import { defineField, defineType } from "sanity";
import { FileText } from "lucide-react";
import { isUniqueOtherThanLanguage } from '@/sanity/lib/isUniqueOtherThanLanguage';

export default defineType({
    name: "newsPost",
    title: "News Post",
    type: "document",
    icon: FileText,
    groups: [
        {
            name: "content",
            title: "Content",
        },
        {
            name: "metadata",
            title: "Metadata",
        },
        {
            name: "affiliations",
            title: "Affiliations",
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
        // Document language
        defineField({
            name: "language",
            type: "string",
            readOnly: true,
            hidden: true,
            group: "settings",
        }),
        defineField({
            name: "title",
            title: "Title",
            type: "object",
            group: "content",
            fields: [
                { name: "en", title: "English", type: "string" },
                { name: "es", title: "Español", type: "string" },
                { name: "fr", title: "Français", type: "string" },
                { name: "ar", title: "العربية", type: "string" },
            ],
            validation: (Rule) =>
                Rule.custom((title: unknown, context) => {
                    const language = String(context?.document?.language || "en");
                    const localizedTitle = title as Record<string, string | undefined>;

                    if (!localizedTitle?.[language]) {
                        return `Title in ${language} is required`;
                    }
                    return true;
            }),
        }),
        defineField({
            name: "subtitle",
            title: "Subtitle",
            type: "object",
            group: "content",
            fields: [
                { name: "en", title: "English", type: "string" },
                { name: "es", title: "Español", type: "string" },
                { name: "fr", title: "Français", type: "string" },
                { name: "ar", title: "العربية", type: "string" },
            ],
        }),
        defineField({
            name: "slug",
            title: "Slug",
            type: "slug",
            group: "settings",
            options: {
                source: (doc: any) => doc.title?.[doc.language || 'en'] || doc.title?.en,
                maxLength: 96,
                isUnique: isUniqueOtherThanLanguage,
            },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: "excerpt",
            title: "Excerpt",
            type: "object",
            group: "content",
            fields: [
                { name: "en", title: "English", type: "text", rows: 3 },
                { name: "es", title: "Español", type: "text", rows: 3 },
                { name: "fr", title: "Français", type: "text", rows: 3 },
                { name: "ar", title: "العربية", type: "text", rows: 3 },
            ],
        }),
        // Content - single language per document
        defineField({
            name: "content",
            title: "Content",
            type: "styled-block-content",
            group: "content",
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: "author",
            title: "Author",
            type: "reference",
            group: "metadata",
            to: { type: "author" },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: "publishedAt",
            title: "Published At",
            type: "datetime",
            group: "metadata",
            initialValue: () => new Date().toISOString(),
        }),
        defineField({
            name: "image",
            title: "Featured Image",
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
        // Affiliations
        defineField({
            name: "organizations",
            title: "Organizations",
            type: "array",
            group: "affiliations",
            of: [
                {
                    type: "reference",
                    to: [{ type: "organization" }],
                },
            ],
            description: "Organizations affiliated with this news post",
        }),
        defineField({
            name: "projects",
            title: "Projects",
            type: "array",
            group: "affiliations",
            of: [
                {
                    type: "reference",
                    to: [{ type: "project" }],
                },
            ],
            description: "Projects related to this news post",
        }),
        // Location using Google Maps plugin
        defineField({
            name: "location",
            title: "Location",
            type: "geopoint",
            group: "metadata",
            description: "Primary location related to this news",
        }),
        defineField({
            name: "locationDetails",
            title: "Location Details",
            type: "object",
            group: "metadata",
            fields: [
                {
                    name: "city",
                    title: "City",
                    type: "string",
                },
                {
                    name: "country",
                    title: "Country",
                    type: "string",
                },
                {
                    name: "region",
                    title: "Region",
                    type: "string",
                },
            ],
        }),
        // Tags using the tags plugin
        defineField({
            name: "tags",
            title: "Tags",
            type: "tags",
            group: "metadata",
            options: {
                includeFromReference: "tag",
                includeFromRelated: "tags",
                customLabel: "label",
                customValue: "value",
                onCreate: (value: string) => ({
                    _type: "reference",
                    _ref: "tag-id", // This would need to be created via API
                }),
            },
        }),
        defineField({
            name: "sources",
            title: "Sources",
            type: "array",
            group: "content",
            of: [
                {
                    type: "object",
                    fields: [
                        {
                            name: "title",
                            title: "Source Title",
                            type: "string",
                            validation: (Rule) => Rule.required(),
                        },
                        {
                            name: "url",
                            title: "Source URL",
                            type: "url",
                            validation: (Rule) => Rule.required(),
                        },
                        {
                            name: "publisher",
                            title: "Publisher",
                            type: "string",
                        },
                        {
                            name: "date",
                            title: "Publication Date",
                            type: "date",
                        },
                    ],
                    preview: {
                        select: {
                            title: "title",
                            subtitle: "publisher",
                        },
                    },
                },
            ],
        }),
        defineField({
            name: "featured",
            title: "Featured Post",
            type: "boolean",
            group: "settings",
            initialValue: false,
        }),
        // SEO fields remain language-specific
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
        }),
    ],
    preview: {
        select: {
            title: "title",
            media: "image",
            language: "language",
            publishedAt: "publishedAt",
            authorName: "author.name",
        },
        prepare({ title, media, language, publishedAt, authorName }) {
            const lang = language || 'en';
            const displayTitle = title?.[lang] || title?.en || "Untitled Post";

            return {
                title: displayTitle,
                subtitle: `${lang.toUpperCase()} | ${authorName || 'No author'} | ${
                    publishedAt ? new Date(publishedAt).toLocaleDateString() : 'Draft'
                }`,
                media,
            };
        },
    },
});
