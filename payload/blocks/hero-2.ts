import type { Block } from "payload";
import { localizedRichText, localizedText } from "@/payload/fields/localized";
import { backgroundOptionField, linksArrayField, sectionPaddingField } from "@/payload/blocks/shared";
import { pickerAdmin } from "@/payload/blocks/picker";
import { moreOptions } from "@/payload/blocks/more-options";

/** `hero-2` — a full-width hero whose background carries the image. Rendered by
 *  components/blocks/hero/hero-2.tsx; mapped in lib/content/internal/payload/blocks.ts. */
export const hero2: Block = {
  slug: "hero2",
  interfaceName: "Hero2Block",
  labels: { singular: "Hero with image", plural: "Heroes with image" },
  admin: pickerAdmin("hero-with-image", "Openings", "A full-width image with a heading on top"),
  fields: moreOptions([
    backgroundOptionField("background"),
    localizedText("tagLine", { label: "Small line above the title" }),
    localizedText("title", { label: "Title" }),
    localizedRichText("body", { label: "Text" }),
    linksArrayField("links", { maxRows: 2 }),
    sectionPaddingField("padding"),
  ]),
};
