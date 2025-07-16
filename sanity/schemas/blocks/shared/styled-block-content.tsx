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
                // Predefined custom styles
                { title: "Lead Text", value: "lead", blockEditor: { render: ({ children }: any) => <p style={{ fontSize: '1.25rem', lineHeight: '1.75rem', color: '#6B7280' }}>{children}</p> } },
                { title: "Caption", value: "caption", blockEditor: { render: ({ children }: any) => <p style={{ fontSize: '0.875rem', lineHeight: '1.25rem', color: '#9CA3AF', fontStyle: 'italic' }}>{children}</p> } },
                { title: "Highlight", value: "highlight", blockEditor: { render: ({ children }: any) => <p style={{ backgroundColor: '#FEF3C7', padding: '0.5rem 1rem', borderRadius: '0.375rem' }}>{children}</p> } },
                { title: "Info Box", value: "infoBox", blockEditor: { render: ({ children }: any) => <div style={{ backgroundColor: '#DBEAFE', padding: '1rem', borderRadius: '0.5rem', borderLeft: '4px solid #3B82F6' }}>{children}</div> } },
                { title: "Warning Box", value: "warningBox", blockEditor: { render: ({ children }: aTS2304: Cannot find name 'style'.ny) => <div style={{ backgroundColor: '#FEE2E2', padding: '1rem', borderRadius: '0.5rem', borderLeft: '4px solid #EF4444' }}>{children}</div> } },
                { title: "Success Box", value: "successBox", blockEditor: { render: ({ children }: any) => <div style={{ backgroundColor: '#D1FAE5', padding: '1rem', borderRadius: '0.5rem', borderLeft: '4px solid #10B981' }}>{children}</div> } },
                { title: "Sidebar Note", value: "sidebarNote", blockEditor: { render: ({ children }: any) => <aside style={{ backgroundColor: '#F3F4F6', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.875rem', marginLeft: '2rem' }}>{children}</aside> } },
                { title: "Call to Action", value: "cta", blockEditor: { render: ({ children }: any) => <div style={{ backgroundColor: '#7C3AED', color: 'white', padding: '1.5rem', borderRadius: '0.5rem', textAlign: 'center', fontWeight: 'bold' }}>{children}</div> } },
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
                    { title: "Code", value: "code" },
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
    ],
});
