import type { Field } from "payload";

/**
 * Sanity's `_updatedAt`, preserved under a name Payload does not own.
 *
 * Payload's `updatedAt` cannot carry it. `payload/dist/collections/operations/
 * utilities/update.js` ends with `dataToUpdate.updatedAt = new Date()
 * .toISOString()` — unconditional, applied after hooks, and not overridable by
 * data, `context` or `overrideAccess`. So an importer that writes `updatedAt`
 * is writing a value the very next line discards: measured on `agendas`,
 * `created_at` spanned 2025-10/2025-11 correctly while all 29 `updated_at`
 * values were the import date. (`createdAt` has no such line and is honoured
 * on create, which is why that half of the trailer works.)
 *
 * This costs a column rather than a hack because the two timestamps mean
 * different things once both systems exist: `updatedAt` is "when this Payload
 * row last changed" (an import run, an editor's save) and `sanityUpdatedAt` is
 * "when the content last changed in Sanity". Overwriting the former with the
 * latter would make Payload's own version history lie; keeping only the former
 * loses ordering the site already depends on.
 *
 * **Phase 3 readers must order by this field, not by `updatedAt`.** The
 * GROQ queries being replaced use `_updatedAt` in three places that matter:
 *   - `lib/content/case-studies.ts:394` `CASE_STUDIES_BY_STATUS_QUERY` —
 *     the moderation queue, `order(_updatedAt desc)`;
 *   - `lib/content/case-studies.ts:351` `CASE_STUDIES_BY_USER_QUERY`;
 *   - `lib/content/system.ts:98, 158` — `lastModified` on every sitemap URL.
 * Ordered by Payload's `updatedAt`, the queue would be in import order and
 * every sitemap URL would claim the import date.
 *
 * Indexed because all three uses are an ORDER BY over a whole collection.
 * Hidden in the admin: it is provenance, not editorial data, and nothing an
 * editor does should change it.
 *
 * Declared on exactly the collections the importer writes — bound to
 * `transform.ts`'s `IMPORTED_COLLECTION_SLUGS` by
 * `lib/__tests__/payload-sanity-updated-at.test.ts`, so a nineteenth imported
 * collection cannot quietly skip it. Not on `users`, `media`, `files`,
 * `events` or `projects`: none of those is built from a Sanity content
 * document with a `_updatedAt` to preserve.
 */
export const sanityUpdatedAt: Field = {
  name: "sanityUpdatedAt",
  type: "date",
  index: true,
  admin: {
    hidden: true,
    readOnly: true,
    description: "Sanity's own _updatedAt, preserved at import. Payload owns `updatedAt` itself.",
  },
};
