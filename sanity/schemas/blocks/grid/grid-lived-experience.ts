import { defineField, defineType } from "sanity";
import { Video } from "lucide-react";

export default defineType({
    name: "grid-lived-experience",
    title: "Grid Lived Experience",
    type: "object",
    icon: Video,
    fields: [
        defineField({
            name: "livedExperience",
            title: "Lived Experience",
            type: "reference",
            to: [{ type: "livedExperience" }],
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: "showTags",
            title: "Show Tags",
            type: "boolean",
            initialValue: true,
            description: "Display tags associated with the lived experience",
        }),
        defineField({
            name: "showMetadata",
            title: "Show Metadata",
            type: "boolean",
            initialValue: true,
            description: "Display publication date and community information",
        }),
        defineField({
            name: "showCommunity",
            title: "Show Community",
            type: "boolean",
            initialValue: true,
            description: "Display the related regional community",
        }),
        defineField({
            name: "showOrganizations",
            title: "Show Organizations",
            type: "boolean",
            initialValue: false,
            description: "Display related organizations",
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
            title: "livedExperience.title",
            media: "livedExperience.thumbnail",
            community: "livedExperience.relatedCommunity.name",
            duration: "livedExperience.duration",
        },
        prepare({ title, media, community, duration }) {
            const displayTitle = title?.en || title?.es || title?.fr || title?.ar || "Untitled Experience";
            const communityText = community ? ` | ${community}` : '';
            const durationText = duration ? ` | ${duration}` : '';

            return {
                title: `Experience: ${displayTitle}`,
                subtitle: `Video${durationText}${communityText}`,
                media: media || Video,
            };
        },
    },
});