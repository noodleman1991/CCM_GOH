import type { GlobalConfig } from "payload";
import { isEditor } from "@/payload/access";

/**
 * Editors' controls over member event suggestions (events spec §3.3): a
 * site-wide switch and the people who can't suggest events. The block list
 * lives here rather than on the Prisma user so it ships with Payload's own
 * migrations (Prisma's don't run on deploy).
 */
export const EventSuggestions: GlobalConfig = {
  slug: "eventSuggestions",
  label: "Event suggestions",
  admin: { group: "Settings" },
  access: { read: isEditor, update: isEditor },
  fields: [
    {
      name: "open",
      type: "checkbox",
      label: "Members can suggest events",
      defaultValue: true,
      admin: { description: "Off: the form says suggestions are paused and nothing new comes in." },
    },
    {
      name: "blocked",
      type: "array",
      label: "People who can't suggest events",
      admin: { description: "Added from the review queue's “Stop this person suggesting events”." },
      fields: [
        { name: "userId", type: "text", required: true, label: "Member id" },
        { name: "note", type: "text", label: "Why (only the team sees this)" },
      ],
    },
  ],
};
