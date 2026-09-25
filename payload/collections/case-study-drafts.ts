import type { CollectionConfig } from "payload";
import { ownerOrEditor } from "@/payload/access";
import { relationshipField, uploadField } from "@/payload/blocks/shared";
import { localizedText, localizedTextarea } from "@/payload/fields/localized";
import { sanityUpdatedAt } from "@/payload/fields/sanity-timestamps";
import { documentIdField } from "@/payload/fields/document-id";

/**
 * Mirrors sanity/schemas/documents/case-study-draft.ts. Verified against
 * production_2 (2026-09-03, 1 document, 0 drafts-of-drafts — matches the
 * brief's "1 case-study draft" exactly). No `versions.drafts`: this
 * collection IS the draft/autosave concept itself (a case study submission
 * form's in-progress state), not a document that separately participates in
 * Sanity's own draft/published versioning.
 *
 * **All four operations use `ownerOrEditor`.** These are private, per-user
 * autosave scratch documents — `lib/content/case-studies.ts`'s
 * `saveCaseStudyDraft`/`getLatestCaseStudyDraft` always scope reads to the
 * authenticated owner server-side, and there is no public listing. Exposing
 * every user's in-progress submission to any signed-in visitor would recreate
 * the dataset-wide exposure class the spec's §1 access-control fix (`isAnyone`
 * vs `publishedOnly`) already addressed for public content, and `ownerOrEditor`
 * does not: it returns a `Where` matching the draft's persisted `userId`
 * against the caller's own `clerkId`, so a member sees their own draft and
 * nobody else's, while an editor still gets `true` and can browse the whole
 * in-progress queue for moderation.
 *
 * `read` was `isEditor` while the three write operations were `ownerOrEditor`,
 * which left an owner able to write a document they could not read back — the
 * asymmetry the final review flagged. `read: ownerOrEditor` is the half that
 * changed, rather than tightening the writes to `isEditor`, because the writes
 * are the ones with a live requirement: a `community_member` autosaving their
 * own submission is what this collection is FOR (see below), so editor-only
 * writes would be wrong on their own terms. Widening `read` to the same
 * predicate grants exactly one new thing — an owner reading their own draft —
 * which `getLatestCaseStudyDraft` already does today against Sanity, and it
 * leaves anonymous callers with nothing (`ownerOrEditor` returns `false`
 * without a `clerkId`).
 *
 * `create`/`update`/`delete` use `ownerOrEditor`
 * (`payload/access/index.ts`), NOT `isEditor` alone — these are documents a
 * `community_member` writes themselves through the case-study submission
 * form's autosave, the same way `saveCaseStudyDraft`/`deleteCaseStudyDraft`
 * work against Sanity today (scoped to `userId` server-side, not gated by a
 * Sanity role). An editor-only write gate would work today only because
 * nothing calls Payload's authenticated API yet; the moment Phase 3 routes
 * autosave through it rather than the local API with `overrideAccess: true`,
 * no member could save their own draft. `ownerOrEditor` matches the
 * collection's `userId` field (a Clerk id) against the signed-in user's own
 * `clerkId`, so a member can create/update/delete only their own draft, and
 * editors keep full access on top.
 *
 * **No field-level `access` is needed here**, unlike the moderated
 * collections. This collection's identity data (`userId`, `authors[].userId`,
 * `authors[].email`) is already unreachable anonymously because `read` is
 * owner-or-editor at DOCUMENT level — an anonymous caller gets no document at
 * all, not a document with fields stripped. A field gate would add nothing and
 * would only hide a draft's own owner id from its owner, or from an editor
 * reading it.
 *
 * **The one real document diverges from its schema more than any other
 * collection in this migration**, because `saveCaseStudyDraft()` writes
 * `{...draftData, _type, userId, lastSaved}` directly — whatever shape the
 * client-side form happens to send — with no schema validation at all:
 * - `tags` (schema: array of `reference`) and the undeclared `selectedTags`
 *   (a client-side duplicate of the same list) are both **arrays of plain
 *   id strings**, not reference objects. Modelled as `array` of `text`, not
 *   `relationship` — matching what's actually stored.
 * - `relatedCommunity` (schema: `reference`) is a **plain id string**.
 *   Modelled as `text`, not `relationship`.
 * - `contentLanguage`, `locationText` (`{country, city}`, same shape as
 *   caseStudy's own field), and a top-level `organizationName` are all real,
 *   populated fields **the schema never declares at all** — added here.
 *   `organizationName` in particular is declared in the schema only nested
 *   under `formMetadata`; the real document stores it at the top level
 *   instead (both are kept, since neither is what's actually populated
 *   matches the other's location).
 */
export const CaseStudyDrafts: CollectionConfig = {
  slug: "caseStudyDrafts",
  admin: {
    group: "System",
    // Not an editorial surface: hidden from the nav for everyone but admins.
    hidden: ({ user }) => (user as { role?: string } | null)?.role !== "admin",
    useAsTitle: "title",
    defaultColumns: ["title", "userId", "lastSaved"],
  },
  access: {
    read: ownerOrEditor,
    create: ownerOrEditor,
    update: ownerOrEditor,
    delete: ownerOrEditor,
  },
  fields: [
    documentIdField,
    sanityUpdatedAt,
    { name: "userId", type: "text", required: true, admin: { description: "Clerk User ID of the draft owner." } },
    { name: "lastSaved", type: "date", required: true },
    localizedText("title"),
    localizedTextarea("excerpt"),
    {
      name: "topic",
      type: "select",
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
    { name: "contentLanguage", type: "text", admin: { description: "Not in the Sanity schema — real data (the one draft sets 'en')." } },
    { name: "content", type: "richText" },
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
    {
      name: "tags",
      type: "array",
      admin: { description: "Plain tag id strings, not references — matches what the form actually saves. See collection header note." },
      fields: [{ name: "value", type: "text" }],
    },
    {
      name: "selectedTags",
      type: "array",
      admin: { description: "Not in the Sanity schema — a real duplicate of 'tags' the form also saves." },
      fields: [{ name: "value", type: "text" }],
    },
    {
      name: "authors",
      type: "array",
      fields: [
        { name: "userId", type: "text" },
        { name: "name", type: "text" },
        { name: "email", type: "text" },
        {
          name: "role",
          type: "select",
          defaultValue: "coauthor",
          options: [
            { label: "Lead Author", value: "lead" },
            { label: "Co-Author", value: "coauthor" },
            { label: "Contributor", value: "contributor" },
            { label: "Advisor", value: "advisor" },
          ],
        },
        relationshipField("affiliation", "organizations"),
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
      admin: { description: "Not in the Sanity schema — real data (the one draft has both fields)." },
      fields: [
        { name: "country", type: "text" },
        { name: "city", type: "text" },
      ],
    },
    { name: "studyLocation", type: "point", label: "Primary Study Location" },
    {
      name: "studyAreas",
      type: "array",
      label: "Additional Study Areas",
      fields: [
        { name: "location", type: "point" },
        { name: "name", type: "text" },
        { name: "description", type: "textarea" },
      ],
    },
    relationshipField("organizations", "organizations", { hasMany: true, label: "Associated Organizations" }),
    {
      name: "relatedCommunity",
      type: "text",
      admin: { description: "A plain regionalCommunity id string, not a relationship — matches what the form actually saves. See collection header note." },
    },
    {
      name: "formMetadata",
      type: "group",
      admin: { description: "Additional form state information." },
      fields: [
        { name: "currentStep", type: "text" },
        { name: "completedSections", type: "array", fields: [{ name: "value", type: "text" }] },
        { name: "organizationName", type: "text", admin: { description: "0/1 populated here — see the top-level organizationName field." } },
      ],
    },
    {
      name: "organizationName",
      type: "text",
      admin: { description: "Not in the Sanity schema at this location — the real document stores it top-level, not nested under formMetadata." },
    },
  ],
};
