import { defineField, defineType } from "sanity";
import { orderRankField } from "@sanity/orderable-document-list";
import { BookA } from "lucide-react";

export default defineType({
  name: "category",
  title: "Category",
  type: "document",
  icon: BookA,
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: "Category name used to group blog posts.",
      validation: (Rule) => Rule.required(),
    }),
    orderRankField({ type: "category" }),
  ],
  preview: {
    select: { title: "title" },
  },
});
