import { defineField, defineType } from "sanity";

export default defineType({
  name: "link",
  type: "object",
  title: "Link",
  fields: [
    defineField({
      name: "title",
      type: "string",
      description: "Button text. Required — buttons render empty without it.",
      validation: (Rule) =>
        Rule.required().warning("Buttons without text render empty"),
    }),
    defineField({
      name: "href",
      title: "href",
      type: "string",
      description:
        "Full URL (https://…) for external sites, or internal path starting with / (e.g. /news)",
    }),
    defineField({
      name: "target",
      type: "boolean",
      title: "Open in new tab",
    }),
    defineField({
      name: "buttonVariant",
      type: "button-variant",
      title: "Button Variant",
    }),
  ],
});
