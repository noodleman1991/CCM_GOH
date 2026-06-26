import { defineType, defineField } from "sanity";
import { CalendarDays } from "lucide-react";

// Events calendar homepage block (WIREFRAMES §4): a month grid with event days
// tinted, an upcoming-events list with inline RSVP, and a Subscribe/iCal link.
// Approved events are fetched server-side via lib/events.ts fetchApprovedEvents();
// the block only holds presentational copy + how many upcoming events to list.
export default defineType({
  name: "events-calendar",
  type: "object",
  title: "Events Calendar",
  icon: CalendarDays,
  fields: [
    defineField({ name: "padding", type: "section-padding" }),
    defineField({ name: "title", type: "string", initialValue: "Events" }),
    defineField({ name: "description", type: "text", rows: 2 }),
    defineField({
      name: "upcomingLimit",
      title: "Max upcoming events listed",
      type: "number",
      initialValue: 5,
      validation: (Rule) => Rule.min(1).max(12).integer(),
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({ title: title || "Events Calendar" }),
  },
});
