import { defineField, defineType } from "sanity";
import { Newspaper } from "lucide-react";

export default defineType({
  name: "all-posts",
  type: "object",
  title: "All Posts",
  description: "A list of all posts",
  icon: Newspaper,
  fields: [
    defineField({
      name: "padding",
      type: "section-padding",
    }),
    defineField({
      name: "mode",
      type: "string",
      title: "Mode",
      description: "How to select posts to display",
      options: {
        list: [
          { title: "Manual Selection", value: "manual" },
          { title: "Featured First", value: "featured" },
          { title: "Most Recent", value: "recent" },
        ],
        layout: "radio",
      },
      initialValue: "featured",
    }),
    defineField({
      name: "limit",
      type: "number",
      title: "Number of Posts",
      description: "Maximum number of posts to display",
      initialValue: 6,
      validation: (Rule) => Rule.min(1).max(50),
    }),
    defineField({
      name: "manualPosts",
      type: "array",
      title: "Manual Posts Selection",
      description: "Select specific posts to display (only used when mode is Manual)",
      of: [
        {
          type: "reference",
          to: [{ type: "newsPost" }],
        },
      ],
      hidden: ({ parent }) => parent?.mode !== "manual",
    }),
  ],
  preview: {
    prepare() {
      return {
        title: "All Posts",
      };
    },
  },
});
