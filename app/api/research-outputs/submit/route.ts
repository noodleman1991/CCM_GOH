import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  researchOutputSubmissionSchema,
  RO_DOC_MAX_BYTES,
  RO_DOC_MIME_TYPES,
} from "@/lib/validation/research-output";
import { ResearchOutputEditNotAllowedError, submitResearchOutput } from "@/lib/content/outputs";
import { addOutput } from "@/lib/actions/workspace-outputs";
import { rateLimitRequest } from "@/lib/rate-limit-route";
import { captureAfterResponse } from "@/lib/analytics/server";

/**
 * Member/project submission of a research output (report / toolkit / dataset
 * brief / guideline). Creates a PENDING `researchOutput` for editor review —
 * status is forced to "pending" regardless of input (the Studio schema
 * defaults to approved, which is exactly why this route must never trust it).
 *
 * Multipart: `data` JSON + downloadable documents as `version-<i>` files,
 * described positionally by data.newVersions[i] (kind + lang). Files upload
 * to Sanity's asset store and land in the `versions` array the public detail
 * page already renders.
 */
export async function POST(request: NextRequest) {
  const limited = await rateLimitRequest(request, "research-output:submit", { limit: 5, windowSeconds: 600 });
  if (limited) return limited;

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clerkUser = await currentUser();
  if (!clerkUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let body: unknown;
  const files: File[] = [];
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }
    const dataString = formData.get("data");
    if (typeof dataString !== "string") {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }
    try {
      body = JSON.parse(dataString);
    } catch {
      return NextResponse.json({ error: "Invalid JSON in data field" }, { status: 400 });
    }
    for (let i = 0; ; i++) {
      const f = formData.get(`version-${i}`);
      if (!(f instanceof File)) break;
      files.push(f);
    }
  } else {
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
  }

  const parsed = researchOutputSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  // Every declared document needs its file, and every file its declaration.
  if (files.length !== data.newVersions.length) {
    return NextResponse.json({ error: "Document metadata mismatch" }, { status: 400 });
  }
  for (const f of files) {
    if (f.size > RO_DOC_MAX_BYTES) {
      return NextResponse.json({ error: "File too large. Maximum size is 50MB." }, { status: 400 });
    }
    if (!RO_DOC_MIME_TYPES.includes(f.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PDF, Word, Excel, PowerPoint." },
        { status: 400 }
      );
    }
  }

  try {
    // Every declared version pairs positionally with its uploaded file.
    const newVersions = await Promise.all(
      files.map(async (f, i) => {
        const meta = data.newVersions[i];
        const sanitizedFilename = f.name.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 255);
        const buffer = await f.arrayBuffer();
        return {
          kind: meta.kind,
          lang: meta.lang,
          buffer: Buffer.from(buffer),
          filename: sanitizedFilename,
          contentType: f.type,
        };
      })
    );

    const result = await submitResearchOutput({
      userId,
      title: data.title,
      outputType: data.outputType,
      excerpt: data.excerpt,
      body: data.body,
      region: data.region,
      themes: data.themes,
      tagIds: data.tagIds,
      suggestedTags: data.suggestedTags,
      communityIds: data.communityIds,
      language: data.language,
      editId: data.editId,
      keptVersionKeys: data.keptVersionKeys,
      newVersions,
    });

    captureAfterResponse({
        event: "submission_submitted",
        distinctId: userId,
        properties: { kind: "research_output", is_resubmission: Boolean(data.editId), has_image: false },
      });

    // Submitted from a workspace: link the new doc as a workspace output.
    // addOutput enforces collab authz; a failed link never fails submission.
    // Skipped on edit — the output row already exists, and addOutput
    // doesn't dedupe.
    if (data.collaborationId && !data.editId) {
      const linked = await addOutput({
        collaborationId: data.collaborationId,
        sanityType: "researchOutput",
        mode: "link",
        sanityId: result.id,
        title: data.title,
      });
      if (!linked.ok) console.warn(`Workspace link failed for ${result.id}: ${linked.error}`);
    }

    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    if (error instanceof ResearchOutputEditNotAllowedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Research output submission failed:", error);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
