// import { defineField, defineType } from "sanity";
// import { FileText } from "lucide-react";
//
// export default defineType({
//     name: "grid-case-study",
//     type: "object",
//     icon: FileText,
//     fields: [
//         defineField({
//             name: "caseStudy",
//             type: "reference",
//             title: "Case Study",
//             description: "Select a case study to display in the grid.",
//             to: [{ type: "caseStudy" }],
//             validation: (Rule) => Rule.required(),
//         }),
//         defineField({
//             name: "showTags",
//             title: "Show Tags",
//             type: "boolean",
//             initialValue: true,
//             description: "Display case study tags on the card",
//         }),
//         defineField({
//             name: "showAuthors",
//             title: "Show Authors",
//             type: "boolean",
//             initialValue: true,
//             description: "Display case study authors on the card",
//         }),
//         defineField({
//             name: "showMetadata",
//             title: "Show Metadata",
//             type: "boolean",
//             initialValue: true,
//             description: "Display publication date, location, and other metadata",
//         }),
//     ],
//     preview: {
//         select: {
//             title: "caseStudy.title.en",
//             status: "caseStudy.status",
//             media: "caseStudy.image",
//             language: "caseStudy.language",
//         },
//         prepare({ title, status, media, language }) {
//             return {
//                 title: "Case Study Card",
//                 subtitle: `${title || "No title"} (${language?.toUpperCase() || "EN"}) - ${status || "Unknown status"}`,
//                 media,
//             };
//         },
//     },
// });

import { defineField, defineType } from "sanity";
import { FileSearch } from "lucide-react";

interface LocalizedString {
    en?: string;
    es?: string;
    fr?: string;
    ar?: string;
}

interface GridCaseStudyPreview {
    title?: LocalizedString;
    subtitle?: string; // language
    media?: any;
    status?: "pending" | "reviewing" | "approved" | "rejected" | "revision" | "published";
}

export default defineType({
    name: "grid-case-study",
    title: "Grid Case Study",
    type: "object",
    icon: FileSearch,
    fields: [
        defineField({
            name: "caseStudy",
            title: "Case Study",
            type: "reference",
            to: [{ type: "caseStudy" }],
            validation: (Rule) => Rule.required(),
            description: "Select a case study to display in the grid",
        }),
        defineField({
            name: "showTags",
            title: "Show Tags",
            type: "boolean",
            initialValue: true,
            description: "Display case study tags",
        }),
        defineField({
            name: "showAuthors",
            title: "Show Authors",
            type: "boolean",
            initialValue: true,
            description: "Display case study authors",
        }),
        defineField({
            name: "showMetadata",
            title: "Show Metadata",
            type: "boolean",
            initialValue: true,
            description: "Display publication date, location, and other metadata",
        }),
        defineField({
            name: "customExcerpt",
            title: "Custom Excerpt",
            type: "text",
            rows: 2,
            description: "Optional custom excerpt to override the case study's excerpt in this grid",
            validation: (Rule) => Rule.max(200),
        }),
    ],
    preview: {
        select: {
            title: "caseStudy.title",
            subtitle: "caseStudy.language",
            media: "caseStudy.image",
            status: "caseStudy.status",
        },
        prepare(value: Record<string, any>) {
            const { title, subtitle, media, status } = value as GridCaseStudyPreview;

            // Handle localized title - try to get title in document language first, then fallback
            const language = subtitle || "en";
            const localizedTitle = title as LocalizedString;
            const displayTitle = localizedTitle?.[language as keyof LocalizedString] ||
                localizedTitle?.en ||
                localizedTitle?.es ||
                localizedTitle?.fr ||
                localizedTitle?.ar ||
                'Untitled Case Study';

            const statusEmoji: Record<string, string> = {
                pending: "⏳",
                reviewing: "👀",
                approved: "✅",
                rejected: "❌",
                revision: "📝",
                published: "🚀",
            };

            const languageFlags: Record<string, string> = {
                en: "🇺🇸",
                es: "🇪🇸",
                fr: "🇫🇷",
                ar: "🇸🇦",
            };

            const flag = languageFlags[language] || "🌐";
            const emoji = statusEmoji[status as string] || "";

            return {
                title: displayTitle,
                subtitle: `Case Study ${flag} ${emoji}`,
                media,
            };
        },
    },
});
