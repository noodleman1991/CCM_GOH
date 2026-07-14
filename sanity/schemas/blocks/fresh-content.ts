import { defineField, defineType } from "sanity";
import { Sparkles } from "lucide-react";

/**
 * Task 13 "Fresh on the hub" bento: the newest public content across every
 * type, as one editorial-pick lead + typed mini cards. Content is dynamic
 * (recency); editors control only the heading and how many items.
 */
export default defineType({
  name: "fresh-content",
  title: "Fresh content (bento)",
  type: "object",
  icon: Sparkles,
  fields: [
    defineField({
      name: "title",
      title: "Heading",
      type: "object",
      fields: [
        { name: "en", title: "English", type: "string" },
        { name: "es", title: "Spanish", type: "string" },
        { name: "fr", title: "French", type: "string" },
        { name: "ar", title: "Arabic", type: "string" },
      ],
    }),
    defineField({
      name: "limit",
      title: "Items",
      type: "number",
      initialValue: 5,
      validation: (r) => r.min(3).max(9),
    }),
  ],
  preview: {
    select: { title: "title.en" },
    prepare({ title }) {
      return { title: title || "Fresh on the hub", subtitle: "Bento of the newest content" };
    },
  },
});
