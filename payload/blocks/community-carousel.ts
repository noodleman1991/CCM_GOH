import type { Block } from "payload";
import { localizedText, localizedTextarea } from "@/payload/fields/localized";
import { pickerAdmin } from "@/payload/blocks/picker";

/**
 * `community-carousel` — one equal card per regional community with its live
 * numbers (regions-and-partners spec §3.3). The cards read their data at
 * render time; everything here is how they look and move. Taglines are on
 * each community's own record.
 */
export const communityCarousel: Block = {
  slug: "communityCarousel",
  interfaceName: "CommunityCarouselBlock",
  labels: { singular: "Community carousel", plural: "Community carousels" },
  admin: pickerAdmin("community-carousel", "Content", "Every regional community as a card with its live numbers"),
  fields: [
    localizedText("heading", { label: "Heading (optional)" }),
    localizedTextarea("intro", { label: "Intro (optional)" }),
    {
      name: "communities",
      type: "relationship",
      relationTo: "regionalCommunities",
      hasMany: true,
      label: "Communities",
      admin: { description: "Leave empty to show every community, in alphabetical order. Taglines are edited on each community." },
    },
    {
      name: "show",
      type: "group",
      label: "On each card, show",
      fields: [
        { name: "members", type: "checkbox", label: "Members", defaultValue: true },
        { name: "stories", type: "checkbox", label: "Stories", defaultValue: true },
        { name: "events", type: "checkbox", label: "Upcoming events", defaultValue: true },
        { name: "faces", type: "checkbox", label: "Member photos (public profiles only)", defaultValue: true },
        { name: "latest", type: "checkbox", label: "The latest story, event and member, in turn", defaultValue: true },
      ],
    },
    {
      name: "autoplay",
      type: "checkbox",
      label: "Move by itself",
      defaultValue: true,
      admin: { description: "It always stops when a visitor hovers, tabs into it or uses the arrows, and never moves for visitors who ask for less motion." },
    },
    {
      name: "speed",
      type: "select",
      defaultValue: "calm",
      admin: { condition: (_, sibling) => sibling?.autoplay !== false },
      options: [
        { label: "Calm", value: "calm" },
        { label: "Normal", value: "normal" },
      ],
    },
  ],
};
