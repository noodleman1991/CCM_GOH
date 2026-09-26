import { defineType, defineField } from "sanity";
import { Map } from "lucide-react";

const FACET_OPTIONS = [
  { title: "Case studies", value: "caseStudyCount" },
  { title: "Members", value: "memberCount" },
  { title: "News", value: "newsCount" },
];

export default defineType({
  name: "region-map",
  type: "object",
  title: "Region Map",
  icon: Map,
  fields: [
    defineField({ name: "padding", type: "section-padding" }),
    defineField({ name: "title", type: "string" }),
    defineField({ name: "description", type: "text", rows: 2 }),
    defineField({
      name: "defaultFacet",
      title: "Default facet",
      type: "string",
      initialValue: "caseStudyCount",
      options: { list: FACET_OPTIONS, layout: "radio" },
    }),
    defineField({
      name: "allowedFacets",
      title: "Selectable facets",
      type: "array",
      of: [{ type: "string" }],
      options: { list: FACET_OPTIONS },
      description:
        "Which facets the visitor can switch between. Leave empty to allow all.",
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({ title: title || "Region Map" }),
  },
});
