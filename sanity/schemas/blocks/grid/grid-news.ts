import { defineField, defineType } from "sanity";
import { FileText } from "lucide-react";

export const gridNews = defineType({
    name: "grid-news",
    title: "Grid News",
    type: "object",
    icon: FileText,
    fields: [
        defineField({
            name: "newsPost",
            title: "News Post",
            type: "reference",
            to: [{ type: "newsPost" }],
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: "showTags",
            title: "Show Tags",
            type: "boolean",
            initialValue: true,
            description: "Display tags associated with the news post",
        }),
        defineField({
            name: "showAuthor",
            title: "Show Author",
            type: "boolean",
            initialValue: true,
            description: "Display the author information",
        }),
        defineField({
            name: "showMetadata",
            title: "Show Metadata",
            type: "boolean",
            initialValue: true,
            description: "Display publication date, author, and organizations",
        }),
        defineField({
            name: "showLocation",
            title: "Show Location",
            type: "boolean",
            initialValue: false,
            description: "Display location information if available",
        }),
        defineField({
            name: "customExcerpt",
            title: "Custom Excerpt",
            type: "object",
            description: "Override the default excerpt with custom text",
            fields: [
                { name: "en", title: "English", type: "text", rows: 3 },
                { name: "es", title: "Español", type: "text", rows: 3 },
                { name: "fr", title: "Français", type: "text", rows: 3 },
                { name: "ar", title: "العربية", type: "text", rows: 3 },
            ],
        }),
    ],
    preview: {
        select: {
            title: "newsPost.title",
            subtitle: "newsPost.subtitle",
            media: "newsPost.image",
            publishedAt: "newsPost.publishedAt",
        },
        prepare({ title, subtitle, media, publishedAt }) {
            const displayTitle = title?.en || title?.es || title?.fr || title?.ar || "Untitled News";
            const displaySubtitle = subtitle?.en || subtitle?.es || subtitle?.fr || subtitle?.ar || 
                (publishedAt ? new Date(publishedAt).toLocaleDateString() : 'No date');

            return {
                title: `News: ${displayTitle}`,
                subtitle: displaySubtitle,
                media,
            };
        },
    },
});