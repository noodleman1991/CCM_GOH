import { defineField, defineType } from "sanity";
import { FileSearch } from "lucide-react";

const supportedLanguages = [
    { id: "en", title: "English", flag: "🇺🇸", isDefault: true },
    { id: "es", title: "Español", flag: "🇪🇸" },
    { id: "fr", title: "Français", flag: "🇫🇷" },
    { id: "ar", title: "العربية", flag: "🇸🇦", isRTL: true },
];

const statusOptions = [
    { title: "📝 Pending Review", value: "pending" },
    { title: "❌ Rejected", value: "rejected" },
    { title: "📋 Needs Revision", value: "revision" },
    { title: "✅ Approved (Published)", value: "approved" },
];

export default defineType({
    name: "grid-case-study",
    title: "Case Study Card",
    type: "object",
    icon: FileSearch,
    fields: [
        defineField({
            name: "caseStudy",
            type: "reference",
            title: "Case Study",
            description: "Select a case study to display in the grid.",
            to: [{ type: "caseStudy" }],
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: "showTags",
            title: "Show Tags",
            type: "boolean",
            initialValue: true,
            description: "Display case study tags on the card",
        }),
        defineField({
            name: "showAuthors",
            title: "Show Authors",
            type: "boolean",
            initialValue: true,
            description: "Display case study authors on the card",
        }),
        defineField({
            name: "showMetadata",
            title: "Show Metadata",
            type: "boolean",
            initialValue: true,
            description: "Display publication date, location, and other metadata",
        }),
        defineField({
            name: "showStudyPeriod",
            title: "Show Study Period",
            type: "boolean",
            initialValue: false,
            description: "Display the study period dates on the card",
        }),
        defineField({
            name: "showLocation",
            title: "Show Location",
            type: "boolean",
            initialValue: false,
            description: "Display the primary study location on the card",
        }),
        defineField({
            name: "customExcerpt",
            title: "Custom Excerpt",
            type: "object",
            description: "Optional custom excerpt to override the case study's excerpt in this grid",
            fields: supportedLanguages.map(lang => ({
                name: lang.id,
                title: `Custom Excerpt (${lang.title})`,
                type: "text",
                rows: 2,
                validation: (Rule: any) => Rule.max(200),
            })),
        }),
        defineField({
            name: "customLayout",
            title: "Card Layout",
            type: "string",
            options: {
                list: [
                    { title: "Default", value: "default" },
                    { title: "Compact", value: "compact" },
                    { title: "Featured", value: "featured" },
                    { title: "Minimal", value: "minimal" },
                ],
            },
            initialValue: "default",
            description: "Choose how this case study card should be displayed",
        }),
        defineField({
            name: "priority",
            title: "Display Priority",
            type: "number",
            description: "Higher numbers appear first in the grid (optional)",
            validation: (Rule) => Rule.min(0).max(100),
        }),
    ],
    preview: {
        select: {
            title: "caseStudy.title",
            language: "caseStudy.language",
            status: "caseStudy.status",
            media: "caseStudy.image",
            customExcerpt: "customExcerpt",
            layout: "customLayout",
            priority: "priority",
            featured: "caseStudy.featured",
            authors: "caseStudy.authors",
        },
        prepare({
                    title,
                    language,
                    status,
                    media,
                    customExcerpt,
                    layout,
                    priority,
                    featured,
                    authors
                }: {
            title?: Record<string, string>;
            language?: string;
            status?: string;
            media?: any;
            customExcerpt?: Record<string, string>;
            layout?: string;
            priority?: number;
            featured?: boolean;
            authors?: Array<{ name: string; role: string }>;
        }) {
            // Get the appropriate language configuration
            const lang = language || "en";
            const langConfig = supportedLanguages.find(l => l.id === lang);

            // Get localized title
            const localizedTitle = title?.[lang] || title?.en || "Untitled Case Study";

            // Status indicators matching your main schema
            const statusEmojis: Record<string, string> = {
                pending: "📝",
                approved: "✅",
                rejected: "❌",
                revision: "📋",
            };

            // Layout indicators
            const layoutEmojis: Record<string, string> = {
                default: "",
                compact: "📦",
                featured: "⭐",
                minimal: "📄",
            };

            // Build subtitle with all relevant info
            const parts: string[] = [];

            // Language flag
            parts.push(langConfig?.flag || "🌐");

            // Status
            const statusEmoji = statusEmojis[status || "pending"] || "📝";
            parts.push(`${statusEmoji} ${status || "pending"}`);

            // Layout if not default
            if (layout && layout !== "default") {
                const layoutEmoji = layoutEmojis[layout] || "";
                parts.push(`${layoutEmoji} ${layout}`);
            }

            // Priority if set
            if (priority !== undefined && priority > 0) {
                parts.push(`🔢 ${priority}`);
            }

            // Featured indicator
            if (featured) {
                parts.push("🌟 Featured");
            }

            // Custom excerpt indicator
            const hasCustomExcerpt = customExcerpt && Object.values(customExcerpt).some(excerpt => excerpt);
            if (hasCustomExcerpt) {
                parts.push("✏️ Custom");
            }

            // Authors count
            if (authors && authors.length > 0) {
                const leadAuthor = authors.find(a => a.role === "lead");
                if (leadAuthor) {
                    parts.push(`👑 ${leadAuthor.name}`);
                } else {
                    parts.push(`👥 ${authors.length} author${authors.length > 1 ? 's' : ''}`);
                }
            }

            return {
                title: `Case Study: ${localizedTitle}`,
                subtitle: parts.join(" | "),
                media,
            };
        },
    },
});
