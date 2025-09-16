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
    // Main content flow - structured foundation with strategic insertion points
    defineField({
      name: "contentFlow",
      type: "array",
      title: "Content Flow",
      group: "content",
      description: "Add structured content blocks and custom inserts between fixed elements",
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
