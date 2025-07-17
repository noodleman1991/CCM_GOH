import { defineField, defineType } from "sanity";
import { FileSearch } from "lucide-react";
import { isUniqueOtherThanLanguage } from '@/sanity/lib/isUniqueOtherThanLanguage';

export default defineType({
    name: "caseStudy",
    title: "Case Study",
    type: "document",
    icon: FileSearch,
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
            name: "review",
            title: "Review",
        },
        {
            name: "seo",
            title: "SEO",
        },
    ],
    fields: [
        // Document language
        defineField({
            name: "language",
            type: "string",
            readOnly: true,
            hidden: true,
        }),
        // Multi-language title and excerpt for easier querying
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
            group: "metadata",
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
            name: "submittedBy",
            title: "Submitted By",
            type: "string",
            group: "metadata",
            description: "User ID of the person who submitted this case study",
            readOnly: true,
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
                            name: "userId",
                            title: "User ID",
                            type: "string",
                            description: "App user ID (if registered)",
                        },
                        {
                            name: "name",
                            title: "Name",
                            type: "string",
                            validation: (Rule) => Rule.required(),
                        },
                        {
                            name: "email",
                            title: "Email",
                            type: "email",
                        },
                        {
                            name: "role",
                            title: "Role in Study",
                            type: "string",
                            options: {
                                list: [
                                    { title: "Lead Author", value: "lead" },
                                    { title: "Co-Author", value: "coauthor" },
                                    { title: "Contributor", value: "contributor" },
                                    { title: "Advisor", value: "advisor" },
                                ],
                            },
                            initialValue: "coauthor",
                        },
                        {
                            name: "affiliation",
                            title: "Affiliation",
                            type: "reference",
                            to: [{ type: "organization" }],
                        },
                    ],
                    preview: {
                        select: {
                            title: "name",
                            subtitle: "role",
                            affiliation: "affiliation.name",
                        },
                        prepare({ title, subtitle, affiliation }) {
                            return {
                                title,
                                subtitle: `${subtitle}${affiliation ? ` - ${affiliation}` : ''}`,
                            };
                        },
                    },
                },
            ],
            validation: (Rule) => Rule.required().min(1),
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
            description: "Organizations involved in this case study",
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
            description: "Projects related to this case study",
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
        defineField({
            name: "studyPeriod",
            title: "Study Period",
            type: "object",
            group: "metadata",
            fields: [
                {
                    name: "startDate",
                    title: "Start Date",
                    type: "date",
                },
                {
                    name: "endDate",
                    title: "End Date",
                    type: "date",
                },
            ],
        }),
        // Location using Google Maps plugin
        defineField({
            name: "studyLocation",
            title: "Primary Study Location",
            type: "geopoint",
            group: "metadata",
        }),
        defineField({
            name: "studyAreas",
            title: "Study Areas",
            type: "array",
            group: "metadata",
            of: [
                {
                    type: "object",
                    fields: [
                        {
                            name: "location",
                            title: "Location",
                            type: "geopoint",
                        },
                        {
                            name: "name",
                            title: "Area Name",
                            type: "string",
                        },
                        {
                            name: "description",
                            title: "Description",
                            type: "text",
                            rows: 2,
                        },
                    ],
                    preview: {
                        select: {
                            title: "name",
                            subtitle: "description",
                        },
                    },
                },
            ],
            description: "Multiple study locations if applicable",
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
        // Review fields
        defineField({
            name: "status",
            title: "Review Status",
            type: "string",
            group: "review",
            options: {
                list: [
                    { title: "Pending Review", value: "pending" },
                    { title: "Under Review", value: "reviewing" },
                    { title: "Approved", value: "approved" },
                    { title: "Rejected", value: "rejected" },
                    { title: "Needs Revision", value: "revision" },
                ],
            },
            initialValue: "pending",
        }),
        defineField({
            name: "reviewNotes",
            title: "Review Notes",
            type: "text",
            group: "review",
            rows: 4,
            description: "Internal notes about the review process",
        }),
        defineField({
            name: "reviewedBy",
            title: "Reviewed By",
            type: "reference",
            group: "review",
            to: { type: "author" },
        }),
        defineField({
            name: "reviewedAt",
            title: "Reviewed At",
            type: "datetime",
            group: "review",
        }),
        defineField({
            name: "publishedAt",
            title: "Published At",
            type: "datetime",
            group: "review",
        }),
        defineField({
            name: "featured",
            title: "Featured Case Study",
            type: "boolean",
            group: "review",
            initialValue: false,
        }),
        // SEO fields
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
    ],
    preview: {
        select: {
            title: "title",
            status: "status",
            media: "image",
            language: "language",
            submittedBy: "submittedBy",
        },
        prepare({
                    title,
                    status,
                    media,
                    language,
                }: {
            title?: Record<string, string>;
            status?: "pending" | "reviewing" | "approved" | "rejected" | "revision";
            media?: any;
            language?: string;
        }) {
            const lang = language || "en";
            const displayTitle = title?.[lang] || title?.en || "Untitled Case Study";

            const statusEmoji: Record<
                "pending" | "reviewing" | "approved" | "rejected" | "revision",
                string
            > = {
                pending: "⏳",
                reviewing: "👀",
                approved: "✅",
                rejected: "❌",
                revision: "📝",
            };

            const safeStatus = status || "pending";

            return {
                title: displayTitle,
                subtitle: `${lang.toUpperCase()} | ${statusEmoji[safeStatus]} ${safeStatus}`,
                media,
            };
        }
    },
});
