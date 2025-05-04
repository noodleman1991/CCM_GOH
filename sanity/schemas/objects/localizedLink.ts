
import { defineField, defineType } from "sanity";
import { i18n } from "@/i18n/languages.json";

export default defineType({
  name: "localized-link",
  title: "Localized Link",
  type: "object",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "object",
      fields: i18n.languages.map((lang) => ({
        name: lang.id,
        title: `Title (${lang.title})`,
        type: "string",
      })),
    }),
    defineField({
      name: "href",
      title: "URL",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "buttonVariant",
      title: "Button Variant",
      type: "string",
      options: {
        list: [
          { title: "Default", value: "default" },
          { title: "Outline", value: "outline" },
          { title: "Secondary", value: "secondary" },
          { title: "Ghost", value: "ghost" },
          { title: "Link", value: "link" },
        ],
      },
      initialValue: "default",
    }),
    defineField({
      name: "target",
      title: "Open in new tab",
      type: "boolean",
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: `title.${i18n.base}`,
      href: "href",
    },
    prepare({ title, href }) {
      return {
        title: title || "Untitled Link",
        subtitle: href,
      };
    },
  },
});
