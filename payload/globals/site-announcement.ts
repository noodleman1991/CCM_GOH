import type { GlobalConfig } from "payload";
import { isAnyone, isEditor } from "@/payload/access";
import { localizedText } from "@/payload/fields/localized";

/**
 * Mirrors sanity/schemas/documents/site-announcement.ts, whose own header
 * already calls it "a SINGLETON" — hence a global rather than a collection,
 * despite spec §6 listing `siteAnnouncement` among the 19 live collections.
 * Verified against production_2 (2026-09-03): exactly **1 document**, `_id:
 * "siteAnnouncement"`, 0 drafts.
 *
 * This is a **Lane-B** type, unlike homepage/onboardingContent: one document
 * holding `{en, es, fr, ar}` objects on `message` and `link.label`. Both
 * collapse onto `localized: true` directly. The live document has all four
 * languages filled for both.
 *
 * `startsAt`/`endsAt` are unset on the one document (the bar is switched with
 * `enabled`, currently `false`), and are kept — they are a live scheduling
 * feature, not dead weight.
 *
 * Read access is public: the announcement bar renders for anonymous visitors.
 */
export const SiteAnnouncement: GlobalConfig = {
  slug: "siteAnnouncement",
  label: "Site Announcement",
  access: {
    read: isAnyone,
    update: isEditor,
  },
  fields: [
    {
      name: "enabled",
      type: "checkbox",
      defaultValue: false,
      label: "Show this announcement",
      admin: { description: "Master switch. Turn off to hide the bar everywhere instantly." },
    },
    localizedText("message", {
      required: true,
      label: "Message",
      admin: { description: "The announcement text. Keep it short — it sits in a single top bar." },
    }),
    {
      name: "variant",
      type: "select",
      defaultValue: "brand",
      label: "Style",
      admin: {
        description:
          "Colour treatment. Brand = the CCM blue (general news); Info = light blue; Success = green; Warning = amber (time-sensitive / heads-up).",
      },
      options: [
        { label: "Brand (CCM blue)", value: "brand" },
        { label: "Info", value: "info" },
        { label: "Success", value: "success" },
        { label: "Warning", value: "warning" },
      ],
    },
    {
      name: "link",
      type: "group",
      label: "Link (optional)",
      admin: { description: "Make the bar clickable — e.g. link to an event or article." },
      fields: [
        { name: "url", type: "text", label: "URL" },
        localizedText("label", {
          label: "Link label",
          admin: { description: "The call-to-action text, e.g. 'Read more' / 'Register'." },
        }),
      ],
    },
    {
      name: "dismissible",
      type: "checkbox",
      defaultValue: true,
      label: "Let visitors dismiss it",
      admin: {
        description:
          "If on, a visitor can close the bar and it stays closed for them (until you change the message).",
      },
    },
    {
      name: "startsAt",
      type: "date",
      label: "Start showing at",
      admin: { description: "Optional. Leave empty to show immediately when enabled." },
    },
    {
      name: "endsAt",
      type: "date",
      label: "Stop showing at",
      admin: { description: "Optional. Leave empty to show until you turn it off." },
    },
  ],
};
