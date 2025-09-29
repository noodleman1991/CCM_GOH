import { defineField, defineType } from "sanity";
import { Calendar } from "lucide-react";
import { orderRankField } from "@sanity/orderable-document-list";

export default defineType({
    name: "agenda",
    title: "Agenda",
    type: "document",
    icon: Calendar,
    groups: [
        {
            name: "content",
            title: "Content",
        },
        {
            name: "files",
            title: "Files & Downloads",
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
            validation: (Rule) => Rule.required(),
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

        // FILES USING SANITY FILE TYPE
        defineField({
            name: "files",
            title: "Agenda Files",
            type: "array",
            group: "files",
            of: [
                {
                    type: "object",
                    name: "agendaFile",
                    title: "Agenda File",
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
                            name: "file",
                            title: "File",
                            type: "file",
                            options: {
                                accept: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx",
                                storeOriginalFilename: true,
                            },
                            validation: (Rule) => Rule.required(),
                        },
                        {
                            name: "downloadCount",
                            title: "Download Count",
                            type: "number",
                            initialValue: 0,
                            readOnly: true,
                        },
                        {
                            name: "lastDownloaded",
                            title: "Last Downloaded",
                            type: "datetime",
                            readOnly: true,
                        },
                    ],
                    preview: {
                        select: {
                            language: "language",
                            downloadCount: "downloadCount",
                            fileName: "file.asset.originalFilename",
                            fileSize: "file.asset.size",
                        },
                        prepare({ language, downloadCount, fileName, fileSize }) {
                            const languageNames = {
                                en: "English",
                                es: "Español",
                                fr: "Français",
                                ar: "العربية",
                            };

                            const sizeText = fileSize ? `${(fileSize / (1024 * 1024)).toFixed(2)}MB` : "Unknown size";
                            const downloads = downloadCount || 0;

                            return {
                                title: `${languageNames[language as keyof typeof languageNames] || language}`,
                                subtitle: `${fileName || 'No filename'} • ${sizeText} • ${downloads} downloads`,
                            };
                        },
                    },
                },
            ],
            validation: (Rule) => Rule.required().min(1),
        }),

        defineField({
            name: "agendaType",
            title: "Agenda Type",
            type: "string",
            group: "metadata",
            options: {
                list: [
                    { title: "Annual Agenda", value: "annual" },
                    { title: "Research Agenda", value: "research" },
                    { title: "Policy Brief", value: "policy" },
                    { title: "Technical Agenda", value: "technical" },
                    { title: "Case Study Agenda", value: "case-study" },
                    { title: "White Paper", value: "whitepaper" },
                    { title: "Guidelines", value: "guidelines" },
                    { title: "Meeting Agenda", value: "agenda" },
                    { title: "Meeting Minutes", value: "minutes" },
                    { title: "Other", value: "other" },
                ],
            },
            validation: (Rule) => Rule.required(),
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
        }),

        // ANALYTICS FIELDS
        defineField({
            name: "totalDownloadCount",
            title: "Total Download Count",
            type: "number",
            group: "metadata",
            readOnly: true,
            initialValue: 0,
        }),

        defineField({
            name: "featured",
            title: "Featured Agenda",
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

        orderRankField({ type: "agenda" }),
    ],
    preview: {
        select: {
            title: "title.en",
            subtitle: "agendaType",
            media: "coverImage",
            year: "year",
            featured: "featured",
            downloadCount: "totalDownloadCount",
        },
        prepare({ title, subtitle, media, year, featured, downloadCount }) {
            const typeLabels = {
                annual: "Annual Agenda",
                research: "Research Agenda",
                policy: "Policy Brief",
                technical: "Technical Agenda",
                "case-study": "Case Study Agenda",
                whitepaper: "White Paper",
                guidelines: "Guidelines",
                agenda: "Meeting Agenda",
                minutes: "Meeting Minutes",
                other: "Other",
            };

            const agendaTypeLabel = typeLabels[subtitle as keyof typeof typeLabels] || subtitle;
            const downloads = downloadCount || 0;

            return {
                title: `${featured ? "FEATURED " : ""}${title || "Untitled Agenda"}`,
                subtitle: `${agendaTypeLabel} | ${year || "No year"} | ${downloads} downloads`,
                media,
            };
        }
    },
});