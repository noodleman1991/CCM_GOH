import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { makeCaseStudySubmissionSchema } from "@/lib/validation/case-study";
import { ERROR_KEYS } from "@/lib/validation/error-keys";
import { formErrorResponse } from "@/lib/api/form-error";
import { addOutput } from "@/lib/actions/workspace-outputs";
import { rateLimitRequest } from "@/lib/rate-limit-route";
import { CaseStudyEditNotAllowedError, getAvailableCaseStudyTags, submitCaseStudy } from "@/lib/content/case-studies";
import { captureAfterResponse } from "@/lib/analytics/server";

let warnedNoThemes = false;

/**
 * The theme tag ids the "at least one theme" rule checks against. `null` when
 * the CMS has no theme tags at all: that rule could never be met, so it is not
 * enforced rather than blocking every submission. A failed tag read throws, and
 * the caller answers it as a generic failure.
 */
async function themeTagIds(): Promise<ReadonlySet<string> | null> {
  const ids = new Set((await getAvailableCaseStudyTags()).filter((t) => t.category === "topic").map((t) => t._id));
  if (ids.size > 0) return ids;
  if (!warnedNoThemes) {
    warnedNoThemes = true;
    console.warn("[case-studies/submit] No theme (topic) tags exist — the theme rule is not enforced until one is added.");
  }
  return null;
}

/**
 * Submits (or, with `editId`, resubmits) a case study. The rebuilt form sends
 * one multipart `data` JSON part; its cover was already uploaded through
 * /api/uploads/image and travels as `imageAssetId` (`null` = removed). Every
 * rejection answers `{ error: { message, fields } }` in the reader's language.
 */
export async function POST(request: NextRequest) {
  const limited = await rateLimitRequest(request, "case-study:submit", { limit: 5, windowSeconds: 600 });
  if (limited) return formErrorResponse({ request, formKey: ERROR_KEYS.formRateLimited, status: 429 });

  try {
    const { userId } = await auth();
    if (!userId) return formErrorResponse({ request, formKey: ERROR_KEYS.formSignIn, status: 401 });

    const clerkUser = await currentUser();
    if (!clerkUser) return formErrorResponse({ request, formKey: ERROR_KEYS.formSignIn, status: 401 });

    const dataString = (await request.formData()).get("data");
    let parsed: unknown;
    try {
      if (typeof dataString !== "string") throw new Error("no data");
      parsed = JSON.parse(dataString);
    } catch {
      return formErrorResponse({ request, formKey: ERROR_KEYS.formGeneric, status: 400 });
    }

    const validation = makeCaseStudySubmissionSchema({ themeTagIds: await themeTagIds() }).safeParse(parsed);
    if (!validation.success) return formErrorResponse({ request, issues: validation.error, input: parsed });

    const data = validation.data;

    const result = await submitCaseStudy({
      userId,
      originalLanguage: data.originalLanguage,
      title: data.title,
      excerpt: data.excerpt,
      content: data.content,
      layout: data.layout,
      authors: data.authors,
      tags: data.tags,
      suggestedTags: data.suggestedTags,
      organizationName: data.organizationName,
      relatedCommunity: data.relatedCommunity,
      studyPeriod: data.studyPeriod,
      place: data.place ?? undefined,
      imageAssetId: data.imageAssetId,
      editId: data.editId,
      clerkImageUrl: clerkUser.imageUrl,
      clerkUsername: clerkUser.username,
    });

    console.log(`Case study submitted by user ${userId} (${clerkUser.emailAddresses[0]?.emailAddress}): ${result.id}`);

    captureAfterResponse({
      event: "submission_submitted",
      distinctId: userId,
      properties: { kind: "case_study", is_resubmission: Boolean(data.editId), has_image: Boolean(data.imageAssetId) },
    });

    // Submitted from a workspace: link the new doc as a workspace output.
    // addOutput enforces collab authz itself; a failed link never fails the
    // submission. Skipped on edit — the output row already exists, and
    // addOutput doesn't dedupe.
    if (typeof data.collaborationId === "string" && data.collaborationId && !data.editId) {
      const linked = await addOutput({
        collaborationId: data.collaborationId,
        sanityType: "caseStudy",
        mode: "link",
        sanityId: result.id,
        title: data.title.en ?? "",
      });
      if (!linked.ok) console.warn(`Workspace link failed for ${result.id}: ${linked.error}`);
    }

    return NextResponse.json({ success: true, id: result.id, slug: result.slug, status: result.status });
  } catch (error) {
    if (error instanceof CaseStudyEditNotAllowedError) {
      return formErrorResponse({ request, formKey: ERROR_KEYS.formNotAllowed, status: 403 });
    }
    console.error("❌ Failed to submit case study:", error);
    return formErrorResponse({ request, formKey: ERROR_KEYS.formGeneric, status: 500 });
  }
}
