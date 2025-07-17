import { defineField, defineType } from "sanity";
import { Globe } from "lucide-react";
import { orderRankField } from "@sanity/orderable-document-list";

export default defineType({
    name: "regionalCommunity",
    title: "Regional Community",
    type: "document",
    icon: Globe,
    fields: [
        defineField({
            name: "name",
            title: "Name",
            type: "object",
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
            options: {
                source: "name.en",
                maxLength: 96,
            },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: "code",
            title: "Region Code",
            type: "string",
            description: "Unique identifier for the region (e.g., SSA, MENA, LAC)",
            validation: (Rule) => Rule.required(),
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
            name: "coverImage",
            title: "Cover Image",
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
            name: "boundaries",
            title: "Geographic Boundaries",
            type: "array",
            of: [
                {
                    type: "geopoint",
                },
            ],
            description: "Define the geographic boundaries of this region",
        }),
        defineField({
            name: "countries",
            title: "Countries",
            type: "array",
            of: [
                {
                    type: "object",
                    fields: [
                        {
                            name: "name",
                            title: "Country Name",
                            type: "string",
                            validation: (Rule) => Rule.required(),
                        },
                        {
                            name: "code",
                            title: "Country Code",
                            type: "string",
                            description: "ISO 3166-1 alpha-2 code",
                            validation: (Rule) => Rule.required().length(2),
                        },
                        {
                            name: "isPrimary",
                            title: "Primary Country",
                            type: "boolean",
                            description: "Is this a primary/major country in the region?",
                            initialValue: false,
                        },
                    ],
                    preview: {
                        select: {
                            title: "name",
                            subtitle: "code",
                            isPrimary: "isPrimary",
                        },
                        prepare({ title, subtitle, isPrimary }) {
                            return {
                                title: `${isPrimary ? "⭐ " : ""}${title}`,
                                subtitle: subtitle,
                            };
                        },
                    },
                },
            ],
        }),
        defineField({
            name: "statistics",
            title: "Regional Statistics",
            type: "object",
            fields: [
                {
                    name: "population",
                    title: "Population",
                    type: "number",
                },
                {
                    name: "organizationCount",
                    title: "Number of Organizations",
                    type: "number",
                },
                {
                    name: "projectCount",
                    title: "Active Projects",
                    type: "number",
                },
                {
                    name: "lastUpdated",
                    title: "Last Updated",
                    type: "date",
                },
            ],
        }),
        defineField({
            name: "contact",
            title: "Regional Contact",
            type: "object",
            fields: [
                {
                    name: "name",
                    title: "Contact Name",
                    type: "string",
                },
                {
                    name: "email",
                    title: "Email",
                    type: "email",
                },
                {
                    name: "phone",
                    title: "Phone",
                    type: "string",
                },
                {
                    name: "organization",
                    title: "Organization",
                    type: "reference",
                    to: [{ type: "organization" }],
                },
            ],
        }),
        defineField({
            name: "tags",
            title: "Focus Areas",
            type: "tags",
            options: {
                includeFromReference: "tag",
                customLabel: "label.en",
                customValue: "value.current",
            },
        }),
        defineField({
            name: "featured",
            title: "Featured Region",
            type: "boolean",
            initialValue: false,
        }),
        defineField({
            name: "active",
            title: "Active",
            type: "boolean",
            initialValue: true,
            description: "Is this regional community currently active?",
        }),
        orderRankField({ type: "regionalCommunity" }),
    ],
    preview: {
        select: {
            title: "name.en",
            subtitle: "code",
            media: "coverImage",
            active: "active",
            featured: "featured",
        },
        prepare({ title, subtitle, media, active, featured }) {
            return {
                title: `${featured ? "⭐ " : ""}${title || "Untitled Region"}`,
                subtitle: `${active ? "🟢" : "🔴"} ${subtitle || "No code"}`,
                media,
            };
        },
    },
});
