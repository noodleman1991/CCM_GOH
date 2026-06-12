import { defineField, defineType } from "sanity";
import { LayoutGrid } from "lucide-react";

export default defineType({
  name: "grid-card",
  type: "object",
  icon: LayoutGrid,
  fields: [
    defineField({
      name: "title",
      type: "string",
      description:
        "Keep under ~60 characters — long titles are trimmed to 2 lines on cards.",
    }),
    defineField({
      name: "excerpt",
      type: "text",
      description: "Short summary shown on the card, up to 3 lines.",
    }),
    defineField({
      name: "image",
      type: "image",
      description:
        "Card image. Drag the hotspot circle to keep the important part visible when the image is cropped.",
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Alternative Text",
        },
      ],
    }),
    defineField({
      name: "link",
      type: "link",
      description: "Where the card's button leads.",
    }),
  ],
  preview: {
    select: {
      title: "title",
      media: "image",
    },
    prepare({ title, media }) {
      return {
        title: "Grid Card",
        subtitle: title || "No title",
        media,
      };
    },
  },
});
