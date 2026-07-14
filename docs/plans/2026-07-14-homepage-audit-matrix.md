# Homepage Audit Matrix — GATE 1 (2026-07-14)

Evidence for the v2 revision plan (`2026-07-14-homepage-regions-revision-plan-v2.md`). Every block observed in the **live rendered UI**, signed-in (Amit Lokszinski), at **1440** and **375**. Screenshots archived in the session scratchpad (`scratchpad/audit/`), not committed to the repo.

**Environment note (critical for reading this matrix):** dev uses the Sanity **`development`** dataset (`.env.local` wins over `.env`'s `production_2`). Many image assets referenced by dev-dataset docs are **dangling** — they 404 on both `development` and `production` CDNs (30 image 404s observed). Every "broken image" below is this local-data condition, **not** block-code failure. Real block/layout/data defects are marked **[DEFECT]**; local-asset noise is marked **[LOCAL-NOISE]**.

## Legend

- **Rhythm**: vertical spacing / container width vs the agreed scale (+7% block gap, wider lg sidebar margin).
- **CMS**: which fields an editor controls today.
- **[DEFECT]** = fix in a build slice · **[LOCAL-NOISE]** = dev-dataset asset gap, not code.

## Matrix

| # | Block (component) | 1440 | 375 (mobile) | CMS control | Findings |
|---|---|---|---|---|---|
| 1 | **Hero** (`hero/`) | Two-column: heading + copy + Explore/Collaborate CTAs left, illustration right | Stacks cleanly; illustration broken-image | Copy, CTAs, illustration = Sanity | **[DEFECT]** differs from wireframe (per directive — needs side-by-side). **[LOCAL-NOISE]** illustration asset 404. → S3 |
| 2 | **Fresh on the hub** (`fresh-content.tsx`, `typed-card.tsx`) | Bento: lead news card + case-study card + 3 LE video cards. H0 covers ✓ real proportions | **[DEFECT]** carousel **clips card 2** at right edge; cards don't stack | Source = latest content mix | **[DEFECT]** mobile stacking; **[DEFECT]** image-less case-study card = empty `aspect-[16/5]` band ("bottom part empty"). H0 covers verified good. → S1 |
| 3 | **Explore by region / atlas** (`maps/`) | Choropleth world map + 5 facet chips (Case studies/LE/Members/News/Research outputs) + counts list right | Map + chips + counts stack acceptably | Facets, region counts derived from data | **[DEFECT]** counts list is **passive** — no affordance from a region row into a filtered `/atlas`. Rethink action-first (chips → tap region → pre-filtered atlas; counts as support). → S4 |
| 4 | **Latest news in the field** (`latest-content-section.tsx`) | 3 text-only cards, narrow max-width, no media | Cards stack | News docs | **[DEFECT]** first two cards are **duplicates** (same title/date/author) — data-source/dedup bug. **[DEFECT]** "needs a stretch" — narrow band, text-only, no thumbnail. → S5 |
| 5 | **Events** (`events/`) | Calendar (July 2026) + "Upcoming" list, "No upcoming events" | Full-width calendar, fine | Events data + iCal subscribe | No layout defect. Empty "Upcoming" is genuine (no data), not a read failure — but verify via R3. Rhythm OK. |
| 6 | **Lived experiences** (`people/` region) | "No lived experiences available yet" empty state | Same | LE docs | **[DEFECT?]** empty despite LE cards existing in block #2 — likely a data-source/query mismatch, not truly empty. Confirm in R3 (discriminated read failures). |
| 7 | **Share your story CTA** | Eyebrow + heading + copy + "Submit your story" button | Stacks; avatar broken-image | Copy, CTA target | Rhythm only. **[LOCAL-NOISE]** avatar 404. → S2 |
| 8 | **Who is involved** (`logo-cloud/`) | Heading + copy + logo grid — **all logos broken-image alt-text** | Logo grid wraps oddly | Logos from partner/org entities | **[LOCAL-NOISE]** every logo asset 404 (code renders fine). **[DEFECT]** directive: confirm/convert to CMS **`organization`** entities, grouped by role. → S5 |
| 9 | **People in your region** (`people/`) | Region chips + member name list | Chips + list stack; avatars broken-image | Region facet + members | **[LOCAL-NOISE]** avatar 404s. Rhythm OK. Verify data-source (profiles by region) in R3. |

## Cross-cutting findings

- **Block rhythm (all 9):** vertical gaps are inconsistent between blocks — some hug tight, some loose. No single container-scale/gap token applied. → **S2** (one rhythm system, +7% gap / lg-margin).
- **Local-asset noise (hero illustration, who's-involved logos, share-story + people avatars, some card covers):** 30 dangling `development`-dataset asset 404s. **Not fixed by any build slice** — it's a content/dataset condition. Flag for the user: either repair the dev-dataset asset refs, or point dev at a dataset with intact assets, to validate media-bearing blocks properly. The mock (Gate 2) will use placeholders where assets are dangling.
- **Console:** 30 errors, all the image-404 class. No JS/runtime errors in block code.

## What this changes in the build plan

- **S1** (cards) gains a concrete second target: mobile carousel stacking, alongside H0 covers + image-less card treatment.
- **S4** (atlas) confirmed: the rework is turning the passive counts list into a region→filtered-`/atlas` path.
- **S5** gains the **Latest-News duplicate-card** data bug (not just "stretch") and confirms **Who's-involved → `organization` entities**.
- **R3** (discriminated read failures) gains two concrete suspects: block #6 (LE empty despite LE data existing) and block #9 (people data-source).
- **User action item (blocker for full media validation):** dev-dataset dangling assets.

## Gate

User reviews this matrix before I build the Gate-2 mock.
