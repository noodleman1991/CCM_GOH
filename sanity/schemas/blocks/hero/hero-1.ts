import { defineField, defineType } from "sanity";
import { LayoutTemplate } from "lucide-react";

export default defineType({
  name: "hero-1",
  title: "Hero 1",
  type: "object",
  icon: LayoutTemplate,
  fields: [
    defineField({
      name: "background",
      type: "background-option",
      title: "Background",
      description: "Choose a background for this hero section",
    }),
    defineField({
      name: "tagLine",
      type: "string",
      title: "Tag Line",
      description: "Short text shown above the main headline (e.g. a category or slogan).",
    }),
    defineField({
      name: "title",
      type: "string",
      title: "Heading",
      description: "Main headline of the hero section.",
    }),
    defineField({
      name: "body",
      type: "block-content",
      title: "Body",
      description: "Supporting text shown below the headline.",
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      description:
        "Shown at half width on desktop; drag the hotspot to control cropping.",
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Alternative Text",
        },
      ],
    }),
    defineField({
      name: "links",
      type: "array",
      of: [{ type: "link" }],
      validation: (rule) => rule.max(2),
    }),
    defineField({
      name: "padding",
      type: "section-padding",
      title: "Padding",
      description: "Add padding to the hero section",
    }),
    defineField({
      name: "imagePosition",
      type: "string",
      title: "Image Position",
      description: "Choose whether the image appears on the left or right of the text",
      options: {
        list: [
          { title: "Right", value: "right" },
          { title: "Left", value: "left" },
        ],
      },
      initialValue: "right",
    }),
  ],
  preview: {
    select: {
      title: "title",
    },
    prepare({ title }) {
      return {
        title: "Hero 1",
        subtitle: title,
      };
    },
  },
});
