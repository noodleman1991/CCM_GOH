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
            description:
                "Pick an on-brand colour. All options read clearly on a white card. (Older tags using other colours are automatically mapped to the closest brand colour when displayed.)",
            options: {
                list: [
                    { title: "Sea (primary)", value: "#205596" },
                    { title: "Water", value: "#2F6FA8" },
                    { title: "Midnight", value: "#0B3160" },
                    { title: "Teal", value: "#0F7368" },
                    { title: "Plum", value: "#6B3FA0" },
                    { title: "Clay", value: "#A1542B" },
                ],
                layout: "radio",
            },
            initialValue: "#205596",
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
