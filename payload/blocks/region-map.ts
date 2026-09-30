import type { Block } from "payload";
import { localizedText, localizedTextarea } from "@/payload/fields/localized";
import { pickerAdmin } from "@/payload/blocks/picker";

/** `region-map` — the world atlas in global mode (components/blocks/maps/region-map.tsx). */
export const regionMap: Block = {
  slug: "regionMap",
  interfaceName: "RegionMapBlock",
  labels: { singular: "Region map", plural: "Region maps" },
  admin: pickerAdmin("region-map", "Maps", "A world map of the hub's regions"),
  fields: [
    localizedText("title", { label: "Title (optional)" }),
    localizedTextarea("description", { label: "Intro (optional)" }),
    {
      name: "showRegionStories",
      type: "checkbox",
      label: "Show the latest from each region",
      defaultValue: true,
      admin: { description: "One newest story per region under the map. Turn off when a Community carousel on the same page already shows it." },
    },
  ],
};
