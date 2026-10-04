import type { CollectionConfig } from "payload";
import { isEditor, isEditorField, publishedAndApproved } from "@/payload/access";
import { moderationAfterChange } from "@/payload/hooks/moderation";
import { searchSyncAfterChange, searchSyncAfterDelete } from "@/payload/hooks/search-sync";
import { relationshipField, uploadField } from "@/payload/blocks/shared";
import { localizedRichText, localizedText, localizedTextarea } from "@/payload/fields/localized";
import { sanityUpdatedAt } from "@/payload/fields/sanity-timestamps";
import { documentIdField } from "@/payload/fields/document-id";
import { slugField } from "@/payload/fields/slug";

/**
 * Mirrors sanity/schemas/documents/case-study.ts. Verified against
 * production_2 (2026-09-03, 28 documents: 27 published + 1 draft — 27
 * matches the brief's "27 case studies" live count exactly, published-only,
 * same pattern Task 4 found for tags/authors).
 *
 * The moderation `status` field (pending/rejected/revision/approved) is kept
 * as its own field, distinct from Payload's built-in `_status` (set by
 * `versions.drafts` below) — named `moderationStatus`, NOT `status`. It is
 * editorial review state — the value the Approve/Reject/Request-Revision/
 * Publish Studio actions write and the public-visibility gate the Sanity
 * frontend reads (`lib/content/pages.ts`'s queries only show `status ==
 * "approved"`). `_status` is Payload's own draft/published version state.
 * Conflating them would make it impossible to hold, e.g., a
 * `pending`-review document that is nonetheless a published `_status`
 * version (or vice versa) — exactly the moderation queue this collection's
 * real data depends on: **approved on 25, pending on 3 — and two of those
 * three pending documents are themselves published (non-draft), not
 * drafts** (`2U42vBhgRaBYxnTE6w726U`,
 * `pbVPtgVbwyH6oOhWZ3wD3a`). That combination — published AND pending — is
 * exactly why `read` uses `publishedAndApproved` below rather than
 * `publishedOnly`: `_status` alone would have served both of those
 * documents, plus their `reviewNotes`/`submittedBy`, to any anonymous
 * caller.
 *
 * **The name had to change, not just the concept.** A field literally named
 * `status` collides with Payload's internal `_status` at the Postgres
 * level once `versions.drafts` is also enabled: both generate a type name
 * that normalizes to `enum_case_studies_status` (Payload strips `_status`'s
 * leading underscore when building the identifier), and Drizzle collapses
 * them onto one enum column. `payload migrate` failed with `invalid input
 * value for enum enum_case_studies_status: "pending"` before this field was
 * renamed to `moderationStatus` — proof the "keep them distinct" guidance
 * is a database-level requirement here, not just a naming convention.
 *
 * **Field-level read access.** `publishedAndApproved` decides which
 * DOCUMENTS an anonymous caller sees; it does not stop an approved, published
 * document from carrying internal data in its own body. `submittedBy`,
 * `reviewNotes`, `reviewedBy`, `reviewedAt`, `notifiedStatus` and the
 * identity sub-fields of `authors[]` (`userId`, `email`, `clerkUserId`,
 * `clerkUsername`, `clerkImageUrl`) therefore each carry
 * `access: { read: isEditorField }`. None of them is rendered on the public
 * case-study page — `reviewNotes`/`reviewedBy`/`reviewedAt` appear only in
 * the editor review form and the submitter's own dashboard
 * (`components/forms/review-context.tsx`,
 * `components/contributions/contribution-row.tsx`), and `authors[].email`
 * only in `case-study-review.tsx`/`case-study-form.tsx` — but
 * `CASE_STUDY_DETAIL_PROJECTION_FRAGMENT` does select them, so without a
 * field gate `/payload-api/caseStudies` would hand every one of them to an
 * anonymous caller. Owner-facing reads run server-side through the Local API,
 * which defaults to `overrideAccess: true` and is unaffected.
 *
 * Schema-vs-data disagreements found:
 * - `authors[]` real entries carry three fields the schema never declares —
 *   `clerkUserId`, `clerkUsername`, `clerkImageUrl` (3/28 entries) — written
 *   directly by the case-study submission form
 *   (`lib/content/case-studies.ts`'s create path), not through the Studio's
 *   schema-constrained editor. Added as plain text fields alongside the
 *   schema's own `userId`/`name`/`email`/`role`/`affiliation` so import
 *   doesn't drop real submitter data. `affiliation` itself is 0/28.
 * - `layout` is declared with `initialValue: "story"` but is 0/28 populated
 *   — Sanity's `initialValue` only applies at document creation in the
 *   Studio UI, so it never backfills existing documents. Kept as a select
 *   with the same default; Task 12's importer should not assume every real
 *   document already has a value.
 * - `relatedContent` (the polymorphic `connection` object) and `projects`
 *   are declared but **0/28 populated**, and `projects`/`connection.target`
 *   reference a `project` document type with **0 live documents anywhere in
 *   production_2** (`report`, another `connection.target` option, is also
 *   0). Not ported — same treatment as Task 3's `colorVariant`: a field
 *   with no real data pointing at a collection this migration has no reason
 *   to create.
 */
export const CaseStudies: CollectionConfig = {
  slug: "caseStudies",
  versions: { drafts: true },
  admin: {
    group: "Hub content",
    useAsTitle: "title",
    defaultColumns: ["title", "moderationStatus", "topic", "featured"],
  },
  access: {
    read: publishedAndApproved,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  // Studio patched a status and left everything else to a Sanity webhook —
  // cache revalidation and the submitter's email — eventually, over the
  // network, and only if delivery succeeded. Here it is the same process and
  // the same call stack. See payload/hooks/moderation.ts.
  // Algolia sync joins the moderation side effects here. It only *schedules*
  // its work — the index write runs after this transaction commits, never
  // inside it. See payload/hooks/search-sync.ts.
  hooks: {
    afterChange: [moderationAfterChange("caseStudies"), searchSyncAfterChange("caseStudies")],
    afterDelete: [searchSyncAfterDelete("caseStudies")],
  },
  fields: [
    // Sanity's _id, preserved verbatim so the import is idempotent and the
    // handful of Prisma rows referencing content ids keep working.
    documentIdField,
    sanityUpdatedAt,
    localizedText("title", { required: true, admin: { description: "Up to 90 characters shows in full on every card; longer titles get cut short there." } }),
    slugField("title"),
    localizedTextarea("excerpt"),
    localizedRichText("content"),
    {
      name: "image",
      type: "group",
      label: "Featured Image",
      fields: [
        uploadField("asset", "media"),
        localizedText("alt", { required: false }),
        { name: "caption", type: "text" },
      ],
    },
    relationshipField("tags", "tags", { hasMany: true }),
    {
      // Free-text tags the submitter proposed and no existing tag matched
      // (lib/tags/fuzzy.ts). Editors only: create the tag in Tags, attach it
      // above, then clear this list. Never rendered publicly.
      name: "suggestedTags",
      type: "text",
      hasMany: true,
      maxRows: 3,
      access: { read: isEditorField },
      admin: {
        position: "sidebar",
        description: "Suggested by the submitter. Create the tag in Tags, attach it, then clear this list.",
      },
    },
    {
      name: "topic",
      type: "select",
      admin: { description: "Retired — replaced by theme tags. Kept only until the topic → tag conversion is confirmed in production." },
      options: [
        { label: "Climate Change & Environment", value: "climate-environment" },
        { label: "Mental Health & Wellbeing", value: "mental-health" },
        { label: "Community Health & Social Care", value: "community-health" },
        { label: "Youth Engagement & Education", value: "youth-education" },
        { label: "Policy Research & Governance", value: "policy-governance" },
        { label: "Technology & Innovation", value: "technology-innovation" },
        { label: "Economic Development", value: "economic-development" },
        { label: "Cultural Heritage & Arts", value: "cultural-arts" },
        { label: "Food Security & Agriculture", value: "food-agriculture" },
        { label: "Urban Planning & Infrastructure", value: "urban-planning" },
        { label: "Human Rights & Social Justice", value: "human-rights" },
        { label: "Migration & Displacement", value: "migration" },
        { label: "Gender Equality", value: "gender-equality" },
        { label: "Disaster Risk & Resilience", value: "disaster-resilience" },
        { label: "Digital Inclusion", value: "digital-inclusion" },
        { label: "Other", value: "other" },
      ],
    },
    {
      name: "layout",
      type: "select",
      defaultValue: "story",
      options: [
        { label: "Story (narrative + photography)", value: "story" },
        { label: "Feature (one bold statement)", value: "feature" },
        { label: "Report (evidence + data; sticky 'At a glance')", value: "report" },
      ],
      admin: { description: "0/28 real documents have this set — Sanity's initialValue never backfilled existing docs." },
    },
    {
      name: "originalLanguage",
      type: "select",
      defaultValue: "en",
      options: [
        { label: "English", value: "en" },
        { label: "Español", value: "es" },
        { label: "Français", value: "fr" },
        { label: "العربية", value: "ar" },
      ],
      admin: { description: "The language the story was written in. Readers of other languages see it with an 'Originally written in' note." },
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
      admin: { description: "Fixed-7 region code, backfilled from the related community." },
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
    {
      name: "submittedBy",
      type: "text",
      admin: { readOnly: true, description: "Clerk User ID of the submitter." },
      access: { read: isEditorField },
    },
    { name: "submittedAt", type: "date" },
    {
      name: "authors",
      type: "array",
      fields: [
        {
          name: "userId",
          type: "text",
          admin: { description: "Clerk User ID (if registered)." },
          access: { read: isEditorField },
        },
        // `name` and `affiliation` are the public byline and stay readable.
        { name: "name", type: "text", required: true },
        { name: "email", type: "text", access: { read: isEditorField } },
        {
          name: "role",
          type: "select",
          defaultValue: "coauthor",
          required: true,
          options: [
            { label: "Lead Author", value: "lead" },
            { label: "Co-Author", value: "coauthor" },
            { label: "Contributor", value: "contributor" },
            { label: "Advisor", value: "advisor" },
          ],
        },
        relationshipField("affiliation", "organizations"),
        // Real submitter data not in the Sanity schema — written directly by
        // the case-study submission form (3/28 real entries). See header note.
        {
          name: "clerkUserId",
          type: "text",
          admin: { description: "Not in the Sanity schema — real submission-form data (3/28 entries)." },
          access: { read: isEditorField },
        },
        { name: "clerkUsername", type: "text", access: { read: isEditorField } },
        { name: "clerkImageUrl", type: "text", access: { read: isEditorField } },
      ],
    },
    {
      name: "studyPeriod",
      type: "group",
      fields: [
        { name: "startDate", type: "date", admin: { date: { pickerAppearance: "dayOnly" } } },
        { name: "endDate", type: "date", admin: { date: { pickerAppearance: "dayOnly" } } },
      ],
    },
    {
      name: "locationText",
      type: "group",
      label: "Study Location (Text)",
      fields: [
        { name: "country", type: "text" },
        { name: "city", type: "text" },
      ],
    },
    { name: "studyLocation", type: "point", label: "Primary Study Location (Map)" },
    { name: "locationDisplayText", type: "text" },
    {
      name: "locationPrecision",
      type: "select",
      defaultValue: "city",
      options: [
        { label: "Exact point", value: "exact" },
        { label: "City", value: "city" },
        { label: "Country", value: "country" },
        { label: "Region only (no pin)", value: "region" },
      ],
    },
    { name: "locationCountryCode", type: "text", label: "Country code (ISO alpha-3)" },
    {
      name: "studyAreas",
      type: "array",
      label: "Additional Study Areas",
      fields: [
        { name: "location", type: "point", required: true },
        { name: "name", type: "text", required: true },
        { name: "description", type: "textarea" },
      ],
    },
    relationshipField("organizations", "organizations", { hasMany: true, admin: { description: "Associated organizations." } }),
    relationshipField("relatedCommunity", "regionalCommunities"),
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
      // Named "moderationStatus", NOT "status" — verified the hard way: a
      // field literally named `status` on a collection with
      // `versions.drafts: true` collides with Payload's own internal
      // `_status` field at the Postgres level. Both generate a type name
      // that normalizes to `enum_case_studies_status` (Payload strips the
      // leading underscore from `_status`), and Drizzle collapses them onto
      // the SAME enum column — `payload migrate` failed with `invalid input
      // value for enum enum_case_studies_status: "pending"` when this field
      // was still named `status` with defaultValue "pending", because that
      // value isn't in `_status`'s own ('draft','published') set. Renaming
      // eliminates the collision entirely; `researchOutputs.moderationStatus`
      // (no drafts today) is named the same for consistency.
      name: "moderationStatus",
      index: true,
      type: "select",
      required: true,
      defaultValue: "pending",
      options: [
        { label: "Pending Review", value: "pending" },
        { label: "Rejected", value: "rejected" },
        { label: "Needs Revision", value: "revision" },
        { label: "Approved (Published)", value: "approved" },
      ],
      admin: {
        description:
          "Editorial review state — NOT Payload's _status (publish state, set by versions.drafts). Only 'Approved' case studies are meant to be publicly visible.",
      },
    },
    { name: "featured", type: "checkbox", index: true, defaultValue: false },
    { name: "publishedAt", type: "date", index: true, admin: { readOnly: true, description: "Set by the Approve action when the case study goes live." } },
    // The review block — internal editorial state, editor-only at field level.
    { name: "reviewNotes", type: "textarea", access: { read: isEditorField } },
    relationshipField("reviewedBy", "authors", { access: { read: isEditorField } }),
    { name: "reviewedAt", type: "date", access: { read: isEditorField } },
    {
      name: "notifiedStatus",
      type: "text",
      admin: { hidden: true, description: "System field — the last status the submitter was emailed about." },
      access: { read: isEditorField },
    },
    { name: "seoTitle", type: "text" },
    { name: "seoDescription", type: "textarea" },
    { name: "canonicalUrl", type: "text", admin: { description: "If this case study was published elsewhere first." } },
  ],
};
