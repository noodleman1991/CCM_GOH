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

    // Section 1: Hero Welcome - maps to "section_1_hero_welcome"
    defineField({
      name: "heroWelcome",
      title: "Hero Welcome Section",
      type: "hero-1",
      group: "content",
      description: "Welcome to Connecting Climate Minds Hub section"
    }),

    // Section 2: Global Agenda - maps to "section_2_global_agenda"
    defineField({
      name: "globalAgenda",
      title: "Global Research & Action Section",
      type: "split-row",
      group: "content",
      description: "Prioritizing Global Research and Action section"
    }),

    // Section 3: How to Use - maps to "section_3_how_to_use"
    defineField({
      name: "howToUse",
      title: "How to Use Hub Section",
      type: "split-row",
      group: "content",
      description: "Your collaborative space section"
    }),

    // Section 4: Agendas Module - maps to "section_4_agendas_module"
    defineField({
      name: "agendasModule",
      title: "Research Agendas",
      type: "grid-row",
      group: "content"
    }),

    // Section 5: Lived Experiences - maps to "section_5_lived_experiences"
    defineField({
      name: "livedExperiences",
      title: "Lived Experiences Stories",
      type: "carousel-2",
      group: "content"
    }),

    // Section 6: Regional Communities - maps to "section_6_regional_communities"
    defineField({
      name: "regionalCommunities",
      title: "Regional Communities",
      type: "grid-row",
      group: "content"
    }),

    // Section 7: Collaboration - maps to "section_7_collaboration_info"
    defineField({
      name: "collaboration",
      title: "Collaboration Section",
      type: "split-row",
      group: "content"
    }),

    // Section 8: News - maps to "section_8_news"
    defineField({
      name: "news",
      title: "Latest News Section",
      type: "grid-row",
      group: "content"
    }),

    // Section 9: Project Info - maps to "section_9_project_info"
    defineField({
      name: "projectInfo",
      title: "Project Information",
      type: "split-row",
      group: "content"
    }),

    // Section 10: Mental Health Definition - maps to "section_10_mental_health_definition"
    defineField({
      name: "mentalHealthDefinition",
      title: "Mental Health Definition",
      type: "cta-1",
      group: "content"
    }),

    // Section 11: Partner Logos - maps to "section_11_partner_logos"
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
