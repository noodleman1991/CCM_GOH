import type { CollectionConfig } from "payload";
import { isEditor, isEditorField, publishedAndApproved } from "@/payload/access";
import { moderationAfterChange } from "@/payload/hooks/moderation";
import { imageField, relationshipField, uploadField } from "@/payload/blocks/shared";
import { localizedRichText, localizedText, localizedTextarea } from "@/payload/fields/localized";
import { sanityUpdatedAt } from "@/payload/fields/sanity-timestamps";

/**
 * Mirrors sanity/schemas/documents/lived-experience.ts. Verified against
 * production_2 (2026-09-03, 56 documents: 35 published + 21 drafts — 35
 * matches the brief's "35 lived experiences" live count exactly). **The 21
 * drafts are the single most damaging thing this phase could lose** — the
 * brief calls them "in-flight moderation work"; `versions.drafts` below is
 * what preserves them.
 *
 * This is the largest schema-vs-data divergence found across all ten
 * collections — real documents were bulk-created by
 * `scripts/migrate-lived-experiences.mjs` and back-filled by
 * `scripts/populate-lived-experience-videos.mjs`, both of which write
 * directly via the Sanity mutation API and were never constrained by the
 * Studio schema:
 *
 * 1. **`status` is 0/56 populated — on every published AND every draft
 *    document.** The schema declares it with `initialValue: "approved"`
 *    and frames it as the sole public-visibility gate, but no real document
 *    has ever had it set. `lib/content/lived-experiences.ts`'s own query
 *    confirms this is expected, not a bug: `status == "approved" ||
 *    !defined(status)` — undefined status is explicitly treated as
 *    approved. Modelled the field per the schema (for the moderation
 *    workflow going forward) but did NOT default it to "approved" the way
 *    the Sanity `initialValue` does, since a Payload default only applies
 *    on creation through the admin UI, and setting one here would misstate
 *    the real data as opted-in rather than simply exempt. Task 12's
 *    importer should leave `status` unset on these 56 records, matching
 *    live behaviour, not synthesize a value. Modelled as `moderationStatus`,
 *    not `status` — see the field's own comment below for why the name has
 *    to differ from Sanity's. `read` uses `publishedAndApproved`
 *    (`payload/access/index.ts`), not `publishedOnly` — its
 *    `moderationStatus: { exists: false }` fallback is what keeps these 56
 *    real, unset-status documents anonymously readable at all; without it
 *    a moderation gate would make every one of them invisible, not just the
 *    unapproved ones.
 * 2. **`region` is stored as a reference to `regionalCommunity` on every
 *    populated document (42/56), not the fixed-7 string code the schema
 *    declares** (`type: "string", options: {list: REGION_OPTIONS}`).
 *    Confirmed on 100% of non-null values — none is ever a bare code like
 *    "ssa". `relatedCommunity` (the schema's actual reference field for
 *    this) is 0/56. `lib/content/taxonomy-options.ts`'s own comment
 *    documents the intended "dual-field transition" (region code with
 *    fallback to the community slug); in practice, for this content type,
 *    only the reference shape was ever populated. Modelled `region` as a
 *    `relationship` to `regionalCommunities` — matching 100% of real data —
 *    NOT a `select` of region codes, which 0% of real data would satisfy.
 * 3. **`videoUrl` — a field the schema never declares, populated on 56/56
 *    real documents and read throughout the live app**
 *    (`lib/content/lived-experiences.ts`, `case-studies.ts`, `discovery.ts`,
 *    `outputs.ts`, `pages.ts` all project it). Written by
 *    `populate-lived-experience-videos.mjs` alongside the schema's own
 *    `videoLink` (also 56/56, identical value). Added as a plain text
 *    field — dropping it would silently break every one of those live
 *    query sites' expected shape on import.
 * 4. **`language` (document-level, Lane A intent) is dropped, not
 *    modelled.** Every real document sets it to "en" and only ever
 *    populates `title.en`/`description.en` — practically Lane A behaviour
 *    even though it's stored in a Lane B `{en,...}` container. Payload's
 *    own locale mechanism (see `payload/fields/localized.ts`) replaces
 *    this outright: `localizedText`/`localizedRichText` collapse a
 *    single-language document onto one Payload document with only the
 *    `en` locale populated, no separate field needed.
 */
export const LivedExperiences: CollectionConfig = {
  slug: "livedExperiences",
  versions: { drafts: true },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "featured", "publishedAt"],
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
  hooks: { afterChange: [moderationAfterChange("livedExperiences")] },
  fields: [
    {
      name: "id",
      type: "text",
      required: true,
      admin: { hidden: true },
      // Sanity's _id, preserved verbatim so the import is idempotent.
    },
    sanityUpdatedAt,
    {
      name: "format",
      type: "select",
      defaultValue: "video",
      options: [
        { label: "Video", value: "video" },
        { label: "Audio", value: "audio" },
        { label: "Written", value: "written" },
      ],
      admin: { description: "0/56 real documents have this set — every existing document is a video by default." },
    },
    localizedText("title", { required: true }),
    { name: "slug", type: "text", required: true, unique: true },
    localizedTextarea("description"),
    localizedTextarea("issue", { label: "The issue / theme" }),
    localizedTextarea("personContext", { label: "About the person sharing" }),
    localizedRichText("body", { label: "Story body" }),
    {
      name: "videoSource",
      type: "select",
      options: [
        { label: "YouTube", value: "youtube" },
        { label: "Vimeo", value: "vimeo" },
        { label: "Uploaded file", value: "upload" },
      ],
      admin: { description: "Optional. When empty, the source is derived from videoLink/videoUrl." },
    },
    { name: "videoLink", type: "text", label: "Media Link" },
    {
      name: "videoUrl",
      type: "text",
      admin: {
        description:
          "NOT in the Sanity schema — real data (56/56), written by scripts/populate-lived-experience-videos.mjs and read throughout lib/content/*.ts. See collection header note.",
      },
    },
    // `files`, not `media` — a video is not an image and `media` is now
    // images-only (Task 8). 0/56 populated; the schema restricts it to
    // video/mp4 + video/webm, which `files` allows.
    uploadField("videoFile", "files", { label: "Video File" }),
    imageField("thumbnail"),
    { name: "duration", type: "text", admin: { description: "e.g. '5:30', '1:45:00'." } },
    { name: "publishedAt", type: "date", index: true },
    relationshipField("author", "authors", { required: true }),
    relationshipField("relatedCommunity", "regionalCommunities", {
      admin: { description: "The schema's own reference field for this — 0/56 real documents populate it. See 'region' below." },
    }),
    relationshipField("region", "regionalCommunities", {
      admin: {
        description:
          "Modelled as a relationship, NOT the fixed-7 select the schema declares — 100% of real data (42/56) stores a regionalCommunity reference here, 0% a string code. See collection header note.",
      },
    }),
    {
      name: "layout",
      type: "select",
      defaultValue: "story",
      options: [
        { label: "Story (narrative + photography)", value: "story" },
        { label: "Feature (one bold statement)", value: "feature" },
        { label: "Report (evidence + data; sticky 'At a glance')", value: "report" },
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
    { name: "location", type: "point", label: "Location (Map)" },
    {
      name: "place",
      type: "group",
      fields: [
        { name: "point", type: "point" },
        { name: "text", type: "text", admin: { description: 'Human-readable place, e.g. "Nakuru, Kenya".' } },
        {
          name: "precision",
          type: "select",
          defaultValue: "country",
          options: [
            { label: "Exact point", value: "exact" },
            { label: "City", value: "city" },
            { label: "Country", value: "country" },
            { label: "Region only (no pin)", value: "region" },
          ],
        },
        { name: "countryCode", type: "text", admin: { description: "ISO alpha-3, e.g. KEN." } },
      ],
    },
    relationshipField("organizations", "organizations", { hasMany: true }),
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
    { name: "featured", type: "checkbox", index: true, defaultValue: false },
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
      // Named "moderationStatus", NOT "status" — a field literally named
      // `status` collides with Payload's internal `_status` at the Postgres
      // level once `versions.drafts` is enabled (both generate the same
      // `enum_lived_experiences_status` type name). Verified against a real
      // failed migration on caseStudies before this was renamed — see that
      // collection's header comment for the exact error.
      name: "moderationStatus",
      index: true,
      type: "select",
      options: [
        { label: "Pending Review", value: "pending" },
        { label: "Rejected", value: "rejected" },
        { label: "Needs Revision", value: "revision" },
        { label: "Approved (Published)", value: "approved" },
      ],
      admin: {
        description:
          "Editorial review state — NOT Payload's _status. 0/56 real documents have this set; the live app treats an unset status as approved. See collection header note.",
      },
    },
    // Internal review data, editor-only at FIELD level: `publishedAndApproved`
    // decides which documents are public, not what an approved one may carry
    // in its body. `lib/content/lived-experiences.ts` selects both only in the
    // gated `loadEditableLivedExperience`, never in a public projection.
    {
      name: "submittedBy",
      type: "text",
      admin: { readOnly: true, description: "Clerk User ID of the submitter (in-app form submissions)." },
      access: { read: isEditorField },
    },
    { name: "reviewNotes", type: "textarea", access: { read: isEditorField } },
    { name: "meta_title", type: "text" },
    { name: "meta_description", type: "textarea" },
    { name: "noindex", type: "checkbox", defaultValue: false },
    imageField("ogImage"),
  ],
};
