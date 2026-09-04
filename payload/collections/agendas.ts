import type { CollectionConfig } from "payload";
import { isAnyone, isEditor } from "@/payload/access";
import { imageField, relationshipField, uploadField } from "@/payload/blocks/shared";
import { localizedText, localizedTextarea } from "@/payload/fields/localized";
import { sanityUpdatedAt } from "@/payload/fields/sanity-timestamps";

/**
 * Mirrors sanity/schemas/documents/agenda.ts. Verified against production_2
 * (2026-09-03, 29 documents, 0 drafts — matches the brief's "29 agendas"
 * exactly). No `versions.drafts`.
 *
 * Schema-vs-data disagreements found:
 * - `organizations` and `tags` are declared but **0/29 populated** — kept
 *   for schema parity (live, currently-offered fields, not orphaned).
 * - `orderRank` is only 5/29 populated (most agendas are unordered).
 * - **`_pdfUrls`, a top-level field on 4/29 real documents, is declared
 *   nowhere in the schema and read nowhere in the codebase** (`grep -rn
 *   "_pdfUrls"` across `sanity/`, `lib/`, `scripts/` returns zero hits
 *   beyond the data itself). Its values are Supabase storage URLs
 *   (`https://nbswmzwquzluimyqnfsf.supabase.co/storage/...`) — orphaned
 *   leftovers from the pre-Sanity Supabase migration referenced in recent
 *   git history (`fix(migration): recover the 28 users the Supabase→Clerk
 *   run dropped`). Not ported: dead data with no live consumer, same
 *   treatment as Task 3's `colorVariant`.
 */
export const Agendas: CollectionConfig = {
  slug: "agendas",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "agendaType", "year", "featured"],
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
    },
    sanityUpdatedAt,
    localizedText("title", { required: true }),
    { name: "slug", type: "text", required: true, unique: true },
    localizedText("subtitle"),
    localizedTextarea("description"),
    imageField("coverImage"),
    {
      name: "files",
      type: "array",
      label: "Agenda Files",
      minRows: 1,
      required: true,
      fields: [
        {
          name: "language",
          type: "select",
          required: true,
          options: [
            { label: "English", value: "en" },
            { label: "Español", value: "es" },
            { label: "Français", value: "fr" },
            { label: "العربية", value: "ar" },
          ],
        },
        // Agenda PDFs live in `files`, not `media` — `media` is images-only
        // (Task 8). 29/29 agendas carry at least one, all application/pdf.
        uploadField("file", "files", { required: true }),
        { name: "downloadCount", type: "number", defaultValue: 0, admin: { readOnly: true } },
        { name: "lastDownloaded", type: "date", admin: { readOnly: true } },
      ],
    },
    {
      name: "agendaType",
      type: "select",
      required: true,
      options: [
        { label: "Annual Agenda", value: "annual" },
        { label: "Research Agenda", value: "research" },
        { label: "Policy Brief", value: "policy" },
        { label: "Technical Agenda", value: "technical" },
        { label: "Case Study Agenda", value: "case-study" },
        { label: "White Paper", value: "whitepaper" },
        { label: "Guidelines", value: "guidelines" },
        { label: "Meeting Agenda", value: "agenda" },
        { label: "Meeting Minutes", value: "minutes" },
        { label: "Other", value: "other" },
      ],
    },
    { name: "publishDate", type: "date", required: true, admin: { date: { pickerAppearance: "dayOnly" } } },
    { name: "year", type: "number", required: true, min: 2000, max: 2050 },
    relationshipField("organizations", "organizations", { hasMany: true, label: "Publishing Organizations" }),
    relationshipField("regionalCommunities", "regionalCommunities", { hasMany: true, label: "Regional Communities" }),
    relationshipField("tags", "tags", { hasMany: true }),
    { name: "totalDownloadCount", type: "number", defaultValue: 0, admin: { readOnly: true } },
    { name: "featured", type: "checkbox", defaultValue: false, label: "Featured Agenda" },
    {
      name: "accessLevel",
      type: "select",
      defaultValue: "public",
      options: [
        { label: "Public", value: "public" },
        { label: "Registered Users", value: "registered" },
        { label: "Members Only", value: "members" },
      ],
    },
    {
      name: "orderRank",
      type: "text",
      admin: { hidden: true, description: "Sanity's LexoRank orderRank string, preserved for editorial ordering." },
    },
  ],
};
