import { defineField, defineType } from "sanity";
import { FolderOpen } from "lucide-react";
import { orderRankField } from "@sanity/orderable-document-list";
import { urlRule } from "../shared/validation";

export default defineType({
    name: "project",
    title: "Project",
    type: "document",
    icon: FolderOpen,
    groups: [
        { name: "content", title: "Details", default: true },
        { name: "partners", title: "Organisations" },
        { name: "location", title: "Location & Coverage" },
    ],
    fields: [
        defineField({
            name: "name",
            group: "content",
            title: "Project Name",
            type: "string",
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: "slug",
            group: "content",
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
            group: "content",
            title: "Acronym",
            type: "string",
            description: "Short form or acronym of the project name",
        }),
        defineField({
            name: "description",
            group: "content",
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
            group: "content",
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
            group: "content",
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
            group: "partners",
            title: "Lead Organization",
            type: "reference",
            to: [{ type: "organization" }],
        }),
        defineField({
            name: "partnerOrganizations",
            group: "partners",
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
            group: "content",
            title: "Start Date",
            type: "date",
        }),
        defineField({
            name: "endDate",
            group: "content",
            title: "End Date",
            type: "date",
        }),
        defineField({
            name: "website",
            group: "content",
            title: "Project Website",
            type: "url",
            validation: (Rule) => urlRule(Rule),
        }),
        defineField({
            name: "logo",
            group: "content",
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
            group: "location",
            title: "Project Location",
            type: "geopoint",
            description: "Primary location or headquarters of the project",
        }),
        defineField({
            name: "coverageArea",
            group: "location",
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
            group: "content",
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
            validation: (Rule) =>
                Rule.max(6).warning("Aim for 3–4 tags; more than 6 dilutes them."),
            description: "Type to search existing tags or create new ones. 3–4 focused tags work best (6 max).",
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
            const safeStatus = status ?? "planning"; // default if undefined

            return {
                title: acronym ? `${acronym} - ${title}` : title || "Untitled Project",
                subtitle: `${safeStatus} - ${subtitle || "project"}`,
                media,
            };
        },
    },
});
