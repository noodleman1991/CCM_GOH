import { defineField, defineType } from "sanity";
import { Minus } from "lucide-react";

export default defineType({
  name: "separatorBlock",
  type: "object",
  title: "Section Separator",
  icon: Minus,
  fields: [
    defineField({
      name: "style",
      type: "string",
      title: "Separator Style",
      options: {
        list: [
          { title: "Simple Line", value: "line" },
          { title: "Dashed Line", value: "dashed" },
          { title: "Dotted Line", value: "dotted" },
          { title: "Spacer (No Line)", value: "spacer" },
          { title: "Wave", value: "wave" },
          { title: "Decorative", value: "decorative" },
        ],
      },
      initialValue: "line",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "spacing",
      type: "string",
      title: "Spacing",
      options: {
        list: [
          { title: "Small", value: "small" },
          { title: "Medium", value: "medium" },
          { title: "Large", value: "large" },
          { title: "Extra Large", value: "extra-large" },
        ],
      },
      initialValue: "medium",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "color",
      type: "string",
      title: "Color",
      options: {
        list: [
          { title: "Light Gray", value: "light-gray" },
          { title: "Medium Gray", value: "medium-gray" },
          { title: "Dark Gray", value: "dark-gray" },
          { title: "Brand Primary", value: "brand-primary" },
          { title: "Brand Secondary", value: "brand-secondary" },
        ],
      },
      initialValue: "light-gray",
      hidden: ({ parent }) => parent?.style === "spacer",
    }),
  ],
  preview: {
    select: {
      style: "style",
      spacing: "spacing",
      color: "color",
    },
    prepare({ style, spacing, color }) {
      const styleEmojis = {
        line: "━━━",
        dashed: "┅┅┅",
        dotted: "···",
        spacer: "⬜",
        wave: "〰️",
        decorative: "✨",
      };

      const emoji = styleEmojis[style as keyof typeof styleEmojis] || "━━━";
      const colorText = style === "spacer" ? "" : ` | ${color || "light-gray"}`;

      return {
        title: `${emoji} ${style}`,
        subtitle: `${spacing} spacing${colorText}`,
        media: Minus,
      };
    },
  },
});