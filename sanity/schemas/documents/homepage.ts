import { defineField, defineType } from "sanity";
import { Home } from "lucide-react";
import { orderRankField } from "@sanity/orderable-document-list";
import { isUniqueOtherThanLanguage } from '@/sanity/lib/isUniqueOtherThanLanguage';

export default defineType({
  name: "homepage",
  type: "document",
  title: "Homepage",
  icon: Home,
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
    defineField({
      name: "title",
      title: "Page Title",
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
      name: "language",
      type: "string",
      readOnly: true,
      //hidden: true,
      group: "settings",
    }),

    // Freeform page-builder: compose the homepage from reusable blocks (drag to
    // reorder). The fixed sections below are legacy and are removed once blocks
    // are in use (dual-field transition).
    defineField({
      name: "blocks",
      title: "Page blocks",
      type: "array",
      group: "content",
      of: [
        { type: "hero-1" },
        { type: "hero-2" },
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
        { type: "region-map" },
        { type: "people-widget" },
        { type: "events-calendar" },
      ],
      description: "Compose the homepage from reusable blocks (drag to reorder).",
    }),

    defineField({
      name: "heroWelcome",
      title: "Hero Welcome Section",
      type: "hero-1",
      group: "content",
      description: "Welcome to Connecting Climate Minds Hub section"
    }),
    defineField({
      name: "globalAgenda",
      title: "Global Research & Action Section",
      type: "split-row",
      group: "content",
      description: "Prioritizing Global Research and Action section"
    }),

    defineField({
      name: "howToUse",
      title: "Your collaborative space section",
      type: "split-row",
      group: "content",
      description: "Collaborative space for ideas, dialogue, and connection"
    }),

    defineField({
      name: "agendasModule",
      title: "Research Agendas",
      type: "grid-row",
      group: "content"
    }),

    defineField({
      name: "livedExperiences",
      title: "Lived Experiences Stories",
      type: "carousel-2",
      group: "content"
    }),

    defineField({
      name: "regionalCommunities",
      title: "Regional Communities",
      type: "grid-row",
      group: "content"
    }),

    defineField({
      name: "collaboration",
      title: "Collaboration Section",
      type: "split-row",
      group: "content"
    }),

    defineField({
      name: "news",
      title: "Latest News Section",
      type: "grid-row",
      group: "content"
    }),

    defineField({
      name: "projectInfo",
      title: "Project Information",
      type: "split-row",
      group: "content"
    }),

    defineField({
      name: "mentalHealthDefinition",
      title: "Mental Health Definition",
      type: "cta-1",
      group: "content"
    }),

    defineField({
      name: "partnerLogos",
      title: "Partner Logos",
      type: "logo-cloud-1",
      group: "content"
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
    orderRankField({ type: "homepage" }),
  ],
  preview: {
    select: {
      title: 'title',
      language: 'language',
      media: 'heroWelcome.image',
    },
    prepare(select) {
      const {title, language, media} = select

      return {
        title: title || "Homepage",
        subtitle: language ? language.toUpperCase() : 'EN',
        media,
      }
    },
  }
});
