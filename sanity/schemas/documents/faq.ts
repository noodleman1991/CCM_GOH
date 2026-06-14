import { defineField, defineType } from "sanity";
import { ListCollapse } from "lucide-react";
import { orderRankField } from "@sanity/orderable-document-list";

export default defineType({
  name: "faq",
  title: "FAQ",
  type: "document",
  icon: ListCollapse,
  fields: [
    defineField({
      name: "title",
      title: "Question",
      type: "string",
      description: "The question, as a visitor would phrase it.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "body",
      title: "Answer",
      type: "block-content",
      description: "The answer. Supports rich text and links.",
    }),
    orderRankField({ type: "faq" }),
  ],

  preview: {
    select: {
      title: "title",
    },
  },
});
