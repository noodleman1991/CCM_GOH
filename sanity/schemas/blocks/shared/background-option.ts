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
          { title: "CCM Color Palette", value: "ccm-palette" },
          { title: "Custom Color", value: "color" },
          { title: "Gradient", value: "gradient" },
          { title: "SVG Pattern", value: "svg" },
          { title: "Image", value: "image" },
        ],
        layout: "radio",
      },
      initialValue: "none",
    }),
    defineField({
      name: "ccmColor",
      title: "CCM Color",
      type: "string",
      options: {
        list: [
          { title: "CCM Sky", value: "ccm-sky" },
          { title: "CCM Water", value: "ccm-water" },
          { title: "CCM Sea", value: "ccm-sea" },
          { title: "CCM Midnight", value: "ccm-midnight" },
        ],
        layout: "dropdown",
      },
      hidden: ({ parent }) => parent?.type !== "ccm-palette",
    }),
    defineField({
      name: "color",
      title: "Custom Background Color",
      type: "string",
      description: "Enter a hex color code (e.g., #205596)",
      hidden: ({ parent }) => parent?.type !== "color",
      validation: (rule) => rule.custom((color) => {
        if (color && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
          return "Please enter a valid hex color code (e.g., #205596)";
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
          type: "string",
          description: "Enter a hex color code (e.g., #205596)",
          validation: (Rule) => Rule.custom((color: string) => {
            if (color && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
              return "Please enter a valid hex color code (e.g., #205596)";
            }
            return true;
          }),
        },
        {
          name: "endColor",
          title: "End Color",
          type: "string",
          description: "Enter a hex color code (e.g., #90e0f4)",
          validation: (Rule) => Rule.custom((color: string) => {
            if (color && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
              return "Please enter a valid hex color code (e.g., #90e0f4)";
            }
            return true;
          }),
        },
      ],
      hidden: ({ parent }) => parent?.type !== "gradient",
      validation: (rule) => rule.custom((gradient, context) => {
        const parent = context.parent as { type?: string };
        if (parent?.type === "gradient" && gradient && (!gradient.startColor || !gradient.endColor)) {
          return "Both start and end colors are required for gradients";
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
      validation: (rule) => rule.custom(() => true),
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
      validation: (rule) => rule.custom(() => true),
    }),
  ],
  preview: {
    select: {
      type: "type",
      ccmColor: "ccmColor",
      color: "color",
      gradient: "gradient",
    },
    prepare({ type, ccmColor, color, gradient }) {
      let subtitle = type || "None";

      if (type === "ccm-palette" && ccmColor) {
        const colorMap = {
          "ccm-sky": "#9BC6DA",
          "ccm-water": "#4186C3",
          "ccm-sea": "#205596",
          "ccm-midnight": "#0B3160",
        };
        subtitle = `CCM ${ccmColor.replace("ccm-", "").replace("-", " ").toUpperCase()} (${colorMap[ccmColor as keyof typeof colorMap]})`;
      } else if (type === "color" && color) {
        subtitle = `Custom Color (${color})`;
      } else if (type === "gradient" && gradient?.startColor && gradient?.endColor) {
        subtitle = `Gradient (${gradient.startColor} → ${gradient.endColor})`;
      }

      return {
        title: "Background",
        subtitle,
      };
    },
  },
});