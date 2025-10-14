import { defineType } from "sanity";
import { Info } from "lucide-react";

export default defineType({
    name: "infoBox",
    title: "Info Box",
    type: "object",
    icon: Info,
    fields: [
        {
            name: "variant",
            title: "Box Type",
            type: "string",
            options: {
                list: [
                    { title: "Info", value: "info" },
                    { title: "Warning", value: "warning" },
                    { title: "Success", value: "success" },
                ],
            },
            initialValue: "info",
            validation: (Rule) => Rule.required(),
        },
        {
            name: "content",
            title: "Content",
            type: "array",
            of: [
                {
                    type: "block",
                    styles: [{ title: "Normal", value: "normal" }],
                    lists: [],
                    marks: {
                        decorators: [
                            { title: "Strong", value: "strong" },
                            { title: "Emphasis", value: "em" },
                        ],
                        annotations: [
                            {
                                title: "URL",
                                name: "link",
                                type: "object",
                                fields: [
                                    {
                                        title: "URL",
                                        name: "href",
                                        type: "url",
                                        validation: (Rule) =>
                                            Rule.uri({
                                                allowRelative: true,
                                                scheme: ["http", "https", "mailto", "tel"],
                                            }),
                                    },
                                ],
                            },
                        ],
                    },
                },
            ],
            validation: (Rule) => Rule.required(),
        },
    ],
    preview: {
        select: {
            variant: "variant",
            content: "content",
        },
        prepare({ variant, content }: { variant?: string; content?: any[] }) {
            const icons = {
                info: "ℹ️",
                warning: "⚠️",
                success: "✅",
            };

            const variantLabels = {
                info: "Info Box",
                warning: "Warning Box",
                success: "Success Box",
            };

            // Extract first text block for preview
            const firstBlock = content?.[0];
            const previewText = firstBlock?.children?.[0]?.text || "Empty box";

            return {
                title: variantLabels[variant as keyof typeof variantLabels] || "Info Box",
                subtitle: previewText.substring(0, 60) + (previewText.length > 60 ? "..." : ""),
                media: icons[variant as keyof typeof icons] || "ℹ️",
            };
        },
    },
});
