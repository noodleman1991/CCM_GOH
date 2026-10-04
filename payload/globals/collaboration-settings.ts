import type { GlobalConfig } from "payload";
import { isEditor } from "@/payload/access";

/**
 * What members can use beyond reading (opening-collaboration spec C1). Every
 * collaboration tool starts off — the live site's state — and the team opens
 * them here, step by step, without a deploy. My contributions starts on and
 * can be hidden from here too (user, 2026-10-04).
 */
export const CollaborationSettings: GlobalConfig = {
  slug: "collaborationSettings",
  label: "Collaboration",
  admin: { group: "Settings", description: "Open the hub's collaboration tools step by step, or hide them again. Changes show within a minute." },
  access: { read: () => true, update: isEditor },
  fields: [
    {
      name: "notifications",
      type: "checkbox",
      label: "Notifications in the hub",
      defaultValue: false,
      admin: { description: "The dot on the account menu and the Notifications page: replies, mentions, what happened to what someone sent, event reminders, connections." },
    },
    {
      name: "people",
      type: "checkbox",
      label: "Open to collaborate and Ask to connect",
      defaultValue: false,
      admin: { description: "Asks members if they're open to collaborating, adds the filter in Find people, and lets members ask to connect." },
    },
    {
      name: "workspaces",
      type: "select",
      label: "Workspaces",
      defaultValue: "off",
      options: [
        { label: "Off", value: "off" },
        { label: "The team only", value: "team" },
        { label: "The team and community leads", value: "leads" },
        { label: "Every member", value: "members" },
      ],
      admin: { description: "Who can see and start workspaces. People already in a workspace can always open it." },
    },
    {
      name: "messages",
      type: "checkbox",
      label: "Direct messages",
      defaultValue: false,
      admin: { description: "Members message each other, within each person's own privacy setting. Turn this on last." },
    },
    {
      name: "contributions",
      type: "checkbox",
      label: "My contributions page",
      defaultValue: true,
      admin: { description: "Dashboard → My contributions: everything a member has sent, what happened to it and what's next. Untick to hide it." },
    },
  ],
};
