import type { CollectionConfig } from "payload";
import { isEditor, publishedOnly } from "@/payload/access";
import { localizedText, localizedTextarea } from "@/payload/fields/localized";
import { sanityUpdatedAt } from "@/payload/fields/sanity-timestamps";
import { SKIP_SEARCH_SYNC, scheduleTagReindex } from "@/payload/hooks/search-sync";
import { tagSearchTextChanged, tagSlug } from "@/lib/tags/slug";

/**
 * Mirrors sanity/schemas/documents/tag.ts. Verified against production_2
 * (2026-09-03, 68 documents incl. 1 draft):
 *
 * - `value` is stored as a **slug object** (`{_type:"slug", current:"..."}`),
 *   not a string (lib/content/taxonomy.ts's TAGS_QUERY already documents this
 *   trap for `getTags()`). Modelled as plain `text` here — Task 12's importer
 *   unwraps `value.current` on the way in; Payload has no distinct slug type.
 * - `color` is a curated 6-value radio list in the current schema
 *   (`options.list`), but only 27/68 real tags (40%) store one of those six
 *   hex values. The other 41 store one of six *legacy* hex values
 *   (#10b981/#14b8a6/#3b82f6/#8b5cf6/#ef4444/#f97316) that match neither the
 *   current option list nor any option Sanity currently offers — they DO
 *   match, exactly, the `colorNames` fallback map still hard-coded in the
 *   schema's own `preview.prepare()`, evidence this is a genuine prior
 *   palette, not stray data. A `select` limited to the current 6 would
 *   reject 60% of real documents on import, so this is modelled as free
 *   `text`, matching the schema's own comment ("Older tags using other
 *   colours are automatically mapped to the closest brand colour").
 * - `useAsTheme` is a real, currently-offered field (0/68 true today) — kept
 *   for parity, same as Task 3's unused-but-live fields.
 * - `label`/`description` are genuine field-level `{en,es,fr,ar}` objects
 *   here (unlike sectionHeader's Lane-B/Lane-A mismatch in Task 3) —
 *   confirmed against real documents, `label.en` always present,
 *   `label.es`/`.fr`/`.ar` on 40/68. Modelled with `localizedText`/
 *   `localizedTextarea`.
 *
 * production_2 also has 1 live draft tag (`drafts.7ba8e07e-...`, missing
 * `label` entirely — an in-progress record) — `versions.drafts` is enabled
 * so Task 12 can import it as a draft rather than being forced to either
 * discard it or publish an incomplete tag. 67 published + 1 draft = 68,
 * matching the live count of "67 tags" (published only) in the brief.
 */
export const Tags: CollectionConfig = {
  slug: "tags",
  versions: { drafts: true },
  admin: {
    group: "Tags & vocabularies",
    useAsTitle: "label",
    defaultColumns: ["label", "category", "value", "color"],
  },
  access: {
    read: publishedOnly,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  hooks: {
    // `value` was a slug field with `source: label.en` in Sanity; here it is
    // derived the same way when left empty, and normalised when typed, so
    // every tag an editor creates gets one stable, well-formed reference
    // value (tag audit 2026-09-17; lib/tags/slug.ts).
    beforeValidate: [
      ({ data }) => {
        if (!data) return data;
        const label = typeof data.label === "string" ? data.label : (data.label as { en?: string } | undefined)?.en;
        const typed = typeof data.value === "string" ? data.value.trim() : "";
        if (typed) data.value = tagSlug(typed);
        else if (label) data.value = tagSlug(label);
        return data;
      },
    ],
    // A renamed tag is copied into the search record of every document that
    // carries it; fan the re-index out after this write commits.
    afterChange: [
      ({ doc, previousDoc, operation, req }) => {
        if (operation !== "update") return doc;
        if (req?.context?.[SKIP_SEARCH_SYNC]) return doc;
        if (!tagSearchTextChanged(previousDoc as never, doc as never)) return doc;
        scheduleTagReindex(String(doc.id), req?.payload as never);
        return doc;
      },
    ],
  },
  fields: [
    {
      name: "id",
      type: "text",
      required: true,
      admin: { hidden: true },
      // Sanity's _id, preserved verbatim so the import is idempotent and the
      // handful of Prisma rows referencing content ids keep working.
    },
    sanityUpdatedAt,
    localizedText("label", { required: true }),
    {
      name: "value",
      type: "text",
      required: true,
      unique: true,
      admin: { description: "The tag's slug (Sanity's value.current). Used as its stable reference value." },
    },
    localizedTextarea("description"),
    {
      name: "category",
      type: "select",
      defaultValue: "topic",
      options: [
        { label: "Topic", value: "topic" },
        { label: "Location", value: "location" },
        { label: "Method", value: "method" },
        { label: "Audience", value: "audience" },
        { label: "Impact", value: "impact" },
        { label: "Other", value: "other" },
      ],
    },
    {
      name: "color",
      type: "text",
      defaultValue: "#205596",
      admin: {
        description:
          "Hex color. The Studio curates a 6-value palette, but 60% of real tags store a legacy hex value outside it — kept as free text, not a constrained select, so import doesn't reject real data.",
      },
    },
    {
      name: "useAsTheme",
      type: "checkbox",
      defaultValue: false,
      admin: { description: "Show this tag as a Theme filter on the Atlas and other discovery surfaces." },
    },
    {
      name: "orderRank",
      type: "text",
      admin: { hidden: true, description: "Sanity's LexoRank orderRank string, preserved for editorial ordering." },
    },
  ],
};
