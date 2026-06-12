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
      description:
        "How many cards per row on desktop screens. Note: the 'Wide (16:9)' card style always shows at most 2 per row.",
      options: {
        list: COLS_VARIANTS.map(({ title, value }) => ({ title, value })),
        layout: "radio",
      },
      initialValue: "grid-cols-3",
    }),
    defineField({
      name: "cardVariant",
      type: "string",
      title: "Card Variant",
      description:
        "Card shape. 'Classic (3:2)' fits 2-4 per row; 'Wide (16:9)' is panoramic and overrides the columns setting to max 2 per row.",
      options: {
        list: [
          { title: "Classic (3:2 - Vertical)", value: "classic" },
          { title: "Wide (16:9 - Horizontal)", value: "wide" },
        ],
        layout: "radio",
      },
      initialValue: "classic",
    }),
    defineField({
      name: "columns",
      type: "array",
      of: [
        { type: "grid-card" },
        { type: "grid-post" },
        { type: "grid-agenda" },
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
      agendaTitle: "columns.0.agenda.title.en",
    },
    prepare({ title, postTitle, agendaTitle }) {
      return {
        title: "Grid Row",
        subtitle: title || postTitle || agendaTitle,
      };
    },
  },
});
