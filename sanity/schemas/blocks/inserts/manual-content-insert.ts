import { defineField, defineType } from "sanity";
import { Edit3 } from "lucide-react";

export default defineType({
  name: "manualContentInsert",
  type: "object",
  title: "Custom Content Block",
  icon: Edit3,
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "Block Title",
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: "content",
      type: "array",
      title: "Content",
      of: [{
        type: "block",
        styles: [
          { title: "Normal", value: "normal" },
          { title: "H2", value: "h2" },
          { title: "H3", value: "h3" },
          { title: "H4", value: "h4" },
          { title: "Quote", value: "blockquote" },
        ],
        lists: [
          { title: "Bullet", value: "bullet" },
          { title: "Numbered", value: "number" },
        ],
        marks: {
          decorators: [
            { title: "Strong", value: "strong" },
            { title: "Emphasis", value: "em" },
            { title: "Code", value: "code" },
          ],
          annotations: [
            {
              name: "link",
              type: "object",
              title: "URL",
              fields: [
                {
                  title: "URL",
                  name: "href",
                  type: "url",
                },
              ],
            },
          ],
        },
      }],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "image",
      type: "image",
      title: "Featured Image",
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Alternative Text",
          validation: (Rule) => Rule.required(),
        },
        {
          name: "caption",
          type: "string",
          title: "Caption",
        },
      ],
    }),
    defineField({
      name: "layout",
      type: "string",
      title: "Layout Style",
      options: {
        list: [
          { title: "Image Left, Content Right", value: "left-image" },
          { title: "Image Right, Content Left", value: "right-image" },
          { title: "Full Width Content", value: "full-width" },
          { title: "Content Above Image", value: "content-above" },
          { title: "Image Above Content", value: "image-above" },
        ],
      },
      initialValue: "full-width",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "backgroundColor",
      type: "string",
      title: "Background Color",
      options: {
        list: [
          { title: "None", value: "none" },
          { title: "Light Gray", value: "light-gray" },
          { title: "Dark Gray", value: "dark-gray" },
          { title: "Brand Primary", value: "brand-primary" },
          { title: "Brand Secondary", value: "brand-secondary" },
        ],
      },
      initialValue: "none",
    }),
    defineField({
      name: "padding",
      type: "string",
      title: "Padding",
      options: {
        list: [
          { title: "None", value: "none" },
          { title: "Small", value: "small" },
          { title: "Medium", value: "medium" },
          { title: "Large", value: "large" },
        ],
      },
      initialValue: "medium",
    }),
  ],
  preview: {
    select: {
      title: "title",
      layout: "layout",
      media: "image",
    },
    prepare({ title, layout, media }) {
      const layoutLabels = {
        "left-image": "📖 Left Image",
        "right-image": "📙 Right Image",
        "full-width": "📄 Full Width",
        "content-above": "📑 Content Above",
        "image-above": "🖼️ Image Above",
      };

      return {
        title: title || "Custom Content Block",
        subtitle: layoutLabels[layout as keyof typeof layoutLabels] || layout,
        media: media || Edit3,
      };
    },
  },
});