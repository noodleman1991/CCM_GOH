import type { CollectionConfig } from "payload";
import { isAnyone, isEditor } from "@/payload/access";
import { localizedText, localizedTextarea } from "@/payload/fields/localized";
import { sanityUpdatedAt } from "@/payload/fields/sanity-timestamps";
import { documentIdField } from "@/payload/fields/document-id";

/**
 * Mirrors sanity/schemas/documents/expertise-area.ts — structurally
 * identical to work-type.ts (see payload/collections/work-types.ts for the
 * shared `key`/internationalized-array-as-localized rationale). Verified
 * against production_2 (2026-09-03, 5 documents, 0 drafts): keys
 * SOCIAL_JUSTICE, EDUCATION, CLIMATE_CHANGE, MENTAL_HEALTH, HEALTH — all
 * uppercase-plus-underscore, all 4 locales populated on both `label` and
 * `description` for every document.
 */
export const ExpertiseAreas: CollectionConfig = {
  slug: "expertiseAreas",
  admin: {
    group: "Settings",
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
    // Sanity's _id, preserved verbatim so the import is idempotent and the
    // handful of Prisma rows referencing content ids keep working.
    documentIdField,
    sanityUpdatedAt,
    {
      name: "key",
      type: "text",
      required: true,
      unique: true,
      admin: {
        description:
          "Uppercase with underscores (e.g. CLIMATE_CHANGE, MENTAL_HEALTH). Must match Prisma's ExpertiseArea enum values exactly.",
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
      admin: { description: "Whether this expertise area is available for selection." },
    },
  ],
};
