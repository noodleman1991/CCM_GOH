import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { activeBackend } from "@/lib/content/internal/backend";
import { uploadImageAsset } from "@/lib/content/internal/sanity-source";
import { uploadImageAsset as uploadPayloadImageAsset } from "@/lib/content/internal/payload-source";
import { authorizeCollab } from "@/lib/collaboration/service";
import { rateLimitRequest } from "@/lib/rate-limit-route";
import { formErrorResponse, rateLimitedResponse } from "@/lib/api/form-error";
import { ERROR_KEYS } from "@/lib/validation/error-keys";

/** `CONTENT_BACKEND_UPLOADS` (or the process-wide `CONTENT_BACKEND`). */
const UPLOADS_DOMAIN = "uploads";

const MAX_MB = 5;
const MAX_FILE_SIZE = MAX_MB * 1024 * 1024; // same cap as the case-study featured image.
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * POST /api/uploads/image
 * Shared in-body image upload for the slash-menu editor (workspace docs +
 * case-study form). Uploads to the active backend's asset store (same
 * pipeline the case-study featured image already uses) so the returned shape
 * is exactly what components/portable-text-renderer.tsx expects: a url plus
 * metadata (dimensions/lqip) that lets the renderer skip any separate
 * URL-resolution step.
 *
 * The store is Sanity's asset library or Payload's `media` collection,
 * decided per request by `activeBackend("uploads")` — never by the caller.
 * The response body is identical either way; the only visible difference is
 * that a Payload url is same-origin and relative (`/payload-api/media/file/…`)
 * where Sanity's is a `cdn.sanity.io` absolute, which is what
 * `next.config.mjs`'s `images.remotePatterns` requires (it lists Sanity and no
 * Payload/R2 host).
 *
 * Two things the Payload arm gets that Sanity's could not:
 *   - `contentType` comes from the browser's own `file.type`, already
 *     validated against ALLOWED_IMAGE_TYPES above, so `media` (which declares
 *     `mimeTypes: ["image/*"]`) is never asked to infer one from a filename.
 *   - No `sanityAssetId`. That column exists to make the Phase-2 import
 *     idempotent; a genuinely new upload has no Sanity original, and setting
 *     it would claim one.
 *
 * Auth: any signed-in user may upload for the case-study form (matches
 * /api/case-studies/submit's model — the case study itself is moderated
 * before publish). When called with a `collaborationId` field (workspace
 * docs), the upload additionally requires "collab:upload" (EDITOR+) on that
 * workspace, gating it to members who can already edit docs.
 */
export async function POST(request: NextRequest) {
  const limited = await rateLimitRequest(request, "upload:image", { limit: 30, windowSeconds: 600 });
  if (limited) return rateLimitedResponse(request, limited);

  const { userId } = await auth();
  if (!userId) {
    return formErrorResponse({ request, formKey: ERROR_KEYS.formSignIn, status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return formErrorResponse({ request, formKey: ERROR_KEYS.formGeneric });
  }

  const file = formData.get("file") as File | null;
  const collaborationId = formData.get("collaborationId") as string | null;

  if (!file) {
    return formErrorResponse({ request, formKey: ERROR_KEYS.formGeneric });
  }

  if (collaborationId) {
    try {
      await authorizeCollab(collaborationId, "collab:upload");
    } catch {
      return formErrorResponse({ request, formKey: ERROR_KEYS.formNotAllowed, status: 403 });
    }
  }

  // Upload problems answer in the shared `{ error: { message, fields } }` shape, in plain words.
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return formErrorResponse({ request, formKey: ERROR_KEYS.uploadWrongTypeImage });
  }

  if (file.size > MAX_FILE_SIZE) {
    return formErrorResponse({
      request,
      formKey: ERROR_KEYS.uploadTooBig,
      values: { size: (file.size / 1048576).toFixed(1), max: MAX_MB },
    });
  }

  const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 255);

  try {
    const buffer = await file.arrayBuffer();
    const asset =
      activeBackend(UPLOADS_DOMAIN) === "payload"
        ? await uploadPayloadImageAsset(Buffer.from(buffer), {
            filename: sanitizedFilename,
            contentType: file.type,
          })
        : await uploadImageAsset(Buffer.from(buffer), {
            filename: sanitizedFilename,
          });

    return NextResponse.json({
      assetRef: asset.id,
      url: asset.url,
      width: asset.width,
      height: asset.height,
      lqip: asset.lqip,
    });
  } catch (error) {
    console.error("[uploads/image] Asset upload failed:", error);
    return formErrorResponse({ request, formKey: ERROR_KEYS.formGeneric, status: 502 });
  }
}
