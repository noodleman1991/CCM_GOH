import { defineField, defineType } from "sanity";
import { MapPinned } from "lucide-react";
import { orderRankField } from "@sanity/orderable-document-list";
import { isUniqueOtherThanLanguage } from '@/sanity/lib/isUniqueOtherThanLanguage';
import { COLS_VARIANTS } from "../blocks/shared/layout-variants";

export default defineType({
  name: "regionalCommunityPage",
  type: "document",
  title: "Regional Community Page",
  icon: MapPinned,
  groups: [
    {
      name: "content",
      title: "Content",
    },
    {
      name: "template",
      title: "Template",
    },
    {
      name: "seo",
      title: "SEO",
    },
    {
      name: "settings",
      title: "Settings",
    },
  ],
  fields: [
    defineField({
      name: "title",
      type: "string",
      group: "content",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "settings",
      options: {
        source: "title",
        maxLength: 96,
        isUnique: isUniqueOtherThanLanguage,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "regionalCommunity",
      title: "Regional Community",
      type: "reference",
      to: [{ type: "regionalCommunity" }],
      group: "settings",
      description: "Link to the regional community for dynamic content filtering",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "language",
      type: "string",
      readOnly: true,
      group: "settings",
    }),

    // Template Structure
    defineField({
      name: "useTemplate",
      title: "Use Regional Community Template",
      type: "boolean",
      group: "template",
      initialValue: true,
      description: "Use the structured template with fixed blocks and dynamic content, or use custom content flow",
    }),

    defineField({
      name: "divider_template_start",
      title: "═══ TEMPLATE BLOCKS BELOW ═══",
      type: "string",
      group: "template",
      hidden: ({ document }) => !Boolean(document?.useTemplate),
      components: {
        input: () => null,
      },
    }),

    // Template Components
    defineField({
      name: "welcomeHero",
      title: "Welcome Hero Section",
      type: "hero-1",
      group: "template",
      hidden: ({ document }) => !Boolean(document?.useTemplate),
      description: "Welcome hero section",
    }),

    defineField({
      name: "divider_after_welcome",
      title: "─────────────────",
      type: "string",
      group: "template",
      hidden: ({ document }) => !Boolean(document?.useTemplate),
      components: {
        input: () => null,
      },
    }),

    defineField({
      name: "whyJoinCTA",
      title: "Why Join Regional Community Hero",
      type: "hero-1",
      group: "template",
      hidden: ({ document }) => !Boolean(document?.useTemplate),
      description: "Hero section with image support for joining the regional community (supports buttons and image positioning)",
    }),

    defineField({
      name: "divider_after_whyjoin",
      title: "─────────────────",
      type: "string",
      group: "template",
      hidden: ({ document }) => !Boolean(document?.useTemplate),
      components: {
        input: () => null,
      },
    }),

    // Dynamic Grid Configurations
    defineField({
      name: "agendasGrid",
      title: "Agendas Grid Section",
      type: "object",
      group: "template",
      hidden: ({ document }) => !Boolean(document?.useTemplate),
      fields: [
        {
          name: "mode",
          title: "Content Mode",
          type: "string",
          description:
            "How this section is filled. Dynamic modes update automatically as new content is published for this region — you don't have to touch the page. 'Dynamic + pinned' lets you feature a few hand-picked items at the top while the rest auto-fill.",
          options: {
            list: [
              { title: "Manual selection only — you choose every item", value: "manual" },
              { title: "Dynamic — featured items first, then recent", value: "dynamic-featured" },
              { title: "Dynamic — most recent first", value: "dynamic-recent" },
              { title: "Dynamic + pinned — your picks first, then auto-fill", value: "dynamic-with-pinned" },
            ],
            layout: "radio",
          },
          initialValue: "dynamic-featured",
        },
        {
          name: "gridColumns",
          title: "Grid Columns",
          type: "string",
          options: {
            list: COLS_VARIANTS.map(({ title, value }) => ({ title, value })),
            layout: "radio",
          },
          initialValue: "grid-cols-3",
        },
        {
          name: "maxItems",
          title: "Maximum Items",
          type: "number",
          initialValue: 6,
          validation: (Rule) => Rule.min(1).max(12),
        },
        {
          name: "initialDisplayCount",
          title: "Initial Display Count",
          type: "number",
          initialValue: 3,
          validation: (Rule) => Rule.min(1).max(12),
          description: "Number of items to show initially (rest shown on 'View More')",
        },
        {
          name: "showTitle",
          title: "Show Section Title",
          type: "boolean",
          initialValue: true,
        },
        {
          name: "title",
          title: "Section Title",
          type: "string",
          initialValue: "Agendas",
          hidden: ({ parent }) => !Boolean(parent?.showTitle),
        },
        {
          name: "subtitle",
          title: "Section Subtitle",
          type: "string",
          hidden: ({ parent }) => !Boolean(parent?.showTitle),
        },
        {
          name: "showDescription",
          title: "Show Description",
          type: "boolean",
          initialValue: false,
        },
        {
          name: "description",
          title: "Section Description",
          type: "styled-block-content",
          hidden: ({ parent }) => !Boolean(parent?.showDescription),
        },
        {
          name: "headerImage",
          title: "Header Image",
          type: "image",
          description: "Small engaging image displayed next to section title",
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: "alt",
              type: "string",
              title: "Alternative Text",
            },
          ],
        },
        {
          name: "manualItems",
          title: "Manual Agenda Selection",
          type: "array",
          of: [{ type: "grid-agenda" }],
          hidden: ({ parent }) => parent?.mode !== "manual" && parent?.mode !== "dynamic-with-pinned",
          description:
            "In 'Manual' mode these are the only agendas shown. In 'Dynamic + pinned' mode these are featured first, then the regional feed fills the rest.",
        },
      ],
    }),

    defineField({
      name: "divider_after_agendas",
      title: "─────────────────",
      type: "string",
      group: "template",
      hidden: ({ document }) => !Boolean(document?.useTemplate),
      components: {
        input: () => null,
      },
    }),

    defineField({
      name: "caseStudiesGrid",
      title: "Case Studies Grid Section",
      type: "object",
      group: "template",
      hidden: ({ document }) => !Boolean(document?.useTemplate),
      fields: [
        {
          name: "mode",
          title: "Content Mode",
          type: "string",
          description:
            "How this section is filled. Dynamic modes update automatically as new content is published for this region — you don't have to touch the page. 'Dynamic + pinned' lets you feature a few hand-picked items at the top while the rest auto-fill.",
          options: {
            list: [
              { title: "Manual selection only — you choose every item", value: "manual" },
              { title: "Dynamic — featured items first, then recent", value: "dynamic-featured" },
              { title: "Dynamic — most recent first", value: "dynamic-recent" },
              { title: "Dynamic + pinned — your picks first, then auto-fill", value: "dynamic-with-pinned" },
            ],
            layout: "radio",
          },
          initialValue: "dynamic-featured",
        },
        {
          name: "gridColumns",
          title: "Grid Columns",
          type: "string",
          options: {
            list: COLS_VARIANTS.map(({ title, value }) => ({ title, value })),
            layout: "radio",
          },
          initialValue: "grid-cols-3",
        },
        {
          name: "maxItems",
          title: "Maximum Items",
          type: "number",
          initialValue: 6,
          validation: (Rule) => Rule.min(1).max(12),
        },
        {
          name: "initialDisplayCount",
          title: "Initial Display Count",
          type: "number",
          initialValue: 3,
          validation: (Rule) => Rule.min(1).max(12),
          description: "Number of items to show initially (rest shown on 'View More')",
        },
        {
          name: "showTitle",
          title: "Show Section Title",
          type: "boolean",
          initialValue: true,
        },
        {
          name: "title",
          title: "Section Title",
          type: "string",
          initialValue: "Case Studies",
          hidden: ({ parent }) => !Boolean(parent?.showTitle),
        },
        {
          name: "subtitle",
          title: "Section Subtitle",
          type: "string",
          hidden: ({ parent }) => !Boolean(parent?.showTitle),
        },
        {
          name: "showDescription",
          title: "Show Description",
          type: "boolean",
          initialValue: false,
        },
        {
          name: "description",
          title: "Section Description",
          type: "styled-block-content",
          hidden: ({ parent }) => !Boolean(parent?.showDescription),
        },
        {
          name: "headerImage",
          title: "Header Image",
          type: "image",
          description: "Small engaging image displayed next to section title",
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: "alt",
              type: "string",
              title: "Alternative Text",
            },
          ],
        },
        {
          name: "manualItems",
          title: "Manual Case Studies Selection",
          type: "array",
          of: [{ type: "grid-case-study" }],
          hidden: ({ parent }) => parent?.mode !== "manual" && parent?.mode !== "dynamic-with-pinned",
          description:
            "In 'Manual' mode these are the only case studies shown. In 'Dynamic + pinned' mode these are featured first, then the regional feed fills the rest.",
        },
      ],
    }),

    defineField({
      name: "divider_after_casestudies",
      title: "─────────────────",
      type: "string",
      group: "template",
      hidden: ({ document }) => !Boolean(document?.useTemplate),
      components: {
        input: () => null,
      },
    }),

    defineField({
      name: "newsGrid",
      title: "News Grid Section",
      type: "object",
      group: "template",
      hidden: ({ document }) => !Boolean(document?.useTemplate),
      fields: [
        {
          name: "mode",
          title: "Content Mode",
          type: "string",
          description:
            "How this section is filled. Dynamic modes update automatically as new content is published for this region — you don't have to touch the page. 'Dynamic + pinned' lets you feature a few hand-picked items at the top while the rest auto-fill.",
          options: {
            list: [
              { title: "Manual selection only — you choose every item", value: "manual" },
              { title: "Dynamic — featured items first, then recent", value: "dynamic-featured" },
              { title: "Dynamic — most recent first", value: "dynamic-recent" },
              { title: "Dynamic + pinned — your picks first, then auto-fill", value: "dynamic-with-pinned" },
            ],
            layout: "radio",
          },
          initialValue: "dynamic-featured",
        },
        {
          name: "gridColumns",
          title: "Grid Columns",
          type: "string",
          options: {
            list: COLS_VARIANTS.map(({ title, value }) => ({ title, value })),
            layout: "radio",
          },
          initialValue: "grid-cols-3",
        },
        {
          name: "maxItems",
          title: "Maximum Items",
          type: "number",
          initialValue: 6,
          validation: (Rule) => Rule.min(1).max(12),
        },
        {
          name: "initialDisplayCount",
          title: "Initial Display Count",
          type: "number",
          initialValue: 3,
          validation: (Rule) => Rule.min(1).max(12),
          description: "Number of items to show initially (rest shown on 'View More')",
        },
        {
          name: "showTitle",
          title: "Show Section Title",
          type: "boolean",
          initialValue: true,
        },
        {
          name: "title",
          title: "Section Title",
          type: "string",
          initialValue: "News & Updates",
          hidden: ({ parent }) => !Boolean(parent?.showTitle),
        },
        {
          name: "subtitle",
          title: "Section Subtitle",
          type: "string",
          hidden: ({ parent }) => !Boolean(parent?.showTitle),
        },
        {
          name: "showDescription",
          title: "Show Description",
          type: "boolean",
          initialValue: false,
        },
        {
          name: "description",
          title: "Section Description",
          type: "styled-block-content",
          hidden: ({ parent }) => !Boolean(parent?.showDescription),
        },
        {
          name: "headerImage",
          title: "Header Image",
          type: "image",
          description: "Small engaging image displayed next to section title",
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: "alt",
              type: "string",
              title: "Alternative Text",
            },
          ],
        },
        {
          name: "manualItems",
          title: "Manual News Selection",
          type: "array",
          of: [{ type: "grid-news" }],
          hidden: ({ parent }) => parent?.mode !== "manual" && parent?.mode !== "dynamic-with-pinned",
          description:
            "In 'Manual' mode these are the only news posts shown. In 'Dynamic + pinned' mode these are featured first, then the regional feed fills the rest.",
        },
      ],
    }),

    defineField({
      name: "divider_after_news",
      title: "─────────────────",
      type: "string",
      group: "template",
      hidden: ({ document }) => !Boolean(document?.useTemplate),
      components: {
        input: () => null,
      },
    }),

    defineField({
      name: "livedExperiencesCarousel",
      title: "Lived Experiences Carousel Section",
      type: "object",
      group: "template",
      hidden: ({ document }) => !Boolean(document?.useTemplate),
      fields: [
        {
          name: "mode",
          title: "Content Mode",
          type: "string",
          description:
            "How this section is filled. Dynamic modes update automatically as new content is published for this region — you don't have to touch the page. 'Dynamic + pinned' lets you feature a few hand-picked items at the top while the rest auto-fill.",
          options: {
            list: [
              { title: "Manual selection only — you choose every item", value: "manual" },
              { title: "Dynamic — featured items first, then recent", value: "dynamic-featured" },
              { title: "Dynamic — most recent first", value: "dynamic-recent" },
              { title: "Dynamic + pinned — your picks first, then auto-fill", value: "dynamic-with-pinned" },
            ],
            layout: "radio",
          },
          initialValue: "dynamic-featured",
        },
        {
          name: "maxItems",
          title: "Maximum Items",
          type: "number",
          initialValue: 10,
          validation: (Rule) => Rule.min(1).max(20),
        },
        {
          name: "showTitle",
          title: "Show Section Title",
          type: "boolean",
          initialValue: true,
        },
        {
          name: "title",
          title: "Section Title",
          type: "string",
          initialValue: "Community Voices",
          hidden: ({ parent }) => !Boolean(parent?.showTitle),
        },
        {
          name: "showDescription",
          title: "Show Description",
          type: "boolean",
          initialValue: false,
        },
        {
          name: "description",
          title: "Section Description",
          type: "styled-block-content",
          hidden: ({ parent }) => !Boolean(parent?.showDescription),
        },
        {
          name: "manualItems",
          title: "Manual Lived Experiences Selection",
          type: "array",
          of: [{ type: "grid-lived-experience" }],
          hidden: ({ parent }) => parent?.mode !== "manual" && parent?.mode !== "dynamic-with-pinned",
          description:
            "In 'Manual' mode these are the only lived experiences shown. In 'Dynamic + pinned' mode these are featured first, then the regional feed fills the rest.",
        },
      ],
    }),

    defineField({
      name: "divider_after_livedexp",
      title: "─────────────────",
      type: "string",
      group: "template",
      hidden: ({ document }) => !Boolean(document?.useTemplate),
      components: {
        input: () => null,
      },
    }),

    // Team Members Section
    defineField({
      name: "teamGrid",
      title: "Team Members Grid",
      type: "object",
      group: "template",
      hidden: ({ document }) => !Boolean(document?.useTemplate),
      description: "Display team members for this regional community",
      fields: [
        {
          name: "mode",
          title: "Content Mode",
          type: "string",
          options: {
            list: [
              { title: "Manual Selection", value: "manual" },
              { title: "Dynamic - From Community Members", value: "dynamic" },
            ],
            layout: "radio",
          },
          initialValue: "dynamic",
        },
        {
          name: "manualMembers",
          title: "Manual Member Selection",
          type: "array",
          of: [
            {
              type: "reference",
              to: [{ type: "author" }],
            },
          ],
          hidden: ({ parent }) => parent?.mode !== "manual" && parent?.mode !== "dynamic-with-pinned",
          description: "Manually select team members to display",
        },
        {
          name: "gridColumns",
          title: "Grid Columns",
          type: "string",
          options: {
            list: [
              { title: "2 Columns", value: "grid-cols-2" },
              { title: "3 Columns", value: "grid-cols-3" },
              { title: "4 Columns", value: "grid-cols-4" },
              { title: "5 Columns", value: "grid-cols-5" },
            ],
            layout: "radio",
          },
          initialValue: "grid-cols-4",
        },
        {
          name: "showTitle",
          title: "Show Section Title",
          type: "boolean",
          initialValue: true,
        },
        {
          name: "title",
          title: "Section Title",
          type: "string",
          initialValue: "Our Team",
          hidden: ({ parent }) => !Boolean(parent?.showTitle),
        },
        {
          name: "showDescription",
          title: "Show Description",
          type: "boolean",
          initialValue: false,
        },
        {
          name: "description",
          title: "Description",
          type: "styled-block-content",
          hidden: ({ parent }) => !Boolean(parent?.showDescription),
        },
        {
          name: "displayRole",
          title: "Display Role",
          type: "boolean",
          initialValue: true,
          description: "Show member's role in the community",
        },
        {
          name: "displayAffiliation",
          title: "Display Affiliation",
          type: "boolean",
          initialValue: true,
          description: "Show member's organizational affiliation",
        },
      ],
    }),

    defineField({
      name: "divider_after_team",
      title: "─────────────────",
      type: "string",
      group: "template",
      hidden: ({ document }) => !Boolean(document?.useTemplate),
      components: {
        input: () => null,
      },
    }),

    defineField({
      name: "logoCloud",
      title: "Logo Cloud Section",
      type: "logo-cloud-1",
      group: "template",
      hidden: ({ document }) => !Boolean(document?.useTemplate),
      description: "Partner organizations logo cloud",
    }),

    // Section dividers for Sanity CMS editor organization (visual only)
    defineField({
      name: "divider_after_logo",
      title: "═══ TEMPLATE BLOCKS ABOVE ═══",
      type: "string",
      group: "template",
      hidden: ({ document }) => !Boolean(document?.useTemplate),
      components: {
        input: () => null,
      },
    }),

    // Main content flow - structured foundation with strategic insertion points
    defineField({
      name: "contentFlow",
      type: "array",
      title: "Custom Content Flow",
      group: "content",
      hidden: ({ document }) => Boolean(document?.useTemplate),
      description: "Add structured content blocks and custom inserts between fixed elements (disabled when using template)",
      of: [
        // Core structured elements
        { type: "section-header" },
        { type: "split-row" },
        { type: "grid-row" },
        { type: "team-grid" },
        { type: "carousel-1" },
        { type: "carousel-2" },
        { type: "lived-experiences-carousel" },
        { type: "timeline-row" },
        { type: "cta-1" },
        { type: "logo-cloud-1" },
        { type: "faqs" },
        { type: "form-newsletter" },
        { type: "all-posts" },
        { type: "region-map" },

        // Strategic insertion blocks
        { type: "manualContentInsert" },
        { type: "dynamicContentInsert" },
        { type: "separatorBlock" },
      ],
      options: {
        insertMenu: {
          groups: [
            {
              name: "structure",
              title: "Page Structure",
              of: [
                "section-header",
                "split-row",
                "grid-row",
                "team-grid",
                "timeline-row",
                "cta-1",
                "logo-cloud-1",
                "faqs",
                "form-newsletter",
                "all-posts",
                "region-map"
              ],
            },
            {
              name: "carousel",
              title: "Carousels",
              of: ["carousel-1", "carousel-2", "lived-experiences-carousel"],
            },
            {
              name: "inserts",
              title: "Custom Inserts",
              of: ["manualContentInsert", "dynamicContentInsert", "separatorBlock"],
            },
          ],
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
    // SEO Fields
    defineField({
      name: "meta_title",
      title: "Meta Title",
      type: "string",
      group: "seo",
    }),
    defineField({
      name: "meta_description",
      title: "Meta Description",
      type: "text",
      group: "seo",
      rows: 3,
    }),
    defineField({
      name: "noindex",
      title: "No Index",
      type: "boolean",
      initialValue: false,
      group: "seo",
    }),
    defineField({
      name: "ogImage",
      title: "Open Graph Image - [1200x630]",
      type: "image",
      group: "seo",
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Alternative Text",
        },
      ],
    }),
    orderRankField({ type: "regionalCommunityPage" }),
  ],
  preview: {
    select: {
      title: 'title',
      language: 'language',
      regionalCommunity: 'regionalCommunity.name',
      useTemplate: 'useTemplate',
    },
    prepare(select) {
      const { title, language, regionalCommunity, useTemplate } = select;

      return {
        title: title || "Regional Community Page",
        subtitle: `${regionalCommunity || "No Community"} | ${language ? language.toUpperCase() : 'EN'} | ${useTemplate ? 'Template' : 'Custom'}`,
      };
    },
  }
});
