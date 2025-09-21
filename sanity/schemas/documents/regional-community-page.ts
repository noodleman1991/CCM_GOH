import { defineField, defineType } from "sanity";
import { MapPinned } from "lucide-react";
import { orderRankField } from "@sanity/orderable-document-list";
import { isUniqueOtherThanLanguage } from '@/sanity/lib/isUniqueOtherThanLanguage';

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
    defineField({ name: "title", type: "string", group: "content" }),
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
          group: "template",
          description: "Link to the regional community for dynamic content filtering",
          validation: (Rule) => Rule.required(),
      }),
      defineField({
          name: "language",
          type: "string",
          readOnly: true,
          group: "settings",
      }),
      defineField({
          name: "titleHero",
          title: "Welcome Hero",
          type: "hero-1",
          group: "content",
      }),
      defineField({
          name: "listHero",
          title: "Sign Up Prompt Hero",
          type: "hero-1",
          group: "content",
      }),
      defineField({
          name: "useTemplate",
          title: "Use Regional Community Template",
          type: "boolean",
          group: "template",
          initialValue: true,
          description: "Use the structured template with fixed blocks and dynamic content, or use custom content flow",
      }),
      defineField({
          name: "templateConfiguration",
          title: "Template Configuration",
          type: "object",
          group: "template",
          hidden: ({ document }) => !Boolean(document?.useTemplate),
          fields: [
              {
                  name: "gridReportsConfig",
                  title: "Grid Reports Configuration",
                  type: "object",
                  fields: [
                      {
                          name: "showFeatured",
                          title: "Show Featured Reports",
                          type: "boolean",
                          initialValue: true,
                      },
                      {
                          name: "maxItems",
                          title: "Maximum Reports",
                          type: "number",
                          initialValue: 6,
                          validation: (Rule) => Rule.min(1).max(12),
                      },
                      {
                          name: "title",
                          title: "Section Title",
                          type: "string",
                          initialValue: "Recent Reports",
                      },
                  ],
              },
              {
                  name: "gridCaseStudiesConfig",
                  title: "Grid Case Studies Configuration",
                  type: "object",
                  fields: [
                      {
                          name: "showFeatured",
                          title: "Show Featured Case Studies",
                          type: "boolean",
                          initialValue: true,
                      },
                      {
                          name: "maxItems",
                          title: "Maximum Case Studies",
                          type: "number",
                          initialValue: 6,
                          validation: (Rule) => Rule.min(1).max(12),
                      },
                      {
                          name: "title",
                          title: "Section Title",
                          type: "string",
                          initialValue: "Case Studies",
                      },
                  ],
              },
              {
                  name: "livedExperiencesConfig",
                  title: "Lived Experiences Configuration",
                  type: "object",
                  fields: [
                      {
                          name: "showFeatured",
                          title: "Show Featured Only",
                          type: "boolean",
                          initialValue: false,
                      },
                      {
                          name: "maxItems",
                          title: "Maximum Experiences",
                          type: "number",
                          initialValue: 10,
                          validation: (Rule) => Rule.min(1).max(20),
                      },
                      {
                          name: "title",
                          title: "Section Title",
                          type: "string",
                          initialValue: "Community Voices",
                      },
                  ],
              },
          ],
      }),
      defineField({
          name: "templateInserts",
          title: "Template Content Inserts",
          type: "array",
          group: "template",
          hidden: ({ document }) => !Boolean(document?.useTemplate),
          description: "Add custom content between template blocks",
          of: [
              { type: "manualContentInsert" },
              { type: "dynamicContentInsert" },
              { type: "separatorBlock" },
              { type: "section-header" },
              { type: "split-row" },
              { type: "cta-1" },
          ],
          options: {
              insertMenu: {
                  groups: [
                      {
                          name: "inserts",
                          title: "Content Inserts",
                          of: ["manualContentInsert", "dynamicContentInsert", "separatorBlock"],
                      },
                      {
                          name: "structure",
                          title: "Additional Sections",
                          of: ["section-header", "split-row", "cta-1"],
                      },
                  ],
              },
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
      orderRankField({ type: "page" }),
  ],
    preview: {
        select: {
            title: 'title',
            language: 'language',
            media: 'image',
        },
        prepare(select) {
            const {title, language, media} = select

            return {
                title,
                subtitle: language ? language.toUpperCase() : 'EN',
                media,
            }
        },
    }
});
