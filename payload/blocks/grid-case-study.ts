import type { Block } from "payload";
import { localizedTextarea } from "@/payload/fields/localized";
import { relationshipField } from "@/payload/blocks/shared";

/**
 * sanity/schemas/blocks/grid/grid-case-study.ts — a **thirteenth** ported
 * block, and the one correction this task makes to the migration spec.
 *
 * Spec §6 lists `grid-case-study` under "Delete entirely (24)", and Task 3's
 * report records "grid-post/grid-case-study/grid-lived-experience 0". Both
 * are right about where they looked and wrong about the dataset: that census
 * counted `grid-row.columns[]`, and grid-case-study is never authored there.
 * It is authored in a different place — `regionalCommunityPage`'s
 * `caseStudiesGrid.manualItems[]`, which Task 3 had no reason to walk.
 *
 * Re-measured against production_2 (2026-09-03) by recursively counting every
 * `_type` in all 74 page/homepage/regionalCommunityPage/onboardingContent/
 * siteAnnouncement documents: **80 grid-case-study instances across 21 of the
 * 29 regional community pages** — the fourth most common block type in the
 * page corpus, behind only grid-agenda (232), hero-1 (81) and grid-card (68).
 * Without this block those 21 pages' entire hand-picked case-study selections
 * would import as nothing, and the loss would be silent: the dynamic fallback
 * would quietly fill the section with different case studies.
 *
 * Real-data field census across those 80 instances:
 *   showTags        true 80/80
 *   showAuthors     true 75, false 5
 *   showMetadata    true 75, false 5
 *   showStudyPeriod false 80/80
 *   showLocation    false 80/80
 *   customLayout    "default" 80/80
 *   customExcerpt   0/80   (declared; Lane-B {en,es,fr,ar} in Sanity)
 *   priority        0/80   (declared)
 * The two unpopulated fields are kept for schema parity, the same treatment
 * Task 3 gave hero-1's `tagLine` and grid-news's `customExcerpt`.
 *
 * NOT added to `payload/blocks/index.ts`'s `blocks` array: that array is "the
 * twelve blocks that carry data" and is asserted exactly in
 * lib/__tests__/payload-blocks.test.ts. grid items are not page-level blocks —
 * gridAgenda/gridCard/gridNews are likewise only reachable through their
 * parent (gridRow.columns), and gridCaseStudy is only reachable through
 * contentGrid.manualItems.
 */
export const gridCaseStudy: Block = {
  slug: "gridCaseStudy",
  interfaceName: "GridCaseStudyBlock",
  fields: [
    relationshipField("caseStudy", "caseStudies", {
      required: true,
      admin: { description: "Select a case study to display in the grid." },
    }),
    {
      name: "showTags",
      type: "checkbox",
      defaultValue: true,
      admin: { description: "Display case study tags on the card" },
    },
    {
      name: "showAuthors",
      type: "checkbox",
      defaultValue: true,
      admin: { description: "Display case study authors on the card" },
    },
    {
      name: "showMetadata",
      type: "checkbox",
      defaultValue: true,
      admin: { description: "Display publication date, location, and other metadata" },
    },
    {
      name: "showStudyPeriod",
      type: "checkbox",
      defaultValue: false,
      admin: { description: "Display the study period dates on the card" },
    },
    {
      name: "showLocation",
      type: "checkbox",
      defaultValue: false,
      admin: { description: "Display the primary study location on the card" },
    },
    localizedTextarea("customExcerpt", {
      maxLength: 200,
      admin: { description: "Optional custom excerpt to override the case study's own excerpt in this grid" },
    }),
    {
      name: "customLayout",
      type: "select",
      defaultValue: "default",
      admin: { description: "Choose how this case study card should be displayed" },
      options: [
        { label: "Default", value: "default" },
        { label: "Compact", value: "compact" },
        { label: "Featured", value: "featured" },
        { label: "Minimal", value: "minimal" },
      ],
    },
    {
      name: "priority",
      type: "number",
      min: 0,
      max: 100,
      admin: { description: "Higher numbers appear first in the grid (optional)" },
    },
  ],
};
