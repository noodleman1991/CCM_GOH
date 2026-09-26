# Phase 6 — Master Plan (new Sanity types · taxonomy migration · documentVersion · content-card map · homepage/content-page adaptation)

> The heaviest phase of the CCM Hub redesign. Contains the **production-risky region
> taxonomy migration**, so everything runs **staging-first** (Sanity `development`
> dataset + Neon dev branch — both already set up). Built as ordered, individually
> shippable slices; each ends green (`pnpm typecheck && pnpm test && pnpm build`) +
> rendered-UI validation on dev/staging, each its own commit. No AI attribution.
> Never run `sanity typegen generate` (hand-edit `sanity.types.ts`).

## Locked decisions (this session)
- **researchOutput REPLACES report/agenda** — caseStudy-modeled, `versions[]`, portable-text body, layout archetypes; port download tracking; migrate existing `report` docs; staging-gated. (Decision reversed from earlier "extend".)
- **Region taxonomy: FULL migration now** to fixed-7 short codes (`ssa nawa csa esea lac oce enam`) across Prisma enum + Sanity + Algolia; staging-gated, dual-field transition.
- **Themes (4) + Populations (5): ADD as new fields**, keep `topic`/`tag` working (no lossy migration; adopt in filters incrementally).
- **Multilingual: `documentVersion` object** (version×lang `versions[]`) on output types — additive; not per-locale body blocks.
- **Geopoints/map:** all 3 content types ALREADY have a geopoint (`caseStudy.studyLocation`, `newsPost.location`, `livedExperience.location`); the real work is plotting **pins + content cards** (the map is choropleth+counts only today).
- **Homepage** is a freeform `blocks[]` builder (18 block types) → adapt by composing/adding blocks, not rebuilding. **Content detail pages** have NO `layout` field and a fixed layout → add Story/Feature/Report archetypes (§4.12).

## Current-state facts (verified)
- New types absent: `researchOutput`/`dataset`/`fundingApplication`/`documentVersion`. `report.ts`+`agenda.ts` = file-download docs w/ download tracking, referenced live.
- Region: 3 stores — Prisma `RegionalCommunityName` enum (long SNAKE), Sanity `regionalCommunity` slug (no code field), Algolia community-name facet values. Bridge module: `lib/maps/region-codes.ts` (already documents the short codes in `REGION_COLOR`).
- `connection` object exists but stale vs spec (missing `about`, targets `report` not `researchOutput`).
- Detail body via `PortableTextRenderer` + `styled-block-content` (lead/pull-quote/CTA). Atlas = choropleth + counts + deep-link, no content cards.

---

## Workstream A — New content types (researchOutput replaces report; dataset; fundingApplication)

- **A1. `documentVersion` object** (prereq for A2/C): shared object `{ kind(summary|full|brief|deck), lang(en|fr|ar|es), label, file, body(localeBlock), pages }`. Register; hand-edit types. *(This is also workstream C — built once, reused.)*
- **A2. `researchOutput` document** (additive first): caseStudy-modeled — localized title/excerpt, portable-text body, `outputType(report|toolkit|dataset-brief|guideline)`, `versions[] of documentVersion`, `layout`, region/theme/population (from B), `relatedCommunity`, tags, review workflow (`status/submittedBy/reviewNotes` + `sanity/actions/` review action mirroring case-study), download tracking ported from `report` (reuse `DownloadEvent`/`use-download-tracking`). Register + Studio structure + GROQ. NOT public-replacing yet.
- **A3. Content migration `report → researchOutput`** (staging-gated): script under `scripts/` (export backup → dry-run → `--apply`, idempotent, refuse-prod) mapping report fields → researchOutput (+ each report `files[]` lang → a `documentVersion`). Repoint `connection.target`, `embeddedDoc`, Algolia, and the Research & Action listing/detail routes from `report`→`researchOutput`. Validate on staging, then promote. Keep `report` type readable during transition (dual-read) → remove in a later cleanup. `agenda`: same treatment or keep as-is — decide at A3 (agenda has no spec successor; lean keep agenda, migrate only report).
- **A4. `dataset` + `fundingApplication`** (internal, never public): minimal docs + `versions[]`; gate out of all public GROQ; Studio structure under an Internal group. `dataset` referenced by `embeddedDoc` block.

## Workstream B — Region taxonomy migration (PRODUCTION-RISKY · staging-gated)

- **B1. Add short-code `region` field** to `regionalCommunity` + a `region` string field to content types (caseStudy/livedExperience/newsPost/researchOutput), values = fixed-7 codes. Backfill from existing slug via `lib/maps/region-codes.ts` (dual-field: new code beside the slug ref; app reads code → fallback to slug-derived). Additive, reversible.
- **B2. Theme + Population fields** (additive, per locked decision): `theme[]` (4 codes) + `population[]` (5 codes) list fields on content types; enforce code-only. Leave `topic`/`tag` intact.
- **B3. Prisma enum migration**: `RegionalCommunityName` long values → short codes. Run on the **Neon dev branch** first (the risky DB step); additive-safe via a transitional mapping; update `region-codes.ts` + `app/api/maps/region-data` + consumers. Promote to prod in a low-traffic window.
- **B4. Algolia reindex**: add `region`(code) + `theme` to `attributesForFaceting` on case_studies/news/researchOutput indices; update transforms to emit codes; reindex the **staging index** first, validate facets, then prod via the sync scripts.
- **B5. Cleanup (later/optional):** once dual-read soaks, drop the legacy slug-derived path. Tracked, not done in this phase.

## Workstream C — documentVersion / multilingual (version×lang)
- Delivered by A1 (`documentVersion` object) + its `versions[]` on output types. **C1:** the Documents version×lang chip switcher on the public output detail page + workspace Documents tab (download/embed by kind×lang, `field[lang] ?? field.en`). Reuses the existing EmbedPDF viewer for `file`, PortableTextRenderer for `body`.

## Workstream D — Content-card map (hybrid map + pins + cards)
- **D1. region-data API → items mode**: extend `app/api/maps/region-data/route.ts` to optionally return **content items** (id/title/slug/type/geopoint/region) per region/facet, not just counts (keep counts mode for the choropleth).
- **D2. Pin layer + content cards**: in the Atlas/`region-map` components, plot the geopoints (caseStudy/LE/news/researchOutput) as a clustered pin layer (lazy, reduced-motion aware) AND render selected-segment content as **cards** in the side panel (replaces the count+deep-link). Hybrid: choropleth + pins + card list, filtered by region/theme/contentType. Reuse existing card components.
- (Geopoint *fields* already exist on all 3 types — no schema work; researchOutput gets one in A2.)

## Workstream E — Homepage + content-page adaptation to the wireframes
- **E1. Content detail layout archetypes (§4.12):** add a `layout(story|feature|report)` field to caseStudy/livedExperience/researchOutput; make the detail page render the chosen archetype (Story = hero→centered column; Feature = split navy panel|media+body; Report = body + sticky "At a glance"). Same blocks, layout-agnostic. Extend `portable-text-renderer`/`styled-block-content` only where a block is missing.
- **E2. Homepage to §4.1:** compose the wireframe Home via existing blocks (hero, outputs grid, regions, news, lived carousel, logo wall) in the homepage Sanity doc; build the 1–2 missing blocks (People widget "members in your region seeking/offering"; optional events/calendar strip now that Phase-5 events exist). Reuse `lib/design-tokens` + section-container.
- **E3. Connections on public pages:** render the `connection`/`relatedContent` chips on output/case-study detail (fix the `connection` object: add `about`, retarget `report→researchOutput`). 

---

## Sequencing (dependency order)
1. **A1 documentVersion** (object; unblocks A2/C).
2. **B1 region code field + B2 theme/population fields** (additive schema; unblocks A2 fields + D filters + B4 facets). Backfill on staging.
3. **A2 researchOutput** (additive type, using A1+B fields).
4. **D1+D2 content-card map** (additive; uses existing geopoints + B region codes; independent of the report migration).
5. **E1 detail layout archetypes** + **E3 connections fix** (additive; applies to caseStudy now, researchOutput when it lands).
6. **A3 report→researchOutput migration** (staging-gated content migration; after A2 + E1 so the new detail page is ready).
7. **B3 Prisma enum + B4 Algolia** region-code migration (the production-risky DB/index steps; staging→promote).
8. **A4 dataset/fundingApplication** (internal; low-risk, any time).
9. **E2 homepage composition** (after researchOutput + map exist so Home can feature them).
10. **B5 cleanup** (later, post-soak).

Each step: dev/staging migration applied first, green gate, rendered validation (375/1440 + RTL ar), unit tests for new actions/migration logic (dry-run idempotency), screenshot. Risky steps (A3, B3, B4) keep a pre-migration export as rollback and promote to prod only after staging sign-off.

## Migration-deploy debt (carry-over)
6 Phase-5/W migrations are applied on dev but pending on prod (sanityPersonId, follows, join_contact_requests, event_rsvp, plans_tasks, collaboration_docs) — deploy with this phase's migrations on the next prod release.

## Open sub-decisions (resolve at the slice)
- A3: migrate `agenda` too, or keep agenda as-is (lean: keep). 
- E2: include an events/calendar strip on Home now, or later.
- D2: map lib — keep the SVG choropleth + an HTML pin overlay, or introduce MapLibre/Leaflet for true clustered pins (lean: HTML overlay first, defer MapLibre).
