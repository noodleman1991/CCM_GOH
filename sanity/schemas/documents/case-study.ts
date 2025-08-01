import { defineField, defineType } from "sanity";
import { FileSearch } from "lucide-react";
import { isUniqueOtherThanLanguage } from '@/sanity/lib/isUniqueOtherThanLanguage';

// Type definitions for better type safety
interface LocalizedString {
    en?: string;
    es?: string;
    fr?: string;
    ar?: string;
}

// Fix: Proper typing for Sanity's prepare function parameters
interface AuthorPreview {
    title?: string;
    subtitle?: string;
    affiliation?: string;
}

interface PreviewData {
    title?: LocalizedString;
    status?: "pending" | "reviewing" | "approved" | "rejected" | "revision" | "published";
    media?: any;
    language?: string;
}

// Fix: Type for document in hidden functions
interface CaseStudyDocument {
    status?: "pending" | "reviewing" | "approved" | "rejected" | "revision" | "published";
    language?: string;
}

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
        {
            name: "translations",
            title: "Translations",
        },
    ],
    fields: [
        // Document language - determines content language
        defineField({
            name: "language",
            title: "Content Language",
            type: "string",
            options: {
                list: [
                    { title: "English", value: "en" },
                    { title: "Español", value: "es" },
                    { title: "Français", value: "fr" },
                    { title: "العربية", value: "ar" },
                ],
            },
            initialValue: "en",
            validation: (Rule) => Rule.required(),
            description: "Language for the main content of this document",
        }),

        // Translation management - document level
        defineField({
            name: "baseDocument",
            title: "Original Document",
            type: "reference",
            to: [{ type: "caseStudy" }],
            group: "translations",
            description: "Reference to the original document if this is a translation",
            hidden: ({ document }) => (document as CaseStudyDocument)?.language === "en",
            validation: (Rule) =>
                Rule.custom((value, context) => {
                    const language = (context?.document as CaseStudyDocument)?.language;
                    if (language !== "en" && !value) {
                        return "Translations must reference the original document";
                    }
                    return true;
                }),
        }),
        defineField({
            name: "translations",
            title: "Available Translations",
            type: "array",
            group: "translations",
            of: [
                {
                    type: "object",
                    fields: [
                        {
                            name: "language",
                            title: "Language",
                            type: "string",
                            options: {
                                list: [
                                    { title: "Español", value: "es" },
                                    { title: "Français", value: "fr" },
                                    { title: "العربية", value: "ar" },
                                ],
                            },
                            validation: (Rule) => Rule.required(),
                        },
                        {
                            name: "document",
                            title: "Translation Document",
                            type: "reference",
                            to: [{ type: "caseStudy" }],
                            validation: (Rule) => Rule.required(),
                        },
                        {
                            name: "status",
                            title: "Translation Status",
                            type: "string",
                            options: {
                                list: [
                                    { title: "In Progress", value: "progress" },
                                    { title: "Review", value: "review" },
                                    { title: "Complete", value: "complete" },
                                ],
                            },
                            initialValue: "progress",
                        },
                    ],
                    preview: {
                        select: {
                            language: "language",
                            status: "status",
                            title: "document.title",
                        },
                        prepare(value: Record<string, any>) {
                            const { language, status, title } = value;
                            const flags = { es: "🇪🇸", fr: "🇫🇷", ar: "🇸🇦" };
                            const statusEmoji = { progress: "🟡", review: "🟠", complete: "🟢" };
                            return {
                                title: `${flags[language as keyof typeof flags] || "🌐"} ${language?.toUpperCase()}`,
                                subtitle: `${statusEmoji[status as keyof typeof statusEmoji]} ${title?.[language as keyof typeof title] || "No title"}`,
                            };
                        },
                    },
                },
            ],
            hidden: ({ document }) => (document as CaseStudyDocument)?.language !== "en",
            description: "Manage translations of this case study",
        }),

        // Field-level translations - Title (available in all languages)
        defineField({
            name: "title",
            title: "Title",
            type: "object",
            group: "content",
            fields: [
                {
                    name: "en",
                    title: "English",
                    type: "string",
                    validation: (Rule) => Rule.max(100),
                },
                {
                    name: "es",
                    title: "Español",
                    type: "string",
                    validation: (Rule) => Rule.max(100),
                },
                {
                    name: "fr",
                    title: "Français",
                    type: "string",
                    validation: (Rule) => Rule.max(100),
                },
                {
                    name: "ar",
                    title: "العربية",
                    type: "string",
                    validation: (Rule) => Rule.max(100),
                },
            ],
            validation: (Rule) =>
                Rule.custom((title: unknown, context) => {
                    const language = String((context?.document as CaseStudyDocument)?.language || "en");
                    const localizedTitle = title as LocalizedString;

                    if (!localizedTitle?.[language as keyof LocalizedString]) {
                        return `Title in ${language.toUpperCase()} is required`;
                    }
                    return true;
                }),
        }),

        // Field-level translations - Excerpt (available in all languages)
        defineField({
            name: "excerpt",
            title: "Excerpt",
            type: "object",
            group: "content",
            fields: [
                {
                    name: "en",
                    title: "English",
                    type: "text",
                    rows: 3,
                    validation: (Rule) => Rule.max(300),
                },
                {
                    name: "es",
                    title: "Español",
                    type: "text",
                    rows: 3,
                    validation: (Rule) => Rule.max(300),
                },
                {
                    name: "fr",
                    title: "Français",
                    type: "text",
                    rows: 3,
                    validation: (Rule) => Rule.max(300),
                },
                {
                    name: "ar",
                    title: "العربية",
                    type: "text",
                    rows: 3,
                    validation: (Rule) => Rule.max(300),
                },
            ],
            validation: (Rule) =>
                Rule.custom((excerpt: unknown, context) => {
                    const language = String((context?.document as CaseStudyDocument)?.language || "en");
                    const localizedExcerpt = excerpt as LocalizedString;

                    if (!localizedExcerpt?.[language as keyof LocalizedString]) {
                        return `Excerpt in ${language.toUpperCase()} is required`;
                    }
                    return true;
                }),
        }),

        // Slug based on title in document language
        defineField({
            name: "slug",
            title: "URL Slug",
            type: "slug",
            group: "metadata",
            options: {
                source: (doc: any) => {
                    const language = doc.language || 'en';
                    return doc.title?.[language] || doc.title?.en || '';
                },
                maxLength: 96,
                isUnique: isUniqueOtherThanLanguage,
            },
            validation: (Rule) => Rule.required(),
        }),

        // Content - single language per document (document-level translation)
        defineField({
            name: "content",
            title: "Main Content",
            type: "array",
            group: "content",
            of: [
                {
                    type: "block",
                    styles: [
                        { title: "Normal", value: "normal" },
                        { title: "H1", value: "h1" },
                        { title: "H2", value: "h2" },
                        { title: "H3", value: "h3" },
                        { title: "H4", value: "h4" },
                        { title: "Quote", value: "blockquote" },
                    ],
                    lists: [
                        { title: "Bullet", value: "bullet" },
                        { title: "Number", value: "number" },
                    ],
                    marks: {
                        decorators: [
                            { title: "Strong", value: "strong" },
                            { title: "Emphasis", value: "em" },
                            { title: "Code", value: "code" },
                        ],
                        annotations: [
                            {
                                title: "URL",
                                name: "link",
                                type: "object",
                                fields: [
                                    {
                                        title: "URL",
                                        name: "href",
                                        type: "url",
                                        validation: (Rule) => Rule.uri({
                                            scheme: ['http', 'https', 'mailto', 'tel']
                                        }),
                                    },
                                    {
                                        title: "Open in new tab",
                                        name: "blank",
                                        type: "boolean",
                                        initialValue: false,
                                    },
                                ],
                            },
                        ],
                    },
                },
                {
                    type: "image",
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
                },
            ],
            validation: (Rule) => Rule.required().min(1),
        }),

        // User submission tracking
        defineField({
            name: "submittedBy",
            title: "Submitted By",
            type: "string",
            group: "metadata",
            description: "Clerk User ID of the person who submitted this case study",
            readOnly: true,
        }),
        defineField({
            name: "submittedAt",
            title: "Submitted At",
            type: "datetime",
            group: "metadata",
            readOnly: true,
        }),

        // Authors with enhanced validation
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
                            description: "Clerk User ID (if registered user)",
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
                            options: {
                                list: [
                                    { title: "Lead Author", value: "lead" },
                                    { title: "Co-Author", value: "coauthor" },
                                    { title: "Contributor", value: "contributor" },
                                    { title: "Advisor", value: "advisor" },
                                ],
                            },
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
                            title: "name",
                            subtitle: "role",
                            affiliation: "affiliation.name",
                        },
                        // Fix: Proper typing for Sanity's prepare function
                        prepare(value: Record<string, any>) {
                            const { title, subtitle, affiliation } = value as AuthorPreview;
                            const roleEmoji = {
                                lead: "👑",
                                coauthor: "✍️",
                                contributor: "🤝",
                                advisor: "🎓",
                            };
                            return {
                                title: title || "Unknown Author",
                                subtitle: `${roleEmoji[subtitle as keyof typeof roleEmoji] || '📝'} ${subtitle || 'Unknown Role'}${affiliation ? ` - ${affiliation}` : ''}`,
                            };
                        },
                    },
                },
            ],
            validation: (Rule) => Rule.required().min(1).max(10),
        }),

        // Affiliations
        defineField({
            name: "organizations",
            title: "Associated Organizations",
            type: "array",
            group: "affiliations",
            of: [
                {
                    type: "reference",
                    to: [{ type: "organization" }],
                },
            ],
            description: "Organizations involved in this case study",
            validation: (Rule) => Rule.max(5),
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
            description: "Projects related to this case study",
            validation: (Rule) => Rule.max(5),
        }),

        // Universal tags (available in all languages)
        defineField({
            name: "tags",
            title: "Tags",
            type: "array",
            group: "affiliations",
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
            description: "Universal tags - searchable in all languages",
        }),

        // Featured image
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
                    validation: (Rule) => Rule.required(),
                },
                {
                    name: "caption",
                    type: "string",
                    title: "Caption",
                },
            ],
        }),

        // Study metadata
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
            validation: (Rule) =>
                Rule.custom((studyPeriod: any) => {
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
            of: [
                {
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
                },
            ],
            validation: (Rule) => Rule.max(10),
        }),

        // Editorial review workflow
        defineField({
            name: "status",
            title: "Publication Status",
            type: "string",
            group: "review",
            options: {
                list: [
                    { title: "📝 Pending Review", value: "pending" },
                    { title: "👀 Under Review", value: "reviewing" },
                    { title: "✅ Approved", value: "approved" },
                    { title: "❌ Rejected", value: "rejected" },
                    { title: "📋 Needs Revision", value: "revision" },
                    { title: "🚀 Published", value: "published" },
                ],
            },
            initialValue: "pending",
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: "reviewNotes",
            title: "Editorial Notes",
            type: "text",
            group: "review",
            rows: 4,
            description: "Internal notes for the editorial review process",
        }),
        defineField({
            name: "reviewedBy",
            title: "Reviewed By",
            type: "reference",
            group: "review",
            to: { type: "author" },
            // Fix: Proper type checking for status
            hidden: ({ document }) => {
                const doc = document as CaseStudyDocument;
                const status = doc?.status;
                return !status || !["approved", "rejected", "published"].includes(status);
            },
        }),
        defineField({
            name: "reviewedAt",
            title: "Review Completed",
            type: "datetime",
            group: "review",
            readOnly: true,
            // Fix: Proper type checking for status
            hidden: ({ document }) => {
                const doc = document as CaseStudyDocument;
                const status = doc?.status;
                return !status || !["approved", "rejected", "published"].includes(status);
            },
        }),
        defineField({
            name: "publishedAt",
            title: "Published At",
            type: "datetime",
            group: "review",
            // Fix: Proper type checking for status
            hidden: ({ document }) => {
                const doc = document as CaseStudyDocument;
                return doc?.status !== "published";
            },
        }),
        defineField({
            name: "featured",
            title: "Featured Case Study",
            type: "boolean",
            group: "review",
            initialValue: false,
            description: "Highlight this case study on the homepage",
        }),

        // SEO optimization
        defineField({
            name: "seoTitle",
            title: "SEO Title",
            type: "string",
            group: "seo",
            validation: (Rule) => Rule.max(60),
            description: "Optimized title for search engines (max 60 chars)",
        }),
        defineField({
            name: "seoDescription",
            title: "SEO Description",
            type: "text",
            group: "seo",
            rows: 3,
            validation: (Rule) => Rule.max(160),
            description: "Meta description for search engines (max 160 chars)",
        }),
        defineField({
            name: "canonicalUrl",
            title: "Canonical URL",
            type: "url",
            group: "seo",
            description: "Canonical URL if this content exists elsewhere",
        }),
    ],
    preview: {
        select: {
            title: "title",
            status: "status",
            media: "image",
            language: "language",
        },
        prepare(value: Record<string, any>) {
            const { title, status, media, language } = value as PreviewData;
            const lang = language || "en";
            const displayTitle = title?.[lang as keyof LocalizedString] || title?.en || "Untitled Case Study";

            const statusEmoji: Record<string, string> = {
                pending: "📝",
                reviewing: "👀",
                approved: "✅",
                rejected: "❌",
                revision: "📋",
                published: "🚀",
            };

            const langFlags = {
                en: "🇺🇸",
                es: "🇪🇸",
                fr: "🇫🇷",
                ar: "🇸🇦",
            };

            const safeStatus = status || "pending";

            return {
                title: displayTitle,
                subtitle: `${langFlags[lang as keyof typeof langFlags] || "🌐"} ${lang.toUpperCase()} | ${statusEmoji[safeStatus]} ${safeStatus}`,
                media,
            };
        },
    },
    orderings: [
        {
            title: "Published Date, New",
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
    ],
});
