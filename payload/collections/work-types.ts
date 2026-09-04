import type { CollectionConfig } from "payload";
import { isAnyone, isEditor } from "@/payload/access";
import { localizedText, localizedTextarea } from "@/payload/fields/localized";
import { sanityUpdatedAt } from "@/payload/fields/sanity-timestamps";

/**
 * Mirrors sanity/schemas/documents/work-type.ts. Verified against
 * production_2 (2026-09-03, 6 documents, 0 drafts): `key` is uppercase-plus-
 * underscore on all 6 (RESEARCH, POLICY, NGO, COMMUNITY_ORGANIZATION,
 * EDUCATION_TEACHING, LIVED_EXPERIENCE_EXPERT) and must match Prisma's enum
 * exactly (per the schema's own admin description) — Phase 3's concern, not
 * this task's, but the field is kept a plain unique text rather than a
 * closed `select` so an as-yet-unseen future key doesn't get rejected.
 *
 * `label`/`description` are Sanity's `internationalizedArrayString`/
 * `internationalizedArrayText` — an array of `{_key, value}` pairs, a THIRD
 * i18n lane distinct from the `{en,es,fr,ar}` object lane `tag`/
 * `regionalCommunity` use (see payload/fields/localized.ts's doc comment,
 * which only names two). Semantically it's the same one-string-per-locale
 * data Payload's `localized: true` already models — all 6 real documents
 * populate all 4 locale keys on both fields — so it collapses onto the same
 * `localizedText`/`localizedTextarea` helpers; Task 12's importer does the
 * array-to-object unwrap on the way in.
 */
export const WorkTypes: CollectionConfig = {
  slug: "workTypes",
  admin: {
    useAsTitle: "key",
    defaultColumns: ["key", "label", "order", "isActive"],
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
    sanityUpdatedAt,
    {
      name: "key",
      type: "text",
      required: true,
      unique: true,
      admin: {
        description:
          "Uppercase with underscores (e.g. RESEARCH, NGO). Must match Prisma's WorkType enum values exactly.",
      },
    },
    localizedText("label", { required: true }),
    localizedTextarea("description"),
    {
      name: "order",
      type: "number",
      defaultValue: 0,
      admin: { description: "Display order in forms (lower numbers first)." },
    },
    {
      name: "isActive",
      type: "checkbox",
      defaultValue: false,
      admin: { description: "Whether this work type is available for selection." },
    },
  ],
};
