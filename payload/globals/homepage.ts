import type { GlobalConfig } from "payload";
import { isEditor, publishedOnly } from "@/payload/access";
import { imageField } from "@/payload/blocks/shared";
import { localizedText, localizedTextarea } from "@/payload/fields/localized";
import { blockSlot } from "@/payload/fields/block-slot";
import { carousel2, cta1, gridRow, hero1, logoCloud1, splitRow } from "@/payload/blocks";

/** Every homepage slot: the block's own field list, localized per field. */
function homepageSlot(
  name: string,
  block: Parameters<typeof blockSlot>[1],
  opts: { label?: string; description?: string } = {},
) {
  return blockSlot(name, block, { ...opts, localized: false });
}

/**
 * Mirrors sanity/schemas/documents/homepage.ts. Verified against
 * production_2 (2026-09-03): **4 documents** (`homepage-en`, `-es`, `-fr`,
 * `-ar`), all with `slug: "index"`, 0 drafts. A Lane-A singleton per
 * language, so it becomes one Payload global with four locales.
 *
 * ## The eleven slots stay slots
 *
 * **Binding ruling for this task: `getHomepage` keeps returning the
 * homepage's current fixed-slot shape.** Turning the eleven named slots into
 * a generic `blocks` array would force a rewrite of
 * `components/pages/homepage.tsx` and its section components, which Phase 2
 * explicitly does not do — nothing user-facing changes in this phase. So the
 * global is modelled on the slots that exist today, one `group` per slot
 * typed on the block that slot holds (payload/fields/block-slot.ts).
 *
 * This is a documented divergence from spec §6's D9, which had the import run
 * `lib/homepage/blocks-from-fields.ts` and land the homepage already
 * remodelled into a block array. That transform is written and unit-tested
 * (`lib/__tests__/homepage-blocks-migration.test.ts`) and has never been
 * executed against any dataset; it stays unexecuted. If the homepage is ever
 * remodelled, it is a deliberate front-end slice with its own rendered
 * check, not a side effect of a backend migration.
 *
 * ## No `blocks` field
 *
 * Sanity's homepage schema *also* declares a freeform `blocks` array beside
 * the eleven slots ("the fixed sections below are legacy and are removed once
 * blocks are in use"). It is `null` on all four documents — the dual-field
 * transition never started. It is not ported: it would be a second, empty
 * authoring path competing with the slots the ruling just preserved, and 11
 * of the 18 block types it offers (hero-2, faqs, form-newsletter, region-map,
 * people-widget, events-calendar, fresh-content, submit-story-banner,
 * lived-experiences-carousel, timeline-row, carousel-1) do not exist in
 * Payload at all — spec §6 deletes them. `page` (payload/collections/pages.ts)
 * remains the freeform page-builder surface.
 *
 * ## Slot -> block mapping (Sanity's own declaration, unchanged)
 *
 *   heroWelcome            hero-1        globalAgenda   split-row
 *   howToUse               split-row     agendasModule  grid-row
 *   livedExperiences       carousel-2    regionalCommunities grid-row
 *   collaboration          split-row     news           grid-row
 *   projectInfo            split-row     mentalHealthDefinition cta-1
 *   partnerLogos           logo-cloud-1
 *
 * All eleven are populated on all four documents.
 *
 * `slug` ("index" on all four) and `language` are dropped: a global has no
 * slug, and Payload's locales replace `language`.
 *
 * ## The eleven slots are localized **field by field, not container by
 * container** — `localized: false` on every `homepageSlot`.
 *
 * Localizing the containers put 135 columns in `homepage_locales`, and
 * Payload reads a localized table through `json_agg(json_build_array(<every
 * column>))` against Postgres's hard 100-argument function limit, so the
 * global could not be read at all (SQLSTATE 54023 on `findGlobal`,
 * `updateGlobal`, `/admin`; task-12-report.md). Unlocalizing the container
 * hands each field back its own declaration: the blocks already mark
 * translatable copy with `localizedText`/`localizedTextarea`/
 * `localizedRichText` (plus `image.alt`) and leave presentation settings —
 * padding checkboxes, `imagePosition`, `background.type`/`ccmColor`/
 * `lightText`, the hex colours, `maxItems` — as plain fields.
 *
 * **Measured before de-localizing anything** (all four production_2 homepage
 * documents, flattened to 387 leaf paths and compared value by value):
 * 308 paths agree across `homepage-{en,es,fr,ar}` and 79 differ. Every one of
 * the 79 is either translatable copy that stays localized (`title`, `body`,
 * `meta_*`, the slot titles/descriptions) or lives inside a row list —
 * `heroWelcome.links[0]`, `*.splitColumns[*]`, `*.columns[*]` — which
 * `blockSlot` keeps localized. **No field this global de-localizes disagrees
 * across the four documents**, including every `image.asset` reference. Two
 * differences would have been lost by a blunter cut and are worth naming:
 * `heroWelcome.links[0].buttonVariant.size` is `lg` in English and `default`
 * in the other three, and `news.columns[1..2].newsPost` points at a different
 * news post in English. Both sit in row lists, so both survive.
 */
export const Homepage: GlobalConfig = {
  slug: "homepage",
  admin: { group: "Site pages" },
  label: "Homepage",
  // Drafts (2026-09-28): see payload/collections/pages.ts.
  versions: { drafts: { autosave: { interval: 1500 } }, max: 50 },
  access: {
    read: publishedOnly,
    update: isEditor,
  },
  fields: [
    localizedText("title", { label: "Page Title" }),
    homepageSlot("heroWelcome", hero1, {
      label: "Hero Welcome Section",
      description: "Welcome to Connecting Climate Minds Hub section",
    }),
    homepageSlot("globalAgenda", splitRow, {
      label: "Global Research & Action Section",
      description: "Prioritizing Global Research and Action section",
    }),
    homepageSlot("howToUse", splitRow, {
      label: "Your collaborative space section",
      description: "Collaborative space for ideas, dialogue, and connection",
    }),
    homepageSlot("agendasModule", gridRow, { label: "Research Agendas" }),
    homepageSlot("livedExperiences", carousel2, { label: "Lived Experiences Stories" }),
    homepageSlot("regionalCommunities", gridRow, { label: "Regional Communities" }),
    homepageSlot("collaboration", splitRow, { label: "Collaboration Section" }),
    homepageSlot("news", gridRow, { label: "Latest News Section" }),
    homepageSlot("projectInfo", splitRow, { label: "Project Information" }),
    homepageSlot("mentalHealthDefinition", cta1, { label: "Mental Health Definition" }),
    homepageSlot("partnerLogos", logoCloud1, { label: "Partner Logos" }),
    localizedText("meta_title", { label: "Meta Title" }),
    localizedTextarea("meta_description", { label: "Meta Description" }),
    { name: "noindex", type: "checkbox", defaultValue: false, label: "No Index" },
    imageField("ogImage"),
  ],
};
