import type { Block } from "payload";
import { localizedTextarea } from "@/payload/fields/localized";
import { relationshipField } from "@/payload/blocks/shared";

/**
 * sanity/schemas/blocks/grid/grid-news.ts. Verified against production_2
 * (2026-09-03): 16 real instances. showTags/showAuthor/showMetadata are
 * true on all 16; showLocation is unset (defaults false) on 12, explicit
 * false on 4 — the "display location" feature has never actually been
 * turned on in real content. `customExcerpt` is declared (a Lane-B
 * `{en,es,fr,ar}` text object in Sanity — this block references a
 * `newsPost` document rather than living inside a Lane-A page itself, so
 * the field-level i18n lane is the correct one here, unlike section-header)
 * but is 0/16 in real data — kept for schema parity via localizedTextarea,
 * which is what Payload's single localization lane collapses that Lane-B
 * shape onto.
 *
 * `relationTo: "newsPosts"` is a forward reference to Task 5's
 * payload/collections/news-posts.ts, which does not exist yet.
 */
export const gridNews: Block = {
  slug: "gridNews",
  interfaceName: "GridNewsBlock",
  fields: [
    relationshipField("newsPost", "newsPosts", { required: true }),
    { name: "showTags", type: "checkbox", defaultValue: true, admin: { description: "Display tags associated with the news post" } },
    { name: "showAuthor", type: "checkbox", defaultValue: true, admin: { description: "Display the author information" } },
    {
      name: "showMetadata",
      type: "checkbox",
      defaultValue: true,
      admin: { description: "Display publication date, author, and organizations" },
    },
    { name: "showLocation", type: "checkbox", defaultValue: false, admin: { description: "Display location information if available" } },
    localizedTextarea("customExcerpt", {
      required: false,
      admin: { description: "Override the default excerpt with custom text" },
    }),
  ],
};
