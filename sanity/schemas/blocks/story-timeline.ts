import { defineType } from "sanity";
import { Milestone } from "lucide-react";

/**
 * "Data & story" timeline block (Task E8) — authored in the app's slash-menu
 * editor, rendered natively as HTML (timeline-1's rail-and-dots visual
 * vocabulary) by components/portable-text-renderer.tsx. No server render
 * step needed, unlike storyChart/storyMermaid.
 */
export default defineType({
    name: "storyTimeline",
    title: "Timeline",
    type: "object",
    icon: Milestone,
    fields: [
        {
            name: "items",
            title: "Timeline items",
            type: "array",
            of: [
                {
                    type: "object",
                    name: "storyTimelineItem",
                    title: "Timeline item",
                    fields: [
                        { name: "date", title: "Date", type: "string", description: "Free-form: a year, a month, or a full date." },
                        { name: "title", title: "Title", type: "string" },
                        { name: "text", title: "Text", type: "text", rows: 3 },
                    ],
                    preview: {
                        select: { title: "title", subtitle: "date" },
                    },
                },
            ],
            validation: (Rule) => Rule.min(1),
        },
    ],
    preview: {
        select: { items: "items" },
        prepare({ items }: { items?: Array<{ title?: string }> }) {
            return {
                title: "Timeline",
                subtitle: `${items?.length ?? 0} items — ${items?.[0]?.title ?? ""}`,
            };
        },
    },
});
