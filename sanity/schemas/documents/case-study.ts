import { defineField, defineType } from "sanity";
import { FileSearch } from "lucide-react";

// Language configuration
const supportedLanguages = [
    { id: "en", title: "English", flag: "🇺🇸", isDefault: true },
    { id: "es", title: "Español", flag: "🇪🇸" },
    { id: "fr", title: "Français", flag: "🇫🇷" },
    { id: "ar", title: "العربية", flag: "🇸🇦", isRTL: true },
];

// Role configuration
const authorRoles = [
    { title: "Lead Author", value: "lead" },
    { title: "Co-Author", value: "coauthor" },
    { title: "Contributor", value: "contributor" },
    { title: "Advisor", value: "advisor" },
];

// Status configuration
const statusOptions = [
    { title: "📝 Pending Review", value: "pending" },
    { title: "❌ Rejected", value: "rejected" },
    { title: "📋 Needs Revision", value: "revision" },
    { title: "✅ Approved (Published)", value: "approved" },
];

// Helper function for localized fields
const createLocalizedField = (name: string, title: string, type: string = "string", required: boolean = false) => {
    const validation = required ? (Rule: any) => Rule.required() : undefined;

    return defineField({
        name,
        title,
        type: "object",
        group: "content",
        fields: supportedLanguages.map(lang => ({
            name: lang.id,
            title: lang.title,
            type,
            validation: lang.isDefault && required ? validation : undefined,
        })),
        validation: required ? (Rule: any) => Rule.required() : undefined,
    });
};

export default defineType({
    name: "caseStudy",
    title: "Case Study",
    type: "document",
    icon: FileSearch,
    groups: [
        { name: "content", title: "Content" },
        { name: "metadata", title: "Metadata" },
        { name: "affiliations", title: "Affiliations" },
        { name: "review", title: "Review" },
        { name: "seo", title: "SEO" },
    ],
    fields: [
        // // Language selection
        // defineField({
        //     name: "language",
        //     title: "Language",
        //     type: "string",
        //     options: {
        //         list: supportedLanguages.map(lang => ({
        //             value: lang.id,
        //             title: `${lang.flag} ${lang.title}`
        //         })),
        //     },
        //     initialValue: "en",
        //     validation: (Rule) => Rule.required(),
        // }),

        // Content fields
        createLocalizedField("title", "Title", "string", true),

        defineField({
            name: "slug",
            title: "Slug",
            type: "slug",
            group: "content",
            options: {
                source: "title.en",
                maxLength: 96,
            },
            validation: (Rule) => Rule.required(),
        }),

        createLocalizedField("excerpt", "Excerpt", "text"),

        defineField({
            name: "image",
            title: "Featured Image",
            type: "image",
            group: "content",
            options: { hotspot: true },
            fields: [
                {
                    name: "alt",
                    type: "string",
                    title: "Alternative Text",
                    validation: (Rule) => Rule.required(),
                },
                {
                    name: "caption",
                    type: "string",
                    title: "Caption",
                },
            ],
        }),

        defineField({
            name: "tags",
            title: "Tags",
            type: "array",
            group: "content",
            of: [{ type: "reference", to: [{ type: "tag" }] }],
            options: {
                layout: "tags",
                sortable: true,
            },
            validation: (Rule) => Rule.max(15),
        }),

        // Metadata fields
        defineField({
            name: "submittedBy",
            title: "Submitted By",
            type: "string",
            group: "metadata",
            description: "Clerk User ID of the submitter",
            readOnly: true,
        }),

        defineField({
            name: "submittedAt",
            title: "Submitted At",
            type: "datetime",
            group: "metadata",
            readOnly: true,
        }),

        defineField({
            name: "authors",
            title: "Authors",
            type: "array",
            group: "metadata",
            of: [{
                type: "object",
                fields: [
                    {
                        name: "userId",
                        title: "User ID",
                        type: "string",
                        description: "Clerk User ID (if registered)",
                    },
                    {
                        name: "name",
                        title: "Full Name",
                        type: "string",
                        validation: (Rule) => Rule.required().min(2).max(100),
                    },
                    {
                        name: "email",
                        title: "Email",
                        type: "email",
                        validation: (Rule) => Rule.email(),
                    },
                    {
                        name: "role",
                        title: "Role in Study",
                        type: "string",
                        options: { list: authorRoles },
                        initialValue: "coauthor",
                        validation: (Rule) => Rule.required(),
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
                        name: "name",
                        role: "role",
                        affiliation: "affiliation.name",
                    },
                    prepare({ name, role, affiliation }: {
                        name?: string;
                        role?: string;
                        affiliation?: string;
                    }) {
                        const roleEmojis = {
                            lead: "👑",
                            coauthor: "✍️",
                            contributor: "🤝",
                            advisor: "🎓",
                        };

                        const roleEmoji = roleEmojis[role as keyof typeof roleEmojis] || "📝";
                        const subtitle = `${roleEmoji} ${role || "Unknown"}${affiliation ? ` - ${affiliation}` : ""}`;

                        return {
                            title: name || "Unknown Author",
                            subtitle,
                        };
                    },
                },
            }],
            validation: (Rule) => Rule.required().min(1).max(10),
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
            validation: (Rule) => Rule.custom((studyPeriod: { startDate?: string; endDate?: string } | undefined) => {
                if (studyPeriod?.startDate && studyPeriod?.endDate) {
                    if (new Date(studyPeriod.startDate) > new Date(studyPeriod.endDate)) {
                        return "Start date must be before end date";
                    }
                }
                return true;
            }),
        }),

        defineField({
            name: "studyLocation",
            title: "Primary Study Location",
            type: "geopoint",
            group: "metadata",
        }),

        defineField({
            name: "studyAreas",
            title: "Additional Study Areas",
            type: "array",
            group: "metadata",
            of: [{
                type: "object",
                fields: [
                    {
                        name: "location",
                        title: "Location",
                        type: "geopoint",
                        validation: (Rule) => Rule.required(),
                    },
                    {
                        name: "name",
                        title: "Area Name",
                        type: "string",
                        validation: (Rule) => Rule.required().max(100),
                    },
                    {
                        name: "description",
                        title: "Description",
                        type: "text",
                        rows: 2,
                        validation: (Rule) => Rule.max(200),
                    },
                ],
                preview: {
                    select: {
                        title: "name",
                        subtitle: "description",
                    },
                },
            }],
            validation: (Rule) => Rule.max(10),
        }),

        // Affiliations
        defineField({
            name: "organizations",
            title: "Associated Organizations",
            type: "array",
            group: "affiliations",
            of: [{ type: "reference", to: [{ type: "organization" }] }],
            validation: (Rule) => Rule.max(5),
        }),

        defineField({
            name: "projects",
            title: "Related Projects",
            type: "array",
            group: "affiliations",
            of: [{ type: "reference", to: [{ type: "project" }] }],
            validation: (Rule) => Rule.max(5),
        }),

        // Review workflow
        defineField({
            name: "status",
            title: "Publication Status",
            type: "string",
            group: "review",
            options: { list: statusOptions },
            initialValue: "pending",
            validation: (Rule) => Rule.required(),
        }),

        defineField({
            name: "reviewNotes",
            title: "Editorial Notes",
            type: "text",
            group: "review",
            rows: 4,
        }),

        defineField({
            name: "reviewedBy",
            title: "Reviewed By",
            type: "reference",
            group: "review",
            to: { type: "author" },
            hidden: ({ document }) => {
                const status = document?.status as string;
                return !status || !["approved", "rejected", "revision"].includes(status);
            },
        }),

        defineField({
            name: "reviewedAt",
            title: "Review Completed",
            type: "datetime",
            group: "review",
            readOnly: true,
            hidden: ({ document }) => {
                const status = document?.status as string;
                return !status || !["approved", "rejected", "revision"].includes(status);
            },
        }),

        defineField({
            name: "publishedAt",
            title: "Published At",
            type: "datetime",
            group: "review",
            hidden: ({ document }) => {
                const status = document?.status as string;
                return status !== "approved";
            },
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
            name: "seoTitle",
            title: "SEO Title",
            type: "string",
            group: "seo",
            validation: (Rule) => Rule.max(60),
        }),

        defineField({
            name: "seoDescription",
            title: "SEO Description",
            type: "text",
            group: "seo",
            rows: 3,
            validation: (Rule) => Rule.max(160),
        }),

        defineField({
            name: "canonicalUrl",
            title: "Canonical URL",
            type: "url",
            group: "seo",
        }),
    ],

    preview: {
        select: {
            title: "title",
            status: "status",
            media: "image",
            language: "language",
        },
        prepare({ title, status, media, language }: {
            title?: Record<string, string>;
            status?: string;
            media?: any;
            language?: string;
        }) {
            const lang = language || "en";
            const langConfig = supportedLanguages.find(l => l.id === lang);
            const displayTitle = title?.[lang] || title?.en || "Untitled Case Study";

            const statusEmojis: Record<string, string> = {
                pending: "📝",
                approved: "✅",
                rejected: "❌",
                revision: "📋",
            };

            const statusEmoji = statusEmojis[status || "pending"] || "📝";
            const subtitle = `${langConfig?.flag || "🌐"} ${langConfig?.title || lang.toUpperCase()} | ${statusEmoji} ${status || "pending"}`;

            return {
                title: displayTitle,
                subtitle,
                media,
            };
        },
    },

    orderings: [
        {
            title: "Published Date (Newest)",
            name: "publishedDateDesc",
            by: [{ field: "publishedAt", direction: "desc" }],
        },
        {
            title: "Status",
            name: "statusAsc",
            by: [{ field: "status", direction: "asc" }],
        },
        {
            title: "Language",
            name: "languageAsc",
            by: [{ field: "language", direction: "asc" }],
        },
        {
            title: "Title (A-Z)",
            name: "titleAsc",
            by: [{ field: "title.en", direction: "asc" }],
        },
    ],
});
