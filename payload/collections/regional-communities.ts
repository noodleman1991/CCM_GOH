import type { CollectionConfig } from "payload";
import { isAnyone, isEditor } from "@/payload/access";
import { imageField, relationshipField } from "@/payload/blocks/shared";
import { localizedText } from "@/payload/fields/localized";

/**
 * Mirrors sanity/schemas/documents/regional-community.ts. Verified against
 * production_2 (2026-09-03, 7 documents, 0 drafts) — the fixed-7 regions,
 * all active, none featured, `name` fully localized on every document
 * (all 4 locale keys present on all 7):
 *
 * - `region` values in real data (csa, esea, enam, lac, nawa, oce, ssa)
 *   match `REGION_OPTIONS` (lib/content/taxonomy-options.ts) exactly —
 *   inlined below rather than imported, since Payload code stays out of
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
const REGION_OPTIONS = [
  { label: "Sub-Saharan Africa", value: "ssa" },
  { label: "Northern Africa & Western Asia", value: "nawa" },
  { label: "Central & Southern Asia", value: "csa" },
  { label: "Eastern & South-Eastern Asia", value: "esea" },
  { label: "Latin America & the Caribbean", value: "lac" },
  { label: "Oceania", value: "oce" },
  { label: "Europe & Northern America", value: "enam" },
];

export const RegionalCommunities: CollectionConfig = {
  slug: "regionalCommunities",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "region", "active", "featured"],
  },
  access: {
    read: isAnyone,
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
      // Sanity's _id, preserved verbatim so the import is idempotent and the
      // handful of Prisma rows referencing content ids keep working.
    },
    localizedText("name", { required: true }),
    { name: "slug", type: "text", required: true, unique: true },
    {
      name: "region",
      type: "select",
      options: REGION_OPTIONS,
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
    {
      name: "orderRank",
      type: "text",
      admin: { hidden: true, description: "Sanity's LexoRank orderRank string, preserved for editorial ordering." },
    },
  ],
};
