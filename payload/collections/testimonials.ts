import type { CollectionConfig } from "payload";
import { isEditor, publishedOnly } from "@/payload/access";
import { imageField, relationshipField } from "@/payload/blocks/shared";
import { localizedRichText, localizedText } from "@/payload/fields/localized";

/**
 * Mirrors sanity/schemas/documents/testimonial.ts. Verified against
 * production_2 (2026-09-03, 21 documents: 20 published + 1 draft — 20
 * matches the brief's "20 testimonials" exactly).
 *
 * **This is the draft the brief calls out specifically: never published,
 * and omitted from an earlier version of the brief entirely.** The draft
 * document has no `name` at all (required in the schema) — its `body`/
 * `quote` hold a stray, apparently accidentally pasted `youtube`-type
 * object instead of real rich text. Without `versions.drafts`, Task 13
 * would have to either discard this in-progress record or publish an
 * incomplete testimonial with a required field missing. `versions.drafts`
 * makes it representable as-is.
 *
 * `quote` (the current, localized field) and `body` (the legacy,
 * single-language, deprecated field) are both genuinely populated in real
 * data (21/21 each) — both are Portable Text arrays, `quote` wrapped in a
 * Lane-B `{en: [...]}` container (every real instance only ever populates
 * `en`). `quote` is modelled as `localizedRichText`; `body` as a plain,
 * non-localized `richText`, matching the schema's own lane for each.
 *
 * `project` (a reference to the `project` document type) is declared but
 * 0/21 populated, and `project` has 0 live documents anywhere in
 * production_2 — not ported, same reasoning as caseStudy/livedExperience/
 * researchOutput/newsPost.
 */
export const Testimonials: CollectionConfig = {
  slug: "testimonials",
  versions: { drafts: true },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "jobTitle", "featured"],
  },
  access: {
    read: publishedOnly,
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
    { name: "name", type: "text", required: true },
    localizedText("jobTitle", { label: "Job Title", admin: { description: "Role/title, in each language." } }),
    {
      name: "title",
      type: "text",
      label: "Job Title (legacy, single-language)",
      admin: { hidden: true, description: "Deprecated — use the localized Job Title field above." },
    },
    imageField("image"),
    localizedRichText("quote", { label: "Testimonial", admin: { description: "The testimonial quote (rich text), in each language." } }),
    {
      name: "body",
      type: "richText",
      label: "Testimonial (legacy, single-language)",
      admin: { hidden: true, description: "Deprecated — use the localized Testimonial field above." },
    },
    { name: "rating", type: "number", min: 1, max: 5, admin: { description: "Rating from 1 to 5 stars." } },
    relationshipField("relatedCommunity", "regionalCommunities"),
    relationshipField("organization", "organizations"),
    { name: "featured", type: "checkbox", defaultValue: false },
    {
      name: "orderRank",
      type: "text",
      admin: { hidden: true, description: "Sanity's LexoRank orderRank string, preserved for editorial ordering." },
    },
  ],
};
