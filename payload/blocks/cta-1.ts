import type { Block } from "payload";
import { localizedRichText, localizedText } from "@/payload/fields/localized";
import { backgroundOptionField, linksArrayField, sectionPaddingField } from "@/payload/blocks/shared";
import { pickerAdmin } from "@/payload/blocks/picker";

/**
 * sanity/schemas/blocks/cta/cta-1.ts. Verified against production_2
 * (2026-09-03): 45 real cta-1-typed instances in page.blocks[] and the
 * homepage's mentalHealthDefinition slot use exactly this field set
 * (sectionWidth/stackAlign populated, no image/imagePosition).
 *
 * Deliberately NOT given image/imagePosition fields even though 29 more
 * documents store `_type: "cta-1"` with those fields populated —
 * regionalCommunityPage.whyJoinCTA. Per spec §7.1, that field is declared
 * `hero-1` in Sanity and the stored `_type` is the wrong half; the Task 12
 * importer maps those 29 onto the hero1 block above, not this one. Adding
 * image/imagePosition here would just recreate the same ambiguity in
 * Payload that Sanity already has.
 *
 * `tagLine` is declared by the schema but is 0/45 in real (non-whyJoinCTA)
 * cta-1 data — kept for schema parity, as with hero1.tagLine.
 */
export const cta1: Block = {
  slug: "cta1",
  interfaceName: "Cta1Block",
  labels: { singular: "Call to action", plural: "Calls to action" },
  admin: pickerAdmin("call-to-action", "Calls to action", "A short message with one or two buttons"),
  fields: [
    sectionPaddingField("padding"),
    backgroundOptionField("background"),
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
    localizedRichText("body"),
    linksArrayField("links", { maxRows: 2 }),
  ],
};
