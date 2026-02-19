import { defineType } from "sanity";
import { Minus } from "lucide-react";

export default defineType({
    name: "break",
    title: "Break",
    type: "object",
    icon: Minus,
    fields: [
        {
            name: "style",
            title: "Break Type",
            type: "string",
            options: {
                list: [
                    { title: "Horizontal Rule", value: "hr" },
                    { title: "Read More", value: "readMore" },
                    { title: "Section Break", value: "section" },
                    { title: "Chapter Break", value: "chapter" },
                ],
            },
            initialValue: "hr",
            validation: (Rule) => Rule.required(),
        },
    ],
    preview: {
        select: {
            style: "style",
        },
        prepare({ style }: { style?: string }) {
            const styleLabels = {
                hr: "Horizontal Rule",
                readMore: "Read More",
                section: "Section Break",
                chapter: "Chapter Break",
            };

            const icons = {
                hr: "—",
                readMore: "···",
                section: "§",
                chapter: "※",
            };

            return {
                title: styleLabels[style as keyof typeof styleLabels] || "Break",
                subtitle: icons[style as keyof typeof icons] || "—",
            };
        },
    },
});
