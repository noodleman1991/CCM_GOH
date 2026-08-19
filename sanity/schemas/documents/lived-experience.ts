import { defineField, defineType, type SanityDocument } from "sanity";
import { Video } from "lucide-react";
import { isUniqueOtherThanLanguage } from '@/sanity/lib/isUniqueOtherThanLanguage';
import { REGION_OPTIONS, THEME_OPTIONS, POPULATION_OPTIONS } from "../shared/taxonomy-options";

export default defineType({
    name: "livedExperience",
    title: "Lived Experience",
    type: "document",
    icon: Video,
    groups: [
        {
            name: "content",
            title: "Content",
        },
        {
            name: "video",
            title: "Video",
        },
        {
            name: "metadata",
            title: "Metadata",
        },
        {
            name: "affiliations",
            title: "Affiliations",
        },
        {
            name: "review",
            title: "Review & Publishing",
        },
        {
            name: "seo",
            title: "SEO",
        },
        {
            name: "settings",
            title: "Settings",
        },
    ],
    fields: [
        // Document language for i18n
        defineField({
            name: "language",
            type: "string",
            readOnly: true,
            hidden: true,
            group: "settings",
        }),
        
        // Medium of the testimony (redesign §4.15). Additive: defaults to "video"
        // so existing docs stay video. Audio/written rendering builds on this.
        defineField({
            name: "format",
            title: "Format",
            type: "string",
            group: "content",
            options: {
                list: [
                    { title: "Video", value: "video" },
                    { title: "Audio", value: "audio" },
                    { title: "Written", value: "written" },
                ],
                layout: "radio",
            },
            initialValue: "video",
            description: "The medium of this lived experience — drives how it's presented.",
        }),

        // Title (required in document's language)
        defineField({
            name: "title",
            title: "Title",
            type: "object",
            group: "content",
            fields: [
                { name: "en", title: "English", type: "string" },
                { name: "es", title: "Español", type: "string" },
                { name: "fr", title: "Français", type: "string" },
                { name: "ar", title: "العربية", type: "string" },
            ],
            validation: (Rule) =>
                Rule.custom((title: unknown, context) => {
                    const language = String(context?.document?.language || "en");
                    const localizedTitle = title as Record<string, string | undefined>;

                    if (!localizedTitle?.[language]) {
                        return `Title in ${language} is required`;
                    }
                    return true;
                }),
        }),
        
        // Slug for URL
        defineField({
            name: "slug",
            title: "Slug",
            type: "slug",
            group: "settings",
            options: {
                source: (doc: SanityDocument) => {
                    const title = doc.title as Record<string, string> | undefined;
                    const language = (doc.language as string | undefined) || 'en';
                    return title?.[language] || title?.en || '';
                },
                maxLength: 96,
                isUnique: isUniqueOtherThanLanguage,
            },
            validation: (Rule) => Rule.required(),
        }),
        
        // Description
        defineField({
            name: "description",
            title: "Description",
            type: "object",
            group: "content",
            description: "Brief description of the lived experience",
            fields: [
                { name: "en", title: "English", type: "text", rows: 3 },
                { name: "es", title: "Español", type: "text", rows: 3 },
                { name: "fr", title: "Français", type: "text", rows: 3 },
                { name: "ar", title: "العربية", type: "text", rows: 3 },
            ],
        }),

        // The issue / theme this experience speaks to — shown in the modal so
        // viewers understand what the story is about (the person writes this).
        defineField({
            name: "issue",
            title: "The issue / theme",
            type: "object",
            group: "content",
            description: "In a sentence or two: what climate × mental-health issue does this experience speak to?",
            fields: [
                { name: "en", title: "English", type: "text", rows: 2 },
                { name: "es", title: "Español", type: "text", rows: 2 },
                { name: "fr", title: "Français", type: "text", rows: 2 },
                { name: "ar", title: "العربية", type: "text", rows: 2 },
            ],
        }),

        // A little about the person sharing — their own words, shown respectfully
        // in the modal alongside their name/affiliation.
        defineField({
            name: "personContext",
            title: "About the person sharing",
            type: "object",
            group: "content",
            description: "A short, self-written introduction to who is sharing this experience.",
            fields: [
                { name: "en", title: "English", type: "text", rows: 2 },
                { name: "es", title: "Español", type: "text", rows: 2 },
                { name: "fr", title: "Français", type: "text", rows: 2 },
                { name: "ar", title: "العربية", type: "text", rows: 2 },
            ],
        }),

        // The full story as rich text (Task E2 — "more like a blog post"):
        // paragraphs + a few images with captions, shared with case studies /
        // news via the styled-block-content type so the same editor + renderer
        // work here unchanged.
        defineField({
            name: "body",
            title: "Story body",
            type: "styled-block-content",
            group: "content",
            description:
                "Optional long-form story — text and images (with captions), rendered below the video.",
        }),

        // Where the video comes from (Task E2). OPTIONAL: legacy docs carry only
        // a videoLink, and the app derives youtube/vimeo from the URL when this
        // is absent — so existing content keeps working without a migration.
        defineField({
            name: "videoSource",
            title: "Video Source",
            type: "string",
            group: "video",
            options: {
                list: [
                    { title: "YouTube", value: "youtube" },
                    { title: "Vimeo", value: "vimeo" },
                    { title: "Uploaded file", value: "upload" },
                ],
                layout: "radio",
            },
            hidden: ({ parent }) => parent?.format === "written",
            description:
                "Optional. When empty, the source is derived from the media link (YouTube or Vimeo).",
        }),

        // Video/audio URL (external link to the media platform). Required only
        // for video/audio formats without an uploaded file; a written story
        // needs no media link. Accepts YouTube AND Vimeo URLs.
        defineField({
            name: "videoLink",
            title: "Media Link",
            type: "url",
            group: "video",
            description: "Link to the video or audio (YouTube, Vimeo, SoundCloud, etc.)",
            hidden: ({ parent }) => parent?.format === "written",
            validation: (Rule) =>
                Rule.custom((value, context) => {
                    const parent = context.parent as {
                        format?: string;
                        videoSource?: string;
                        videoFile?: { asset?: { _ref?: string } };
                    };
                    const hasFile = Boolean(parent?.videoFile?.asset?._ref);
                    if (
                        parent?.format !== "written" &&
                        parent?.videoSource !== "upload" &&
                        !hasFile &&
                        !value
                    ) {
                        return "A media link is required for video and audio formats (unless a video file is uploaded).";
                    }
                    return true;
                }),
        }),

        // Directly uploaded video (Task E2) — used when videoSource is "upload".
        defineField({
            name: "videoFile",
            title: "Video File",
            type: "file",
            group: "video",
            options: { accept: "video/mp4,video/webm" },
            hidden: ({ parent }) => parent?.format === "written",
            description:
                "Self-hosted video (MP4 or WebM, up to 100MB). Played natively on the site — no third-party embed or cookie consent needed.",
        }),
        
        // Video thumbnail (optional, will fallback to platform thumbnail)
        defineField({
            name: "thumbnail",
            title: "Video Thumbnail",
            type: "image",
            group: "video",
            options: {
                hotspot: true,
            },
            fields: [
                {
                    name: "alt",
                    type: "string",
                    title: "Alternative Text",
                },
            ],
            description: "Optional custom thumbnail. If not provided, will use platform default.",
        }),
        
        // Duration (optional)
        defineField({
            name: "duration",
            title: "Duration",
            type: "string",
            group: "video",
            description: "Video duration (e.g., '5:30', '1:45:00')",
            placeholder: "mm:ss or h:mm:ss",
        }),
        
        // Publication date
        defineField({
            name: "publishedAt",
            title: "Published At",
            type: "datetime",
            group: "metadata",
            initialValue: () => new Date().toISOString(),
        }),
        
        // Author
        defineField({
            name: "author",
            title: "Author",
            type: "reference",
            group: "affiliations",
            to: { type: "author" },
            description: "The author of this lived experience",
            validation: (Rule) => Rule.required(),
        }),

        // Related Community
        defineField({
            name: "relatedCommunity",
            title: "Related Community",
            type: "reference",
            group: "affiliations",
            to: { type: "regionalCommunity" },
            description: "The community this lived experience relates to",
        }),

        // Detail-page layout archetype (WIREFRAMES §4.12). Defaults to "story".
        defineField({
            name: "layout",
            title: "Detail layout",
            type: "string",
            group: "content",
            options: { list: [
                { title: "Story (narrative + photography)", value: "story" },
                { title: "Feature (one bold statement)", value: "feature" },
                { title: "Report (evidence + data; sticky 'At a glance')", value: "report" },
            ] },
            initialValue: "story",
        }),

        // Phase 6 fixed taxonomy (additive; backfilled from relatedCommunity).
        defineField({
            name: "region",
            title: "Region",
            type: "string",
            group: "affiliations",
            options: { list: [...REGION_OPTIONS] },
            description: "Fixed-7 region code (backfilled from the related community).",
        }),
        defineField({
            name: "themes",
            title: "Themes",
            type: "array",
            of: [{ type: "string" }],
            options: { list: [...THEME_OPTIONS] },
            group: "affiliations",
        }),
        defineField({
            name: "populations",
            title: "Populations",
            type: "array",
            of: [{ type: "string" }],
            options: { list: [...POPULATION_OPTIONS] },
            group: "affiliations",
        }),

        // Optional precise location — enables this experience to appear as a pin
        // on the content map (in addition to the region-level choropleth).
        defineField({
            name: "location",
            title: "Location (Map)",
            type: "geopoint",
            group: "metadata",
            description: "Optional. A point on the map for this experience.",
        }),

        // Reusable geotag (spec A2). Defaults to country-level precision — a
        // community-safety default for user-submitted lived experiences, so a
        // specific address is never shown on the map unless an editor opts in.
        defineField({
            name: "place",
            title: "Place",
            type: "place",
            group: "metadata",
            initialValue: { precision: "country" },
        }),

        // Related Organizations
        defineField({
            name: "organizations",
            title: "Organizations",
            type: "array",
            group: "affiliations",
            of: [
                {
                    type: "reference",
                    to: [{ type: "organization" }],
                },
            ],
            description: "Organizations involved in this lived experience",
        }),
        
        // Related Projects
        defineField({
            name: "projects",
            title: "Projects",
            type: "array",
            group: "affiliations",
            of: [
                {
                    type: "reference",
                    to: [{ type: "project" }],
                },
            ],
            description: "Projects related to this lived experience",
        }),

        // Cross-content links — rendered as a content-type-aware "Related" strip.
        defineField({
            name: "relatedContent",
            title: "Related content",
            type: "array",
            group: "affiliations",
            of: [{ type: "connection" }],
            description: "Link to case studies, news or other stories this connects to.",
            validation: (Rule) => Rule.max(8),
        }),
        
        // Tags for categorization
        defineField({
            name: "tags",
            title: "Tags",
            type: "array",
            group: "metadata",
            of: [
                {
                    type: "reference",
                    to: [{ type: "tag" }],
                },
            ],
            options: {
                layout: "tags",
                sortable: true,
            },
            validation: (Rule) =>
                Rule.max(6).warning("Aim for 3–4 tags; more than 6 dilutes them."),
            description: "Tags to categorize this lived experience. 3–4 focused tags work best (6 max).",
        }),
        
        // Featured flag
        defineField({
            name: "featured",
            title: "Featured",
            type: "boolean",
            group: "settings",
            initialValue: false,
            description: "Mark as featured to highlight in listings",
        }),

        // Review workflow (mirrors case studies) — only "approved" shows publicly.
        defineField({
            name: "status",
            title: "Publication Status",
            type: "string",
            group: "review",
            options: {
                list: [
                    { title: "Pending Review", value: "pending" },
                    { title: "Rejected", value: "rejected" },
                    { title: "Needs Revision", value: "revision" },
                    { title: "Approved (Published)", value: "approved" },
                ],
            },
            initialValue: "approved",
            description: "Only 'Approved' lived experiences appear on the public site. User-submitted ones start as 'Pending Review'.",
        }),
        defineField({
            name: "submittedBy",
            title: "Submitted By",
            type: "string",
            group: "review",
            readOnly: true,
            description: "Clerk User ID of the submitter (set when submitted via the in-app form).",
        }),
        defineField({
            name: "reviewNotes",
            title: "Review Notes",
            type: "text",
            group: "review",
            rows: 3,
            description: "Internal notes for the editor / feedback to the submitter.",
        }),

        // SEO fields
        defineField({
            name: "meta_title",
            title: "Meta Title",
            type: "string",
            group: "seo",
            description: "Custom title for search engines",
        }),
        defineField({
            name: "meta_description",
            title: "Meta Description",
            type: "text",
            group: "seo",
            rows: 3,
            description: "Custom description for search engines",
        }),
        defineField({
            name: "noindex",
            title: "No Index",
            type: "boolean",
            initialValue: false,
            group: "seo",
            description: "Prevent search engines from indexing this page",
        }),
        defineField({
            name: "ogImage",
            title: "Open Graph Image - [1200x630]",
            type: "image",
            group: "seo",
            description: "Image for social media sharing",
        }),
    ],
    
    orderings: [
        {
            title: 'Published Date (Newest)',
            name: 'publishedAtDesc',
            by: [{ field: 'publishedAt', direction: 'desc' }],
        },
        {
            title: 'Published Date (Oldest)',
            name: 'publishedAtAsc',
            by: [{ field: 'publishedAt', direction: 'asc' }],
        },
        {
            title: 'Title A-Z',
            name: 'titleAsc',
            by: [{ field: 'title.en', direction: 'asc' }],
        },
    ],
    
    preview: {
        select: {
            title: "title",
            media: "thumbnail",
            language: "language",
            publishedAt: "publishedAt",
            community: "relatedCommunity.name",
            featured: "featured",
        },
        prepare({ title, media, language, publishedAt, community, featured }) {
            const lang = language || 'en';
            const displayTitle = title?.[lang] || title?.en || "Untitled Experience";
            const dateText = publishedAt ? new Date(publishedAt).toLocaleDateString() : 'Draft';
            const featuredText = featured ? 'FEATURED ' : '';
            const communityText = community ? ` | ${community}` : '';

            return {
                title: `${featuredText}${displayTitle}`,
                subtitle: `${lang.toUpperCase()} | ${dateText}${communityText}`,
                media: media || Video,
            };
        },
    },
});
