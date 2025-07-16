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
            title: "Title",
            type: "object",
            group: "content",
            fields: [
                { name: "en", title: "English", type: "string", validation: (Rule) => Rule.required() },
                { name: "es", title: "Español", type: "string" },
                { name: "fr", title: "Français", type: "string" },
                { name: "ar", title: "العربية", type: "string" },
            ],
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
                source: "title.en",
                maxLength: 96,
                isUnique: isUniqueOtherThanLanguage,
            },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: "language",
            type: "string",
            readOnly: true,
            hidden: true,
            group: "settings",
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
        defineField({
            name: "author",
            title: "Author",
            type: "reference",
            group: "metadata",
            to: { type: "author" },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: "organization",
            title: "Organization/Affiliation",
            type: "reference",
            group: "metadata",
            to: { type: "organization" },
        }),
        defineField({
            name: "location",
            title: "Location",
            type: "object",
            group: "metadata",
            fields: [
                {
                    name: "country",
                    title: "Country",
                    type: "string",
                },
                {
                    name: "city",
                    title: "City",
                    type: "string",
                },
                {
                    name: "region",
                    title: "Region",
                    type: "string",
                },
            ],
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
                    type: "object",
                    title: "Alternative Text",
                    fields: [
                        { name: "en", title: "English", type: "string" },
                        { name: "es", title: "Español", type: "string" },
                        { name: "fr", title: "Français", type: "string" },
                        { name: "ar", title: "العربية", type: "string" },
                    ],
                },
            ],
        }),
        defineField({
            name: "tags",
            title: "Tags",
            type: "array",
            group: "metadata",
            of: [{ type: "reference", to: { type: "tag" } }],
            validation: (Rule) => Rule.unique(),
        }),
        defineField({
            name: "body",
            title: "Body",
            type: "styled-block-content",
            group: "content",
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
        defineField({
            name: "meta_title",
            title: "Meta Title",
            type: "object",
            group: "seo",
            fields: [
                { name: "en", title: "English", type: "string" },
                { name: "es", title: "Español", type: "string" },
                { name: "fr", title: "Français", type: "string" },
                { name: "ar", title: "العربية", type: "string" },
            ],
        }),
        defineField({
            name: "meta_description",
            title: "Meta Description",
            type: "object",
            group: "seo",
            fields: [
                { name: "en", title: "English", type: "text", rows: 3 },
                { name: "es", title: "Español", type: "text", rows: 3 },
                { name: "fr", title: "Français", type: "text", rows: 3 },
                { name: "ar", title: "العربية", type: "text", rows: 3 },
            ],
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
            title: "title.en",
            author: "author.name",
            media: "image",
            language: "language",
            publishedAt: "publishedAt",
        },
        prepare({ title, author, media, language, publishedAt }) {
            return {
                title: title || "Untitled Post",
                subtitle: `${language ? language.toUpperCase() : 'EN'} | ${author || 'No author'} | ${publishedAt ? new Date(publishedAt).toLocaleDateString() : 'Draft'}`,
                media,
            };
        },
    },
});
