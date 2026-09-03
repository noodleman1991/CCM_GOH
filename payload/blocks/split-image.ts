import type { Block } from "payload";
import { imageField } from "@/payload/blocks/shared";

/**
 * sanity/schemas/blocks/split/split-image.ts. Verified against production_2
 * (2026-09-03): 16 real instances, all matching the schema exactly (image +
 * alt, nothing else) — no disagreement to report for this block.
 */
export const splitImage: Block = {
  slug: "splitImage",
  interfaceName: "SplitImageBlock",
  fields: [imageField("image")],
};
