import type { GlobalConfig } from "payload";
import { isEditor } from "@/payload/access";

/**
 * Mirrors sanity/schemas/documents/moderation-settings.ts. Verified against
 * production_2 (2026-09-03): **0 documents** — the wordlists have never been
 * authored, and `lib/moderation/*` runs on its built-in defaults. Spec §6
 * keeps the type anyway ("live code references"), so it is built here and
 * imports nothing.
 *
 * Two tiers, matching the moderation pipeline:
 *   blockTerms  — clearly harmful; the comment is rejected and never shown.
 *   reviewTerms — borderline; the comment is held PENDING for an editor.
 *
 * **Both lists are arrays of `{ term }` rather than arrays of bare strings.**
 * Sanity stores `array of string`; Payload has no scalar array field, so each
 * entry needs a named field to live in. The importer flattens
 * `["slur", ...]` to `[{ term: "slur" }, ...]`, and a reader maps back with
 * `.map(t => t.term)`. Nothing is lost — but it is a shape change, so it is
 * recorded rather than discovered.
 *
 * Terms are not localized. They are matched case-insensitively with
 * Arabic-aware normalization (`lib/moderation/normalize.ts`) against comments
 * in any language, so one list serves all four locales — localizing it would
 * mean a term blocked in English silently passing in Arabic.
 *
 * **Read is restricted to editors**, unlike the other globals. The wordlist
 * is the filter's specification: published to anonymous REST callers it tells
 * anyone exactly which terms are caught and, by omission, which are not. The
 * moderation pipeline reads it through the Local API, which bypasses access
 * control by default, so this costs nothing server-side.
 */
export const ModerationSettings: GlobalConfig = {
  slug: "moderationSettings",
  admin: { group: "System" },
  label: "Comment Moderation",
  access: {
    read: isEditor,
    update: isEditor,
  },
  fields: [
    {
      name: "enabled",
      type: "checkbox",
      defaultValue: true,
      label: "Wordlist filtering enabled",
      admin: {
        description:
          "Master switch. Off = no wordlist filtering (anonymous comments are still held for review).",
      },
    },
    {
      name: "blockTerms",
      type: "array",
      label: "Block terms (auto-removed, never shown)",
      admin: {
        description:
          "Clearly harmful terms (slurs, threats). A comment containing one is rejected and never appears.",
      },
      fields: [{ name: "term", type: "text", required: true }],
    },
    {
      name: "reviewTerms",
      type: "array",
      label: "Review terms (held for editor approval)",
      admin: {
        description:
          "Borderline terms. A comment containing one is held PENDING for review rather than blocked.",
      },
      fields: [{ name: "term", type: "text", required: true }],
    },
  ],
};
