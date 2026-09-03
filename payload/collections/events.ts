import type { CollectionConfig } from "payload";
import { isEditor, moderationApprovedOnly } from "@/payload/access";
import { imageField, relationshipField } from "@/payload/blocks/shared";
import { localizedRichText, localizedText, localizedTextarea } from "@/payload/fields/localized";

/**
 * Mirrors sanity/schemas/documents/event.ts.
 *
 * Verified against production_2 (2026-09-04): **0 documents, 0 drafts**,
 * measured alongside two non-zero controls (agenda 29, regionalCommunityPage
 * 29) so the zero is a real zero and not an untokened query.
 *
 * The type is empty but **wired**: 17 live references across submission and
 * moderation code. Spec §9 carries it across in full so that launching needs
 * no second migration. Built here; nothing is imported.
 *
 * Because there is no data, the Sanity schema is the only source of truth —
 * "no live document uses it" is not available as a reason to drop a field, so
 * every declared field is ported.
 *
 * ## `status` becomes `moderationStatus`
 *
 * Sanity's `status` is this type's moderation gate, not a lifecycle field, and
 * the app reads it as such: `lib/content/system.ts:144` and
 * `lib/content/discovery.ts:609` both filter `_type == "event" && status ==
 * "approved"`. It is renamed for the same reason as caseStudies and
 * livedExperiences — a Payload field named `status` collides with Payload's
 * own `_status` at the Postgres enum-type level the moment `versions.drafts`
 * is enabled. Phase 3's reader maps `moderationStatus` back onto the `status`
 * that `lib/content/` exposes publicly.
 *
 * Read access is `moderationApprovedOnly`: there is no `_status` here (no
 * drafts), so approval alone is the public gate — which is exactly what the
 * two GROQ filters above do today. Gating on publish state alone was a real
 * security finding earlier in this phase and is not repeated.
 */
export const Events: CollectionConfig = {
  slug: "events",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "startAt", "mode", "moderationStatus"],
  },
  access: {
    read: moderationApprovedOnly,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  fields: [
    { name: "id", type: "text", required: true, admin: { hidden: true } },
    localizedText("title", { required: true }),
    { name: "slug", type: "text", required: true, unique: true },
    localizedTextarea("description"),
    {
      name: "scope",
      type: "select",
      defaultValue: "community",
      options: [
        { label: "Community", value: "community" },
        { label: "Project", value: "project" },
      ],
    },
    { name: "startAt", type: "date", required: true, admin: { date: { pickerAppearance: "dayAndTime" } } },
    { name: "endAt", type: "date", admin: { date: { pickerAppearance: "dayAndTime" } } },
    {
      name: "mode",
      type: "select",
      defaultValue: "online",
      options: [
        { label: "Online", value: "online" },
        { label: "In person", value: "in_person" },
        { label: "Hybrid", value: "hybrid" },
      ],
    },
    {
      name: "locationName",
      type: "text",
      admin: { description: "Venue name or city (for in-person/hybrid). Not localized — venue names are proper nouns." },
    },
    {
      name: "place",
      type: "group",
      admin: { description: "The reusable geotag (spec A2)." },
      fields: [
        { name: "point", type: "point" },
        { name: "text", type: "text", admin: { description: 'Human-readable place, e.g. "Nakuru, Kenya".' } },
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
        { name: "countryCode", type: "text", admin: { description: "ISO alpha-3, e.g. KEN." } },
      ],
    },
    { name: "url", type: "text", label: "Joining / details URL" },
    imageField("coverImage"),
    localizedRichText("body", { label: "Page body" }),
    {
      name: "recordingUrl",
      type: "text",
      admin: { description: "Posted after the event — flips the public page into recap mode." },
    },
    {
      name: "relatedCollaboration",
      type: "text",
      admin: {
        readOnly: true,
        description: "Prisma Collaboration id of the organising workspace, set by the app.",
      },
    },
    {
      name: "linkedProject",
      type: "text",
      admin: { description: "If scope = project: the Collaboration id this event belongs to." },
    },
    relationshipField("relatedCommunity", "regionalCommunities", { label: "Regional community" }),
    {
      name: "moderationStatus",
      type: "select",
      defaultValue: "approved",
      options: [
        { label: "Pending Review", value: "pending" },
        { label: "Rejected", value: "rejected" },
        { label: "Needs Revision", value: "revision" },
        { label: "Approved (Published)", value: "approved" },
      ],
      admin: {
        description:
          "Only 'Approved' events are public. Member/project submissions start as 'Pending Review'. Sanity's `status`.",
      },
    },
    {
      name: "submittedBy",
      type: "text",
      admin: { readOnly: true, description: "Clerk User ID of the submitter (set on in-app submission)." },
    },
    { name: "reviewNotes", type: "textarea", admin: { description: "Internal notes / feedback to the submitter." } },
  ],
};
