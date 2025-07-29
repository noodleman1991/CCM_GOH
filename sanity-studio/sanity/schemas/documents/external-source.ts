import { defineField, defineType } from "sanity";
import { ExternalLink } from "lucide-react";

type SourceType = 'news' | 'research' | 'blog' | 'report' | 'press' | 'policy' | 'other';

export default defineType({
    name: "externalSource",
    title: "External Source",
    type: "document",
    icon: ExternalLink,
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
            name: "settings",
            title: "Settings",
        },
    ],
    fields: [
        defineField({
            name: "title",
            title: "Title",
            type: "object",
            group: "content",
            fields: [
                { name: "en", title: "English", type: "string", validation: (Rule) => Rule.required() },
                { name: "es", title: "Español", type: "string" },
                { name: "fr", title: "Français", type: "string" },
                { name: "ar", title: "العربية", type: "string" },
            ],
            description: "Title of the external article (translate if needed)",
        }),
        defineField({
            name: "sourceUrl",
            title: "Source URL",
            type: "url",
            group: "content",
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: "publisher",
            title: "Publisher",
            type: "string",
            group: "metadata",
            validation: (Rule) => Rule.required(),
            description: "Name of the publishing organization (e.g., BBC, Nature, WHO)",
        }),
        defineField({
            name: "publishedAt",
            title: "Published At",
            type: "datetime",
            group: "metadata",
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
            description: "Brief summary or excerpt from the article",
        }),
        defineField({
            name: "image",
            title: "Preview Image",
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
            },
        }),
        // Affiliations
        defineField({
            name: "organizations",
            title: "Related Organizations",
            type: "array",
            group: "affiliations",
            of: [
                {
                    type: "reference",
                    to: [{ type: "organization" }],
                },
            ],
            description: "Organizations mentioned or related to this source",
        }),
        defineField({
            name: "projects",
            title: "Related Projects",
            type: "array",
            group: "affiliations",
            of: [
                {
                    type: "reference",
                    to: [{ type: "project" }],
                },
            ],
            description: "Projects mentioned or related to this source",
        }),
        defineField({
            name: "authors",
            title: "Authors",
            type: "array",
            group: "metadata",
            of: [
                {
                    type: "string",
                },
            ],
            description: "Authors of the original article",
        }),
        defineField({
            name: "language",
            title: "Original Language",
            type: "string",
            group: "metadata",
            options: {
                list: [
                    { title: "English", value: "en" },
                    { title: "Español", value: "es" },
                    { title: "Français", value: "fr" },
                    { title: "العربية", value: "ar" },
                    { title: "Multiple Languages", value: "multi" },
                    { title: "Other", value: "other" },
                ],
            },
            initialValue: "en",
        }),
        defineField({
            name: "sourceType",
            title: "Source Type",
            type: "string",
            group: "metadata",
            options: {
                list: [
                    { title: "News Article", value: "news" },
                    { title: "Research Paper", value: "research" },
                    { title: "Blog Post", value: "blog" },
                    { title: "Report", value: "report" },
                    { title: "Press Release", value: "press" },
                    { title: "Policy Document", value: "policy" },
                    { title: "Other", value: "other" },
                ],
            },
            initialValue: "news",
        }),
        defineField({
            name: "featured",
            title: "Featured Source",
            type: "boolean",
            group: "settings",
            initialValue: false,
        }),
        defineField({
            name: "approved",
            title: "Approved",
            type: "boolean",
            group: "settings",
            initialValue: true,
            description: "Whether this external source has been approved for display",
        }),
        defineField({
            name: "addedBy",
            title: "Added By",
            type: "reference",
            group: "settings",
            to: { type: "author" },
            description: "Editor who added this external source",
        }),
        defineField({
            name: "addedAt",
            title: "Added At",
            type: "datetime",
            group: "settings",
            initialValue: () => new Date().toISOString(),
        }),
    ],
    preview: {
        select: {
            title: "title.en",
            publisher: "publisher",
            media: "image",
            sourceUrl: "sourceUrl",
            approved: "approved",
            sourceType: "sourceType",
        },
        prepare({
                    title,
                    publisher,
                    media,
                    sourceUrl,
                    approved,
                    sourceType,
                }: {
            title?: string;
            publisher?: string;
            media?: any;
            sourceUrl?: string;
            approved?: boolean;
            sourceType?: SourceType;
        }) {
            const typeEmoji = {
                news: "📰",
                research: "🔬",
                blog: "📝",
                report: "📊",
                press: "📢",
                policy: "📋",
                other: "📄",
            };

            return {
                title: title || "Untitled Source",
                subtitle: `${approved ? '✓' : '⏳'} ${
                    sourceType && typeEmoji[sourceType] ? typeEmoji[sourceType] : '📄'
                } ${publisher || 'Unknown'} | ${
                    sourceUrl ? new URL(sourceUrl).hostname : 'No URL'
                }`,
                media,
            };
        },
    },
});
