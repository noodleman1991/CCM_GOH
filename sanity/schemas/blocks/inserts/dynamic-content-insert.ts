import { defineField, defineType } from "sanity";
import { Database, Zap } from "lucide-react";

export default defineType({
  name: "dynamicContentInsert",
  type: "object",
  title: "Dynamic Content Insert",
  icon: Zap,
  fields: [
    defineField({
      name: "queryType",
      type: "string",
      title: "Content Type",
      options: {
        list: [
          { title: "Recent News/Posts", value: "recentNews" },
          { title: "Recent Case Studies", value: "recentCaseStudies" },
          { title: "Recent Lived Experiences", value: "recentLivedExperiences" },
          { title: "Featured News/Posts", value: "featuredNews" },
          { title: "Featured Case Studies", value: "featuredCaseStudies" },
          { title: "Featured Lived Experiences", value: "featuredLivedExperiences" },
        ],
      },
      validation: (Rule) => Rule.required(),
      description: "All queries are filtered by the current regional community",
    }),
    defineField({
      name: "displayStyle",
      type: "string",
      title: "Display Style",
      options: {
        list: [
          { title: "Grid Layout", value: "grid" },
          { title: "Carousel", value: "carousel" },
          { title: "List View", value: "list" },
          { title: "Minimal Cards", value: "minimal" },
        ],
      },
      initialValue: "grid",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "itemCount",
      type: "number",
      title: "Number of Items",
      initialValue: 6,
      validation: (Rule) => Rule.min(1).max(12).required(),
      description: "Maximum number of items to display",
    }),
    defineField({
      name: "title",
      type: "string",
      title: "Section Title",
      description: "Optional custom title for this section",
    }),
    defineField({
      name: "subtitle",
      type: "text",
      title: "Section Subtitle",
      rows: 2,
      description: "Optional subtitle or description",
    }),
    defineField({
      name: "showViewAllButton",
      type: "boolean",
      title: "Show 'View All' Button",
      initialValue: true,
      description: "Display a button to view all items in this category",
    }),
    defineField({
      name: "backgroundColor",
      type: "string",
      title: "Background Color",
      options: {
        list: [
          { title: "None", value: "none" },
          { title: "Light Gray", value: "light-gray" },
          { title: "Dark Gray", value: "dark-gray" },
          { title: "Brand Primary", value: "brand-primary" },
          { title: "Brand Secondary", value: "brand-secondary" },
        ],
      },
      initialValue: "none",
    }),
    defineField({
      name: "padding",
      type: "string",
      title: "Padding",
      options: {
        list: [
          { title: "None", value: "none" },
          { title: "Small", value: "small" },
          { title: "Medium", value: "medium" },
          { title: "Large", value: "large" },
        ],
      },
      initialValue: "medium",
    }),
  ],
  preview: {
    select: {
      queryType: "queryType",
      displayStyle: "displayStyle",
      itemCount: "itemCount",
      title: "title",
    },
    prepare({ queryType, displayStyle, itemCount, title }) {
      const queryLabels = {
        recentNews: "📰 Recent News",
        recentCaseStudies: "📊 Recent Case Studies",
        recentLivedExperiences: "🎥 Recent Lived Experiences",
        featuredNews: "⭐ Featured News",
        featuredCaseStudies: "⭐ Featured Case Studies",
        featuredLivedExperiences: "⭐ Featured Lived Experiences",
      };

      const styleEmojis = {
        grid: "⏹️",
        carousel: "🎠",
        list: "📋",
        minimal: "🎯",
      };

      const queryLabel = queryLabels[queryType as keyof typeof queryLabels] || queryType;
      const styleEmoji = styleEmojis[displayStyle as keyof typeof styleEmojis] || "📄";

      return {
        title: title || `Dynamic: ${queryLabel}`,
        subtitle: `${styleEmoji} ${displayStyle} | ${itemCount} items`,
        media: Database,
      };
    },
  },
});