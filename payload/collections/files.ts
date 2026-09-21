import type { CollectionConfig } from "payload";
import { editorOrStaticFile, isEditor } from "@/payload/access";
import { randomizeUploadFilename } from "@/payload/hooks/upload-filename";
import { setUploadCacheControl } from "@/payload/hooks/upload-cache-control";
import { uploadResponseHeaders } from "@/payload/hooks/upload-headers";

/**
 * Non-image uploads. Mirrors Sanity's `sanity.fileAsset` — 48 of them in
 * production_2 (verified 2026-09-03 by GROQ against the dataset: 48/48
 * `application/pdf`, largest 38.8 MB, 395 MB in total).
 *
 * Separate from `media` because `media` is now `mimeTypes: ["image/*"]` and
 * runs every upload through sharp; a PDF cannot live there. The three schema
 * fields that carry file assets point here (they pointed at `media` while
 * `media` was Task 4's unrestricted placeholder):
 *   - `agendas.files[].file`          — agenda PDFs (29 documents)
 *   - `researchOutputs.files[].file`  — report PDFs
 *   - `livedExperiences.videoFile`    — 0/56 populated, but a live, offered
 *     field; `sanity/schemas/documents/lived-experience.ts:229` restricts it to
 *     `video/mp4,video/webm`, which is why those two types are allowed below.
 *
 * Sanity declares a fifth `type: "file"` field —
 * `backgroundOption.svgPattern` (accept `.svg`) — which deliberately does NOT
 * point here: an SVG is an image, `media` already admits it via
 * `mimeTypes: ["image/*"]`, and routing it here would have meant admitting an
 * image type into the non-image collection and skipping Payload's SVG safety
 * check. The reasoning is recorded in full at the field itself
 * (`payload/blocks/shared.ts`'s `backgroundOptionField`).
 *
 * `read: editorOrStaticFile` — same reasoning as `media`: an asset has no
 * `moderationStatus` and no draft state to gate on, and agenda/report PDFs are
 * already public downloads today, so the file route stays open. The LISTING
 * does not: until 2026-09-16 this was `isAnyone`, and `/payload-api/files?limit=0`
 * handed an anonymous caller the URL of every PDF and video — including the
 * report attached to a pending or rejected research output, which
 * `moderationApprovedOnly` correctly hides on the parent. The documents that
 * *reference* these files carry their own access control
 * (`agendas.accessLevel`, `publishedAndApproved` on the moderated
 * collections); the file itself is protected only by an unguessable name,
 * which `randomizeUploadFilename` provides for every new upload.
 *
 * No `imageSizes`, no `focalPoint`: nothing here is an image.
 */
export const Files: CollectionConfig = {
  slug: "files",
  admin: {
    group: "Media",
    useAsTitle: "filename",
    defaultColumns: ["filename", "mimeType", "filesize"],
  },
  access: {
    read: editorOrStaticFile,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  hooks: {
    beforeOperation: [randomizeUploadFilename],
    // One-year immutable Cache-Control on the stored objects, after commit.
    afterChange: [setUploadCacheControl],
  },
  upload: {
    // All 48 real assets are PDFs. The office/text types are the rest of what
    // "documents" means for an editor uploading to an agenda or report; the two
    // video types exist solely for `livedExperiences.videoFile`, matching that
    // field's own `accept` list rather than a broad `video/*`.
    // SVG sandboxing and Cache-Control — see payload/hooks/upload-headers.ts.
    modifyResponseHeaders: uploadResponseHeaders,
    mimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/csv",
      "text/plain",
      "video/mp4",
      "video/webm",
    ],
  },
  fields: [
    {
      name: "id",
      type: "text",
      required: true,
      admin: { hidden: true },
      // Sanity's _id (`file-<hash>-<ext>`), preserved verbatim so the import is
      // idempotent and every document's file reference resolves.
    },
    {
      name: "sanityAssetId",
      type: "text",
      unique: true,
      index: true,
      admin: {
        hidden: true,
        description:
          "The originating sanity.fileAsset _id. Unique, so Task 11 can re-run its import without creating a second copy of an asset.",
      },
    },
  ],
};
