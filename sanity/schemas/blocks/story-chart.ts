import { defineType } from "sanity";
import { ChartColumn } from "lucide-react";

/**
 * "Data & story" chart block (Task E8) — bar/line/pie data authored in the
 * app's slash-menu editor. `renderedSvg` is produced server-side by
 * POST /api/story-blocks/render (lib/story-blocks/chart-svg.ts) and
 * sanitized before storage; the public renderer only shows blocks with
 * renderStatus == "ok" (withheld-from-publish on render failure).
 */
export default defineType({
    name: "storyChart",
    title: "Chart",
    type: "object",
    icon: ChartColumn,
    fields: [
        {
            name: "chartType",
            title: "Chart type",
            type: "string",
            options: {
                list: [
                    { title: "Bar", value: "bar" },
                    { title: "Line", value: "line" },
                    { title: "Pie", value: "pie" },
                ],
                layout: "radio",
            },
            initialValue: "bar",
            validation: (Rule) => Rule.required(),
        },
        { name: "title", title: "Title", type: "string" },
        {
            name: "data",
            title: "Data rows",
            type: "array",
            of: [
                {
                    type: "object",
                    name: "storyChartRow",
                    title: "Row",
                    fields: [
                        { name: "label", title: "Label", type: "string" },
                        { name: "value", title: "Value", type: "number" },
                    ],
                    preview: {
                        select: { title: "label", subtitle: "value" },
                        prepare({ title, subtitle }: { title?: string; subtitle?: number }) {
                            return { title: title ?? "", subtitle: String(subtitle ?? "") };
                        },
                    },
                },
            ],
            validation: (Rule) => Rule.min(1),
        },
        {
            name: "renderedSvg",
            title: "Rendered SVG (server-populated)",
            type: "text",
            readOnly: true,
            description: "Sanitized SVG produced by the render API at save time. Do not edit.",
        },
        {
            name: "renderStatus",
            title: "Render status",
            type: "string",
            options: { list: ["ok", "failed"] },
            readOnly: true,
            description: 'Blocks whose status is not "ok" are withheld from the public page.',
        },
    ],
    preview: {
        select: { title: "title", chartType: "chartType", data: "data" },
        prepare({ title, chartType, data }: { title?: string; chartType?: string; data?: unknown[] }) {
            return {
                title: title || "Chart",
                subtitle: `${chartType ?? "bar"} — ${data?.length ?? 0} rows`,
            };
        },
    },
});
