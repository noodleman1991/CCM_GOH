import type { CollectionConfig } from "payload";
import { isAnyone, isEditor } from "@/payload/access";

/**
 * PLACEHOLDER — Task 8 ("Uploads on R2") owns this collection for real:
 * `imageSizes` matching lib/content/images.ts's real transforms, the
 * `r2Storage` adapter, `mimeTypes` restrictions, and the sibling `files`
 * collection for PDFs/documents.
 *
 * It exists this early only because Task 4's taxonomy collections are
 * registered in the real `payload.config.ts` (per that task's own brief:
 * "register the collections... confirm Payload boots clean") and three of
 * them have a real, live `image`-type field carrying real data —
 * `authors.image` (83/99 real authors), `organizations.logo`,
 * `regionalCommunities.coverImage` — each an `upload` field with
 * `relationTo: 'media'` (payload/blocks/shared.ts's `imageField` helper,
 * the same one Task 3's blocks use). Payload's config sanitizer validates
 * every `relationTo` against a real registered collection slug at
 * `buildConfig()` time — a stricter check than `tsc`, and one that
 * `lib/__tests__/payload-config.test.ts` (Task 1) already exercises by
 * importing the real `@payload-config` — so an unregistered `media` target
 * breaks that pre-existing test, not just a new one. Task 3's own forward
 * reference to `media` never hit this because its blocks aren't wired into
 * any collection yet (that's Task 6); Task 4's collections are wired in now.
 *
 * Kept intentionally minimal — `upload: true` and nothing else — so Task 8
 * can extend or fully replace it without fighting anything opinionated here.
 */
export const Media: CollectionConfig = {
  slug: "media",
  upload: true,
  admin: { useAsTitle: "filename" },
  access: {
    read: isAnyone,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  fields: [],
};
