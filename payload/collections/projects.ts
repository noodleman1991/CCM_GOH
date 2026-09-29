import type { CollectionConfig } from "payload";
import { isAnyone, isEditor } from "@/payload/access";
import { imageField, relationshipField } from "@/payload/blocks/shared";
import { localizedText, localizedTextarea } from "@/payload/fields/localized";
import { SLUG_MAX_LENGTH, urlValidate } from "@/payload/fields/validation";
import { documentIdField } from "@/payload/fields/document-id";
import { slugField } from "@/payload/fields/slug";

/**
 * Mirrors sanity/schemas/documents/project.ts.
 *
 * Verified against production_2 (2026-09-04): **0 documents, 0 drafts**,
 * measured alongside two non-zero controls (agenda 29, regionalCommunityPage
 * 29) so the zero is a real zero and not an untokened query.
 *
 * Empty but **wired**: 7 live references. Spec §9 carries it across in full so
 * that launching needs no second migration. Built here; nothing is imported.
 * With no data, the Sanity schema is the only source of truth, so every
 * declared field is ported.
 *
 * ## `status` keeps its name here, unlike on events
 *
 * This `status` is a **lifecycle** field (planning / active / completed /
 * on-hold / cancelled), not a moderation gate. Nothing filters projects on
 * `status == "approved"` the way `lib/content/system.ts` and
 * `lib/content/discovery.ts` filter events, so renaming it to
 * `moderationStatus` would misdescribe it. Keeping the two names distinct is
 * the point: `moderationStatus` means "an editor approved this",
 * `status` means "where the project is in its life".
 *
 * **Do not enable `versions: { drafts: true }` on this collection without
 * first renaming this field.** A Payload field named `status` collides with
 * Payload's own `_status` at the Postgres enum-type level once drafts are on,
 * which already cost this phase one failed migration. It is safe today only
 * because this collection has no drafts.
 *
 * Read access is `isAnyone`: there is no moderation field to gate on.
 *
 * `description` is Sanity's explicit four-language object ({en, es, fr, ar}),
 * so it maps directly onto a Payload localized field rather than a group.
 *
 * Sanity's validation rules are ported alongside the fields (slug
 * `maxLength: 96`, `urlRule` on `website`) — see
 * `payload/fields/validation.ts`. One could not be ported faithfully:
 * Sanity's `tags` rule is `Rule.max(6).warning("Aim for 3–4 tags; more than 6
 * dilutes them.")`, a SOFT warning that still saves. Payload's `Validate`
 * returns `string | true` only — a string blocks the save — and there is no
 * warning severity anywhere in its field config, so there is no way to
 * express "hint, but allow". `maxRows: 6` below is therefore a deliberate
 * hardening of a Sanity warning, recorded here rather than left to look like
 * a faithful port.
 */
export const Projects: CollectionConfig = {
  slug: "projects",
  admin: {
    group: "People & organisations",
    useAsTitle: "name",
    defaultColumns: ["name", "acronym", "type", "status"],
  },
  access: {
    read: isAnyone,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  fields: [
    documentIdField,
    localizedText("name", { required: true, label: "Project Name" }),
    slugField("name", { maxLength: SLUG_MAX_LENGTH }),
    { name: "acronym", type: "text", admin: { description: "Short form or acronym of the project name." } },
    localizedTextarea("description"),
    {
      name: "type",
      type: "select",
      defaultValue: "research",
      label: "Project Type",
      options: [
        { label: "Research Project", value: "research" },
        { label: "Implementation Project", value: "implementation" },
        { label: "Pilot Project", value: "pilot" },
        { label: "Community Initiative", value: "community" },
        { label: "Policy Initiative", value: "policy" },
        { label: "Technology Project", value: "technology" },
        { label: "Other", value: "other" },
      ],
    },
    {
      name: "status",
      type: "select",
      defaultValue: "active",
      admin: { description: "Project lifecycle, NOT a moderation gate. See the note at the top of this file." },
      options: [
        { label: "Planning", value: "planning" },
        { label: "Active", value: "active" },
        { label: "Completed", value: "completed" },
        { label: "On Hold", value: "on-hold" },
        { label: "Cancelled", value: "cancelled" },
      ],
    },
    relationshipField("leadOrganization", "organizations", { label: "Lead Organization" }),
    relationshipField("partnerOrganizations", "organizations", {
      hasMany: true,
      label: "Partner Organizations",
    }),
    { name: "startDate", type: "date", admin: { date: { pickerAppearance: "dayOnly" } } },
    { name: "endDate", type: "date", admin: { date: { pickerAppearance: "dayOnly" } } },
    { name: "website", type: "text", label: "Project Website", validate: urlValidate },
    imageField("logo"),
    {
      name: "location",
      type: "point",
      label: "Project Location",
      admin: { description: "Primary location or headquarters of the project." },
    },
    {
      name: "coverageArea",
      type: "array",
      label: "Coverage Area",
      admin: { description: "Areas where the project is active." },
      fields: [
        { name: "location", type: "point" },
        { name: "name", type: "text", label: "Location Name" },
        { name: "description", type: "textarea" },
      ],
    },
    relationshipField("tags", "tags", {
      hasMany: true,
      // Sanity's rule is `Rule.max(6).warning(…)` — a soft hint that still
      // saves. Payload has no warning outcome (see the header note), so this
      // is a hard cap: the only alternative was to drop the rule entirely.
      maxRows: 6,
      admin: { description: "3–4 focused tags work best (6 max). Hard limit here; a soft warning in Sanity." },
    }),
    {
      name: "orderRank",
      type: "text",
      admin: { hidden: true, description: "Sanity's LexoRank orderRank string, preserved for editorial ordering." },
    },
  ],
};
