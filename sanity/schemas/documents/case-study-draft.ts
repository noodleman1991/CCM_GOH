import { defineField, defineType } from "sanity";
import { FileEdit } from "lucide-react";
import { topicOptions } from "../shared/topic-options";

// Re-use the same configuration as the main case study schema
const supportedLanguages = [
    { id: "en", title: "English", isDefault: true },
    { id: "es", title: "Español" },
    { id: "fr", title: "Français" },
    { id: "ar", title: "العربية", isRTL: true },
];

const authorRoles = [
    { title: "Lead Author", value: "lead" },
    { title: "Co-Author", value: "coauthor" },
    { title: "Contributor", value: "contributor" },
    { title: "Advisor", value: "advisor" },
];

// topicOptions imported from shared/topic-options

// Helper function for localized fields
const createLocalizedField = (name: string, title: string, type: string = "string", required: boolean = false) => {
    return defineField({
        name,
        title,
        type: "object",
        fields: supportedLanguages.map(lang => ({
            name: lang.id,
            title: lang.title,
            type,
        })),
    });
};

export default defineType({
    name: "caseStudyDraft",
    title: "Case Study Draft",
    type: "document",
    icon: FileEdit,
    description: "Auto-saved draft of case study submissions",
    fields: [
        // User identification
        defineField({
            name: "userId",
            title: "User ID",
            type: "string",
            description: "Clerk User ID of the draft owner",
            validation: (Rule) => Rule.required(),
        }),

        defineField({
            name: "lastSaved",
            title: "Last Saved",
            type: "datetime",
            description: "When this draft was last updated",
            validation: (Rule) => Rule.required(),
        }),

        // Content fields - same structure as main case study but without validation
        createLocalizedField("title", "Title"),
        createLocalizedField("excerpt", "Excerpt", "text"),

        defineField({
            name: "topic",
            title: "Topic/Domain",
            type: "string",
            options: { list: [...topicOptions] },
            description: "Primary topic or domain this case study belongs to",
        }),

        defineField({
            name: "content",
            title: "Case Study Content",
            type: "styled-block-content",
            description: "The main content of your case study with rich text formatting",
        }),

        defineField({
            name: "image",
            title: "Featured Image",
            type: "image",
            options: { hotspot: true },
            fields: [
                {
                    name: "alt",
                    type: "string",
                    title: "Alternative Text",
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
            of: [{ type: "reference", to: [{ type: "tag" }] }],
            options: {
                layout: "tags",
                sortable: true,
            },
        }),

        defineField({
            name: "authors",
            title: "Authors",
            type: "array",
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
                        options: { list: authorRoles },
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
        }),

        defineField({
            name: "studyPeriod",
            title: "Study Period",
            type: "object",
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

        defineField({
            name: "studyLocation",
            title: "Primary Study Location",
            type: "geopoint",
        }),

        defineField({
            name: "studyAreas",
            title: "Additional Study Areas",
            type: "array",
            of: [{
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
            }],
        }),

        defineField({
            name: "organizations",
            title: "Associated Organizations",
            type: "array",
            of: [{ type: "reference", to: [{ type: "organization" }] }],
        }),

        defineField({
            name: "projects",
            title: "Related Projects",
            type: "array",
            of: [{ type: "reference", to: [{ type: "project" }] }],
        }),

        defineField({
            name: "relatedCommunity",
            title: "Related Community",
            type: "reference",
            to: { type: "regionalCommunity" },
            description: "The community this case study relates to",
        }),

        // Metadata for form state
        defineField({
            name: "formMetadata",
            title: "Form Metadata",
            type: "object",
            description: "Additional form state information",
            fields: [
                {
                    name: "currentStep",
                    title: "Current Step",
                    type: "string",
                    description: "Current form step when saved",
                },
                {
                    name: "completedSections",
                    title: "Completed Sections",
                    type: "array",
                    of: [{ type: "string" }],
                    description: "List of completed form sections",
                },
                {
                    name: "organizationName",
                    title: "Organization Name",
                    type: "string",
                    description: "Free text organization name if not selecting existing",
                },
            ],
        }),
    ],

    preview: {
        select: {
            title: "title",
            topic: "topic",
            lastSaved: "lastSaved",
            userId: "userId",
        },
        prepare({ title, topic, lastSaved, userId }: {
            title?: Record<string, string>;
            topic?: string;
            lastSaved?: string;
            userId?: string;
        }) {
            const displayTitle = title?.en || "Untitled Draft";
            const topicLabel = topicOptions.find(t => t.value === topic)?.title || topic;
            const savedDate = lastSaved ? new Date(lastSaved).toLocaleDateString() : "";

            const subtitle = `Draft${topicLabel ? ` • ${topicLabel}` : ""}${savedDate ? ` • ${savedDate}` : ""}`;

            return {
                title: displayTitle,
                subtitle,
                description: `User: ${userId?.slice(0, 8)}...`,
            };
        },
    },

    orderings: [
        {
            title: "Last Saved (Newest)",
            name: "lastSavedDesc",
            by: [{ field: "lastSaved", direction: "desc" }],
        },
        {
            title: "Title (A-Z)",
            name: "titleAsc",
            by: [{ field: "title.en", direction: "asc" }],
        },
    ],
});