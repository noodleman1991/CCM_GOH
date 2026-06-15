import { defineField, defineType } from "sanity";
import { LetterText } from "lucide-react";
import { STACK_ALIGN, SECTION_WIDTH } from "./shared/layout-variants";

export default defineType({
  name: "section-header",
  type: "object",
  title: "Section Header",
  description: "A section header with a tag.ts line, title, and description",
  icon: LetterText,
  fields: [
    defineField({
      name: "padding",
      type: "section-padding",
    }),
    defineField({
      name: "sectionWidth",
      type: "string",
      title: "Section Width",
      options: {
        list: SECTION_WIDTH.map(({ title, value }) => ({ title, value })),
        layout: "radio",
      },
      initialValue: "default",
    }),
    defineField({
      name: "stackAlign",
      type: "string",
      title: "Stack Layout Alignment",
      options: {
        list: STACK_ALIGN.map(({ title, value }) => ({ title, value })),
        layout: "radio",
      },
      initialValue: "left",
    }),
    defineField({
      name: "tagLine",
      type: "object",
      title: "Tag Line",
      description: "Localized tag line text",
      fields: [
        { name: "en", title: "English", type: "string" },
        { name: "es", title: "Español", type: "string" },
        { name: "fr", title: "Français", type: "string" },
        { name: "ar", title: "العربية", type: "string" },
      ],
    }),
    defineField({
      name: "title",
      type: "object",
      title: "Title",
      description: "Localized section title",
      fields: [
        { name: "en", title: "English", type: "string" },
        { name: "es", title: "Español", type: "string" },
        { name: "fr", title: "Français", type: "string" },
        { name: "ar", title: "العربية", type: "string" },
      ],
    }),
    defineField({
      name: "description",
      type: "object",
      title: "Description",
      description: "Localized section description",
      fields: [
        { name: "en", title: "English", type: "text" },
        { name: "es", title: "Español", type: "text" },
        { name: "fr", title: "Français", type: "text" },
        { name: "ar", title: "العربية", type: "text" },
      ],
    }),
  ],
  preview: {
    select: {
      title: "title.en",
    },
    prepare({ title }) {
      return {
        title: "Section Header",
        subtitle: title,
      };
    },
  },
});
