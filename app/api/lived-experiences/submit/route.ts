import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  livedExperienceSubmissionSchema,
  LE_VIDEO_MAX_BYTES,
  LE_VIDEO_MIME_TYPES,
} from "@/lib/validation/lived-experience";
import {
  LivedExperienceEditNotAllowedError,
  LivedExperienceMissingVideoError,
  submitLivedExperience,
} from "@/lib/content/lived-experiences";
import { addOutput } from "@/lib/actions/workspace-outputs";
import { rateLimitRequest } from "@/lib/rate-limit-route";

/**
 * User submission of a lived experience. Creates a PENDING livedExperience for
 * editor review (mirrors the case-study flow). Only approved docs are public,
 * enforced in the read queries; status starts as "pending" regardless of input.
 *
 * Accepts either JSON (legacy link-only clients) or multipart form data
 * (`data` JSON field + optional `video` file — the case-study image pattern,
 * with a 100MB cap for direct video uploads to Sanity's asset store).
 */
export async function POST(request: NextRequest) {
  const limited = await rateLimitRequest(request, "lived-experience:submit", { limit: 5, windowSeconds: 600 });
  if (limited) return limited;

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clerkUser = await currentUser();
  if (!clerkUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Parse the payload — multipart (data + optional video file) or plain JSON.
  let body: unknown;
  let videoFile: File | null = null;
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
    const file = formData.get("video");
    if (file instanceof File && file.size > 0) videoFile = file;
  } else {
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
  }

  const parsed = livedExperienceSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const lang = data.language;

  // Direct upload: the file is required and validated (type + 100MB cap).
  // In edit mode a missing file means "keep the existing upload" — the edit
  // branch below verifies one actually exists.
  if (data.videoSource === "upload") {
    if (!videoFile && !data.editId) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 });
    }
    if (videoFile && videoFile.size > LE_VIDEO_MAX_BYTES) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 100MB." },
        { status: 400 }
      );
    }
    if (videoFile && !LE_VIDEO_MIME_TYPES.includes(videoFile.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: MP4, WebM." },
        { status: 400 }
      );
    }
  }

  // The video file travels outside the validated JSON — sanitize + buffer it
  // here (Web File API, not a content-layer concern) before handing off.
  let videoFilePayload: { buffer: Buffer; filename: string; contentType: string } | null = null;
  if (data.videoSource === "upload" && videoFile) {
    const sanitizedFilename = videoFile.name.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 255);
    const buffer = Buffer.from(await videoFile.arrayBuffer());
    videoFilePayload = { buffer, filename: sanitizedFilename, contentType: videoFile.type };
  }

  try {
    const result = await submitLivedExperience({
      userId,
      language: lang,
      title: data.title,
      description: data.description,
      issue: data.issue,
      personContext: data.personContext,
      videoSource: data.videoSource,
      videoLink: data.videoLink,
      body: data.body,
      regionalCommunityId: data.regionalCommunityId,
      tagIds: data.tagIds,
      editId: data.editId,
      videoFile: videoFilePayload,
    });

    // Submitted from a workspace (create-mode only — edit mode's link-back
    // already exists): link the new doc as a workspace output. addOutput
    // enforces collab authz itself; a failed link never fails the submission.
    if (!data.editId && data.collaborationId) {
      const linked = await addOutput({
        collaborationId: data.collaborationId,
        sanityType: "livedExperience",
        mode: "link",
        sanityId: result.id,
        title: data.title,
      });
      if (!linked.ok) console.warn(`Workspace link failed for ${result.id}: ${linked.error}`);
    }

    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    if (error instanceof LivedExperienceEditNotAllowedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof LivedExperienceMissingVideoError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Lived experience submission failed:", error);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
