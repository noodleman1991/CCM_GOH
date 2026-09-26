import { defineType, defineField } from "sanity";
import { BookText } from "lucide-react";

/**
 * A chapter of a long-form document (e.g. the Global Research and Action
 * Agenda), rendered in the in-app docs reader. Editor-maintained so the Agenda
 * lives natively in the Hub (on-brand, accessible, localizable) rather than as
 * an external Docusaurus site. Body uses the shared styled-block-content so it
 * matches every other rich surface.
 */
export default defineType({
  name: "docsChapter",
  title: "Document Chapter",
  type: "document",
  icon: BookText,
  fields: [
    defineField({
      name: "collection",
      title: "Document",
      type: "string",
      description: "Which long-form document this chapter belongs to (e.g. 'global-agenda').",
      initialValue: "global-agenda",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "title",
      title: "Chapter title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      description: "Position in the chapter list (Cover = 1).",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "styled-block-content",
      description: "The chapter content — headings, figures, links, callouts.",
    }),
  ],
  orderings: [
    { title: "Order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] },
  ],
  preview: {
    select: { title: "title", order: "order", collection: "collection" },
    prepare({ title, order, collection }) {
      return { title: `${order ?? "—"}. ${title}`, subtitle: collection };
    },
  },
});
