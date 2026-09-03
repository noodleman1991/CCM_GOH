import type { GlobalConfig } from "payload";
import { isAnyone, isEditor } from "@/payload/access";
import { imageField } from "@/payload/blocks/shared";
import { localizedText, localizedTextarea } from "@/payload/fields/localized";
import { blockSlot } from "@/payload/fields/block-slot";
import { carousel2, cta1, gridRow, hero1, logoCloud1, splitRow } from "@/payload/blocks";

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
 */
export const Homepage: GlobalConfig = {
  slug: "homepage",
  label: "Homepage",
  access: {
    read: isAnyone,
    update: isEditor,
  },
  fields: [
    localizedText("title", { label: "Page Title" }),
    blockSlot("heroWelcome", hero1, {
      label: "Hero Welcome Section",
      description: "Welcome to Connecting Climate Minds Hub section",
    }),
    blockSlot("globalAgenda", splitRow, {
      label: "Global Research & Action Section",
      description: "Prioritizing Global Research and Action section",
    }),
    blockSlot("howToUse", splitRow, {
      label: "Your collaborative space section",
      description: "Collaborative space for ideas, dialogue, and connection",
    }),
    blockSlot("agendasModule", gridRow, { label: "Research Agendas" }),
    blockSlot("livedExperiences", carousel2, { label: "Lived Experiences Stories" }),
    blockSlot("regionalCommunities", gridRow, { label: "Regional Communities" }),
    blockSlot("collaboration", splitRow, { label: "Collaboration Section" }),
    blockSlot("news", gridRow, { label: "Latest News Section" }),
    blockSlot("projectInfo", splitRow, { label: "Project Information" }),
    blockSlot("mentalHealthDefinition", cta1, { label: "Mental Health Definition" }),
    blockSlot("partnerLogos", logoCloud1, { label: "Partner Logos" }),
    localizedText("meta_title", { label: "Meta Title" }),
    localizedTextarea("meta_description", { label: "Meta Description" }),
    { name: "noindex", type: "checkbox", defaultValue: false, label: "No Index" },
    imageField("ogImage"),
  ],
};
