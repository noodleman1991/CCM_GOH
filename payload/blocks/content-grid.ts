import type { Block } from "payload";
import { imageField, relationshipField } from "@/payload/blocks/shared";
import { localizedRichText, localizedText } from "@/payload/fields/localized";
import { gridAgenda } from "@/payload/blocks/grid-agenda";
import { gridCaseStudy } from "@/payload/blocks/grid-case-study";
import { gridNews } from "@/payload/blocks/grid-news";

/**
 * **The remodel (spec D9).** `regionalCommunityPage`'s six near-identical
 * grid slots — `agendasGrid`, `caseStudiesGrid`, `newsGrid`,
 * `livedExperiencesCarousel`, `teamGrid`, `testimonialsBlock` — collapse into
 * this one parameterised block, repeated in an ordered array. In Sanity they
 * are six separate `type: "object"` fields declaring the same ~15 sub-fields
 * six times over, and they are most of that schema's 849 lines.
 *
 * `contentType` is the parameter that used to be the field name.
 *
 * Verified against production_2 (2026-09-03), all 29 documents (28 published
 * + 1 draft). What the six slots actually store:
 *
 * | slot                     | present | modes seen                          |
 * |--------------------------|---------|-------------------------------------|
 * | agendasGrid              | 29/29   | manual 17, dyn-featured 8, dyn-recent 4 |
 * | caseStudiesGrid          | 29/29   | manual 17, dyn-recent 8, dyn-featured 4 |
 * | newsGrid                 | 29/29   | dyn-recent 16, manual 9, dyn-featured 4 |
 * | livedExperiencesCarousel | 29/29   | dyn-featured 21, dyn-recent 8       |
 * | teamGrid                 | 29/29   | manual 21, **dynamic** 8            |
 * | testimonialsBlock        | 17/29   | (no mode field at all)              |
 *
 * Three shape differences the union has to absorb, all real:
 *
 * 1. **`teamGrid.mode` speaks a different vocabulary** — bare `"dynamic"`,
 *    not `"dynamic-featured"`/`"dynamic-recent"`. Both vocabularies are
 *    offered here rather than one being rewritten onto the other, because
 *    they mean different things: teamGrid's dynamic pulls community members,
 *    the others pull published content with an ordering rule.
 * 2. **The hand-picked items are not all the same kind of thing.** Agendas,
 *    case studies and news store *item blocks* carrying per-card display
 *    flags (`manualItems`, 50 + 80 + 4 real instances). Team members and
 *    testimonials store *bare references* with no per-item options
 *    (`manualMembers` 21 docs, `testimonials` 12 docs). Modelling those two
 *    as blocks would invent a wrapper that has never existed;
 *    `manualMembers`/`manualTestimonials` keep them as what they are.
 * 3. **`livedExperiencesCarousel` has no `gridColumns`, `headerImage` or
 *    `initialDisplayCount`** — it is a carousel. Those fields are simply
 *    unset on it, which the union already allows.
 *
 * Fields declared by the Sanity slots but **never populated on any of the 29
 * documents** — `initialDisplayCount` (0/29) and `subtitle` (0/29) — are kept
 * anyway: `components/templates/regional-community-template.tsx` reads both
 * (`initialDisplayCount: agendasGrid?.initialDisplayCount`,
 * `subtitle: agendasGrid?.subtitle`), so they are live editing features with
 * no content yet, not dead weight.
 *
 * **`testimonialsBlock`'s `showSection` is dropped.** It is `true` on all 17
 * documents that have the block, so — exactly like `useTemplate`, `true` on
 * all 28 — it encodes nothing: "this section is shown" is already said by the
 * block being in the array. (Recorded so the importer does not look for it.
 * A second fact worth knowing: the regional template never renders
 * testimonialsBlock at all today. It is projected by
 * REGIONAL_COMMUNITY_PAGE_QUERY and read by nothing, but it holds 12
 * documents' worth of real testimonial references, so it is carried across
 * rather than dropped as dead data.)
 *
 * `grid-lived-experience` — what a lived-experiences `manualItems` entry
 * would be — is **not** in `manualItems`: 0 of the 29 documents put the
 * carousel in a manual mode, so no such item has ever been authored, and
 * spec §6 deletes that block. Payload will accept manual mode for lived
 * experiences with no items to pick; if that feature is ever wanted, the
 * block gets added then, against a real requirement.
 */
export const contentGrid: Block = {
  slug: "contentGrid",
  interfaceName: "ContentGridBlock",
  labels: { singular: "Content section (old)", plural: "Content sections (old)" },
  fields: [
    {
      name: "contentType",
      type: "select",
      required: true,
      label: "What this section shows",
      admin: { description: "Which kind of content fills this section." },
      options: [
        { label: "Agendas", value: "agendas" },
        { label: "Case studies", value: "caseStudies" },
        { label: "News & updates", value: "news" },
        { label: "Lived experiences", value: "livedExperiences" },
        { label: "Team members", value: "team" },
        { label: "Testimonials", value: "testimonials" },
      ],
    },
    {
      name: "mode",
      type: "select",
      defaultValue: "dynamic-featured",
      label: "Content Mode",
      admin: {
        description:
          "How this section is filled. Dynamic modes update automatically as new content is published for this region — you don't have to touch the page. 'Dynamic + pinned' lets you feature a few hand-picked items at the top while the rest auto-fill.",
      },
      options: [
        { label: "Manual selection only — you choose every item", value: "manual" },
        { label: "Dynamic — featured items first, then recent", value: "dynamic-featured" },
        { label: "Dynamic — most recent first", value: "dynamic-recent" },
        { label: "Dynamic + pinned — your picks first, then auto-fill", value: "dynamic-with-pinned" },
        { label: "Dynamic — from community members (team sections only)", value: "dynamic" },
      ],
    },
    {
      name: "gridColumns",
      type: "select",
      defaultValue: "grid-cols-3",
      label: "Grid Columns",
      options: [
        { label: "2 Cards", value: "grid-cols-2" },
        { label: "3 Cards", value: "grid-cols-3" },
        { label: "4 Cards", value: "grid-cols-4" },
        { label: "5 Cards", value: "grid-cols-5" },
      ],
    },
    {
      name: "maxItems",
      type: "number",
      min: 1,
      // The grids cap at 12 in Sanity, the carousel at 20. One union range,
      // since one field now serves both.
      max: 20,
      label: "Maximum Items",
    },
    {
      name: "initialDisplayCount",
      type: "number",
      min: 1,
      max: 12,
      admin: { description: "Number of items to show initially (rest shown on 'View More')" },
    },
    { name: "showTitle", type: "checkbox", defaultValue: true, label: "Show Section Title" },
    localizedText("title", { label: "Section Title" }),
    localizedText("subtitle", { label: "Section Subtitle" }),
    { name: "showDescription", type: "checkbox", defaultValue: false, label: "Show Description" },
    localizedRichText("description", { label: "Section Description" }),
    imageField("headerImage"),
    {
      name: "manualItems",
      type: "blocks",
      label: "Hand-picked items",
      admin: {
        description:
          "In 'Manual' mode these are the only items shown. In 'Dynamic + pinned' mode they are featured first and the regional feed fills the rest.",
      },
      blocks: [gridAgenda, gridCaseStudy, gridNews],
    },
    relationshipField("manualMembers", "authors", {
      hasMany: true,
      label: "Hand-picked team members",
      admin: { condition: (_, siblingData) => siblingData?.contentType === "team" },
    }),
    relationshipField("manualTestimonials", "testimonials", {
      hasMany: true,
      label: "Hand-picked testimonials",
      admin: { condition: (_, siblingData) => siblingData?.contentType === "testimonials" },
    }),
    {
      name: "displayRole",
      type: "checkbox",
      defaultValue: true,
      admin: {
        description: "Show a member's role in the community",
        condition: (_, siblingData) => siblingData?.contentType === "team",
      },
    },
    {
      name: "displayAffiliation",
      type: "checkbox",
      defaultValue: true,
      admin: {
        description: "Show a member's organizational affiliation",
        condition: (_, siblingData) => siblingData?.contentType === "team",
      },
    },
  ],
};
