# Homepage + Regional Pages Revision + Robustness — plan v2 (2026-07-14)

Supersedes `2026-07-14-homepage-regions-revision-plan.md` (the H0–H5 doc), which was written and committed just before a machine crash interrupted execution mid-H0. This v2 re-grounds the plan against the **live rendered UI** (verified signed-in at 1440 + 375 on 2026-07-14) and three user decisions:

- **H0 (card covers) folds into the rework** — verified working (`aspect-video` at 1440 + 375), left uncommitted, committed together with the card slice (S1), not as a standalone pre-step.
- **Audit + mock-approval gates kept** — screenshot-audit → one mock artifact the user approves → build. No build code before mock approval.
- **Scope = everything incl. robustness** — homepage + regional pages AND the H5/robustness workstream, interleaved between gates.

Standing directives this plan honors: validate against rendered UI (green build ≠ validated); mock-first for design work; slice-by-slice WITH checkpoints (not big-bang); design-language uniformity (reuse tokens, +7% block gap / lg-sidebar-margin); CMS-driven taxonomy + user-facing labels (no hardcoded vocab); exciting + simple done right (gorgeous defaults, pro depth one level deeper, one story gesture, craft is scope).

## Live-UI findings that shape this plan (2026-07-14 verification)

- Homepage renders **9 blocks** via the Sanity `Blocks` system + `components/pages/homepage.tsx`: hero → fresh-content → region-map/atlas → latest-news → events → lived-experiences → share-story CTA → who's-involved (logo-cloud) → people.
- The "empty white page" in the crashed-session screenshot was mostly **21 dangling Sanity `development`-dataset image refs 404ing** (org logos + avatars + some card images), collapsing image containers. This is **local content-data noise**, NOT block-code bugs. `.env.local` (wins in dev) uses dataset `development`; `.env` uses `production_2`. The specific assets 404 on both datasets → dangling refs in the dev dataset.
- H0 card covers verified fixed at 1440 + 375. Two things H0 does NOT fix (correctly out of its scope): the dangling-asset 404s, and the **mobile carousel clipping card 2** in "Fresh on the hub" @375.

## GATE 1 — Audit (first deliverable, no build code)

Every block screenshotted at 1440 and 375, signed-in, from the live rendered UI. Annotated matrix committed to `docs/plans/2026-07-14-homepage-audit-matrix.md`. Per block: container width + vertical-rhythm delta vs agreed scale; mobile behavior @375; CMS-controllable fields vs hardcoded; data-source correctness; local-noise flag (separates real defects from dangling-asset 404s).

Blocks + known issues:

1. **Hero** (`hero/`) — "different from wireframes"; needs side-by-side wireframe delta.
2. **Fresh on the hub** (`fresh-content.tsx`, `typed-card.tsx`) — H0 covers ✓; mobile carousel clips card 2 @375; image-less case-study card shows empty `aspect-[16/5]` band ("bottom part empty").
3. **Explore by region / atlas** (`maps/`) — passive counts list; no path region → filtered `/atlas`; rethink action-first.
4. **Latest news in the field** (`latest-content-section.tsx`) — "needs a stretch"; width audit.
5. **Events** (`events/`) — calendar + "No upcoming events" empty state; rhythm check.
6. **Lived experiences** — empty "No lived experiences available yet"; data-source check.
7. **Share your story CTA** — alignment/rhythm only.
8. **Who is involved** (`logo-cloud/`) — logos blank locally = dangling refs (local noise); directive: link to CMS **organization** entities — verify orgs not profiles.
9. **People in your region** (`people/`) — data-source + rhythm check.

**Gate:** user reviews the matrix before the mock.

## GATE 2 — Mock artifact (user approves before build code)

One published visual artifact, both 1440 and 375 per reworked block, using real live content where possible (placeholder only for dangling assets):

1. Hero — wireframe-faithful, side-by-side with current live hero + original wireframe.
2. Fresh on the hub — H0 covers + fixed mobile stacking (no clipped card 2) + considered image-less-card treatment (no empty band).
3. Atlas block re-thought action-first — chips → tap region → into pre-filtered `/atlas`; counts as support (one story gesture).
4. Latest News — full-stretch band.
5. Who's involved — CMS-driven organizations block (org logos/names from `organization` docs, grouped by role).
6. Block-rhythm system — one container scale + one gap token across all blocks (+7% gap / lg-margin), shown as spacing spec.

**Gate:** user approves the mock before any build slice.

## Build sequence (after mock approval) — slice-by-slice, checkpoint each

Each slice verified against rendered UI at 1440 + 375 before the next.

| Slice | Scope | Commit gate |
|---|---|---|
| **S1** | Card system: H0 covers + mobile stacking fix + image-less card treatment (`fresh-content.tsx`, `typed-card.tsx`) | verified @375 + 1440 |
| **S2** | Block-rhythm token pass — one container scale + gap token across all 9 blocks | alignment screenshot |
| **S3** | Hero → wireframe-faithful, CMS-controlled copy/CTAs | side-by-side vs wireframe |
| **S4** | Atlas block action-first rework (region → filtered `/atlas`) | drive the click-through live |
| **S5** | Latest News stretch + "Who's involved" → CMS `organization` entities (schema fields, no hardcoded vocab) | editor-controllable check |
| **S6** | Regional community pages — TypedCard grid + typed section headers, every section a CMS block; region hero stays (§4.13) | verified @375 + RTL spot-check |

Every block stays CMS-controlled — schema fields for copy/counts/links, no hardcoded vocabularies.

## Robustness track (H5/R) — interleaved between homepage gates

From the 2026-07-14 robustness audit (`fbad2c452`). Separate concern (write paths, not layout); fix-order preserved.

| Slice | Fix | Touches |
|---|---|---|
| **R1** | Optimistic concurrency — Prisma `updatedAt` guards + Sanity `ifRevisionId` on writes. **Review the uncommitted `lib/actions/requests.ts` (+43 lines) as R1's first step** to decide keep/fold/discard. | `lib/actions/*`, Sanity mutation helpers |
| **R2** | Per-doc autosave timers + unload flush | workspace/editor autosave hooks |
| **R3** | Discriminated read failures (distinguish "no data" from "read failed") | data-fetch layer, block empty-states |

Interleave:

```
AUDIT (gate 1) ──► MOCK (gate 2, approve)
   │                    │
   └─ R1 during review ─┘
                        │
   S1 ─► S2 ─► [R2] ─► S3 ─► S4 ─► [R3] ─► S5 ─► S6
```

Each R-slice verified end-to-end (R1 = two concurrent edits, confirm second rejected not silently lost), not just green typecheck.

## Sequence summary

AUDIT (gate) → MOCK (approval gate) → S1 → S2 → R2 → S3 → S4 → R3 → S5 → S6, with R1 in the gate-review windows. H0 folds into S1; `requests.ts` reviewed inside R1.
