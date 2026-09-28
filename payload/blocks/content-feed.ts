import type { Block, Where } from "payload";
import { localizedText, localizedTextarea } from "@/payload/fields/localized";
import { REGION_OPTIONS } from "@/payload/fields/regions";
import { pickerAdmin } from "@/payload/blocks/picker";

/**
 * `content-feed` — cards of any mix of content, filled automatically, from the
 * editor's picks, or both (spec §3.2). The settings are stored as-is and turned
 * into cards at render time by `lib/content/feeds/resolve.ts`; the field names
 * under `filters` and `viewAll` are what `mapBlock` reads.
 */

const KIND_OPTIONS = [
  { value: "caseStudies", label: "Case studies" },
  { value: "newsPosts", label: "News" },
  { value: "events", label: "Events" },
  { value: "livedExperiences", label: "Lived experiences" },
  { value: "researchOutputs", label: "Research outputs" },
  { value: "agendas", label: "Agendas" },
];

const PUBLISHED: Where = { _status: { equals: "published" } };
const APPROVED: Where = { moderationStatus: { equals: "approved" } };

/** What the picker offers: only items that could actually show on the site. */
const PICKABLE: Record<string, Where | true> = {
  caseStudies: { and: [PUBLISHED, APPROVED] },
  newsPosts: PUBLISHED,
  livedExperiences: {
    and: [PUBLISHED, { or: [APPROVED, { moderationStatus: { exists: false } }] }],
  },
  researchOutputs: APPROVED,
  events: APPROVED,
  agendas: true,
};

type Sibling = { fill?: string };
type BlockData = { kinds?: string[] };

export const contentFeed: Block = {
  slug: "contentFeed",
  interfaceName: "ContentFeedBlock",
  labels: { singular: "Content feed", plural: "Content feeds" },
  admin: pickerAdmin("content-feed", "Content", "Cards of case studies, news, events and more — chosen automatically or by you"),
  fields: [
    localizedText("heading", { label: "Heading (optional)" }),
    localizedTextarea("intro", { label: "Intro (optional)" }),
    {
      name: "kinds",
      label: "What to show",
      type: "select",
      hasMany: true,
      required: true,
      defaultValue: ["caseStudies"],
      options: KIND_OPTIONS,
    },
    {
      name: "fill",
      label: "How to fill it",
      type: "radio",
      defaultValue: "automatic",
      options: [
        { value: "automatic", label: "Automatic — newest items that match" },
        { value: "automaticWithPicks", label: "Automatic, with my picks first" },
        { value: "picksOnly", label: "Only the items I pick" },
      ],
    },
    {
      name: "picks",
      label: "My picks",
      type: "relationship",
      hasMany: true,
      relationTo: ["caseStudies", "newsPosts", "events", "livedExperiences", "researchOutputs", "agendas"],
      filterOptions: ({ relationTo }) => PICKABLE[relationTo] ?? true,
      admin: {
        description: "Drag to set the order. Only published items can be picked.",
        condition: (_data, sibling: Sibling) => sibling?.fill === "automaticWithPicks" || sibling?.fill === "picksOnly",
      },
    },
    {
      name: "filters",
      label: "Filters (optional)",
      type: "group",
      admin: { description: "Leave these empty to show everything that matches. They don't apply to your picks." },
      fields: [
        { name: "regions", label: "Region", type: "select", hasMany: true, options: REGION_OPTIONS },
        { name: "communities", label: "Community", type: "relationship", relationTo: "regionalCommunities", hasMany: true },
        { name: "tags", label: "Themes and tags", type: "relationship", relationTo: "tags", hasMany: true },
        {
          name: "featuredOnly",
          label: "Featured only",
          type: "checkbox",
          admin: { description: "Events have no featured flag, so they won't appear when this is on." },
        },
        {
          name: "upcomingOnly",
          label: "Upcoming events only",
          type: "checkbox",
          admin: { condition: (_data, _sibling, { blockData }) => ((blockData as BlockData | undefined)?.kinds ?? []).includes("events") },
        },
      ],
    },
    {
      name: "sort",
      label: "Order",
      type: "select",
      defaultValue: "newest",
      options: [
        { value: "newest", label: "Newest first" },
        { value: "featuredFirst", label: "Featured first" },
        { value: "upcomingSoonest", label: "Soonest upcoming (events)" },
        { value: "myOrder", label: "My order (with 'Only the items I pick')" },
      ],
    },
    { name: "count", label: "How many", type: "number", min: 1, max: 24, defaultValue: 6 },
    {
      name: "layout",
      label: "Layout",
      type: "select",
      defaultValue: "grid",
      options: [
        { value: "grid", label: "Grid" },
        { value: "carousel", label: "Carousel" },
        { value: "list", label: "List" },
      ],
    },
    {
      name: "viewAll",
      label: "'View all' link",
      type: "group",
      admin: { description: "Showing one kind? The link goes to its page automatically. Showing several? Add your own link and text." },
      fields: [
        { name: "show", label: "Show a View all link", type: "checkbox", defaultValue: true },
        { name: "href", label: "Link (for several kinds)", type: "text" },
        localizedText("label", { label: "Link text (for several kinds)" }),
      ],
    },
    // No stored value: a live list of what the settings above would show.
    { name: "whatWillShow", type: "ui", admin: { components: { Field: "@/payload/components/feed-preview#FeedPreview" } } },
  ],
};
