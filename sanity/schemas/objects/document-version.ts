import { defineType, defineField } from "sanity";

/**
 * A single version of an output document, in one language (redesign
 * SANITY_SCHEMA §4). Held as `versions: [documentVersion]` on output-bearing
 * types (researchOutput / caseStudy / dataset / fundingApplication). A version
 * carries EITHER an uploaded file (PDF/DOCX/…) OR in-hub rich `body`, plus a
 * `kind` (summary/full/…) and `lang`, so the Documents tab can show a
 * version × language chip switcher. `label` auto-derives from kind+lang if blank.
 */
export const VERSION_KINDS = [
  { title: "Summary", value: "summary" },
  { title: "Full", value: "full" },
  { title: "Brief", value: "brief" },
  { title: "Deck", value: "deck" },
] as const;

const LANGS = [
  { title: "English", value: "en" },
  { title: "Español", value: "es" },
  { title: "Français", value: "fr" },
  { title: "العربية", value: "ar" },
] as const;

const documentVersion = defineType({
  name: "documentVersion",
  title: "Version",
  type: "object",
  fields: [
    defineField({
      name: "kind",
      title: "Kind",
      type: "string",
      options: { list: [...VERSION_KINDS] },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "lang",
      title: "Language",
      type: "string",
      options: { list: [...LANGS] },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "label",
      title: "Label",
      type: "string",
      description: "Optional display label; auto-derived from kind + language if left blank.",
    }),
    defineField({
      name: "file",
      title: "File",
      type: "file",
      description: "Uploaded document (PDF/DOCX/XLSX/PPTX). Use this OR the in-hub body.",
      options: { accept: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx", storeOriginalFilename: true },
    }),
    defineField({
      name: "body",
      title: "In-hub body",
      type: "styled-block-content",
      description: "Read-in-the-hub rich content. Use this OR an uploaded file.",
    }),
    defineField({
      name: "pages",
      title: "Pages",
      type: "number",
      validation: (Rule) => Rule.min(1).integer(),
    }),
    // Download tracking (parity with report files[]), per-version.
    defineField({ name: "downloadCount", title: "Download Count", type: "number", initialValue: 0, readOnly: true }),
    defineField({ name: "lastDownloaded", title: "Last Downloaded", type: "datetime", readOnly: true }),
  ],
  preview: {
    select: { kind: "kind", lang: "lang", label: "label" },
    prepare({ kind, lang, label }) {
      const k = (kind as string) || "version";
      const l = ((lang as string) || "").toUpperCase();
      return { title: label || `${k.charAt(0).toUpperCase() + k.slice(1)} (${l})` };
    },
  },
});

export default documentVersion;
