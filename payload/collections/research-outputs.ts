import type { CollectionConfig } from "payload";
import { isEditor, isEditorField, moderationApprovedOnly } from "@/payload/access";
import { moderationAfterChange } from "@/payload/hooks/moderation";
import { imageField, relationshipField, uploadField } from "@/payload/blocks/shared";
import { localizedRichText, localizedText, localizedTextarea } from "@/payload/fields/localized";
import { sanityUpdatedAt } from "@/payload/fields/sanity-timestamps";

/**
 * Mirrors sanity/schemas/documents/research-output.ts. Verified against
 * production_2 (2026-09-03, 29 documents, 0 drafts — matches the brief's
 * "29 research outputs" exactly). No `versions.drafts`.
 *
 * `status` is 29/29 "approved" — real usage matches the schema's
 * `initialValue`. Modelled as `moderationStatus`, not `status` — no
 * `_status` collision exists today (no `versions.drafts` here), but
 * `caseStudies`/`livedExperiences` proved the collision is real the moment
 * both a same-named `status` field and `versions.drafts` land on the same
 * collection (Postgres error: `invalid input value for enum
 * enum_case_studies_status: "pending"` — see case-studies.ts's header).
 * Named consistently here so enabling drafts on this collection later, or
 * building shared moderation-queue UI across all three, never has to
 * special-case one of the three field names.
 *
 * `read` uses `moderationApprovedOnly` (`payload/access/index.ts`), not
 * `isAnyone` — this collection has no `_status` field to gate on (no
 * `versions.drafts`), so `moderationStatus` alone is the visibility gate.
 * `isAnyone` would have made a future `pending`/`rejected` output public
 * from the moment it's created. That helper is now STRICT — approved and
 * nothing else — matching every live GROQ filter on this type
 * (`lib/content/system.ts:142`, `:289`, `discovery.ts:608`,
 * `outputs.ts:639`, `:647`, `:653`, `:1144`), none of which admits an unset
 * status. It previously mirrored `publishedAndApproved`'s `exists: false`
 * fallback, which belongs to `livedExperience` alone.
 *
 * `submittedBy` and `reviewNotes` additionally carry field-level
 * `access.read: isEditorField`: the collection gate says which documents are
 * public, not what an approved one may carry in its body.
 *
 * `region` here IS stored as the fixed-7 string code (14/29, e.g. "csa") —
 * unlike `livedExperience.region` (see payload/collections/lived-experiences.ts),
 * this content type's real data matches its schema exactly. No disagreement.
 *
 * `relatedContent` (the `connection` object) is declared but 0/29
 * populated, and its polymorphic target includes a `project` type with 0
 * live documents anywhere in production_2 — not ported, same reasoning as
 * `caseStudy`/`livedExperience`.
 *
 * `migratedFromReport` is populated on all 29/29 — every research output in
 * production_2 was migrated from the legacy `report` type (0 live `report`
 * documents remain), confirming the schema comment ("Supersedes the legacy
 * file-download report").
 */
export const ResearchOutputs: CollectionConfig = {
  slug: "researchOutputs",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "outputType", "moderationStatus", "featured"],
  },
  access: {
    read: moderationApprovedOnly,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  // Studio patched a status and left everything else to a Sanity webhook —
  // cache revalidation and the submitter's email — eventually, over the
  // network, and only if delivery succeeded. Here it is the same process and
  // the same call stack. See payload/hooks/moderation.ts.
  hooks: { afterChange: [moderationAfterChange("researchOutputs")] },
  fields: [
    {
      name: "id",
      type: "text",
      required: true,
      admin: { hidden: true },
    },
    sanityUpdatedAt,
    localizedText("title", { required: true }),
    { name: "slug", type: "text", required: true, unique: true },
    localizedTextarea("excerpt"),
    {
      name: "outputType",
      type: "select",
      required: true,
      defaultValue: "report",
      options: [
        { label: "Report", value: "report" },
        { label: "Toolkit", value: "toolkit" },
        { label: "Dataset brief", value: "dataset-brief" },
        { label: "Guideline", value: "guideline" },
      ],
    },
    {
      name: "layout",
      type: "select",
      defaultValue: "report",
      options: [
        { label: "Report (evidence + data; sticky 'At a glance')", value: "report" },
        { label: "Story (narrative + photography)", value: "story" },
        { label: "Feature (one bold statement)", value: "feature" },
      ],
    },
    imageField("coverImage"),
    localizedRichText("body", { label: "In-hub body" }),
    {
      name: "versions",
      type: "array",
      admin: { description: "Each version is a kind (summary/full/…) × language, as a file or in-hub body." },
      fields: [
        {
          name: "kind",
          type: "select",
          required: true,
          options: [
            { label: "Summary", value: "summary" },
            { label: "Full", value: "full" },
            { label: "Brief", value: "brief" },
            { label: "Deck", value: "deck" },
          ],
        },
        {
          name: "lang",
          type: "select",
          required: true,
          options: [
            { label: "English", value: "en" },
            { label: "Español", value: "es" },
            { label: "Français", value: "fr" },
            { label: "العربية", value: "ar" },
          ],
        },
        { name: "label", type: "text", admin: { description: "Optional display label; auto-derived from kind + language if blank." } },
        // Report PDFs live in `files`, not `media` — `media` is images-only
        // (Task 8).
        uploadField("file", "files"),
        { name: "body", type: "richText", admin: { description: "In-hub content. Use this OR an uploaded file." } },
        { name: "pages", type: "number" },
        { name: "downloadCount", type: "number", defaultValue: 0, admin: { readOnly: true } },
        { name: "lastDownloaded", type: "date", admin: { readOnly: true } },
      ],
    },
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
    relationshipField("relatedCommunities", "regionalCommunities", { hasMany: true, label: "Regional Communities" }),
    relationshipField("organizations", "organizations", { hasMany: true }),
    relationshipField("tags", "tags", { hasMany: true }),
    {
      // Studio's approve / request-revision / reject document actions, as
      // buttons inside the document. A `ui` field has no database column, so
      // this needs no migration. The gate and the transition table live in
      // payload/hooks/moderation.ts and are shared with the server action.
      name: "moderationActions",
      type: "ui",
      admin: { components: { Field: "@/payload/components/moderation-actions#ModerationActions" } },
    },
    {
      // Named "moderationStatus" for consistency with caseStudies/
      // livedExperiences, which MUST use this name to avoid a Postgres enum
      // collision with Payload's internal `_status` — see case-studies.ts.
      name: "moderationStatus",
      type: "select",
      defaultValue: "approved",
      options: [
        { label: "Pending Review", value: "pending" },
        { label: "Rejected", value: "rejected" },
        { label: "Needs Revision", value: "revision" },
        { label: "Approved (Published)", value: "approved" },
      ],
      admin: { description: "Editorial review state, distinct from Payload's _status. 29/29 real documents are 'approved'." },
    },
    // Internal review data, editor-only at FIELD level: the collection gate
    // decides which documents are public, not what an approved one carries.
    // `lib/content/outputs.ts` selects `submittedBy` only in the gated
    // ownership check at :909, never in a public projection.
    { name: "submittedBy", type: "text", admin: { readOnly: true }, access: { read: isEditorField } },
    { name: "reviewNotes", type: "textarea", access: { read: isEditorField } },
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
    { name: "publishDate", type: "date", admin: { date: { pickerAppearance: "dayOnly" } } },
    { name: "year", type: "number" },
    { name: "featured", type: "checkbox", defaultValue: false },
    { name: "totalDownloadCount", type: "number", defaultValue: 0, admin: { readOnly: true } },
    {
      name: "migratedFromReport",
      type: "text",
      admin: { readOnly: true, description: "Carries the legacy report _id through the A3 migration (provenance + dedupe). 29/29 real documents set." },
    },
    {
      name: "orderRank",
      type: "text",
      admin: { hidden: true, description: "Sanity's LexoRank orderRank string, preserved for editorial ordering." },
    },
  ],
};
