import type { CollectionConfig } from "payload";
import { isEditor, isEditorField, moderationApprovedOnly } from "@/payload/access";
import { moderationAfterChange } from "@/payload/hooks/moderation";
import { imageField, relationshipField } from "@/payload/blocks/shared";
import { localizedRichText, localizedText, localizedTextarea } from "@/payload/fields/localized";
import {
  SLUG_MAX_LENGTH,
  countryCodeValidate,
  endAfterStartValidate,
  urlValidate,
} from "@/payload/fields/validation";
import { documentIdField } from "@/payload/fields/document-id";
import { slugField } from "@/payload/fields/slug";

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
 * drafts), so approval alone is the public gate — strictly
 * `moderationStatus == "approved"`, matching all six live GROQ filters
 * (`lib/content/system.ts:144`, `lib/content/discovery.ts:609`, `:723`,
 * `:728`, `:915`, `:948`), none of which admits an unset status. Gating on
 * publish state alone was a real security finding earlier in this phase and
 * is not repeated.
 *
 * `submittedBy` and `reviewNotes` additionally carry field-level
 * `access.read: isEditorField`. They are a Clerk user id and internal
 * editorial feedback; the public GROQ projections
 * (`APPROVED_EVENTS_QUERY`, `EVENT_BY_SLUG_QUERY`) select neither, and only
 * the gated, drafts-visible `getEditableEventDoc` does. `/payload-api` would
 * otherwise return both on every approved event.
 *
 * Sanity's own validation rules are ported alongside the fields — see
 * `payload/fields/validation.ts`, which also records which of them were
 * `.warning()` in Sanity and are necessarily hard errors here.
 */
export const Events: CollectionConfig = {
  slug: "events",
  admin: {
    group: "Hub content",
    useAsTitle: "title",
    defaultColumns: ["title", "startAt", "mode", "moderationStatus"],
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
  hooks: { afterChange: [moderationAfterChange("events")] },
  fields: [
    documentIdField,
    localizedText("title", { required: true }),
    slugField("title", { maxLength: SLUG_MAX_LENGTH }),
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
    { name: "startAt", type: "date", index: true, required: true, admin: { date: { pickerAppearance: "dayAndTime" } } },
    {
      name: "endAt",
      type: "date",
      admin: { date: { pickerAppearance: "dayAndTime" } },
      validate: endAfterStartValidate,
    },
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
        {
          name: "countryCode",
          type: "text",
          admin: { description: "ISO alpha-3, e.g. KEN." },
          validate: countryCodeValidate,
        },
      ],
    },
    { name: "url", type: "text", label: "Joining / details URL", validate: urlValidate },
    imageField("coverImage"),
    localizedRichText("body", { label: "Page body" }),
    {
      name: "recordingUrl",
      type: "text",
      admin: { description: "Posted after the event — flips the public page into recap mode." },
      validate: urlValidate,
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
      // Studio's approve / request-revision / reject document actions, as
      // buttons inside the document. A `ui` field has no database column, so
      // this needs no migration. The gate and the transition table live in
      // payload/hooks/moderation.ts and are shared with the server action.
      name: "moderationActions",
      type: "ui",
      admin: { components: { Field: "@/payload/components/moderation-actions#ModerationActions" } },
    },
    {
      name: "moderationStatus",
      index: true,
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
      // Editor-only at FIELD level: a Clerk user id on an otherwise-public
      // document. No public GROQ projection selects it.
      access: { read: isEditorField },
    },
    {
      name: "reviewNotes",
      type: "textarea",
      admin: { description: "Internal notes / feedback to the submitter." },
      // Editor-only at FIELD level: internal editorial commentary.
      access: { read: isEditorField },
    },
  ],
};
