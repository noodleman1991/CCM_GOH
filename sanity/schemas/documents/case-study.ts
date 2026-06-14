import { defineField, defineType } from "sanity";
import { FileSearch } from "lucide-react";
import { topicOptions } from "../shared/topic-options";

// Language configuration
const supportedLanguages = [
    { id: "en", title: "English", isDefault: true },
    { id: "es", title: "Español" },
    { id: "fr", title: "Français" },
    { id: "ar", title: "العربية", isRTL: true },
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
    { title: "Pending Review", value: "pending" },
    { title: "Rejected", value: "rejected" },
    { title: "Needs Revision", value: "revision" },
    { title: "Approved (Published)", value: "approved" },
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
        { name: "review", title: "Review & Publishing" },
        { name: "seo", title: "SEO" },
    ],
    fields: [
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
            name: "content",
            title: "Case Study Content",
            type: "styled-block-content",
            group: "content",
            validation: (Rule) => Rule.required(),
            description: "The main content of your case study with rich text formatting",
        }),

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

        defineField({
            name: "topic",
            title: "Topic",
            type: "string",
            description: "Main topic category for this case study",
            group: "content",
            options: {
                list: [...topicOptions],
            },
            validation: (Rule) => Rule.required(),
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
                        type: "string",
                        validation: (Rule) => Rule.custom((value: string | undefined) => {
                            if (!value || value === '') return true;
                            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                            return emailRegex.test(value) ? true : 'Must be a valid email address';
                        }),
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
                        const subtitle = `${role || "Unknown"}${affiliation ? ` - ${affiliation}` : ""}`;

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
            name: "locationText",
            title: "Study Location (Text)",
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
                    title: "City/Region",
                    type: "string",
                },
            ],
            description: "Human-readable location shown on the case study (e.g. \"Nairobi, Kenya\"). Display only — for the map, set the coordinates below.",
        }),

        defineField({
            name: "studyLocation",
            title: "Primary Study Location (Map)",
            type: "geopoint",
            group: "metadata",
            description: "The main location's coordinates. This is what drives the regional map and search — set it for every case study.",
        }),

        defineField({
            name: "studyAreas",
            title: "Additional Study Areas",
            type: "array",
            group: "metadata",
            description: "Optional. Only add these if the study spanned several distinct places beyond the primary location above.",
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

        defineField({
            name: "relatedCommunity",
            title: "Related Community",
            type: "reference",
            group: "affiliations",
            to: { type: "regionalCommunity" },
            description: "The community this case study relates to",
        }),

        // Review workflow and publishing
        defineField({
            name: "status",
            title: "Publication Status",
            type: "string",
            group: "review",
            options: { list: statusOptions },
            initialValue: "pending",
            validation: (Rule) => Rule.required(),
            description: "Single source of truth for visibility: ONLY 'Approved' case studies appear on the public site. Use the Approve / Reject / Request Revision actions (top-right) so review timestamps are recorded.",
        }),

        defineField({
            name: "featured",
            title: "Featured Case Study",
            type: "boolean",
            group: "review",
            initialValue: false,
            description: "Featured case studies appear in highlighted sections",
        }),

        defineField({
            name: "publishedAt",
            title: "Published At",
            type: "datetime",
            group: "review",
            readOnly: true,
            hidden: ({ document }) => {
                const status = document?.status as string;
                return status !== "approved";
            },
            description: "Set automatically by the Approve action when the case study goes live. Read-only so it always reflects the real publish time.",
        }),

        defineField({
            name: "reviewNotes",
            title: "Editorial Notes",
            type: "text",
            group: "review",
            rows: 4,
            description: "Internal notes for editors and reviewers",
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
            // System field: the last status the submitter was emailed about.
            // Set automatically by the status-change webhook so notifications
            // aren't re-sent on unrelated edits. Not editorial.
            name: "notifiedStatus",
            title: "Last Notified Status (system)",
            type: "string",
            group: "review",
            readOnly: true,
            hidden: true,
        }),

        // SEO fields
        defineField({
            name: "seoTitle",
            title: "SEO Title",
            type: "string",
            group: "seo",
            validation: (Rule) => Rule.max(60),
            description: "Override the default title for search engines",
        }),

        defineField({
            name: "seoDescription",
            title: "SEO Description",
            type: "text",
            group: "seo",
            rows: 3,
            validation: (Rule) => Rule.max(160),
            description: "Description for search engines and social sharing",
        }),

        defineField({
            name: "canonicalUrl",
            title: "Canonical URL",
            type: "url",
            group: "seo",
            description: "If this case study was published elsewhere first",
        }),
    ],

    preview: {
        select: {
            title: "title",
            status: "status",
            media: "image",
            featured: "featured",
        },
        prepare({ title, status, media, featured }: {
            title?: Record<string, string>;
            status?: string;
            media?: any;
            featured?: boolean;
        }) {
            const displayTitle = title?.en || "Untitled Case Study";
            const featuredIcon = featured ? "⭐ " : "";
            // Status is the single source of truth for public visibility:
            // only "approved" is shown on the public site. Make that explicit in
            // the Studio list so an editor never misreads a hidden doc as live.
            const statusLabels: Record<string, string> = {
                approved: "🟢 Live (public)",
                pending: "🟡 Pending review (hidden)",
                revision: "🟠 Needs revision (hidden)",
                rejected: "🔴 Rejected (hidden)",
            };
            const statusLabel = statusLabels[status || "pending"] || `${status} (hidden)`;
            const subtitle = `${featuredIcon}${statusLabel}`;

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
            title: "Submitted Date (Newest)",
            name: "submittedDateDesc",
            by: [{ field: "submittedAt", direction: "desc" }],
        },
        {
            title: "Status",
            name: "statusAsc",
            by: [{ field: "status", direction: "asc" }],
        },
        {
            title: "Featured First",
            name: "featuredFirst",
            by: [
                { field: "featured", direction: "desc" },
                { field: "publishedAt", direction: "desc" }
            ],
        },
        {
            title: "Title (A-Z)",
            name: "titleAsc",
            by: [{ field: "title.en", direction: "asc" }],
        },
    ],
});
