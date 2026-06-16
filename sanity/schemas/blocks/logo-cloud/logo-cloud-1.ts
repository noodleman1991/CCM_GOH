import { defineType, defineField } from "sanity";
import { Images } from "lucide-react";

export default defineType({
  name: "logo-cloud-1",
  type: "object",
  icon: Images,
  fields: [
    defineField({
      name: "padding",
      type: "section-padding",
    }),
    defineField({
      name: "title",
      type: "string",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "layout",
      title: "Layout",
      type: "string",
      description:
        "Grid gives the logos more space and dignity (recommended for partners/institutions). Marquee is the scrolling strip.",
      options: {
        list: [
          { title: "Grid — calm, spacious", value: "grid" },
          { title: "Marquee — scrolling strip", value: "marquee" },
        ],
        layout: "radio",
      },
      initialValue: "marquee",
    }),
    defineField({
      name: "motionSpeed",
      title: "Marquee speed",
      type: "string",
      description: "Only applies to the marquee layout. Slow is gentler and less distracting.",
      options: {
        list: [
          { title: "Default", value: "default" },
          { title: "Slow", value: "slow" },
        ],
        layout: "radio",
      },
      initialValue: "default",
      hidden: ({ parent }) => parent?.layout === "grid",
    }),
    defineField({
      name: "images",
      type: "array",
      of: [
        defineField({
          name: "image",
          title: "Image",
          type: "image",
          fields: [
            {
              name: "alt",
              type: "string",
              title: "Alternative Text",
            },
            {
              name: "label",
              type: "string",
              title: "Name (optional)",
              description: "Shown under the logo in grid layout — e.g. the organisation's name.",
            },
            {
              name: "orgType",
              type: "string",
              title: "Institution type (optional)",
              description: "If set on logos, the grid groups them under type headings.",
              options: {
                list: [
                  { title: "NGO", value: "ngo" },
                  { title: "Research Institution", value: "research" },
                  { title: "University", value: "university" },
                  { title: "Government Agency", value: "government" },
                  { title: "International Organization", value: "international" },
                  { title: "Private Company", value: "company" },
                  { title: "Community Organization", value: "community" },
                  { title: "Foundation", value: "foundation" },
                  { title: "Other", value: "other" },
                ],
              },
            },
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "description",
    },
    prepare({ title, subtitle }) {
      return {
        title: title || "Logo Cloud",
        subtitle: subtitle || "Partner logos",
      };
    },
  },
});
