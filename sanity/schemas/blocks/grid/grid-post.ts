import { defineField, defineType } from "sanity";
import { LayoutGrid } from "lucide-react";

export default defineType({
  name: "grid-post",
  type: "object",
  icon: LayoutGrid,
  fields: [
    defineField({
      name: "newsPost",
      type: "reference",
      title: "News Post",
      description: "Select a news post to display as a card.",
      to: [{ type: "newsPost" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "featured",
      type: "boolean",
      title: "Featured",
      description: "Mark this post as featured within the grid",
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: "newsPost.title.en",
      subtitle: "newsPost.subtitle.en",
      media: "newsPost.image",
      featured: "featured",
      publishedAt: "newsPost.publishedAt",
    },
    prepare({ title, subtitle, media, featured, publishedAt }) {
      const date = publishedAt ? new Date(publishedAt).toLocaleDateString() : "Draft";
      return {
        title: `${featured ? "⭐ " : ""}${title || "Untitled News Post"}`,
        subtitle: `${subtitle || ""} | ${date}`,
        media,
      };
    },
  },
});
