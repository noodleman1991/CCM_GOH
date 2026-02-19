import { defineType, defineArrayMember } from "sanity";
import { SquarePlay } from "lucide-react";
import { YouTubePreview } from "@/sanity/schemas/previews/youtube-preview";

export default defineType({
    title: "Styled Block Content",
    name: "styled-block-content",
    type: "array",
    of: [
        defineArrayMember({
            title: "Block",
            type: "block",
            styles: [
                { title: "Normal", value: "normal" },
                { title: "H1", value: "h1" },
                { title: "H2", value: "h2" },
                { title: "H3", value: "h3" },
                { title: "H4", value: "h4" },
                { title: "Quote", value: "blockquote" },
                // Block-level styles that affect entire paragraphs
                { title: "Lead Text", value: "lead" },
                { title: "Caption", value: "caption" },
                { title: "Sidebar Note", value: "sidebarNote" },
                { title: "Call to Action", value: "cta" },
            ],
            lists: [
                { title: "Bullet", value: "bullet" },
                { title: "Number", value: "number" },
                { title: "Checkbox", value: "checkbox" },
            ],
            marks: {
                decorators: [
                    { title: "Strong", value: "strong" },
                    { title: "Emphasis", value: "em" },
                    { title: "Underline", value: "underline" },
                    { title: "Strike", value: "strike-through" },
                    // Moved from styles - this applies to selected text only
                    { title: "Highlight", value: "highlight", icon: () => '🖍️' },
                ],
                annotations: [
                    {
                        title: "URL",
                        name: "link",
                        type: "object",
                        fields: [
                            {
                                title: "URL",
                                name: "href",
                                type: "url",
                                validation: (Rule) =>
                                    Rule.uri({
                                        allowRelative: true,
                                        scheme: ["http", "https", "mailto", "tel"],
                                    }),
                            },
                            {
                                title: "Open in new tab",
                                name: "target",
                                type: "boolean",
                                initialValue: false,
                            },
                        ],
                    },
                    {
                        title: "Internal Link",
                        name: "internalLink",
                        type: "object",
                        fields: [
                            {
                                title: "Reference",
                                name: "reference",
                                type: "reference",
                                to: [
                                    { type: "post" },
                                    { type: "page" },
                                    { type: "caseStudy" },
                                ],
                            },
                        ],
                    },
                ],
            },
        }),
        // Break/separator blocks
        defineArrayMember({
            type: "break",
        }),
        // Info boxes (replaced the old style-based approach)
        defineArrayMember({
            type: "infoBox",
        }),
        defineArrayMember({
            type: "image",
            options: { hotspot: true },
            fields: [
                {
                    name: "alt",
                    type: "object",
                    title: "Alternative Text",
                    fields: [
                        { name: "en", title: "English", type: "string" },
                        { name: "es", title: "Español", type: "string" },
                        { name: "fr", title: "Français", type: "string" },
                        { name: "ar", title: "العربية", type: "string" },
                    ],
                },
                {
                    name: "caption",
                    type: "object",
                    title: "Caption",
                    fields: [
                        { name: "en", title: "English", type: "string" },
                        { name: "es", title: "Español", type: "string" },
                        { name: "fr", title: "Français", type: "string" },
                        { name: "ar", title: "العربية", type: "string" },
                    ],
                },
            ],
        }),
        defineArrayMember({
            name: "youtube",
            type: "object",
            title: "YouTube",
            icon: SquarePlay,
            fields: [
                {
                    name: "videoId",
                    title: "Video ID",
                    type: "string",
                    description: "YouTube Video ID",
                },
                {
                    name: "caption",
                    type: "object",
                    title: "Caption",
                    fields: [
                        { name: "en", title: "English", type: "string" },
                        { name: "es", title: "Español", type: "string" },
                        { name: "fr", title: "Français", type: "string" },
                        { name: "ar", title: "العربية", type: "string" },
                    ],
                },
            ],
            preview: {
                select: {
                    title: "videoId",
                },
            },
            components: {
                preview: YouTubePreview,
            },
        }),
        defineArrayMember({
            name: "code",
            type: "code",
            options: {
                withFilename: true,
                language: "typescript",
                languageAlternatives: [
                    { title: "TypeScript", value: "typescript" },
                    { title: "JavaScript", value: "javascript" },
                    { title: "JSX", value: "jsx" },
                    { title: "TSX", value: "tsx" },
                    { title: "HTML", value: "html" },
                    { title: "CSS", value: "css" },
                    { title: "SCSS", value: "scss" },
                    { title: "JSON", value: "json" },
                    { title: "Python", value: "python" },
                    { title: "PHP", value: "php" },
                    { title: "Ruby", value: "ruby" },
                    { title: "Shell", value: "shell" },
                    { title: "Markdown", value: "markdown" },
                    { title: "YAML", value: "yaml" },
                    { title: "GraphQL", value: "graphql" },
                    { title: "SQL", value: "sql" },
                ],
            },
        }),
    ],
});
