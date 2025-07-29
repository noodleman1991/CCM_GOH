import { defineField, defineType } from "sanity";
import { FolderOpen } from "lucide-react";
import { orderRankField } from "@sanity/orderable-document-list";

export default defineType({
    name: "project",
    title: "Project",
    type: "document",
    icon: FolderOpen,
    fields: [
        defineField({
            name: "name",
            title: "Project Name",
            type: "string",
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: "slug",
            title: "Slug",
            type: "slug",
            options: {
                source: "name",
                maxLength: 96,
            },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: "acronym",
            title: "Acronym",
            type: "string",
            description: "Short form or acronym of the project name",
        }),
        defineField({
            name: "description",
            title: "Description",
            type: "object",
            fields: [
                { name: "en", title: "English", type: "text", rows: 3 },
                { name: "es", title: "Español", type: "text", rows: 3 },
                { name: "fr", title: "Français", type: "text", rows: 3 },
                { name: "ar", title: "العربية", type: "text", rows: 3 },
            ],
        }),
        defineField({
            name: "type",
            title: "Project Type",
            type: "string",
            options: {
                list: [
                    { title: "Research Project", value: "research" },
                    { title: "Implementation Project", value: "implementation" },
                    { title: "Pilot Project", value: "pilot" },
                    { title: "Community Initiative", value: "community" },
                    { title: "Policy Initiative", value: "policy" },
                    { title: "Technology Project", value: "technology" },
                    { title: "Other", value: "other" },
                ],
            },
            initialValue: "research",
        }),
        defineField({
            name: "status",
            title: "Status",
            type: "string",
            options: {
                list: [
                    { title: "Planning", value: "planning" },
                    { title: "Active", value: "active" },
                    { title: "Completed", value: "completed" },
                    { title: "On Hold", value: "on-hold" },
                    { title: "Cancelled", value: "cancelled" },
                ],
            },
            initialValue: "active",
        }),
        defineField({
            name: "leadOrganization",
            title: "Lead Organization",
            type: "reference",
            to: [{ type: "organization" }],
        }),
        defineField({
            name: "partnerOrganizations",
            title: "Partner Organizations",
            type: "array",
            of: [
                {
                    type: "reference",
                    to: [{ type: "organization" }],
                },
            ],
        }),
        defineField({
            name: "startDate",
            title: "Start Date",
            type: "date",
        }),
        defineField({
            name: "endDate",
            title: "End Date",
            type: "date",
        }),
        defineField({
            name: "website",
            title: "Project Website",
            type: "url",
        }),
        defineField({
            name: "logo",
            title: "Project Logo",
            type: "image",
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
            name: "location",
            title: "Project Location",
            type: "geopoint",
            description: "Primary location or headquarters of the project",
        }),
        defineField({
            name: "coverageArea",
            title: "Coverage Area",
            type: "array",
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
                            title: "Location Name",
                            type: "string",
                        },
                        {
                            name: "description",
                            title: "Description",
                            type: "text",
                            rows: 2,
                        },
                    ],
                },
            ],
            description: "Areas where the project is active",
        }),
        defineField({
            name: "tags",
            title: "Tags",
            type: "tags",
            options: {
                includeFromReference: "tag",
                includeFromRelated: "tags",
                customLabel: "label.en",
                customValue: "value.current",
            },
        }),
        orderRankField({ type: "project" }),
    ],
    preview: {
        select: {
            title: "name",
            subtitle: "type",
            media: "logo",
            status: "status",
            acronym: "acronym",
        },
        prepare({
                    title,
                    subtitle,
                    media,
                    status,
                    acronym,
                }: {
            title?: string;
            subtitle?: string;
            media?: any;
            status?: "planning" | "active" | "completed" | "on-hold" | "cancelled";
            acronym?: string;
        }) {
            const statusEmoji: Record<
                "planning" | "active" | "completed" | "on-hold" | "cancelled",
                string
            > = {
                planning: "📋",
                active: "🟢",
                completed: "✅",
                "on-hold": "⏸️",
                cancelled: "❌",
            };

            const safeStatus = status ?? "planning"; // default if undefined

            return {
                title: acronym ? `${acronym} - ${title}` : title || "Untitled Project",
                subtitle: `${statusEmoji[safeStatus]} ${subtitle || "project"}`,
                media,
            };
        },
    },
});
