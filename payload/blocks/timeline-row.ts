import type { Block } from "payload";
import { localizedRichText, localizedText } from "@/payload/fields/localized";
import { sectionPaddingField } from "@/payload/blocks/shared";
import { pickerAdmin } from "@/payload/blocks/picker";
import { moreOptions } from "@/payload/blocks/more-options";

/** `timeline-row` — steps or dates along a line (components/blocks/timeline/timeline-row.tsx). */
export const timelineRow: Block = {
  slug: "timelineRow",
  interfaceName: "TimelineRowBlock",
  labels: { singular: "Timeline", plural: "Timelines" },
  admin: pickerAdmin("timeline", "Text & media", "Steps or dates along a line"),
  fields: moreOptions([
    {
      name: "timelines",
      label: "Steps",
      type: "array",
      minRows: 1,
      labels: { singular: "Step", plural: "Steps" },
      fields: [
        localizedText("title", { label: "Title" }),
        localizedText("tagLine", { label: "Date or label" }),
        localizedRichText("body", { label: "Text" }),
      ],
    },
    sectionPaddingField("padding"),
  ]),
};
