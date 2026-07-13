import "server-only";
import { writeClient } from "@/sanity/lib/write-client";
import { prisma, safeQuery } from "@/lib/prisma";

/**
 * X7 edit mode: load a case study the current user may edit, mapped to the
 * submission form's field shape (the same shape drafts use, so the form's
 * applyDraft() handles it unchanged).
 *
 * May edit = the original submitter, OR a member of a workspace that lists
 * the doc as an output. Only draft/pending/revision docs are editable —
 * approved content changes go through the editorial team.
 */
export async function loadEditableCaseStudy(
  sanityId: string,
  userId: string
): Promise<(Record<string, unknown> & { _sanityId: string }) | null> {
  const id = sanityId.replace(/^drafts\./, "");
  // The token client with a raw perspective: draft docs (drafts.*) are
  // invisible to the public read client, and edit mode is exactly about
  // reopening drafts. This module is server-only and authz-gated below.
  const doc = await writeClient.withConfig({ perspective: "raw" }).fetch(
    `*[_type == "caseStudy" && (_id == $id || _id == "drafts." + $id)][0]{
      _id, title, excerpt, content, topic, layout, submittedBy, status, reviewNotes,
      studyPeriod, locationText, locationDisplayText,
      "relatedCommunity": relatedCommunity._ref,
      "tags": tags[]._ref,
      organizationName
    }`,
    { id }
  );
  if (!doc) return null;
  if (!["pending", "revision", "draft", null, undefined].includes(doc.status)) return null;

  let allowed = doc.submittedBy === userId;
  if (!allowed) {
    const membership = await safeQuery(() =>
      prisma.workspaceOutput.findFirst({
        where: {
          sanityId: { in: [id, `drafts.${id}`] },
          collaboration: { members: { some: { userId } } },
        },
        select: { id: true },
      })
    );
    allowed = membership.success && !!membership.data;
  }
  if (!allowed) return null;

  return {
    _sanityId: doc._id,
    // Pipeline context for the edit UI — stripped before applyDraft.
    _review: { status: doc.status ?? "draft", reviewNotes: doc.reviewNotes ?? null },
    title: doc.title ?? { en: "", es: "", fr: "", ar: "" },
    excerpt: doc.excerpt ?? { en: "", es: "", fr: "", ar: "" },
    content: doc.content ?? [],
    topic: doc.topic ?? "",
    layout: doc.layout ?? "story",
    studyPeriod: doc.studyPeriod ?? { startDate: "", endDate: "" },
    locationText: doc.locationText ?? { country: "", city: "" },
    relatedCommunity: doc.relatedCommunity ?? "",
    organizationName: doc.organizationName ?? "",
    selectedTags: doc.tags ?? [],
  };
}
