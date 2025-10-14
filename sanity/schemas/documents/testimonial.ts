import { defineField, defineType } from "sanity";
import { orderRankField } from "@sanity/orderable-document-list";
import { Quote } from "lucide-react";

export default defineType({
  name: "testimonial",
  title: "Testimonials",
  type: "document",
  icon: Quote,
  groups: [
    {
      name: "content",
      title: "Content",
    },
    {
      name: "affiliations",
      title: "Affiliations",
    },
    {
      name: "settings",
      title: "Settings",
    },
  ],
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      group: "content",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "title",
      title: "Job Title",
      type: "string",
      group: "content",
    }),
    defineField({
      name: "image",
      title: "Photo",
      type: "image",
      group: "content",
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
    }),
    defineField({
      name: "body",
      title: "Testimonial",
      type: "block-content",
      group: "content",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "rating",
      title: "Rating",
      type: "number",
      group: "content",
      validation: (rule) => rule.min(1).max(5),
      description: "Rating from 1 to 5 stars",
    }),
    defineField({
      name: "relatedCommunity",
      title: "Related Community",
      type: "reference",
      group: "affiliations",
      to: { type: "regionalCommunity" },
      description: "The community this testimonial relates to",
    }),
    defineField({
      name: "organization",
      title: "Organization",
      type: "reference",
      group: "affiliations",
      to: { type: "organization" },
      description: "The organization this person is affiliated with",
    }),
    defineField({
      name: "project",
      title: "Project",
      type: "reference",
      group: "affiliations",
      to: { type: "project" },
      description: "The specific project this testimonial relates to",
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      group: "settings",
      initialValue: false,
      description: "Mark as featured to highlight in testimonial sections",
    }),
      orderRankField({ type: "testimonial" }),
  ],

  preview: {
    select: {
      name: "name",
      title: "title",
      rating: "rating",
      community: "relatedCommunity.name",
      organization: "organization.name",
      featured: "featured",
      media: "image",
    },
    prepare({ name, title, rating, community, organization, featured, media }) {
      const ratingText = rating ? `(${rating}/5)` : "";
      const featuredText = featured ? "FEATURED " : "";
      const affiliation = organization || community || "";
      const subtitle = [title, affiliation, ratingText].filter(Boolean).join(" • ");

      return {
        title: `${featuredText}${name || "Unnamed"}`,
        subtitle: subtitle || "No details",
        media,
      };
    },
  },
});
