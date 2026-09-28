import type { Block } from "payload";
import { REGION_OPTIONS } from "@/payload/fields/regions";
import { pickerAdmin } from "@/payload/blocks/picker";

/** `atlas-embed` — the interactive atlas for one region (components/blocks/maps/atlas-embed.tsx). */
export const atlasEmbed: Block = {
  slug: "atlasEmbed",
  interfaceName: "AtlasEmbedBlock",
  labels: { singular: "Atlas", plural: "Atlases" },
  admin: pickerAdmin("atlas", "Maps", "The interactive atlas for one region"),
  fields: [
    { name: "region", type: "select", required: true, label: "Region", options: REGION_OPTIONS },
    { name: "showBreakdown", type: "checkbox", label: "Show the breakdown panel", defaultValue: true },
  ],
};
