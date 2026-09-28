import type { CollectionConfig } from "payload";
import { isEditor, publishedOnly } from "@/payload/access";
import { imageField } from "@/payload/blocks/shared";
import { localizedText, localizedTextarea } from "@/payload/fields/localized";
import {
  atlasEmbed,
  carousel1,
  carousel2,
  contentFeed,
  cta1,
  eventsCalendar,
  faqs,
  formNewsletter,
  gridRow,
  hero1,
  hero2,
  logoCloud1,
  peopleWidget,
  regionMap,
  sectionHeader,
  splitRow,
  submitStoryBanner,
  timelineRow,
} from "@/payload/blocks";
import { sanityUpdatedAt } from "@/payload/fields/sanity-timestamps";
import { documentIdField } from "@/payload/fields/document-id";
import { slugField } from "@/payload/fields/slug";

/**
 * Mirrors sanity/schemas/documents/page.ts. Verified against production_2
 * (2026-09-03): **36 documents, 0 drafts** — 9 slugs x 4 languages, a
 * complete `ar/en/es/fr` set for every slug, which is why Task 12 can group
 * on slug (spec §6). The 36 collapse to 9 Payload documents.
 *
 * No `versions.drafts`: there is not a single `drafts.page.*` record.
 *
 * ## `blocks` is localized at the ARRAY level, and that is not a stylistic call
 *
 * Everywhere else in this migration, Lane A collapses onto field-level
 * `localized: true` — the four language documents share one structure and
 * differ only in their text. For `page.blocks[]` that is **false in the real
 * data**. Measured across all 9 slug groups:
 *
 *   - 6 groups: identical block lists in all four languages.
 *   - `about`: en has 3 blocks, ar/es/fr have 4 (an extra `section-header`
 *     leading the page).
 *   - `research-and-action/impact-reports`: en is `[hero-1, grid-row]`,
 *     ar/es/fr are `[hero-1, split-row, split-row, split-row]`.
 *   - `research-and-action/toolkits`: en is `[hero-1, grid-row]`,
 *     ar/es/fr are `[hero-1, split-row]`.
 *
 * A shared structure cannot represent that. Forcing one would either render
 * an empty section header on the English About page or drop three
 * split-rows from three languages of Impact Reports. So the blocks field
 * itself is `localized: true`: each locale stores its own ordered list.
 *
 * Payload 3.88 then strips `localized` from the block sub-fields
 * (`sanitizeField`: `if (parentIsLocalized) delete field.localized`), which
 * is the correct outcome — the outer localization already gives each locale
 * a complete copy. See payload/fields/block-slot.ts for why every Lane-A
 * container in this task is localized the same way rather than only this one.
 *
 * ## Which blocks are offered
 *
 * Sanity's `page.blocks` declares 14 types; spec §6 ports 12 blocks total,
 * 5 of which are sub-blocks reached through their parent (splitContent and
 * splitImage inside splitRow.splitColumns; gridCard, gridAgenda and gridNews
 * inside gridRow.columns). The intersection of "declared on page.blocks" and
 * "ported, page-level" is these seven. The real data uses six of them
 * (hero-1 48, grid-row 50, split-row 20, cta-1 12, logo-cloud-1 4,
 * section-header 3); carousel-2 is declared by page.blocks and only ever
 * authored on the homepage, and is offered here for parity.
 *
 * ## Localization of the leaf fields
 *
 * `slug` is deliberately NOT localized: it is the grouping key, identical
 * across all four languages of every group (`about`, `feedback`,
 * `research-and-action/*`), which is exactly why slug-grouping works.
 * `title` and the SEO fields ARE localized — each language document carries
 * its own (`About` / `Acerca de` / `À propos` / `حول`, and matching
 * `meta_title`s). This differs from Task 5's Lane-B collections, where
 * meta_title is a single plain string; there the four languages live in one
 * document already, here they are four documents being merged.
 */
export const Pages: CollectionConfig = {
  slug: "pages",
  admin: {
    group: "Site pages",
    useAsTitle: "title",
    defaultColumns: ["title", "slug"],
  },
  // Drafts (2026-09-28): edits autosave as a draft and only reach visitors on
  // Publish. Saving a draft never touches the published row, so the live page
  // is unaffected until then.
  versions: { drafts: { autosave: { interval: 1500 } }, maxPerDoc: 50 },
  access: {
    read: publishedOnly,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  fields: [
    documentIdField,
    sanityUpdatedAt,
    localizedText("title"),
    slugField("title", { description: "Shared by all four languages of this page — it is what groups them into one document." }),
    {
      name: "blocks",
      type: "blocks",
      localized: true,
      label: "Page blocks",
      admin: { description: "Compose the page from reusable blocks (drag to reorder). Each language has its own list." },
      // The first seven keep their order; the rest follow the picker's groups (spec §3.1).
      blocks: [
        hero1,
        sectionHeader,
        splitRow,
        gridRow,
        carousel2,
        cta1,
        logoCloud1,
        hero2,
        carousel1,
        timelineRow,
        faqs,
        contentFeed,
        eventsCalendar,
        peopleWidget,
        regionMap,
        atlasEmbed,
        submitStoryBanner,
        formNewsletter,
      ],
    },
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
