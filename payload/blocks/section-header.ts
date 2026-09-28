import type { Block } from "payload";
import { localizedText, localizedTextarea } from "@/payload/fields/localized";
import { sectionPaddingField } from "@/payload/blocks/shared";
import { pickerAdmin } from "@/payload/blocks/picker";

/**
 * sanity/schemas/blocks/section-header.ts.
 *
 * DISAGREEMENT — schema vs. stored shape, same species as whyJoinCTA
 * (spec §7.1) but on a field, not a block `_type`: the schema declares
 * `tagLine`/`title`/`description` as Lane-B field-level i18n objects
 * (`{en, es, fr, ar}`), but section-header only ever lives inside `page`
 * documents, which are themselves Lane A (one document per language). Real
 * data follows the document, not the schema: verified against production_2
 * (2026-09-03), all 3 stored section-header instances hold `title` and
 * `description` as PLAIN STRINGS (one per per-language `page` document),
 * never as `{en,es,fr,ar}` objects — e.g. `"title": "رحلة Connecting Climate
 * Minds"` on the `ar` page, `"title": "The Journey of..."` on `en`, same
 * `_key`. `tagLine` is unset on all 3.
 *
 * Modelled on the stored shape per the brief ("prefer the second [stored
 * data] where they disagree"): plain localized fields, collapsing the same
 * way every other Lane-A field in this block set does — NOT nested
 * `{en,es,fr,ar}` group fields. Flagging for Task 12: if the importer ever
 * encounters a `{en,es,fr,ar}` object here (the schema-declared shape,
 * never actually observed), it needs to unwrap it per-locale rather than
 * assume the plain-string shape unconditionally.
 */
export const sectionHeader: Block = {
  slug: "sectionHeader",
  interfaceName: "SectionHeaderBlock",
  labels: { singular: "Section heading", plural: "Section headings" },
  admin: pickerAdmin("section-heading", "Openings", "A heading and short intro that starts a new part of the page"),
  fields: [
    sectionPaddingField("padding"),
    {
      name: "sectionWidth",
      type: "select",
      defaultValue: "default",
      options: [
        { label: "Default", value: "default" },
        { label: "Narrow", value: "narrow" },
      ],
    },
    {
      name: "stackAlign",
      type: "select",
      label: "Stack Layout Alignment",
      defaultValue: "left",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
      ],
    },
    localizedText("tagLine", { required: false }),
    localizedText("title", { required: false }),
    localizedTextarea("description", { required: false }),
  ],
};
