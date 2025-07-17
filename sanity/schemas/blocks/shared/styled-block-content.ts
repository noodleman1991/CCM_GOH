// todo: remove one version - which on is working?
// import { defineType, defineArrayMember } from "sanity";
// import { SquarePlay } from "lucide-react";
// import { YouTubePreview } from "@/sanity/schemas/previews/youtube-preview";
//
// export default defineType({
//     title: "Styled Block Content",
//     name: "styled-block-content",
//     type: "array",
//     of: [
//         defineArrayMember({
//             title: "Block",
//             type: "block",
//             styles: [
//                 { title: "Normal", value: "normal" },
//                 { title: "H1", value: "h1" },
//                 { title: "H2", value: "h2" },
//                 { title: "H3", value: "h3" },
//                 { title: "H4", value: "h4" },
//                 { title: "Quote", value: "blockquote" },
//                 // Custom styles
//                 { title: "Lead Text", value: "lead" },
//                 { title: "Caption", value: "caption" },
//                 { title: "Highlight", value: "highlight" },
//                 { title: "Info Box", value: "infoBox" },
//                 { title: "Warning Box", value: "warningBox" },
//                 { title: "Success Box", value: "successBox" },
//                 { title: "Sidebar Note", value: "sidebarNote" },
//                 { title: "Call to Action", value: "cta" },
//             ],
//             lists: [
//                 { title: "Bullet", value: "bullet" },
//                 { title: "Number", value: "number" },
//                 { title: "Checkbox", value: "checkbox" },
//             ],
//             marks: {
//                 decorators: [
//                     { title: "Strong", value: "strong" },
//                     { title: "Emphasis", value: "em" },
//                     { title: "Underline", value: "underline" },
//                     { title: "Strike", value: "strike-through" },
//                     { title: "Code", value: "code" },
//                     { title: "Highlight", value: "highlight", icon: () => '🖍️' },
//                 ],
//                 annotations: [
//                     {
//                         title: "URL",
//                         name: "link",
//                         type: "object",
//                         fields: [
//                             {
//                                 title: "URL",
//                                 name: "href",
//                                 type: "url",
//                                 validation: (Rule) =>
//                                     Rule.uri({
//                                         allowRelative: true,
//                                         scheme: ["http", "https", "mailto", "tel"],
//                                     }),
//                             },
//                             {
//                                 title: "Open in new tab",
//                                 name: "target",
//                                 type: "boolean",
//                                 initialValue: false,
//                             },
//                         ],
//                     },
//                     {
//                         title: "Internal Link",
//                         name: "internalLink",
//                         type: "object",
//                         fields: [
//                             {
//                                 title: "Reference",
//                                 name: "reference",
//                                 type: "reference",
//                                 to: [
//                                     { type: "post" },
//                                     { type: "page" },
//                                     { type: "caseStudy" },
//                                 ],
//                             },
//                         ],
//                     },
//                 ],
//             },
//         }),
//         defineArrayMember({
//             type: "image",
//             options: { hotspot: true },
//             fields: [
//                 {
//                     name: "alt",
//                     type: "object",
//                     title: "Alternative Text",
//                     fields: [
//                         { name: "en", title: "English", type: "string" },
//                         { name: "es", title: "Español", type: "string" },
//                         { name: "fr", title: "Français", type: "string" },
//                         { name: "ar", title: "العربية", type: "string" },
//                     ],
//                 },
//                 {
//                     name: "caption",
//                     type: "object",
//                     title: "Caption",
//                     fields: [
//                         { name: "en", title: "English", type: "string" },
//                         { name: "es", title: "Español", type: "string" },
//                         { name: "fr", title: "Français", type: "string" },
//                         { name: "ar", title: "العربية", type: "string" },
//                     ],
//                 },
//             ],
//         }),
//         defineArrayMember({
//             name: "youtube",
//             type: "object",
//             title: "YouTube",
//             icon: SquarePlay,
//             fields: [
//                 {
//                     name: "videoId",
//                     title: "Video ID",
//                     type: "string",
//                     description: "YouTube Video ID",
//                 },
//                 {
//                     name: "caption",
//                     type: "object",
//                     title: "Caption",
//                     fields: [
//                         { name: "en", title: "English", type: "string" },
//                         { name: "es", title: "Español", type: "string" },
//                         { name: "fr", title: "Français", type: "string" },
//                         { name: "ar", title: "العربية", type: "string" },
//                     ],
//                 },
//             ],
//             preview: {
//                 select: {
//                     title: "videoId",
//                 },
//             },
//             components: {
//                 preview: YouTubePreview,
//             },
//         }),
//     ],
// });

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
                // Custom styles - Note: These are just style definitions
                // The actual rendering happens in your frontend components
                { title: "Lead Text", value: "lead" },
                { title: "Caption", value: "caption" },
                { title: "Highlight", value: "highlight" },
                { title: "Info Box", value: "infoBox" },
                { title: "Warning Box", value: "warningBox" },
                { title: "Success Box", value: "successBox" },
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
