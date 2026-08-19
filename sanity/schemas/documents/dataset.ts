import { defineField, defineType, type SanityDocument } from "sanity";
import { Database } from "lucide-react";
import { REGION_OPTIONS, THEME_OPTIONS } from "../shared/taxonomy-options";

/**
 * dataset — an INTERNAL, never-public data resource (SANITY_SCHEMA §6.2 / TAXONOMY).
 * Referenced by the `embeddedDoc` block and `annotation.parent`; surfaced only
 * inside the hub workspace, never on the public site. Versioned via documentVersion.
 */
export default defineType({
  name: "dataset",
  title: "Dataset (internal)",
  type: "document",
  icon: Database,
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "object",
      fields: [
        { name: "en", title: "English", type: "string", validation: (Rule) => Rule.required() },
        { name: "es", title: "Español", type: "string" },
        { name: "fr", title: "Français", type: "string" },
        { name: "ar", title: "العربية", type: "string" },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: (doc: SanityDocument) => (doc.title as { en?: string } | undefined)?.en || "", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "description", title: "Description", type: "text", rows: 3 }),
    defineField({
      name: "versions",
      title: "Versions / files",
      type: "array",
      of: [{ type: "documentVersion" }],
    }),
    defineField({ name: "region", title: "Region", type: "string", options: { list: [...REGION_OPTIONS] } }),
    defineField({
      name: "themes",
      title: "Themes",
      type: "array",
      of: [{ type: "string" }],
      options: { list: [...THEME_OPTIONS] },
    }),
    defineField({
      name: "organizations",
      title: "Organizations",
      type: "array",
      of: [{ type: "reference", to: [{ type: "organization" }] }],
    }),
    // Internal workflow only (draft → review → final). Never "published".
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: { list: [
        { title: "Draft", value: "draft" },
        { title: "In review", value: "review" },
        { title: "Final", value: "final" },
      ] },
      initialValue: "draft",
    }),
  ],
  preview: {
    select: { title: "title.en", status: "status" },
    prepare: ({ title, status }) => ({ title: title || "Untitled dataset", subtitle: `internal · ${status || "draft"}` }),
  },
});
