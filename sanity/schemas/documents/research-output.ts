import { defineField, defineType } from "sanity";
import { FileText } from "lucide-react";
import { orderRankField } from "@sanity/orderable-document-list";
import { REGION_OPTIONS, THEME_OPTIONS, POPULATION_OPTIONS } from "../shared/taxonomy-options";

/**
 * researchOutput — the redesign's primary published-output type (SANITY_SCHEMA
 * §6.2), modelled on caseStudy. Supersedes the legacy file-download `report`
 * (migrated in A3). Carries an in-hub portable-text `body`, a version × language
 * `versions[]` (documentVersion), a layout archetype, and the fixed taxonomy.
 * Download tracking lives per-version (documentVersion) + a roll-up here, for
 * parity with the old report.
 */
export default defineType({
  name: "researchOutput",
  title: "Research Output",
  type: "document",
  icon: FileText,
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "versions", title: "Versions & Files" },
    { name: "affiliations", title: "Affiliations" },
    { name: "review", title: "Review & Publishing" },
    { name: "metadata", title: "Metadata" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "object",
      group: "content",
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
      group: "metadata",
      options: {
        source: (doc: any) => {
          const t = (doc?.title || {}) as Record<string, string>;
          return t.en || t.es || t.fr || t.ar || "";
        },
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "excerpt",
      title: "Excerpt",
      type: "object",
      group: "content",
      fields: [
        { name: "en", title: "English", type: "text", rows: 3 },
        { name: "es", title: "Español", type: "text", rows: 3 },
        { name: "fr", title: "Français", type: "text", rows: 3 },
        { name: "ar", title: "العربية", type: "text", rows: 3 },
      ],
    }),
    defineField({
      name: "outputType",
      title: "Output type",
      type: "string",
      group: "content",
      options: {
        list: [
          { title: "Report", value: "report" },
          { title: "Toolkit", value: "toolkit" },
          { title: "Dataset brief", value: "dataset-brief" },
          { title: "Guideline", value: "guideline" },
        ],
      },
      initialValue: "report",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "layout",
      title: "Layout",
      type: "string",
      group: "content",
      description: "Detail-page archetype (chosen by the dominant content element).",
      options: { list: [
        { title: "Report (evidence + data; sticky 'At a glance')", value: "report" },
        { title: "Story (narrative + photography)", value: "story" },
        { title: "Feature (one bold statement)", value: "feature" },
      ] },
      initialValue: "report",
    }),
    defineField({
      name: "coverImage",
      title: "Cover Image",
      type: "image",
      group: "content",
      options: { hotspot: true },
      fields: [{ name: "alt", type: "string", title: "Alternative Text" }],
    }),
    defineField({
      name: "body",
      title: "In-hub body",
      type: "styled-block-content",
      group: "content",
      description: "Read-in-the-hub content (used by the Story/Feature/Report detail layouts).",
    }),

    // Version × language (download/embed switcher on the Documents tab).
    defineField({
      name: "versions",
      title: "Versions",
      type: "array",
      group: "versions",
      of: [{ type: "documentVersion" }],
      description: "Each version is a kind (summary/full/…) × language, as a file or in-hub body.",
    }),

    // Fixed taxonomy.
    defineField({
      name: "region",
      title: "Region",
      type: "string",
      group: "affiliations",
      options: { list: [...REGION_OPTIONS] },
    }),
    defineField({
      name: "themes",
      title: "Themes",
      type: "array",
      of: [{ type: "string" }],
      options: { list: [...THEME_OPTIONS] },
      group: "affiliations",
    }),
    defineField({
      name: "populations",
      title: "Populations",
      type: "array",
      of: [{ type: "string" }],
      options: { list: [...POPULATION_OPTIONS] },
      group: "affiliations",
    }),
    defineField({
      name: "relatedCommunities",
      title: "Regional Communities",
      type: "array",
      group: "affiliations",
      of: [{ type: "reference", to: [{ type: "regionalCommunity" }] }],
    }),
    defineField({
      name: "organizations",
      title: "Organizations",
      type: "array",
      group: "affiliations",
      of: [{ type: "reference", to: [{ type: "organization" }] }],
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      group: "affiliations",
      of: [{ type: "reference", to: [{ type: "tag" }] }],
      validation: (Rule) => Rule.max(6).warning("3–4 focused tags work best (6 max)."),
    }),
    defineField({
      name: "relatedContent",
      title: "Related content",
      type: "array",
      group: "affiliations",
      of: [{ type: "connection" }],
    }),

    // Review workflow (mirrors caseStudy / livedExperience).
    defineField({
      name: "status",
      title: "Publication Status",
      type: "string",
      group: "review",
      options: {
        list: [
          { title: "Pending Review", value: "pending" },
          { title: "Rejected", value: "rejected" },
          { title: "Needs Revision", value: "revision" },
          { title: "Approved (Published)", value: "approved" },
        ],
      },
      initialValue: "approved",
      description: "Only 'Approved' research outputs appear on the public site.",
    }),
    defineField({ name: "submittedBy", title: "Submitted By", type: "string", group: "review", readOnly: true }),
    defineField({ name: "reviewNotes", title: "Review Notes", type: "text", group: "review", rows: 3 }),

    // Reusable geotag (spec A2, extended to researchOutput 2026-08-05) — the
    // shared `place` object (mirrors livedExperience/newsPost exactly) so
    // research outputs that name a specific place can appear as atlas pins,
    // not just region-level counts. No initialValue: research outputs are
    // editor-authored (not user-submitted), so there's no safety default to
    // apply the way livedExperience does.
    defineField({
      name: "place",
      title: "Place",
      type: "place",
      group: "metadata",
    }),

    // Metadata + download roll-up (parity with report).
    defineField({ name: "publishDate", title: "Publish date", type: "datetime", group: "metadata" }),
    defineField({ name: "year", title: "Year", type: "number", group: "metadata" }),
    defineField({ name: "featured", title: "Featured", type: "boolean", group: "metadata", initialValue: false }),
    defineField({ name: "totalDownloadCount", title: "Total downloads", type: "number", group: "metadata", initialValue: 0, readOnly: true }),
    // Carries the legacy report _id through the A3 migration (provenance + dedupe).
    defineField({ name: "migratedFromReport", title: "Migrated from report (id)", type: "string", group: "metadata", readOnly: true }),
    orderRankField({ type: "researchOutput" }),
  ],
  preview: {
    select: { title: "title.en", status: "status", outputType: "outputType" },
    prepare({ title, status, outputType }) {
      return { title: title || "Untitled output", subtitle: `${outputType || "report"} · ${status || "—"}` };
    },
  },
});
