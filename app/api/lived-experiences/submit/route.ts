import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { writeClient } from "@/sanity/lib/write-client";
import {
  livedExperienceSubmissionSchema,
  generateLivedExperienceSlug,
  LE_VIDEO_MAX_BYTES,
  LE_VIDEO_MIME_TYPES,
} from "@/lib/validation/lived-experience";
import { addOutput } from "@/lib/actions/workspace-outputs";

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
  if (data.videoSource === "upload") {
    if (!videoFile) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 });
    }
    if (videoFile.size > LE_VIDEO_MAX_BYTES) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 100MB." },
        { status: 400 }
      );
    }
    if (!LE_VIDEO_MIME_TYPES.includes(videoFile.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: MP4, WebM." },
        { status: 400 }
      );
    }
  }

  // Localized objects with the submitter's language populated.
  const localized = (value: string) => (value ? { [lang]: value } : undefined);

  const doc: { _type: string; [key: string]: unknown } = {
    _type: "livedExperience",
    language: lang,
    status: "pending", // never trust client; always pending on submit
    submittedBy: userId,
    publishedAt: new Date().toISOString(),
    slug: { _type: "slug", current: generateLivedExperienceSlug(data.title) },
    title: { [lang]: data.title },
    description: localized(data.description),
    issue: localized(data.issue),
    personContext: localized(data.personContext || ""),
    featured: false,
  };

  if (data.videoSource) doc.videoSource = data.videoSource;
  if (data.videoSource !== "upload" && data.videoLink) doc.videoLink = data.videoLink;

  // Long-form body — already Portable Text from the shared editor.
  if (Array.isArray(data.body) && data.body.length > 0) doc.body = data.body;

  if (data.regionalCommunityId) {
    doc.relatedCommunity = { _type: "reference", _ref: data.regionalCommunityId };
  }
  if (data.tagIds && data.tagIds.length > 0) {
    doc.tags = data.tagIds.map((id) => ({ _type: "reference", _ref: id, _key: id }));
  }

  try {
    // Upload the video to Sanity's asset store first (same pipeline as the
    // case-study image), then reference it from the document.
    if (data.videoSource === "upload" && videoFile) {
      const sanitizedFilename = videoFile.name.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 255);
      const buffer = await videoFile.arrayBuffer();
      const asset = await writeClient.assets.upload("file", Buffer.from(buffer), {
        filename: sanitizedFilename,
        contentType: videoFile.type,
      });
      doc.videoFile = { _type: "file", asset: { _type: "reference", _ref: asset._id } };
    }

    const created = await writeClient.create(doc);

    // Submitted from a workspace: link the new doc as a workspace output.
    // addOutput enforces collab authz itself; a failed link never fails the submission.
    if (data.collaborationId) {
      const linked = await addOutput({
        collaborationId: data.collaborationId,
        sanityType: "livedExperience",
        mode: "link",
        sanityId: created._id,
        title: data.title,
      });
      if (!linked.ok) console.warn(`Workspace link failed for ${created._id}: ${linked.error}`);
    }

    return NextResponse.json({ success: true, id: created._id });
  } catch (error) {
    console.error("Lived experience submission failed:", error);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
