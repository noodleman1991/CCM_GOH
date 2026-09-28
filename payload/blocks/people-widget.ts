import type { Block } from "payload";
import { localizedText, localizedTextarea } from "@/payload/fields/localized";
import { REGION_OPTIONS } from "@/payload/fields/regions";
import { pickerAdmin } from "@/payload/blocks/picker";

/** `people-widget` — hub members, filled automatically (components/blocks/people/people-widget.tsx). */
export const peopleWidget: Block = {
  slug: "peopleWidget",
  interfaceName: "PeopleWidgetBlock",
  labels: { singular: "People", plural: "People sections" },
  admin: pickerAdmin("people", "Content", "Members of the hub, filled automatically"),
  fields: [
    localizedText("title", { label: "Title (optional)" }),
    localizedTextarea("description", { label: "Intro (optional)" }),
    { name: "limit", type: "number", label: "How many people", min: 1, max: 48, defaultValue: 12 },
    {
      name: "region",
      type: "select",
      label: "Start on this region (optional)",
      options: REGION_OPTIONS,
      admin: { description: "Visitors can still switch regions." },
    },
  ],
};
