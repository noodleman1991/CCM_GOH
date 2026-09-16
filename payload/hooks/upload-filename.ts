import { randomBytes } from "node:crypto";
import type { CollectionBeforeOperationHook } from "payload";

/**
 * Gives every new upload an unguessable filename.
 *
 * Payload names a stored file after its sanitised ORIGINAL name
 * (`payload/dist/uploads/generateFileData.js`: `sanitize(file.name)`), so an
 * editor's `board-minutes.pdf` is served at
 * `/payload-api/files/file/board-minutes.pdf`. Sanity served the same asset
 * at a 40-character content hash. The static file route is deliberately open
 * to anonymous callers (a rendered page needs its images without a session —
 * see `editorOrStaticFile` in `payload/access`), which is only safe while the
 * URL cannot be guessed. This hook restores that property by appending 64
 * bits of randomness to the stem: `board-minutes-9bac9301cda26005.pdf`.
 *
 * It runs as `beforeOperation`, which Payload calls before
 * `generateFileData` reads `req.file.name` — so the derived `imageSizes`
 * pick the randomised stem up too, and nothing downstream sees two names.
 *
 * Sanity-imported assets are left alone. `scripts/payload-import/assets.ts`
 * assigns deterministic filenames (unique per collection, checked against
 * the `*_filename_idx` unique indexes) so that re-running the import is
 * idempotent and `verify:import` can compare against the archive. The import
 * always sends `sanityAssetId`; a live upload never does, so that field is
 * the discriminator.
 */
export const randomizeUploadFilename: CollectionBeforeOperationHook = async ({ args, operation, req }) => {
  if (operation !== "create") return;
  const file = req.file;
  if (!file?.name) return;
  const data = (args as { data?: Record<string, unknown> } | undefined)?.data;
  if (data && typeof data.sanityAssetId === "string" && data.sanityAssetId) return;

  const dot = file.name.lastIndexOf(".");
  const hasExtension = dot > 0;
  const stem = hasExtension ? file.name.slice(0, dot) : file.name;
  const ext = hasExtension ? file.name.slice(dot) : "";
  file.name = `${stem}-${randomBytes(8).toString("hex")}${ext}`;
};
