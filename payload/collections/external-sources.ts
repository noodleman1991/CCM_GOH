import type { CollectionConfig } from "payload";
import { approvedOnly, isEditor, isEditorField } from "@/payload/access";
import { imageField, relationshipField } from "@/payload/blocks/shared";
import { localizedText, localizedTextarea } from "@/payload/fields/localized";

/**
 * Mirrors sanity/schemas/documents/external-source.ts. Verified against
 * production_2 (2026-09-03, 1 document, 0 drafts — matches the brief's "1
 * external source" exactly). No `versions.drafts`.
 *
 * The one real document matches the schema closely: `title`/`excerpt` are
 * Lane-B `{en,...}` objects with only `en` ever populated (no Lane
 * mismatch, unlike Task 3's sectionHeader finding); `authors` is a real
 * array of plain strings (`["Daniella Watson", "Emma Lawrance"]`), matching
 * the schema's `of: [{type: "string"}]` — modelled as an array of objects
 * with a single `name` field, since Payload's `array` field always wraps
 * rows in objects (there is no bare-scalar array type). `tags`,
 * `organizations`, `projects`, `relatedCommunity`, `addedBy` are all
 * declared but 0/1 populated on the only real document — kept for schema
 * parity. `projects` references a `project` type with 0 live documents in
 * production_2, same reasoning as the other content collections, but
 * `projects` here is genuinely unused (0/1) either way.
 *
 * `read` uses `approvedOnly` (`payload/access/index.ts`), not `isAnyone` —
 * gated on the schema's own `approved` boolean (defaulting to `true`, the
 * only real document has it `true`). `isAnyone` would have made a future
 * `approved: false` source public from the moment it's created.
 */
export const ExternalSources: CollectionConfig = {
  slug: "externalSources",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "publisher", "sourceType", "approved"],
  },
  access: {
    read: approvedOnly,
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
    localizedText("title", { required: true, admin: { description: "Title of the external article (translate if needed)." } }),
    { name: "sourceUrl", type: "text", required: true, label: "Source URL" },
    { name: "publisher", type: "text", required: true },
    { name: "publishedAt", type: "date" },
    localizedTextarea("excerpt"),
    imageField("image"),
    relationshipField("tags", "tags", { hasMany: true }),
    relationshipField("organizations", "organizations", { hasMany: true, label: "Related Organizations" }),
    relationshipField("relatedCommunity", "regionalCommunities", { label: "Regional Community" }),
    {
      name: "authors",
      type: "array",
      admin: { description: "Authors of the original article." },
      fields: [{ name: "name", type: "text" }],
    },
    {
      name: "language",
      type: "select",
      defaultValue: "en",
      label: "Original Language",
      options: [
        { label: "English", value: "en" },
        { label: "Español", value: "es" },
        { label: "Français", value: "fr" },
        { label: "العربية", value: "ar" },
        { label: "Multiple Languages", value: "multi" },
        { label: "Other", value: "other" },
      ],
    },
    {
      name: "sourceType",
      type: "select",
      defaultValue: "news",
      options: [
        { label: "News Article", value: "news" },
        { label: "Research Paper", value: "research" },
        { label: "Blog Post", value: "blog" },
        { label: "Report", value: "report" },
        { label: "Press Release", value: "press" },
        { label: "Policy Document", value: "policy" },
        { label: "Other", value: "other" },
      ],
    },
    { name: "featured", type: "checkbox", defaultValue: false, label: "Featured Source" },
    {
      name: "approved",
      type: "checkbox",
      defaultValue: true,
      admin: { description: "Whether this external source has been approved for display." },
    },
    // Internal editorial bookkeeping — which staff member added the source and
    // when. No GROQ projection in lib/content/ selects either field and nothing
    // renders them, so both are editor-only at FIELD level.
    relationshipField("addedBy", "authors", {
      admin: { description: "Editor who added this external source." },
      access: { read: isEditorField },
    }),
    { name: "addedAt", type: "date", access: { read: isEditorField } },
  ],
};
