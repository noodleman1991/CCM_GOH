import type { Block } from "payload";
import { localizedRichText, localizedText } from "@/payload/fields/localized";
import { linkField, sectionPaddingField } from "@/payload/blocks/shared";

/**
 * sanity/schemas/blocks/split/split-content.ts. Verified against
 * production_2 (2026-09-03): 42 real instances (in page.blocks[]'s split-row
 * columns and the homepage's split-row slots).
 *
 * Two disagreements found, both left OUT of this field list — see
 * task-3-report.md:
 *  - 22/42 instances store a plural `links` array instead of the schema's
 *    singular `link`. components/blocks/split/split-content.tsx destructures
 *    only `link`, so these 22 buttons never render today — `links` is
 *    already-dead data in production, not a live shape to port.
 *  - 4/42 instances carry `colorVariant` ("background"), which no current
 *    schema declares and no renderer reads (see split-row.ts for the fuller
 *    trail — same field, same fate, smaller footprint here).
 */
export const splitContent: Block = {
  slug: "splitContent",
  interfaceName: "SplitContentBlock",
  fields: [
    { name: "sticky", type: "checkbox", defaultValue: false, admin: { description: "Sticky column on desktop" } },
    sectionPaddingField("padding"),
    localizedText("tagLine", { required: false }),
    localizedText("title", { required: false }),
    localizedRichText("body"),
    linkField("link"),
  ],
};
