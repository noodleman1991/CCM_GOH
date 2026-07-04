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
                    { title: "Grouped bars", value: "groupedBar" },
                    { title: "Stacked bars", value: "stackedBar" },
                    { title: "Line", value: "line" },
                    { title: "Area", value: "area" },
                    { title: "Pie", value: "pie" },
                    { title: "Donut", value: "donut" },
                    { title: "Region map", value: "regionMap" },
                ],
                layout: "radio",
            },
            initialValue: "bar",
            validation: (Rule) => Rule.required(),
        },
        { name: "title", title: "Title", type: "string" },
        { name: "unit", title: "Unit", type: "string", description: "e.g. %, households, °C — shown under the title." },
        {
            // Legacy single-series rows (E8). Kept for existing docs; new
            // charts write `labels` + `series` below. Renderers read both.
            name: "data",
            title: "Data rows (single series — legacy)",
            type: "array",
            hidden: ({ parent }: { parent?: { series?: unknown[] } }) => (parent?.series?.length ?? 0) > 0,
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
        },
        {
            name: "labels",
            title: "Category labels",
            type: "array",
            of: [{ type: "string" }],
            description: "One label per data point (x-axis categories, region codes for the map).",
        },
        {
            name: "series",
            title: "Series",
            type: "array",
            of: [
                {
                    type: "object",
                    name: "storyChartSeries",
                    title: "Series",
                    fields: [
                        { name: "name", title: "Name", type: "string" },
                        { name: "values", title: "Values", type: "array", of: [{ type: "number" }] },
                        {
                            name: "highlight",
                            title: "Highlight (the story series)",
                            type: "boolean",
                            initialValue: false,
                            description: "Renders in amber with a direct end-label; everything else recedes to calm blues.",
                        },
                    ],
                    preview: {
                        select: { title: "name", highlight: "highlight" },
                        prepare({ title, highlight }: { title?: string; highlight?: boolean }) {
                            return { title: title ?? "Series", subtitle: highlight ? "★ highlighted" : undefined };
                        },
                    },
                },
            ],
        },
        {
            name: "annotations",
            title: "Annotations",
            type: "array",
            of: [
                {
                    type: "object",
                    name: "storyChartAnnotation",
                    title: "Annotation",
                    fields: [
                        {
                            name: "atLabel",
                            title: "At category",
                            type: "string",
                            description: "The label (x position) this note is pinned to.",
                        },
                        { name: "text", title: "Note", type: "string", validation: (Rule) => Rule.max(80) },
                    ],
                    preview: { select: { title: "text", subtitle: "atLabel" } },
                },
            ],
        },
        {
            name: "threshold",
            title: "Threshold line",
            type: "object",
            fields: [
                { name: "value", title: "Value", type: "number" },
                { name: "label", title: "Label", type: "string", description: "e.g. Programme target" },
            ],
        },
        { name: "caption", title: "Caption", type: "text", rows: 2 },
        { name: "source", title: "Source", type: "string", description: "Where the data comes from — rendered under the chart." },
        { name: "sourceUrl", title: "Source link", type: "url" },
        { name: "alt", title: "Alt text", type: "text", rows: 2, description: "What the chart shows, for screen readers." },
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
