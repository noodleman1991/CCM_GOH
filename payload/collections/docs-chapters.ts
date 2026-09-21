import type { CollectionConfig } from "payload";
import { isAnyone, isEditor } from "@/payload/access";
import { sanityUpdatedAt } from "@/payload/fields/sanity-timestamps";

/**
 * Mirrors sanity/schemas/documents/docs-chapter.ts. Verified against
 * production_2 (2026-09-03, 12 documents, 0 drafts — matches the brief's
 * "12 docs chapters" exactly). No `versions.drafts`.
 *
 * Unlike every other collection in this migration, docsChapter has NO
 * localized fields at all in its schema — `title` is a plain string, there
 * is no `language` field, and no field declares a `{en,es,fr,ar}` shape.
 * Real data confirms this: `title` is a bare string on all 12 documents.
 * `title` and `body` are modelled as plain (non-localized) `text`/`richText`
 * fields, not via the `localizedText`/`localizedRichText` helpers.
 *
 * `collection` (which long-form document a chapter belongs to) has exactly
 * one real value across all 12 documents — "global-agenda" — matching the
 * schema's own `initialValue`. Modelled as free text rather than a select,
 * since the schema itself declares it as an open string field anticipating
 * more collections later.
 */
export const DocsChapters: CollectionConfig = {
  slug: "docsChapters",
  admin: {
    group: "Content",
    useAsTitle: "title",
    defaultColumns: ["title", "collection", "order"],
  },
  access: {
    read: isAnyone,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  fields: [
    {
      name: "id",
      type: "text",
      required: true,
      admin: { hidden: true },
    },
    sanityUpdatedAt,
    {
      name: "collection",
      type: "text",
      required: true,
      defaultValue: "global-agenda",
      admin: { description: "Which long-form document this chapter belongs to (e.g. 'global-agenda')." },
    },
    { name: "title", type: "text", required: true, label: "Chapter title" },
    { name: "slug", type: "text", required: true, unique: true },
    { name: "order", type: "number", required: true, admin: { description: "Position in the chapter list (Cover = 1)." } },
    {
      name: "body",
      type: "richText",
      admin: { description: "The chapter content — headings, figures, links, callouts." },
    },
  ],
};
