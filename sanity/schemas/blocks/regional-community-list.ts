import { defineField, defineType } from "sanity";
import { Users } from "lucide-react";

/**
 * Regional Community List Block
 *
 * A block that references regional community documents.
 * Uses document references to maintain a single source of truth
 * for localized community names.
 *
 * Pattern: Option 3 (Dynamic References)
 * - Stores references to regionalCommunity documents
 * - Localized names are fetched from the referenced documents
 * - No duplicate content, always up-to-date
 */
export default defineType({
  name: "regionalCommunityList",
  type: "object",
  title: "Regional Community List",
  description: "A list of regional communities with auto-localized names",
  icon: Users,
  fields: [
    defineField({
      name: "title",
      type: "object",
      title: "Section Title",
      description: "Optional title for the community list section",
      fields: [
        { name: "en", title: "English", type: "string" },
        { name: "es", title: "Español", type: "string" },
        { name: "fr", title: "Français", type: "string" },
        { name: "ar", title: "العربية", type: "string" },
      ],
    }),
    defineField({
      name: "communities",
      type: "array",
      title: "Communities",
      description: "Select regional communities to display",
      of: [
        {
          type: "reference",
          to: [{ type: "regionalCommunity" }],
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "layout",
      type: "string",
      title: "Layout Style",
      description: "How to display the community list",
      options: {
        list: [
          { title: "Grid", value: "grid" },
          { title: "List", value: "list" },
          { title: "Cards", value: "cards" },
        ],
        layout: "radio",
      },
      initialValue: "grid",
    }),
    defineField({
      name: "showDescription",
      type: "boolean",
      title: "Show Descriptions",
      description: "Display community descriptions if available",
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: "title.en",
      communities: "communities",
    },
    prepare({ title, communities }) {
      const count = communities?.length || 0;
      return {
        title: title || "Regional Community List",
        subtitle: `${count} ${count === 1 ? "community" : "communities"}`,
        media: Users,
      };
    },
  },
});
