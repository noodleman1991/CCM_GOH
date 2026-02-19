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
            type: "string",
            options: {
                list: [
                    { title: "Blue", value: "#3b82f6" },
                    { title: "Green", value: "#10b981" },
                    { title: "Red", value: "#ef4444" },
                    { title: "Yellow", value: "#f59e0b" },
                    { title: "Purple", value: "#8b5cf6" },
                    { title: "Pink", value: "#ec4899" },
                    { title: "Indigo", value: "#6366f1" },
                    { title: "Gray", value: "#6b7280" },
                    { title: "Orange", value: "#f97316" },
                    { title: "Teal", value: "#14b8a6" },
                ],
                layout: "radio",
            },
            initialValue: "#3b82f6",
        }),
        orderRankField({ type: "tag" }),
    ],
    preview: {
        select: {
            title: "label.en",
            subtitle: "category",
            value: "value.current",
            color: "color",
        },
        prepare({ title, subtitle, value, color }: {
            title?: string;
            subtitle?: string;
            value?: string;
            color?: string;
        }) {
            const colorNames: Record<string, string> = {
                "#3b82f6": "Blue",
                "#10b981": "Green",
                "#ef4444": "Red",
                "#f59e0b": "Yellow",
                "#8b5cf6": "Purple",
                "#ec4899": "Pink",
                "#6366f1": "Indigo",
                "#6b7280": "Gray",
                "#f97316": "Orange",
                "#14b8a6": "Teal",
            };

            return {
                title: `${title || "Untitled Tag"}`,
                subtitle: `${colorNames[color || "#3b82f6"] || "Blue"} | ${subtitle || "topic"} | ${value || "no-slug"}`,
                media: Tag,
            };
        },
    },
});
