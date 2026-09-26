import { defineType, defineField } from "sanity";
import { Megaphone } from "lucide-react";
import { createLocalizedField } from "../shared/localized-field";

/**
 * Site-wide announcement bar — a SINGLETON. Editors set one announcement that
 * shows as a dismissible top bar across the whole site, in all 4 locales.
 * Message/label are Lane-B localized objects ({en,es,fr,ar}).
 */
export default defineType({
  name: "siteAnnouncement",
  title: "Site Announcement",
  type: "document",
  icon: Megaphone,
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "display", title: "Display & schedule" },
  ],
  fields: [
    defineField({
      name: "enabled",
      title: "Show this announcement",
      type: "boolean",
      description: "Master switch. Turn off to hide the bar everywhere instantly.",
      initialValue: false,
      group: "content",
    }),
    {
      ...createLocalizedField("message", "Message", "string", {
        required: true,
        description: "The announcement text. Keep it short — it sits in a single top bar.",
      }),
      group: "content",
    },
    defineField({
      name: "variant",
      title: "Style",
      type: "string",
      description:
        "Colour treatment. Brand = the CCM blue (general news); Info = light blue; Success = green; Warning = amber (time-sensitive / heads-up).",
      options: {
        list: [
          { title: "Brand (CCM blue)", value: "brand" },
          { title: "Info", value: "info" },
          { title: "Success", value: "success" },
          { title: "Warning", value: "warning" },
        ],
        layout: "radio",
      },
      initialValue: "brand",
      group: "content",
    }),
    defineField({
      name: "link",
      title: "Link (optional)",
      type: "object",
      description: "Make the bar clickable — e.g. link to an event or article.",
      group: "content",
      fields: [
        defineField({
          name: "url",
          title: "URL",
          type: "url",
          validation: (Rule) =>
            Rule.uri({ allowRelative: true, scheme: ["http", "https"] }),
        }),
        createLocalizedField("label", "Link label", "string", {
          description: "The call-to-action text, e.g. 'Read more' / 'Register'.",
        }),
      ],
    }),
    defineField({
      name: "dismissible",
      title: "Let visitors dismiss it",
      type: "boolean",
      description:
        "If on, a visitor can close the bar and it stays closed for them (until you change the message).",
      initialValue: true,
      group: "display",
    }),
    defineField({
      name: "startsAt",
      title: "Start showing at",
      type: "datetime",
      description: "Optional. Leave empty to show immediately when enabled.",
      group: "display",
    }),
    defineField({
      name: "endsAt",
      title: "Stop showing at",
      type: "datetime",
      description: "Optional. Leave empty to show until you turn it off.",
      group: "display",
    }),
  ],
  preview: {
    select: { message: "message.en", enabled: "enabled", variant: "variant" },
    prepare({ message, enabled, variant }) {
      return {
        title: message || "Site Announcement",
        subtitle: `${enabled ? "● Live" : "○ Off"} · ${variant || "brand"}`,
      };
    },
  },
});
