import type { Block } from "payload";
import { relationshipField } from "@/payload/blocks/shared";

/**
 * sanity/schemas/blocks/grid/grid-agenda.ts. Verified against production_2
 * (2026-09-03): 232 real instances (grid-row.columns[] is the single
 * biggest source of block instances in the dataset). All three booleans
 * genuinely vary in stored data (not just their schema defaults) — real
 * editorial signal, not noise: showTags true on 50/232, showDownloadButtons
 * true on 212/232, showMetadata true on 30/232.
 *
 * `relationTo: "agendas"` is a forward reference to Task 5's
 * payload/collections/agendas.ts, which does not exist yet — see
 * payload/blocks/shared.ts's `collectionSlug` cast.
 */
export const gridAgenda: Block = {
  slug: "gridAgenda",
  interfaceName: "GridAgendaBlock",
  fields: [
    relationshipField("agenda", "agendas", {
      required: true,
      admin: { description: "Select an agenda to display in the grid." },
    }),
    { name: "showTags", type: "checkbox", defaultValue: true, admin: { description: "Display agenda tags on the card" } },
    {
      name: "showDownloadButtons",
      type: "checkbox",
      defaultValue: true,
      admin: { description: "Display download buttons for each language" },
    },
    {
      name: "showMetadata",
      type: "checkbox",
      defaultValue: true,
      admin: { description: "Display agenda type, year, and other metadata" },
    },
  ],
};
