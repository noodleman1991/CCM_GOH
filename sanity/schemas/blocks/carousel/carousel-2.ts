import { defineField, defineType } from "sanity";
import { Quote } from "lucide-react";

export default defineType({
  name: "carousel-2",
  type: "object",
  title: "Carousel 2",
  icon: Quote,
  description: "A carousel of testimonials",
  fields: [
    defineField({
      name: "title",
      title: "Section Title",
      type: "string",
    }),
    defineField({
      name: "description",
      title: "Section Description",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "padding",
      type: "section-padding",
    }),
    defineField({
      name: "colorVariant",
      type: "color-variant",
      title: "Color Variant",
      description: "Select a background color variant",
    }),
    defineField({
      name: "testimonial",
      type: "array",
      of: [
        {
          name: "testimonial",
          type: "reference",
          to: [{ type: "testimonial" }],
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "description",
      testimonialName: "testimonial.0.name",
    },
    prepare({ title, subtitle, testimonialName }) {
      return {
        title: title || "Testimonials Carousel",
        subtitle: subtitle || testimonialName || "Team testimonials",
      };
    },
  },
});
