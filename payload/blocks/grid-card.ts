import type { Block } from "payload";
import { localizedText, localizedTextarea } from "@/payload/fields/localized";
import { imageField, linkField } from "@/payload/blocks/shared";

/**
 * sanity/schemas/blocks/grid/grid-card.ts. Verified against production_2
 * (2026-09-03): 68 real instances, all matching the schema exactly — no
 * disagreement to report for this block.
 */
export const gridCard: Block = {
  slug: "gridCard",
  interfaceName: "GridCardBlock",
  fields: [
    localizedText("title", { required: false, admin: { description: "Keep under ~60 characters." } }),
    localizedTextarea("excerpt", { required: false, admin: { description: "Up to 3 lines." } }),
    imageField("image"),
    linkField("link"),
  ],
};
