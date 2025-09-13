import { defineField, defineType } from "sanity";
import { Play } from "lucide-react";

export default defineType({
  name: "lived-experiences-carousel",
  title: "Lived Experiences Carousel",
  type: "object",
  icon: Play,
  fields: [
    defineField({
      name: "title",
      title: "Section Title",
      type: "string",
    }),
    defineField({
      name: "subtitle",
      title: "Section Subtitle",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "background",
      type: "background-option",
      title: "Background",
      description: "Choose a background for this carousel section",
    }),
    defineField({
      name: "padding",
      type: "section-padding",
    }),
    defineField({
      name: "filterBy",
      title: "Filter Options",
      type: "object",
      fields: [
        {
          name: "communities",
          title: "Communities",
          type: "array",
          of: [
            {
              type: "reference",
              to: [{ type: "regionalCommunity" }],
            },
          ],
          description: "Filter by specific communities (leave empty to show all)",
        },
        {
          name: "tags",
          title: "Tags",
          type: "array",
          of: [
            {
              type: "reference",
              to: [{ type: "tag" }],
            },
          ],
          description: "Filter by specific tags (leave empty to show all)",
        },
        {
          name: "authors",
          title: "Authors",
          type: "array",
          of: [
            {
              type: "reference",
              to: [{ type: "author" }],
            },
          ],
          description: "Filter by specific authors (leave empty to show all)",
        },
      ],
      description: "Configure filtering options for the carousel",
    }),
    defineField({
      name: "maxItems",
      title: "Maximum Items",
      type: "number",
      description: "Maximum number of lived experiences to display (default: 10)",
      initialValue: 10,
      validation: (Rule) => Rule.min(1).max(50),
    }),
    defineField({
      name: "featured",
      title: "Show Featured Only",
      type: "boolean",
      description: "Only show featured lived experiences",
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "subtitle",
    },
    prepare({ title, subtitle }) {
      return {
        title: title || "Lived Experiences Carousel",
        subtitle: subtitle || "Interactive carousel of lived experiences",
      };
    },
  },
});