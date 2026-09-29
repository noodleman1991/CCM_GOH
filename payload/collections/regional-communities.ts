import type { Block, CollectionConfig } from "payload";
import { communityRead, communityUpdate, isEditor, staffOnlyField } from "@/payload/access";
import { syncLeadRoles } from "@/payload/hooks/sync-lead-roles";
import { imageField, relationshipField } from "@/payload/blocks/shared";
import { localizedText, localizedTextarea } from "@/payload/fields/localized";
import { sanityUpdatedAt } from "@/payload/fields/sanity-timestamps";
import { documentIdField } from "@/payload/fields/document-id";
import { slugField } from "@/payload/fields/slug";
import { REGION_OPTIONS } from "@/payload/fields/regions";
import { sectionsField } from "@/payload/fields/sections";
import { livePreviewAt } from "@/payload/fields/live-preview";
import { withChapter } from "@/payload/blocks/chapter";
import { withShortEnumNames } from "@/payload/fields/short-enum-names";
import { communityHeader, communityMembers } from "@/payload/blocks";
import { HOMEPAGE_SECTIONS } from "@/payload/globals/homepage";

/** What a community page can hold (CMS project 3): its own header and
 *  members, plus the whole homepage library — each with a "Page menu" setting. */
export const COMMUNITY_SECTIONS: Block[] = [communityHeader, ...HOMEPAGE_SECTIONS, communityMembers]
  .map(withChapter)
  // `regional_communities` is a long table name; keep every enum within Postgres's 63 characters.
  .map(withShortEnumNames);

/**
 * Mirrors sanity/schemas/documents/regional-community.ts. Verified against
 * production_2 (2026-09-03, 7 documents, 0 drafts) — the fixed-7 regions,
 * all active, none featured, `name` fully localized on every document
 * (all 4 locale keys present on all 7):
 *
 * - `region` values in real data (csa, esea, enam, lac, nawa, oce, ssa)
 *   match `REGION_OPTIONS` (lib/content/taxonomy-options.ts) exactly —
 *   kept in payload/fields/regions.ts rather than imported, since Payload code stays out of
 *   `lib/content/` (Task 1/3's established boundary: nothing under
 *   `lib/content/`, `components/`, or existing `app/api/`).
 * - `members` (person ref + role, meant to link authors to a community from
 *   the community side) is **0/7 populated** — every real membership lives
 *   on the *other* side instead: `author.communityMemberships[]` (79/99
 *   authors, see payload/collections/authors.ts). Kept for schema parity —
 *   it's a real, currently-offered field — but flagged since an importer
 *   built from this schema alone might expect community-side membership
 *   data that doesn't exist.
 * - `coverImage`, `boundaries`, `contact` are also 0/7 today; not shape
 *   disagreements (nothing stores a different shape than declared), just
 *   unused live fields, same treatment as Task 3's `tagLine`.
 */

export const RegionalCommunities: CollectionConfig = {
  slug: "regionalCommunities",
  admin: {
    group: "Site pages",
    useAsTitle: "name",
    defaultColumns: ["name", "region", "_status"],
    description: "One record per regional community: its details and its page.",
    livePreview: livePreviewAt((data, locale) => `/${locale}/communities/${String(data.slug ?? "")}`),
  },
  // Drafts (CMS project 3): the community's page edits autosave as a draft.
  // Every community was marked published by the migration that added this —
  // reads of a drafts-enabled collection are published-only everywhere.
  versions: { drafts: { autosave: { interval: 1500 } }, maxPerDoc: 50 },
  // Community leads (editor-experience spec §3.5) may read their drafts and
  // edit + publish only the communities that list them in `leadIds`.
  access: {
    read: communityRead,
    readVersions: communityUpdate,
    create: isEditor,
    update: communityUpdate,
    delete: isEditor,
  },
  hooks: { afterChange: [syncLeadRoles] },
  fields: [
    // Sanity's _id, preserved verbatim so the import is idempotent and the
    // handful of Prisma rows referencing content ids keep working.
    documentIdField,
    sanityUpdatedAt,
    // The community's address — kept up front, outside "Details".
    // Staff-only: changing the address would break the site's links.
    { ...slugField("name"), access: { update: staffOnlyField } },
    {
      name: "leadIds",
      type: "text",
      hasMany: true,
      label: "Community leads",
      access: { update: staffOnlyField },
      admin: {
        description: "People who can edit and publish this community's page. They get access once this community is published.",
        components: { Field: "@/payload/components/lead-picker#LeadPicker" },
      },
    },
    {
      type: "collapsible",
      label: "Details",
      admin: { initCollapsed: true },
      fields: [
        localizedText("name", { required: true }),
        {
          name: "region",
          type: "select",
          options: REGION_OPTIONS,
          access: { update: staffOnlyField },
          admin: { description: "Fixed-7 region short code." },
        },
        imageField("coverImage"),
        {
          name: "boundaries",
          type: "array",
          admin: { description: "Geographic boundary points." },
          fields: [{ name: "point", type: "point" }],
        },
        {
          name: "members",
          type: "array",
          access: { update: staffOnlyField },
          admin: { description: "Members and authors associated with this community." },
          fields: [
            relationshipField("person", "authors", { required: true }),
            { name: "role", type: "text", admin: { description: "Their role or position within this community." } },
          ],
        },
        {
          name: "contact",
          type: "group",
          label: "Regional Contact",
          fields: [
            { name: "name", type: "text" },
            { name: "email", type: "email" },
            { name: "phone", type: "text" },
            relationshipField("organization", "organizations"),
          ],
        },
        { name: "featured", type: "checkbox", defaultValue: false },
        { name: "active", type: "checkbox", defaultValue: true },
      ],
    },
    {
      name: "orderRank",
      type: "text",
      admin: { hidden: true, description: "Sanity's LexoRank orderRank string, preserved for editorial ordering." },
    },
    ...sectionsField({ blocks: COMMUNITY_SECTIONS }),
    localizedText("meta_title", { label: "Meta Title" }),
    localizedTextarea("meta_description", { label: "Meta Description" }),
    { name: "noindex", type: "checkbox", defaultValue: false, label: "No Index" },
    imageField("ogImage"),
  ],
};
