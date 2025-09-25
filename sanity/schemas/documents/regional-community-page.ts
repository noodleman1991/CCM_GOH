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
      name: "whyJoinCTA",
      title: "Why Join Regional Community CTA",
      type: "cta-1",
      group: "template",
      hidden: ({ document }) => !Boolean(document?.useTemplate),
      description: "Call-to-action for joining the regional community",
    }),
    // Dynamic Grid Configurations
    defineField({
      name: "reportsGrid",
      title: "Reports Grid Section",
      type: "object",
      group: "template",
      hidden: ({ document }) => !Boolean(document?.useTemplate),
      fields: [
        {
          name: "mode",
          title: "Content Mode",
          type: "string",
          options: {
            list: [
              { title: "Manual Selection", value: "manual" },
              { title: "Dynamic - Featured First", value: "dynamic-featured" },
              { title: "Dynamic - Recent First", value: "dynamic-recent" },
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
          name: "showTitle",
          title: "Show Section Title",
          type: "boolean",
          initialValue: true,
        },
        {
          name: "title",
          title: "Section Title",
          type: "string",
          initialValue: "Reports",
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
          title: "Manual Report Selection",
          type: "array",
          of: [{ type: "grid-report" }],
          hidden: ({ parent }) => parent?.mode !== "manual",
          description: "Manually select specific reports to display",
        },
      ],
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
          options: {
            list: [
              { title: "Manual Selection", value: "manual" },
              { title: "Dynamic - Featured First", value: "dynamic-featured" },
              { title: "Dynamic - Recent First", value: "dynamic-recent" },
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
          title: "Manual News Selection",
          type: "array",
          of: [{ type: "grid-news" }],
          hidden: ({ parent }) => parent?.mode !== "manual",
          description: "Manually select specific news posts to display",
        },
      ],
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
          options: {
            list: [
              { title: "Manual Selection", value: "manual" },
              { title: "Dynamic - Featured First", value: "dynamic-featured" },
              { title: "Dynamic - Recent First", value: "dynamic-recent" },
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
          title: "Manual Case Studies Selection",
          type: "array",
          of: [{ type: "grid-case-study" }],
          hidden: ({ parent }) => parent?.mode !== "manual",
          description: "Manually select specific case studies to display",
        },
      ],
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
          options: {
            list: [
              { title: "Manual Selection", value: "manual" },
              { title: "Dynamic - Featured First", value: "dynamic-featured" },
              { title: "Dynamic - Recent First", value: "dynamic-recent" },
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
          hidden: ({ parent }) => parent?.mode !== "manual",
          description: "Manually select specific lived experiences to display",
        },
      ],
    }),
    defineField({
      name: "testimonialsBlock",
      title: "Testimonials Section",
      type: "object",
      group: "template",
      hidden: ({ document }) => !Boolean(document?.useTemplate),
      fields: [
        {
          name: "showSection",
          title: "Show Testimonials Section",
          type: "boolean",
          initialValue: true,
        },
        {
          name: "title",
          title: "Section Title",
          type: "string",
          initialValue: "What Our Community Says",
          hidden: ({ parent }) => !Boolean(parent?.showSection),
        },
        {
          name: "testimonials",
          title: "Testimonials",
          type: "array",
          of: [{ type: "reference", to: [{ type: "testimonial" }] }],
          hidden: ({ parent }) => !Boolean(parent?.showSection),
          validation: (Rule) => Rule.max(6),
        },
      ],
    }),
    defineField({
      name: "logoCloud",
      title: "Logo Cloud Section",
      type: "logo-cloud-1",
      group: "template",
      hidden: ({ document }) => !Boolean(document?.useTemplate),
      description: "Partner organizations logo cloud",
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
        { type: "carousel-1" },
        { type: "carousel-2" },
        { type: "lived-experiences-carousel" },
        { type: "timeline-row" },
        { type: "cta-1" },
        { type: "logo-cloud-1" },
        { type: "faqs" },
        { type: "form-newsletter" },
        { type: "all-posts" },

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
                "timeline-row",
                "cta-1",
                "logo-cloud-1",
                "faqs",
                "form-newsletter",
                "all-posts"
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
