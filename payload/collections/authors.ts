import type { CollectionConfig } from "payload";
import { isEditor, isEditorField, publishedOnly } from "@/payload/access";
import { imageField, relationshipField } from "@/payload/blocks/shared";

/**
 * Mirrors sanity/schemas/documents/author.ts. **The only cross-system tie in
 * the whole migration**: Prisma's `User.sanityPersonId` (prisma/schema.prisma:75)
 * references an author's Sanity `_id` by name, and Phase 3's
 * `getAuthorBySanityId` (lib/content/taxonomy.ts:170) depends on it — the
 * root `id` field below must preserve those ids exactly.
 *
 * Verified against production_2 (2026-09-03, 99 documents: 95 published + 4
 * drafts — 95 matches the brief's "95 authors" live count exactly, i.e. that
 * count is published-only):
 *
 * - `slug` is `Rule.required()` in the schema; 95/95 *published* authors
 *   have one, so `required: true` is kept as-is. The one author missing it
 *   is itself one of the 4 drafts (whose `name` is also null) — an
 *   in-progress record, not a published-data violation. `versions.drafts`
 *   (below) is what lets that stay representable without weakening the
 *   constraint for real, published records.
 * - `userId` — the schema's own reverse-link field ("the hub account this
 *   author is the same person as") — is **0/99 populated**. The live
 *   cross-system tie runs the opposite direction today: Prisma's
 *   `User.sanityPersonId` points AT an author id; no author document points
 *   back via `userId`. Kept for schema parity (it's a real, currently-offered
 *   field), flagged here since an importer built from the schema alone might
 *   assume it carries data.
 * - `image` is used on 83/99 (only 3/83 set `alt`) — modelled with the
 *   shared `imageField` helper (upload + localized alt), same shape as every
 *   other Sanity `image` field in this migration.
 * - `communityMemberships` is populated on 79/99 (`role` sub-field on only
 *   14/79) — genuine editorial signal, not schema noise, kept as-is.
 *
 * `communityMemberships[].community` relates to `regionalCommunities`,
 * registered in this same task — no forward-reference cast needed here,
 * unlike Task 3's blocks.
 */
export const Authors: CollectionConfig = {
  slug: "authors",
  versions: { drafts: true },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "organizationalAffiliation", "slug"],
  },
  access: {
    read: publishedOnly,
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
      // Sanity's _id, preserved verbatim — the cross-system tie Prisma's
      // User.sanityPersonId depends on. Do not regenerate this on import.
    },
    { name: "name", type: "text", required: true },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
    },
    imageField("image"),
    {
      name: "organizationalAffiliation",
      type: "text",
      admin: { description: "The organization this person is affiliated with." },
    },
    {
      name: "userId",
      type: "text",
      admin: {
        description:
          "Optional reverse link to a hub member (Clerk/Prisma User id). 0/99 real authors populate this today — the live tie runs the other way, via Prisma's User.sanityPersonId.",
      },
      // Editor-only at FIELD level: a Clerk/Prisma user id on a public
      // document. No GROQ projection in lib/content/ selects it, so gating it
      // keeps the migration from publishing an identity link Sanity never did.
      access: { read: isEditorField },
    },
    {
      name: "communityMemberships",
      type: "array",
      admin: { description: "Communities this person is a member of, and their role in each." },
      fields: [
        relationshipField("community", "regionalCommunities", { required: true }),
        { name: "role", type: "text", admin: { description: "Their role or position within this community." } },
      ],
    },
    {
      name: "orderRank",
      type: "text",
      admin: { hidden: true, description: "Sanity's LexoRank orderRank string, preserved for editorial ordering." },
    },
  ],
};
