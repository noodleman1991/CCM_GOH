import { defineField, defineType } from "sanity";
import { FileDown } from "lucide-react";

export default defineType({
    name: "grid-report",
    type: "object",
    icon: FileDown,
    fields: [
        defineField({
            name: "report",
            type: "reference",
            title: "Report",
            description: "Select a report to display in the grid.",
            to: [{ type: "report" }],
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: "showTags",
            title: "Show Tags",
            type: "boolean",
            initialValue: true,
            description: "Display report tags on the card",
        }),
        defineField({
            name: "showDownloadButtons",
            title: "Show Download Buttons",
            type: "boolean",
            initialValue: true,
            description: "Display download buttons for each language",
        }),
        defineField({
            name: "showMetadata",
            title: "Show Metadata",
            type: "boolean",
            initialValue: true,
            description: "Display report type, year, and other metadata",
        }),
    ],
    preview: {
        select: {
            title: "report.title.en",
            subtitle: "report.reportType",
            media: "report.coverImage",
            year: "report.year",
        },
        prepare({ title, subtitle, media, year }) {
            return {
                title: "Report Card",
                subtitle: `${title || "No title"} (${year || "No year"}) - ${subtitle || "Unknown type"}`,
                media,
            };
        },
    },
});
