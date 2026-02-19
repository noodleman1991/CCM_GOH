import { defineField, defineType } from "sanity";
import { Link } from "lucide-react";

/**
 * Document Reference List Block
 *
 * A generic reusable block for displaying lists of referenced documents.
 * Can be used for tags, projects, organizations, or any document type
 * with localized fields.
 *
 * Pattern: Option 3 (Dynamic References)
 * - Stores references to any document type
 * - Fetches localized content from referenced documents
 * - Reusable across different content types
 */
export default defineType({
  name: "documentReferenceList",
  type: "object",
  title: "Document Reference List",
  description: "A generic list of document references with auto-localized content",
  icon: Link,
  fields: [
    defineField({
      name: "title",
      type: "object",
      title: "Section Title",
      description: "Optional title for the reference list section",
      fields: [
        { name: "en", title: "English", type: "string" },
        { name: "es", title: "Español", type: "string" },
        { name: "fr", title: "Français", type: "string" },
        { name: "ar", title: "العربية", type: "string" },
      ],
    }),
    defineField({
      name: "documentType",
      type: "string",
      title: "Document Type",
      description: "Type of documents to reference",
      options: {
        list: [
          { title: "Regional Communities", value: "regionalCommunity" },
          { title: "Tags", value: "tag" },
          { title: "Projects", value: "project" },
          { title: "Organizations", value: "organization" },
          { title: "News Posts", value: "newsPost" },
          { title: "Case Studies", value: "caseStudy" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "documents",
      type: "array",
      title: "Documents",
      description: "Select documents to display",
      of: [
        {
          type: "reference",
          to: [
            { type: "regionalCommunity" },
            { type: "tag" },
            { type: "project" },
            { type: "organization" },
            { type: "newsPost" },
            { type: "caseStudy" },
          ],
          options: {
            filter: ({ document }) => {
              const docType = document?.documentType;
              if (!docType) return {};
              return {
                filter: "_type == $type",
                params: { type: docType },
              };
            },
          },
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "layout",
      type: "string",
      title: "Layout Style",
      description: "How to display the document list",
      options: {
        list: [
          { title: "Grid", value: "grid" },
          { title: "List", value: "list" },
          { title: "Cards", value: "cards" },
          { title: "Inline Tags", value: "tags" },
        ],
        layout: "radio",
      },
      initialValue: "grid",
    }),
    defineField({
      name: "displayField",
      type: "string",
      title: "Display Field",
      description: "Which field to display from the referenced documents",
      options: {
        list: [
          { title: "Name/Title", value: "name" },
          { title: "Description", value: "description" },
          { title: "Both", value: "both" },
        ],
        layout: "radio",
      },
      initialValue: "name",
    }),
    defineField({
      name: "linkToDocument",
      type: "boolean",
      title: "Link to Documents",
      description: "Make items clickable links to the full documents",
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: "title.en",
      documentType: "documentType",
      documents: "documents",
    },
    prepare({ title, documentType, documents }) {
      const count = documents?.length || 0;
      const type = documentType || "documents";
      return {
        title: title || "Document Reference List",
        subtitle: `${count} ${type} ${count === 1 ? "reference" : "references"}`,
        media: Link,
      };
    },
  },
});
