 import { defineField, defineType } from "sanity";
import { Globe } from "lucide-react";
import { orderRankField } from "@sanity/orderable-document-list";

export default defineType({
    name: "regionalCommunity",
    title: "Community",
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
            name: "members",
            title: "Authors/Members",
            type: "array",
            of: [
                {
                    type: "object",
                    fields: [
                        {
                            name: "person",
                            title: "Person",
                            type: "reference",
                            to: [{ type: "author" }],
                            validation: (Rule) => Rule.required(),
                        },
                        {
                            name: "role",
                            title: "Role in Community",
                            type: "string",
                            description: "Their role or position within this community",
                        },
                    ],
                    preview: {
                        select: {
                            title: "person.name",
                            subtitle: "role",
                            media: "person.image",
                        },
                        prepare({ title, subtitle, media }) {
                            return {
                                title: title || "Untitled Person",
                                subtitle: subtitle || "No role specified",
                                media,
                            };
                        },
                    },
                },
            ],
            description: "Members and authors associated with this community",
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
            name: "featured",
            title: "Featured Community",
            type: "boolean",
            initialValue: false,
        }),
        defineField({
            name: "active",
            title: "Active",
            type: "boolean",
            initialValue: true,
            description: "Is this community currently active?",
        }),
        orderRankField({ type: "regionalCommunity" }),
    ],
    preview: {
        select: {
            title: "name.en",
            media: "coverImage",
            active: "active",
            featured: "featured",
        },
        prepare({ title, media, active, featured }) {
            return {
                title: `${featured ? "FEATURED " : ""}${title || "Untitled Community"}`,
                subtitle: `${active ? "Active" : "Inactive"}`,
                media,
            };
        },
    },
});
