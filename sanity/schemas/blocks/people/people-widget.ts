import { defineType, defineField } from "sanity";
import { Users } from "lucide-react";

// "People in your region — seeking / offering" widget (WIREFRAMES §4.1).
// A live cut of members; data is fetched client-side by region. The block only
// holds presentational copy.
export default defineType({
  name: "people-widget",
  type: "object",
  title: "People Widget",
  icon: Users,
  fields: [
    defineField({ name: "padding", type: "section-padding" }),
    defineField({ name: "title", type: "string", initialValue: "People in your region" }),
    defineField({ name: "description", type: "text", rows: 2 }),
    defineField({
      name: "limit",
      title: "Max members shown",
      type: "number",
      initialValue: 6,
      validation: (Rule) => Rule.min(1).max(24).integer(),
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({ title: title || "People Widget" }),
  },
});
