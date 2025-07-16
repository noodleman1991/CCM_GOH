import { defineField, defineType } from "sanity";
import { Tag } from "lucide-react";
import { orderRankField } from "@sanity/orderable-document-list";

export default defineType({
    name: "tag",
    title: "Tag",
    type: "document",
    icon: Tag,
    fields: [
        defineField({
            name: "label",
            title: "Label",
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
            name: "value",
            title: "Value (Slug)",
            type: "slug",
            options: {
                source: "label.en",
                maxLength: 96,
            },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: "description",
            title: "Description",
            type: "object",
            fields: [
                { name: "en", title: "English", type: "text", rows: 2 },
                { name: "es", title: "Español", type: "text", rows: 2 },
                { name: "fr", title: "Français", type: "text", rows: 2 },
                { name: "ar", title: "العربية", type: "text", rows: 2 },
            ],
        }),
        defineField({
            name: "category",
            title: "Tag Category",
            type: "string",
            options: {
                list: [
                    { title: "Topic", value: "topic" },
                    { title: "Location", value: "location" },
                    { title: "Method", value: "method" },
                    { title: "Audience", value: "audience" },
                    { title: "Impact", value: "impact" },
                    { title: "Other", value: "other" },
                ],
            },
            initialValue: "topic",
        }),
        defineField({
            name: "color",
            title: "Color",
            type: "color",
            options: {
                disableAlpha: true,
            },
        }),
        orderRankField({ type: "tag" }),
    ],
    preview: {
        select: {
            title: "label.en",
            subtitle: "category",
            value: "value.current",
        },
        prepare({ title, subtitle, value }) {
            return {
                title: title || "Untitled Tag",
                subtitle: `${subtitle || "topic"} | ${value || "no-slug"}`,
            };
        },
    },
});
