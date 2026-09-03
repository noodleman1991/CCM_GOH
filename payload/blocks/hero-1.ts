import type { Block } from "payload";
import { localizedRichText, localizedText } from "@/payload/fields/localized";
import { backgroundOptionField, imageField, linksArrayField, sectionPaddingField } from "@/payload/blocks/shared";

/**
 * sanity/schemas/blocks/hero/hero-1.ts. Verified against production_2
 * (2026-09-03): 81 real instances across page.blocks[], the homepage's
 * heroWelcome slot, and regionalCommunityPage's welcomeHero/whyJoinCTA slots
 * (the latter stored as `_type: "cta-1"` — spec §7.1; the importer, not this
 * block, normalises that onto hero1).
 *
 * `tagLine` is declared by the schema but is 0/81 in real data — kept for
 * schema parity (still offered to editors), not because it is exercised.
 */
export const hero1: Block = {
  slug: "hero1",
  interfaceName: "Hero1Block",
  fields: [
    backgroundOptionField("background"),
    localizedText("tagLine", { required: false }),
    localizedText("title", { required: false }),
    localizedRichText("body"),
    imageField("image"),
    linksArrayField("links", { maxRows: 2 }),
    sectionPaddingField("padding"),
    {
      name: "imagePosition",
      type: "select",
      defaultValue: "right",
      options: [
        { label: "Right", value: "right" },
        { label: "Left", value: "left" },
      ],
    },
  ],
};
