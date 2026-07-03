import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { writeClient } from "@/sanity/lib/write-client";
import { authorizeCollab } from "@/lib/collaboration/service";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB — same cap as the case-study featured image.
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * POST /api/uploads/image
 * Shared in-body image upload for the slash-menu editor (workspace docs +
 * case-study form). Uploads to Sanity's asset store (same pipeline the
 * case-study featured image already uses) so the returned shape is exactly
 * what components/portable-text-renderer.tsx expects: a CDN url plus
 * metadata (dimensions/lqip) that lets the renderer skip Sanity's `urlFor`
 * resolution entirely.
 *
 * Auth: any signed-in user may upload for the case-study form (matches
 * /api/case-studies/submit's model — the case study itself is moderated
 * before publish). When called with a `collaborationId` field (workspace
 * docs), the upload additionally requires "collab:upload" (EDITOR+) on that
 * workspace, gating it to members who can already edit docs.
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const collaborationId = formData.get("collaborationId") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (collaborationId) {
    try {
      await authorizeCollab(collaborationId, "collab:upload");
    } catch {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large. Maximum size is 5MB." }, { status: 400 });
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF." },
      { status: 400 }
    );
  }

  const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 255);

  try {
    const buffer = await file.arrayBuffer();
    const asset = await writeClient.assets.upload("image", Buffer.from(buffer), {
      filename: sanitizedFilename,
    });

    return NextResponse.json({
      assetRef: asset._id,
      url: asset.url,
      width: asset.metadata?.dimensions?.width,
      height: asset.metadata?.dimensions?.height,
      lqip: asset.metadata?.lqip,
    });
  } catch (error) {
    console.error("[uploads/image] Sanity asset upload failed:", error);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 502 });
  }
}
