import type { CollectionConfig } from "payload";
import { isEditor, publishedOnly } from "@/payload/access";
import { imageField, relationshipField } from "@/payload/blocks/shared";
import { localizedRichText, localizedText, localizedTextarea } from "@/payload/fields/localized";
import { sanityUpdatedAt } from "@/payload/fields/sanity-timestamps";
import { searchSyncAfterChange, searchSyncAfterDelete } from "@/payload/hooks/search-sync";

/**
 * Mirrors sanity/schemas/documents/news-post.ts. Verified against
 * production_2 (2026-09-03, 5 documents: 4 published + 1 draft — matches
 * the brief's "4 news posts" exactly). `versions.drafts` enabled — the one
 * draft is an edit of a published document.
 *
 * newsPost declares no moderation `status` field at all (unlike
 * caseStudy/livedExperience/researchOutput) — none added here either.
 *
 * `language` (document-level, Lane A intent) is dropped, not modelled — and
 * unlike livedExperience, the real data itself already shows the schema's
 * Lane A intent breaking down: the 3 oldest seed documents
 * (`news-cop28`, `news-climate-distress-study`, `news-regional-dialogues`)
 * set `language: "en"` and populate only `title.en`; the newest document
 * (and its draft) — the one holding substantial, recently-authored editorial
 * content — has NO `language` set and populates BOTH `title.en` and
 * `title.fr` on the same document. Payload's `localized: true` mechanism
 * (`localizedText`/`localizedRichText`) captures both shapes without a
 * separate field: a single-locale legacy doc becomes one Payload document
 * with only `en` populated; the newer multi-locale doc becomes one document
 * with `en` and `fr` both populated.
 *
 * `region` here IS stored as the fixed-7 string code (1/5, "oce") — like
 * researchOutput and unlike livedExperience. No disagreement.
 *
 * `projects` is declared but 0/5 populated and references a `project` type
 * with 0 live documents in production_2 — not ported (same reasoning as
 * caseStudy/livedExperience/researchOutput).
 */
export const NewsPosts: CollectionConfig = {
  slug: "newsPosts",
  versions: { drafts: true },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "publishedAt", "featured"],
  },
  access: {
    read: publishedOnly,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  // What the Sanity search webhook used to do, in-process. Scheduling only —
  // the Algolia write runs after this transaction commits, never inside it.
  // See payload/hooks/search-sync.ts.
  hooks: {
    afterChange: [searchSyncAfterChange("newsPosts")],
    afterDelete: [searchSyncAfterDelete("newsPosts")],
  },
  fields: [
    {
      name: "id",
      type: "text",
      required: true,
      admin: { hidden: true },
    },
    sanityUpdatedAt,
    localizedText("title", { required: true }),
    localizedText("subtitle"),
    { name: "slug", type: "text", required: true, unique: true },
    localizedTextarea("excerpt"),
    localizedRichText("content", { required: true }),
    relationshipField("author", "authors", { required: true }),
    { name: "publishedAt", type: "date" },
    imageField("image"),
    relationshipField("organizations", "organizations", { hasMany: true }),
    relationshipField("relatedCommunity", "regionalCommunities", { label: "Regional Community" }),
    {
      name: "region",
      type: "select",
      options: [
        { label: "Sub-Saharan Africa", value: "ssa" },
        { label: "Northern Africa & Western Asia", value: "nawa" },
        { label: "Central & Southern Asia", value: "csa" },
        { label: "Eastern & South-Eastern Asia", value: "esea" },
        { label: "Latin America & the Caribbean", value: "lac" },
        { label: "Oceania", value: "oce" },
        { label: "Europe & Northern America", value: "enam" },
      ],
      admin: { description: "Optional for news, unlike other content types." },
    },
    {
      name: "themes",
      type: "select",
      hasMany: true,
      options: ["displacement", "livelihoods", "youth", "indigenous"].map((value) => ({ label: value, value })),
    },
    {
      name: "populations",
      type: "select",
      hasMany: true,
      options: [
        { label: "Children & youth", value: "youth" },
        { label: "Women", value: "women" },
        { label: "Indigenous peoples", value: "indigenous" },
        { label: "Farmers & rural livelihoods", value: "farmers" },
        { label: "Displaced & migrants", value: "displaced" },
      ],
    },
    { name: "location", type: "point" },
    {
      name: "place",
      type: "group",
      fields: [
        { name: "point", type: "point" },
        { name: "text", type: "text" },
        {
          name: "precision",
          type: "select",
          defaultValue: "city",
          options: [
            { label: "Exact point", value: "exact" },
            { label: "City", value: "city" },
            { label: "Country", value: "country" },
            { label: "Region only (no pin)", value: "region" },
          ],
        },
        { name: "countryCode", type: "text" },
      ],
    },
    {
      name: "locationDetails",
      type: "group",
      fields: [
        { name: "city", type: "text" },
        { name: "country", type: "text" },
        { name: "region", type: "text" },
      ],
    },
    relationshipField("tags", "tags", { hasMany: true }),
    {
      name: "sources",
      type: "array",
      fields: [
        { name: "title", type: "text", required: true, label: "Source Title" },
        { name: "url", type: "text", required: true, label: "Source URL" },
        { name: "publisher", type: "text" },
        { name: "date", type: "date", admin: { date: { pickerAppearance: "dayOnly" } } },
      ],
    },
    { name: "featured", type: "checkbox", defaultValue: false, label: "Featured Post" },
    { name: "meta_title", type: "text", label: "Meta Title" },
    { name: "meta_description", type: "textarea", label: "Meta Description" },
    { name: "noindex", type: "checkbox", defaultValue: false, label: "No Index" },
    imageField("ogImage"),
  ],
};
