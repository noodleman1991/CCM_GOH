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
      name: "subtitle",
      type: "string",
      title: "Subtitle",
      description: "Optional subtitle shown below the title",
    }),
    defineField({
        name: "description",
        type: "styled-block-content",
        title: "Description",
        description: "Optional description text that supports rich formatting and styling",
    }),
    defineField({
      name: "headerImage",
      type: "image",
      title: "Header Image",
      description:
        "Optional small image shown next to the section title (e.g. a logo or illustration)",
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: "alt",
          type: "string",
          title: "Alternative Text",
          description: "Describe the image for screen readers and SEO",
        }),
      ],
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
      name: "mode",
      title: "Content Mode",
      type: "string",
      options: {
        list: [
          { title: "Manual — hand-pick items", value: "manual" },
          { title: "Dynamic — most recent", value: "dynamic-recent" },
          { title: "Dynamic — featured first, fill with recent", value: "dynamic-featured" },
        ],
        layout: "radio",
      },
      initialValue: "manual",
      description:
        "Dynamic modes keep this section automatically up to date with the latest published content. Currently honored by the homepage 'Latest News' (news posts) and 'Research Agendas' (agendas) sections; other grid sections always use the manually picked items below.",
    }),
    defineField({
      name: "maxItems",
      title: "Max items (dynamic modes)",
      type: "number",
      initialValue: 3,
      hidden: ({ parent }) => !parent?.mode || parent?.mode === "manual",
      validation: (Rule) => Rule.min(1).max(12),
    }),
    defineField({
      name: "initialDisplayCount",
      type: "number",
      title: "Initial Display Count",
      description:
        "How many cards to show before the Show More button. Leave empty to always show all cards.",
      validation: (Rule) => Rule.min(1).integer(),
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
