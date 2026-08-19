import { defineField, defineType, type SanityDocument } from "sanity";
import { Banknote } from "lucide-react";
import { REGION_OPTIONS } from "../shared/taxonomy-options";

/**
 * fundingApplication — an INTERNAL, never-public document (SANITY_SCHEMA §6.2 /
 * TAXONOMY §funding). Drafts of funding asks, with a draft → review → final
 * internal workflow (never "published"). Versioned via documentVersion.
 */
export default defineType({
  name: "fundingApplication",
  title: "Funding Application (internal)",
  type: "document",
  icon: Banknote,
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
    defineField({ name: "funder", title: "Funder", type: "string" }),
    defineField({ name: "amount", title: "Amount requested", type: "string" }),
    defineField({ name: "deadline", title: "Deadline", type: "date" }),
    defineField({ name: "summary", title: "Summary", type: "text", rows: 3 }),
    defineField({
      name: "versions",
      title: "Versions / drafts",
      type: "array",
      of: [{ type: "documentVersion" }],
    }),
    defineField({ name: "region", title: "Region", type: "string", options: { list: [...REGION_OPTIONS] } }),
    defineField({
      name: "organizations",
      title: "Organizations",
      type: "array",
      of: [{ type: "reference", to: [{ type: "organization" }] }],
    }),
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
    select: { title: "title.en", status: "status", funder: "funder" },
    prepare: ({ title, status, funder }) => ({
      title: title || "Untitled application",
      subtitle: `internal · ${funder ? funder + " · " : ""}${status || "draft"}`,
    }),
  },
});
