import type { CollectionConfig } from "payload";
import { isEditor } from "@/payload/access";
import { relationshipField, uploadField } from "@/payload/blocks/shared";
import { localizedText, localizedTextarea } from "@/payload/fields/localized";

/**
 * Mirrors sanity/schemas/documents/case-study-draft.ts. Verified against
 * production_2 (2026-09-03, 1 document, 0 drafts-of-drafts — matches the
 * brief's "1 case-study draft" exactly). No `versions.drafts`: this
 * collection IS the draft/autosave concept itself (a case study submission
 * form's in-progress state), not a document that separately participates in
 * Sanity's own draft/published versioning.
 *
 * `read` access is `isEditor`, not `isAnyone`/`publishedOnly` like the
 * other nine collections. These are private, per-user autosave scratch
 * documents — `lib/content/case-studies.ts`'s `saveCaseStudyDraft`/
 * `getLatestCaseStudyDraft` always scope reads to the authenticated owner
 * server-side; there is no public listing. Exposing every user's
 * in-progress submission to any signed-in visitor would recreate the
 * dataset-wide exposure class the spec's §1 access-control fix (`isAnyone`
 * vs `publishedOnly`) already addressed for public content. The per-user
 * scoping itself belongs at the application layer (a server action calling
 * Payload's local API with an explicit owner filter), same as it does in
 * Sanity today — not modelled as a collection-level access function here.
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
    useAsTitle: "title",
    defaultColumns: ["title", "userId", "lastSaved"],
  },
  access: {
    read: isEditor,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  fields: [
    {
      name: "id",
      type: "text",
      required: true,
      admin: { hidden: true },
    },
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
