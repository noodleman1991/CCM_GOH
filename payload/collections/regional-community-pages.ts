import type { CollectionConfig } from "payload";
import { isEditor, publishedOnly } from "@/payload/access";
import { imageField, relationshipField } from "@/payload/blocks/shared";
import { localizedText, localizedTextarea } from "@/payload/fields/localized";
import { blockSlot } from "@/payload/fields/block-slot";
import { hero1, logoCloud1 } from "@/payload/blocks";
import { contentGrid } from "@/payload/blocks/content-grid";
import { sanityUpdatedAt } from "@/payload/fields/sanity-timestamps";

/**
 * Mirrors sanity/schemas/documents/regional-community-page.ts — **the one
 * document type this phase deliberately does not preserve the shape of**
 * (spec D9). Verified against production_2 (2026-09-03): 29 documents, 28
 * published + 1 draft (`drafts.regional-community-page-central-and-southern-asia`),
 * 7 slugs x 4 languages. `versions.drafts` is enabled for that one draft.
 *
 * ## What collapsed, and what was dropped
 *
 * The six grid slots — `agendasGrid`, `caseStudiesGrid`, `newsGrid`,
 * `livedExperiencesCarousel`, `teamGrid`, `testimonialsBlock` — become an
 * ordered `sections` array of one parameterised block
 * (payload/blocks/content-grid.ts, which carries the measurements).
 *
 * Three things are dropped outright:
 *
 * 1. **The six `divider_*` fields.** Studio-only spacers whose whole
 *    implementation is `components: { input: () => null }`. 0/29 documents
 *    store any of them — they were never data. Payload groups and labels do
 *    the same job.
 * 2. **`useTemplate`.** `true` on all 29 documents, so its false branch has
 *    never executed and the field distinguishes nothing.
 * 3. **`contentFlow`** — which *is* that dead false branch (Sanity hides it
 *    with `hidden: ({document}) => Boolean(document?.useTemplate)`). 0/29
 *    documents populate it. Keeping the branch body after removing the
 *    switch that reaches it would carry dead weight into a new system for
 *    no reader; it is called out explicitly here because it is the one drop
 *    that follows from the `useTemplate` ruling rather than being named by
 *    it.
 *
 * ## What stayed a named slot
 *
 * `welcomeHero`, `whyJoinCTA`, `atlasEmbed` and `logoCloud` are not grids
 * and do not collapse. They stay as named slots, so the regional template's
 * fixed page skeleton (hero -> why-join -> sections -> atlas -> logos)
 * survives the remodel.
 *
 * **`whyJoinCTA` is typed on hero-1, not cta-1 (spec §7.1).** All 29
 * documents store `_type: "cta-1"`, and all 29 are wrong: the stored field
 * set is hero-1's — `image` on 25/29 and `imagePosition` on 20/29, neither
 * of which cta-1 declares. Sanity tolerates the mismatch because renderers
 * read the stored `_type`; Payload cannot hold one block in a field typed
 * as another. The importer maps the stored `cta-1` onto this hero-1 slot and
 * ignores the `_type`. Do not "fix" this to cta1 — that would drop the
 * images on 25 documents.
 *
 * ## Order for the importer
 *
 * `components/templates/regional-community-template.tsx` pushes template
 * blocks in this order: welcomeHero, whyJoinCTA, agendasGrid,
 * caseStudiesGrid, newsGrid, livedExperiencesCarousel, teamGrid, atlasEmbed,
 * logoCloud. So `sections` is written as agendas, caseStudies, news,
 * livedExperiences, team — then testimonials last, since the template does
 * not render testimonialsBlock at all today (it is projected by
 * REGIONAL_COMMUNITY_PAGE_QUERY and read by nothing) and has no place in the
 * rendered order to preserve.
 *
 * ## Localization
 *
 * Lane A: 7 slugs x `ar/en/es/fr`. `slug` and `regionalCommunity` are
 * identical across the four language documents of every group (verified) and
 * stay non-localized — they are the grouping key and the region link.
 * Everything editorial is localized at the container level; see
 * payload/fields/block-slot.ts for why that level and not the leaf fields.
 */
export const RegionalCommunityPages: CollectionConfig = {
  slug: "regionalCommunityPages",
  // Postgres caps table and enum identifiers at 63 characters, and Payload
  // builds them by concatenating the whole path. `regional_community_pages`
  // (24) plus the versions prefix plus a nested block plus a select field
  // overruns it — `enum__regional_community_pages_v_blocks_content_grid_content_type`
  // is 65. `regional_pages` (14) brings the worst case to 55. The API slug
  // is unaffected; this only names the tables.
  dbName: "regional_pages",
  versions: { drafts: true },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug"],
  },
  access: {
    read: publishedOnly,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  fields: [
    {
      name: "id",
      type: "text",
      required: true,
      admin: { hidden: true },
    },
    sanityUpdatedAt,
    localizedText("title", { required: true }),
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: { description: "Shared by all four languages of this page — it is what groups them into one document." },
    },
    relationshipField("regionalCommunity", "regionalCommunities", {
      required: true,
      label: "Regional Community",
      admin: { description: "Link to the regional community for dynamic content filtering" },
    }),
    blockSlot("welcomeHero", hero1, {
      label: "Welcome Hero Section",
      description: "Welcome hero section",
    }),
    blockSlot("whyJoinCTA", hero1, {
      label: "Why Join Regional Community Hero",
      description:
        "Hero section with image support for joining the regional community (supports buttons and image positioning)",
    }),
    {
      name: "sections",
      type: "blocks",
      localized: true,
      label: "Content sections",
      admin: {
        description:
          "The region's content sections, in the order they appear on the page. Each one picks what it shows and how it fills.",
      },
      blocks: [contentGrid],
    },
    {
      name: "atlasEmbed",
      type: "group",
      label: "Atlas Embed (this region)",
      admin: { description: "Embed the region-locked Atlas explorer on this page" },
      fields: [
        {
          name: "enabled",
          type: "checkbox",
          label: "Show the atlas embed",
          // Deliberately no defaultValue. Sanity declares `initialValue:
          // false`, but 0/29 documents store atlasEmbed at all, so that
          // initial value has never been written — and the renderer reads it
          // as opt-OUT (`atlasEmbed?.enabled !== false`), i.e. absent means
          // shown. Defaulting to false here would turn the atlas OFF on every
          // regional page the moment a document is saved. Leaving it unset
          // preserves today's behaviour exactly.
          admin: { description: "Leave unset to show it (the seven canonical regions show it by default)." },
        },
        {
          name: "showBreakdown",
          type: "checkbox",
          defaultValue: true,
          label: "Show the country breakdown list",
          admin: { condition: (_, siblingData) => siblingData?.enabled !== false },
        },
      ],
    },
    blockSlot("logoCloud", logoCloud1, {
      label: "Logo Cloud Section",
      description: "Partner organizations logo cloud",
    }),
    localizedText("meta_title", { label: "Meta Title" }),
    localizedTextarea("meta_description", { label: "Meta Description" }),
    { name: "noindex", type: "checkbox", defaultValue: false, label: "No Index" },
    imageField("ogImage"),
    {
      name: "orderRank",
      type: "text",
      admin: { hidden: true, description: "Sanity's LexoRank orderRank string, preserved for editorial ordering." },
    },
  ],
};
