import { defineField, defineType } from "sanity";
import { Building } from "lucide-react";
import { orderRankField } from "@sanity/orderable-document-list";

export default defineType({
    name: "organization",
    title: "Organization",
    type: "document",
    icon: Building,
    fields: [
        defineField({
            name: "name",
            title: "Name",
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
            description: "Organization acronym (e.g., WHO, UN)",
        }),
        defineField({
            name: "type",
            title: "Type",
            type: "string",
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
        }),
        defineField({
            name: "email",
            title: "Contact Email",
            type: "email",
        }),
        defineField({
            name: "headquarters",
            title: "Headquarters Location",
            type: "geopoint",
        }),
        defineField({
            name: "offices",
            title: "Office Locations",
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
            name: "socialMedia",
            title: "Social Media",
            type: "object",
            fields: [
                {
                    name: "twitter",
                    title: "Twitter/X",
                    type: "url",
                },
                {
                    name: "linkedin",
                    title: "LinkedIn",
                    type: "url",
                },
                {
                    name: "facebook",
                    title: "Facebook",
                    type: "url",
                },
                {
                    name: "instagram",
                    title: "Instagram",
                    type: "url",
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
            description: "Areas of focus or expertise",
        }),
        defineField({
            name: "verified",
            title: "Verified Organization",
            type: "boolean",
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
