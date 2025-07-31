import { defineField, defineType } from "sanity";
import { FileDown } from "lucide-react";
import { orderRankField } from "@sanity/orderable-document-list";

export default defineType({
    name: "report",
    title: "Report",
    type: "document",
    icon: FileDown,
    groups: [
        {
            name: "content",
            title: "Content",
        },
        {
            name: "files",
            title: "Files",
        },
        {
            name: "metadata",
            title: "Metadata",
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
            name: "slug",
            title: "Slug",
            type: "slug",
            group: "metadata",
            options: {
                source: "title.en",
                maxLength: 96,
            },
            validation: (Rule) => Rule.required(),
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
            name: "description",
            title: "Description",
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
            name: "coverImage",
            title: "Cover Image",
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
            name: "reportType",
            title: "Report Type",
            type: "string",
            group: "metadata",
            options: {
                list: [
                    { title: "Annual Report", value: "annual" },
                    { title: "Research Report", value: "research" },
                    { title: "Policy Brief", value: "policy" },
                    { title: "Technical Report", value: "technical" },
                    { title: "Case Study Report", value: "case-study" },
                    { title: "White Paper", value: "whitepaper" },
                    { title: "Guidelines", value: "guidelines" },
                    { title: "Other", value: "other" },
                ],
            },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: "translations",
            title: "Report Translations",
            type: "array",
            group: "files",
            of: [
                {
                    type: "file",
                    name: "reportFile",
                    title: "Translated Report",
                    options: {
                        accept: "application/pdf",
                        storeOriginalFilename: true,
                    },
                    fields: [
                        {
                            name: "language",
                            title: "Language",
                            type: "string",
                            options: {
                                list: [
                                    { title: "English", value: "en" },
                                    { title: "Español", value: "es" },
                                    { title: "Français", value: "fr" },
                                    { title: "العربية", value: "ar" },
                                ],
                            },
                            validation: (Rule) => Rule.required(),
                        },
                        {
                            name: "fileSize",
                            title: "File Size (MB)",
                            type: "number",
                            readOnly: true,
                        },
                        {
                            name: "pages",
                            title: "Number of Pages",
                            type: "number",
                        },
                    ],
                },
            ],
            validation: (Rule) => Rule.required().min(1),
        }),
    defineField({
            name: "authors",
            title: "Authors",
            type: "array",
            group: "metadata",
            of: [
                {
                    type: "object",
                    fields: [
                        {
                            name: "name",
                            title: "Name",
                            type: "string",
                            validation: (Rule) => Rule.required(),
                        },
                        {
                            name: "organization",
                            title: "Organization",
                            type: "reference",
                            to: [{ type: "organization" }],
                        },
                    ],
                },
            ],
        }),
        defineField({
            name: "publishDate",
            title: "Publication Date",
            type: "date",
            group: "metadata",
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: "year",
            title: "Year",
            type: "number",
            group: "metadata",
            validation: (Rule) => Rule.required().min(2000).max(2050),
        }),
        defineField({
            name: "organizations",
            title: "Publishing Organizations",
            type: "array",
            group: "metadata",
            of: [
                {
                    type: "reference",
                    to: [{ type: "organization" }],
                },
            ],
        }),
        defineField({
            name: "projects",
            title: "Related Projects",
            type: "array",
            group: "metadata",
            of: [
                {
                    type: "reference",
                    to: [{ type: "project" }],
                },
            ],
        }),
        defineField({
            name: "regionalCommunities",
            title: "Regional Communities",
            type: "array",
            group: "metadata",
            of: [
                {
                    type: "reference",
                    to: [{ type: "regionalCommunity" }],
                },
            ],
        }),
        defineField({
            name: "tags",
            title: "Tags",
            type: "array",
            of: [
                {
                    type: "reference",
                    to: [{ type: "tag" }],
                },
            ],
            options: {
                layout: "tags",
                sortable: true,
            },
            validation: (Rule) => Rule.max(15),
            description: "Type to search existing tags or create new ones.",
        }),
        defineField({
            name: "downloadCount",
            title: "Download Count",
            type: "number",
            group: "metadata",
            readOnly: true,
            initialValue: 0,
        }),
        defineField({
            name: "featured",
            title: "Featured Report",
            type: "boolean",
            group: "metadata",
            initialValue: false,
        }),
        defineField({
            name: "accessLevel",
            title: "Access Level",
            type: "string",
            group: "metadata",
            options: {
                list: [
                    { title: "Public", value: "public" },
                    { title: "Registered Users", value: "registered" },
                    { title: "Members Only", value: "members" },
                ],
            },
            initialValue: "public",
        }),
        orderRankField({ type: "report" }),
    ],
    preview: {
        select: {
            title: "title.en",
            subtitle: "reportType",
            media: "coverImage",
            year: "year",
            featured: "featured",
        },
        prepare({ title, subtitle, media, year, featured }) {
            const typeLabels = {
                annual: "Annual Report",
                research: "Research Report",
                policy: "Policy Brief",
                technical: "Technical Report",
                "case-study": "Case Study Report",
                whitepaper: "White Paper",
                guidelines: "Guidelines",
                other: "Other",
            };

            const reportTypeLabel = typeLabels[subtitle as keyof typeof typeLabels] || subtitle;

            return {
                title: `${featured ? "⭐ " : ""}${title || "Untitled Report"}`,
                subtitle: `${reportTypeLabel} | ${year || "No year"}`,
                media,
            };
        }
    },
});
