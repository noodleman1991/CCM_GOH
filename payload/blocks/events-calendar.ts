import type { Block } from "payload";
import { localizedText, localizedTextarea } from "@/payload/fields/localized";
import { sectionPaddingField } from "@/payload/blocks/shared";
import { pickerAdmin } from "@/payload/blocks/picker";

/** `events-calendar` — fills itself from approved events (components/blocks/events/events-calendar.tsx). */
export const eventsCalendar: Block = {
  slug: "eventsCalendar",
  interfaceName: "EventsCalendarBlock",
  labels: { singular: "Events calendar", plural: "Events calendars" },
  admin: pickerAdmin("events-calendar", "Content", "A calendar of upcoming events, filled automatically"),
  fields: [
    localizedText("title", { label: "Title (optional)" }),
    localizedTextarea("description", { label: "Intro (optional)" }),
    {
      name: "upcomingLimit",
      type: "number",
      label: "How many upcoming events",
      min: 1,
      max: 24,
      defaultValue: 6,
      admin: { description: "Events appear here automatically once approved." },
    },
    sectionPaddingField("padding"),
  ],
};
