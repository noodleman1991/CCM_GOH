import { defineField, defineType } from "sanity";
import { Calendar } from "lucide-react";

export default defineType({
    name: "grid-agenda",
    type: "object",
    icon: Calendar,
    fields: [
        defineField({
            name: "agenda",
            type: "reference",
            title: "Agenda",
            description: "Select an agenda to display in the grid.",
            to: [{ type: "agenda" }],
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: "showTags",
            title: "Show Tags",
            type: "boolean",
            initialValue: true,
            description: "Display agenda tags on the card",
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
            description: "Display agenda type, year, and other metadata",
        }),
    ],
    preview: {
        select: {
            title: "agenda.title.en",
            subtitle: "agenda.agendaType",
            media: "agenda.coverImage",
            year: "agenda.year",
        },
        prepare({ title, subtitle, media, year }) {
            return {
                title: "Agenda Card",
                subtitle: `${title || "No title"} (${year || "No year"}) - ${subtitle || "Unknown type"}`,
                media,
            };
        },
    },
});