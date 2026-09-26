import { defineField, defineType } from "sanity";
import { Building } from "lucide-react";
import { orderRankField } from "@sanity/orderable-document-list";
import { urlRule, emailRule } from "../shared/validation";

export default defineType({
    name: "organization",
    title: "Organization",
    type: "document",
    icon: Building,
    groups: [
        { name: "content", title: "Details", default: true },
        { name: "contact", title: "Contact & Links" },
        { name: "location", title: "Location" },
    ],
    fields: [
        defineField({
            name: "name",
            title: "Name",
            type: "string",
            group: "content",
            description: "The organisation's full name.",
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: "slug",
            title: "Slug",
            type: "slug",
            group: "content",
            description: "Auto-generated from the name; used in the page URL.",
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
            group: "content",
            description: "Organization acronym (e.g., WHO, UN)",
        }),
        defineField({
            name: "type",
            title: "Type",
            type: "string",
            group: "content",
            description: "The kind of institution — used to group organisations.",
            options: {
                list: [
                    { title: "NGO", value: "ngo" },
                    { title: "Research Institution", value: "research" },
                    { title: "University", value: "university" },
                    { title: "Government Agency", value: "government" },
                    { title: "International Organization", value: "international" },
                    { title: "Private Company", value: "company" },
                    { title: "Community Organization", value: "community" },
                    { title: "Foundation", value: "foundation" },
                    { title: "Other", value: "other" },
                ],
            },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: "description",
            title: "Description",
            type: "object",
            group: "content",
            description: "A short description, in each language.",
            fields: [
                { name: "en", title: "English", type: "text", rows: 3 },
                { name: "es", title: "Español", type: "text", rows: 3 },
                { name: "fr", title: "Français", type: "text", rows: 3 },
                { name: "ar", title: "العربية", type: "text", rows: 3 },
            ],
        }),
        defineField({
            name: "logo",
            title: "Logo",
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
            name: "website",
            title: "Website",
            type: "url",
            group: "contact",
            validation: (Rule) => urlRule(Rule),
        }),
        defineField({
            name: "email",
            title: "Contact Email",
            type: "email",
            group: "contact",
            validation: (Rule) => emailRule(Rule),
        }),
        defineField({
            name: "headquarters",
            title: "Headquarters Location",
            type: "geopoint",
            group: "location",
        }),
        defineField({
            name: "place",
            title: "Place",
            type: "place",
            group: "location",
        }),
        defineField({
            name: "offices",
            title: "Office Locations",
            type: "array",
            group: "location",
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
                            title: "Office Name",
                            type: "string",
                        },
                        {
                            name: "address",
                            title: "Address",
                            type: "text",
                            rows: 2,
                        },
                        {
                            name: "isPrimary",
                            title: "Is Primary Office",
                            type: "boolean",
                            initialValue: false,
                        },
                    ],
                    preview: {
                        select: {
                            title: "name",
                            subtitle: "address",
                            isPrimary: "isPrimary",
                        },
                        prepare({ title, subtitle, isPrimary }) {
                            return {
                                title: `${isPrimary ? "🏢 " : ""}${title || "Office"}`,
                                subtitle,
                            };
                        },
                    },
                },
            ],
        }),
        defineField({
            name: "locationDetails",
            title: "Location Details",
            type: "object",
            group: "location",
            fields: [
                {
                    name: "country",
                    title: "Country",
                    type: "string",
                },
                {
                    name: "city",
                    title: "City",
                    type: "string",
                },
                {
                    name: "region",
                    title: "Region",
                    type: "string",
                },
            ],
        }),
        defineField({
            name: "regionalCommunity",
            title: "Regional Community",
            type: "reference",
            group: "content",
            to: [{ type: "regionalCommunity" }],
            description: "Which regional community does this organization belong to?",
        }),
        defineField({
            name: "socialMedia",
            title: "Social Media",
            type: "object",
            group: "contact",
            fields: [
                {
                    name: "twitter",
                    title: "Twitter/X",
                    type: "url",
                    validation: (Rule) => urlRule(Rule),
                },
                {
                    name: "linkedin",
                    title: "LinkedIn",
                    type: "url",
                    validation: (Rule) => urlRule(Rule),
                },
                {
                    name: "facebook",
                    title: "Facebook",
                    type: "url",
                    validation: (Rule) => urlRule(Rule),
                },
                {
                    name: "instagram",
                    title: "Instagram",
                    type: "url",
                    validation: (Rule) => urlRule(Rule),
                },
            ],
        }),
        defineField({
            name: "tags",
            title: "Tags",
            type: "array",
            group: "content",
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
        defineField({
            name: "verified",
            title: "Verified Organization",
            type: "boolean",
            group: "content",
            initialValue: false,
            description: "Has this organization been verified by the platform?",
        }),
        orderRankField({ type: "organization" }),
    ],
    preview: {
        select: {
            title: "name",
            subtitle: "type",
            media: "logo",
            acronym: "acronym",
            verified: "verified",
        },
        prepare({ title, subtitle, media, acronym, verified }) {
            const displayTitle = acronym ? `${acronym} - ${title}` : title;
            return {
                title: `${verified ? "✓ " : ""}${displayTitle || "Untitled Organization"}`,
                subtitle: subtitle ? subtitle.charAt(0).toUpperCase() + subtitle.slice(1) : "",
                media,
            };
        },
    },
});
