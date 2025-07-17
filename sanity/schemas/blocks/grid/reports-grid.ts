import { defineField, defineType } from "sanity";
import { FileDown } from "lucide-react";

export default defineType({
    name: "reports-grid",
    type: "object",
    title: "Reports Grid",
    icon: FileDown,
    fields: [
        defineField({
            name: "padding",
            type: "section-padding",
        }),
        defineField({
            name: "colorVariant",
            type: "color-variant",
            title: "Color Variant",
            description: "Select a background color variant",
        }),
        defineField({
            name: "title",
            title: "Section Title",
            type: "object",
            fields: [
                { name: "en", title: "English", type: "string" },
                { name: "es", title: "Español", type: "string" },
                { name: "fr", title: "Français", type: "string" },
                { name: "ar", title: "العربية", type: "string" },
            ],
        }),
        defineField({
            name: "description",
            title: "Section Description",
            type: "object",
            fields: [
                { name: "en", title: "English", type: "text", rows: 2 },
                { name: "es", title: "Español", type: "text", rows: 2 },
                { name: "fr", title: "Français", type: "text", rows: 2 },
                { name: "ar", title: "العربية", type: "text", rows: 2 },
            ],
        }),
        defineField({
            name: "displayType",
            title: "Display Type",
            type: "string",
            options: {
                list: [
                    { title: "Manual Selection", value: "manual" },
                    { title: "Latest Reports", value: "latest" },
                    { title: "Featured Reports", value: "featured" },
                    { title: "By Type", value: "type" },
                    { title: "By Tag", value: "tag" },
                ],
            },
            initialValue: "manual",
        }),
        defineField({
            name: "reports",
            title: "Reports",
            type: "array",
            of: [
                {
                    type: "reference",
                    to: [{ type: "report" }],
                },
            ],
            hidden: ({ parent }) => parent?.displayType !== "manual",
            validation: (Rule) => Rule.max(6),
        }),
        defineField({
            name: "reportType",
            title: "Report Type Filter",
            type: "string",
            options: {
                list: [
                    { title: "Annual Report", value: "annual" },
                    { title: "Research Report", value: "research" },
                    { title: "Policy Brief", value: "policy" },
                    { title: "Technical Report", value: "technical" },
                    { title: "Case Study Report", value: "case-study" },
                    { title: "White Paper", value: "whitepaper" },
                    { title: "Guidelines", value: "guidelines" },
                ],
            },
            hidden: ({ parent }) => parent?.displayType !== "type",
        }),
        defineField({
            name: "tagFilter",
            title: "Tag Filter",
            type: "reference",
            to: [{ type: "tag" }],
            hidden: ({ parent }) => parent?.displayType !== "tag",
        }),
        defineField({
            name: "limit",
            title: "Number of Reports",
            type: "number",
            validation: (Rule) => Rule.min(1).max(6),
            initialValue: 6,
            hidden: ({ parent }) => parent?.displayType === "manual",
        }),
        defineField({
            name: "columns",
            title: "Grid Columns",
            type: "string",
            options: {
                list: [
                    { title: "2 Columns", value: "2" },
                    { title: "3 Columns", value: "3" },
                ],
            },
            initialValue: "3",
        }),
        defineField({
            name: "showDownloadCount",
            title: "Show Download Count",
            type: "boolean",
            initialValue: true,
        }),
        defineField({
            name: "showYear",
            title: "Show Year",
            type: "boolean",
            initialValue: true,
        }),
        defineField({
            name: "showTags",
            title: "Show Tags",
            type: "boolean",
            initialValue: true,
        }),
    ],
    preview: {
        select: {
            title: "title.en",
            displayType: "displayType",
            reportsCount: "reports.length",
            reportType: "reportType",
        },
        prepare({
                    title,
                    displayType,
                    reportsCount,
                    reportType,
                }: {
            title?: string;
            displayType: "manual" | "latest" | "featured" | "type" | "tag";
            reportsCount?: number;
            reportType?: string;
        }) {
            const typeLabels = {
                manual: "Manual Selection",
                latest: "Latest Reports",
                featured: "Featured Reports",
                type: `By Type: ${reportType || "All"}`,
                tag: "By Tag",
            };

            return {
                title: title || "Reports Grid",
                subtitle: `${typeLabels[displayType]} ${
                    displayType === "manual" ? `(${reportsCount || 0} reports)` : ""
                }`,
            };
        }
    },
});
