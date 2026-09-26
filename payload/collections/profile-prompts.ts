import type { CollectionConfig } from "payload";
import { isAnyone, isEditor } from "@/payload/access";
import { localizedText } from "@/payload/fields/localized";
import { sanityUpdatedAt } from "@/payload/fields/sanity-timestamps";
import { documentIdField } from "@/payload/fields/document-id";

/**
 * Mirrors sanity/schemas/documents/profile-prompt.ts. Verified against
 * production_2 (2026-09-03, 3 documents, 0 drafts — matches the brief's "3
 * profile prompts" exactly). No `versions.drafts`.
 *
 * No schema-vs-data disagreements found — all 3 real documents match the
 * schema exactly: `prompt` fully localized (all 4 locale keys on every
 * document), `category` and `active` set, `orderRank` a genuine LexoRank
 * string on all 3.
 */
export const ProfilePrompts: CollectionConfig = {
  slug: "profilePrompts",
  admin: {
    group: "Tags & vocabularies",
    useAsTitle: "prompt",
    defaultColumns: ["prompt", "category", "active"],
  },
  access: {
    read: isAnyone,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  fields: [
    documentIdField,
    sanityUpdatedAt,
    localizedText("prompt", {
      required: true,
      admin: {
        description:
          "A conversational prompt members answer, e.g. 'Climate change feels personal to me because…'. Keep it open and inviting.",
      },
    }),
    {
      name: "category",
      type: "select",
      defaultValue: "about",
      options: [
        { label: "About you", value: "about" },
        { label: "Collaboration", value: "collaboration" },
        { label: "Lived experience", value: "lived-experience" },
        { label: "Research & work", value: "research" },
      ],
    },
    {
      name: "active",
      type: "checkbox",
      defaultValue: true,
      admin: { description: "Only active prompts are offered to members. Turn off to retire a prompt without losing existing answers." },
    },
    {
      name: "orderRank",
      type: "text",
      admin: { hidden: true, description: "Sanity's LexoRank orderRank string, preserved for editorial ordering." },
    },
  ],
};
