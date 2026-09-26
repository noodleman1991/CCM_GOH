import { defineType, defineField } from "sanity";
import { Megaphone } from "lucide-react";

// Submit-story banner (handoff §4.1): a full-bleed CCM-navy band inviting
// people to share their lived experience. All copy fields are OPTIONAL
// overrides — when empty the component falls back to localized i18n defaults,
// so one block works across the en/es/fr/ar homepage docs without duplication.
export default defineType({
  name: "submit-story-banner",
  type: "object",
  title: "Submit Story Banner",
  icon: Megaphone,
  fields: [
    defineField({ name: "padding", type: "section-padding" }),
    defineField({
      name: "title",
      type: "string",
      description: "Optional override; defaults to the localized “Share your story”.",
    }),
    defineField({
      name: "subtitle",
      type: "text",
      rows: 2,
      description: "Optional override; defaults to the localized invitation copy.",
    }),
    defineField({
      name: "ctaLabel",
      title: "CTA label",
      type: "string",
      description: "Optional override; defaults to the localized “Submit your story”. Always links to the lived-experience submit flow.",
    }),
    defineField({
      name: "illustration",
      type: "image",
      options: { hotspot: true },
      description: "Optional decorative hub-character illustration shown at the inline-end of the band.",
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({ title: title || "Submit Story Banner" }),
  },
});
