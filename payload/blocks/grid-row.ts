import type { Block } from "payload";
import { localizedRichText, localizedText } from "@/payload/fields/localized";
import { backgroundOptionField, imageField, sectionPaddingField } from "@/payload/blocks/shared";
import { gridAgenda } from "@/payload/blocks/grid-agenda";
import { gridCard } from "@/payload/blocks/grid-card";
import { gridNews } from "@/payload/blocks/grid-news";

/**
 * sanity/schemas/blocks/grid/grid-row.ts. Verified against production_2
 * (2026-09-03): 62 real instances. `columns[]` only ever holds grid-card
 * (68), grid-agenda (182) and grid-news (12) — 0 grid-post, 0
 * grid-case-study, 0 grid-lived-experience, matching spec §6's census
 * exactly.
 *
 * `subtitle`, `mode`, `maxItems` and `initialDisplayCount` are 0/62 in
 * stored data (mode always falls back to its "manual" default) — kept for
 * schema parity; the schema's own description records that "dynamic" mode
 * is honored by the homepage's Latest News / Research Agendas sections
 * specifically, once Task 6 wires those through `blocksFromFields`.
 *
 * `description` (36/62 populated) is Sanity's `styled-block-content`, a
 * richer feature set than the `block-content` used by hero1.body/cta1.body/
 * splitContent.body — pull quotes, references, footnotes, the five
 * "story-*" embeds (spec §6). This is the one block-level rich text field
 * in the twelve with real embed ambitions; Task 9's BlocksFeature
 * registration should be attached to this field specifically, not applied
 * uniformly to every localizedRichText call in this block set.
 */
export const gridRow: Block = {
  slug: "gridRow",
  interfaceName: "GridRowBlock",
  fields: [
    sectionPaddingField("padding"),
    backgroundOptionField("background"),
    localizedText("title", { required: false, admin: { description: "Optional title for the grid section" } }),
    localizedText("subtitle", { required: false, admin: { description: "Optional subtitle shown below the title" } }),
    localizedRichText("description", {
      required: false,
      admin: { description: "Optional description text that supports rich formatting and styling" },
    }),
    imageField("headerImage"),
    {
      name: "gridColumns",
      type: "select",
      label: "Grid Columns",
      defaultValue: "grid-cols-3",
      admin: {
        description:
          "How many cards per row on desktop screens. Note: the 'Wide (16:9)' card style always shows at most 2 per row.",
      },
      options: [
        { label: "2 Cards", value: "grid-cols-2" },
        { label: "3 Cards", value: "grid-cols-3" },
        { label: "4 Cards", value: "grid-cols-4" },
        { label: "5 Cards", value: "grid-cols-5" },
      ],
    },
    {
      name: "cardVariant",
      type: "select",
      defaultValue: "classic",
      admin: {
        description:
          "Card shape. 'Classic (3:2)' fits 2-4 per row; 'Wide (16:9)' is panoramic and overrides the columns setting to max 2 per row.",
      },
      options: [
        { label: "Classic (3:2 - Vertical)", value: "classic" },
        { label: "Wide (16:9 - Horizontal)", value: "wide" },
      ],
    },
    {
      name: "mode",
      type: "select",
      label: "Content Mode",
      defaultValue: "manual",
      admin: {
        description:
          "Dynamic modes keep this section automatically up to date with the latest published content.",
      },
      options: [
        { label: "Manual — hand-pick items", value: "manual" },
        { label: "Dynamic — most recent", value: "dynamic-recent" },
        { label: "Dynamic — featured first, fill with recent", value: "dynamic-featured" },
      ],
    },
    {
      name: "maxItems",
      type: "number",
      label: "Max items (dynamic modes)",
      defaultValue: 3,
      min: 1,
      max: 12,
      admin: { condition: (_, siblingData) => siblingData?.mode && siblingData.mode !== "manual" },
    },
    {
      name: "initialDisplayCount",
      type: "number",
      min: 1,
      admin: { description: "How many cards to show before the Show More button. Leave empty to always show all." },
    },
    {
      name: "columns",
      type: "blocks",
      blocks: [gridCard, gridAgenda, gridNews],
    },
  ],
};
