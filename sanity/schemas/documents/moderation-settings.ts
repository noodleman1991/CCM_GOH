import { defineType, defineField } from "sanity";
import { ShieldAlert } from "lucide-react";

/**
 * Singleton that lets editors maintain the comment moderation wordlists without
 * a deploy. Two tiers:
 *  - blockTerms : clearly-harmful terms → the comment is rejected outright and
 *                 never shown (auto-removed).
 *  - reviewTerms: borderline terms → the comment is held PENDING for an editor.
 * Terms are matched case-insensitively with Arabic-aware normalization
 * (see lib/moderation/normalize.ts). One term per line; whole-word matching.
 */
export default defineType({
  name: "moderationSettings",
  title: "Comment Moderation",
  type: "document",
  icon: ShieldAlert,
  fields: [
    defineField({
      name: "enabled",
      title: "Wordlist filtering enabled",
      type: "boolean",
      description: "Master switch. Off = no wordlist filtering (anonymous comments are still held for review).",
      initialValue: true,
    }),
    defineField({
      name: "blockTerms",
      title: "Block terms (auto-removed, never shown)",
      type: "array",
      of: [{ type: "string" }],
      description: "Clearly harmful terms (slurs, threats). A comment containing one is rejected and never appears.",
      options: { layout: "tags" },
    }),
    defineField({
      name: "reviewTerms",
      title: "Review terms (held for editor approval)",
      type: "array",
      of: [{ type: "string" }],
      description: "Borderline terms. A comment containing one is held PENDING for review rather than blocked.",
      options: { layout: "tags" },
    }),
  ],
  preview: {
    prepare() {
      return { title: "Comment Moderation" };
    },
  },
});
