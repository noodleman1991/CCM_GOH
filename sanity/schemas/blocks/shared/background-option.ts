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
          { title: "Gradient", value: "gradient" },
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
      name: "gradient",
      title: "Gradient",
      type: "object",
      fields: [
        {
          name: "direction",
          title: "Direction",
          type: "string",
          options: {
            list: [
              { title: "To Right", value: "to-r" },
              { title: "To Left", value: "to-l" },
              { title: "To Bottom", value: "to-b" },
              { title: "To Top", value: "to-t" },
              { title: "To Bottom Right", value: "to-br" },
              { title: "To Bottom Left", value: "to-bl" },
              { title: "To Top Right", value: "to-tr" },
              { title: "To Top Left", value: "to-tl" },
            ],
            layout: "dropdown",
          },
          initialValue: "to-r",
        },
        {
          name: "startColor",
          title: "Start Color",
          type: "color",
          validation: (Rule) => Rule.required(),
        },
        {
          name: "endColor",
          title: "End Color",
          type: "color",
          validation: (Rule) => Rule.required(),
        },
      ],
      hidden: ({ parent }) => parent?.type !== "gradient",
      validation: (rule) => rule.custom((gradient, context) => {
        const parent = context.parent as { type?: string };
        if (parent?.type === "gradient" && !gradient) {
          return "Gradient configuration is required when type is set to 'Gradient'";
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
      gradient: "gradient",
    },
    prepare({ type, color, gradient }) {
      let subtitle = type || "None";

      if (type === "color" && color?.hex) {
        subtitle = `${type} (${color.hex})`;
      } else if (type === "gradient" && gradient?.startColor?.hex && gradient?.endColor?.hex) {
        subtitle = `${type} (${gradient.startColor.hex} → ${gradient.endColor.hex})`;
      }

      return {
        title: "Background",
        subtitle,
      };
    },
  },
});