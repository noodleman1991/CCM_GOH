import { defineField, defineType } from "sanity";
import { LayoutGrid } from "lucide-react";
import { COLS_VARIANTS } from "../shared/layout-variants";

export default defineType({
  name: "grid-row",
  title: "Grid Row",
  type: "object",
  icon: LayoutGrid,
  fields: [
    defineField({
      name: "padding",
      type: "section-padding",
    }),
    defineField({
      name: "background",
      type: "background-option",
      title: "Background",
      description: "Choose a background for this grid section",
    }),
    defineField({
      name: "title",
      type: "string",
      title: "Title",
      description: "Optional title for the grid section",
    }),
    defineField({
        name: "description",
        type: "styled-block-content",
        title: "Description",
        description: "Optional description text that supports rich formatting and styling",
    }),
    defineField({
      name: "gridColumns",
      type: "string",
      title: "Grid Columns",
      options: {
        list: COLS_VARIANTS.map(({ title, value }) => ({ title, value })),
        layout: "radio",
      },
      initialValue: "grid-cols-3",
    }),
    defineField({
      name: "columns",
      type: "array",
      of: [
        { type: "grid-card" },
        { type: "grid-post" },
        { type: "grid-report" },
        { type: "grid-case-study" },
        { type: "grid-news" },
        { type: "grid-lived-experience" },
      ],
      options: {
        insertMenu: {
          views: [
            {
              name: "grid",
              previewImageUrl: (block) => `/sanity/preview/${block}.jpg`,
            },
            { name: "list" },
          ],
        },
      },
    }),
  ],
  preview: {
    select: {
      title: "columns.0.title",
      postTitle: "columns.0.post.title",
      reportTitle: "columns.0.report.title.en",
    },
    prepare({ title, postTitle, reportTitle }) {
      return {
        title: "Grid Row",
        subtitle: title || postTitle || reportTitle,
      };
    },
  },
});
