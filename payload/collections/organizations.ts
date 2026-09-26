import type { CollectionConfig } from "payload";
import { isAnyone, isEditor } from "@/payload/access";
import { imageField, relationshipField } from "@/payload/blocks/shared";
import { localizedTextarea } from "@/payload/fields/localized";
import { sanityUpdatedAt } from "@/payload/fields/sanity-timestamps";
import { documentIdField } from "@/payload/fields/document-id";
import { slugField } from "@/payload/fields/slug";

/**
 * Mirrors sanity/schemas/documents/organization.ts. Verified against
 * production_2 (2026-09-03, 24 documents, 0 drafts): real organizations are
 * overwhelmingly stub records — only `name`, `slug`, `type` and `verified`
 * (22/24) are ever populated. `description`, `logo`, `website`, `email`,
 * `headquarters`, `place`, `offices`, `locationDetails`, `regionalCommunity`,
 * `socialMedia`, `tags`, `orderRank` and `acronym` are **0/24** on every
 * field checked. None of that is a *shape* disagreement — every field that
 * does carry a value matches its schema exactly (`name`/`type` plain
 * strings, `slug` a real slug) — it's sparsity, not divergence, so every
 * field is still modelled: they're live, currently-offered Studio fields
 * (not orphaned like Task 3's `colorVariant`), just not yet authored for
 * most of these 24 records.
 *
 * `name` is a plain string here (unlike `tag`/`regionalCommunity`'s
 * localized `{en,es,fr,ar}` object) — `description` is the one genuinely
 * localized field, confirmed by lib/content/taxonomy.ts's own
 * `Organization`/`RawOrganization` types.
 */
export const Organizations: CollectionConfig = {
  slug: "organizations",
  admin: {
    group: "People & places",
    useAsTitle: "name",
    defaultColumns: ["name", "acronym", "type", "verified"],
  },
  access: {
    read: isAnyone,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  fields: [
    // Sanity's _id, preserved verbatim so the import is idempotent and the
    // handful of Prisma rows referencing content ids keep working.
    documentIdField,
    sanityUpdatedAt,
    { name: "name", type: "text", required: true },
    slugField("name"),
    { name: "acronym", type: "text", admin: { description: "e.g. WHO, UN." } },
    {
      name: "type",
      type: "select",
      required: true,
      options: [
        { label: "NGO", value: "ngo" },
        { label: "Research Institution", value: "research" },
        { label: "University", value: "university" },
        { label: "Government Agency", value: "government" },
        { label: "International Organization", value: "international" },
        { label: "Private Company", value: "company" },
        { label: "Community Organization", value: "community" },
        { label: "Foundation", value: "foundation" },
        { label: "Other", value: "other" },
      ],
    },
    localizedTextarea("description"),
    imageField("logo"),
    { name: "website", type: "text", admin: { description: "Full URL, e.g. https://example.org." } },
    { name: "email", type: "email" },
    { name: "headquarters", type: "point", admin: { description: "Headquarters location." } },
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
    {
      name: "offices",
      type: "array",
      fields: [
        { name: "location", type: "point" },
        { name: "name", type: "text" },
        { name: "address", type: "textarea" },
        { name: "isPrimary", type: "checkbox", defaultValue: false },
      ],
    },
    {
      name: "locationDetails",
      type: "group",
      fields: [
        { name: "country", type: "text" },
        { name: "city", type: "text" },
        { name: "region", type: "text" },
      ],
    },
    relationshipField("regionalCommunity", "regionalCommunities", {
      admin: { description: "Which regional community does this organization belong to?" },
    }),
    {
      name: "socialMedia",
      type: "group",
      fields: [
        { name: "twitter", type: "text" },
        { name: "linkedin", type: "text" },
        { name: "facebook", type: "text" },
        { name: "instagram", type: "text" },
      ],
    },
    relationshipField("tags", "tags", { hasMany: true }),
    { name: "verified", type: "checkbox", defaultValue: false },
    {
      name: "orderRank",
      type: "text",
      admin: { hidden: true, description: "Sanity's LexoRank orderRank string, preserved for editorial ordering." },
    },
  ],
};
