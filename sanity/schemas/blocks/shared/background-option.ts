import { defineType, defineField } from "sanity";

export const backgroundOption = defineType({
  name: "background-option",
  title: "Background Option",
  type: "object",
  fields: [
    defineField({
      name: "type",
      title: "Background Type",
      type: "string",
      options: {
        list: [
          { title: "None (inherit)", value: "none" },
          { title: "Solid Color", value: "color" },
          { title: "SVG Pattern", value: "svg" },
          { title: "Image", value: "image" },
        ],
        layout: "radio",
      },
      initialValue: "none",
    }),
    defineField({
      name: "color",
      title: "Background Color",
      type: "color",
      hidden: ({ parent }) => parent?.type !== "color",
      validation: (rule) => rule.custom((color, context) => {
        const parent = context.parent as { type?: string };
        if (parent?.type === "color" && !color) {
          return "Background color is required when type is set to 'Solid Color'";
        }
        return true;
      }),
    }),
    defineField({
      name: "svgPattern",
      title: "SVG Pattern",
      type: "file",
      options: {
        accept: ".svg"
      },
      hidden: ({ parent }) => parent?.type !== "svg",
      validation: (rule) => rule.custom((file, context) => {
        const parent = context.parent as { type?: string };
        if (parent?.type === "svg" && !file) {
          return "SVG pattern is required when type is set to 'SVG Pattern'";
        }
        return true;
      }),
    }),
    defineField({
      name: "image",
      title: "Background Image",
      type: "image",
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Alternative Text",
        },
      ],
      hidden: ({ parent }) => parent?.type !== "image",
      validation: (rule) => rule.custom((image, context) => {
        const parent = context.parent as { type?: string };
        if (parent?.type === "image" && !image) {
          return "Background image is required when type is set to 'Image'";
        }
        return true;
      }),
    }),
  ],
  preview: {
    select: {
      type: "type",
      color: "color",
    },
    prepare({ type, color }) {
      return {
        title: "Background",
        subtitle: type === "color" && color?.hex ? 
          `${type} (${color.hex})` : 
          type || "None",
      };
    },
  },
});