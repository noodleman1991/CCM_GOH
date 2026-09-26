# Homepage + Regional Pages Revision — plan (user directive 2026-07-14)

User feedback driving this: typed-card images/videos too narrow · homepage needs a whole-page pass (block alignment, mobile) · hero differs from wireframes · atlas block usability rethink · Latest News needs stretch · "Who is involved" revision + linked to CMS organization entities · everything CMS-block-controlled.

## H0 — Card cover fix (immediate, no gate)
Grid/lead/mini covers get real media proportions (aspect-video, not 74px strips); LE video covers read as video. One-place change in typed-card.tsx.

## H1 — Homepage + region page audit (evidence first, per contract)
Screenshot every block at 1440/375, both from the LIVE blocks[] docs. Catalog per block: container width + vertical rhythm deltas, mobile breakage, CMS-controllable fields vs hardcoded, hero-1 vs wireframe delta (side-by-side), region-map (atlas block) usability issues (counts list is passive; no path into filtered atlas), Latest News width/stretch, people-widget data source (currently profiles? must become organization entities). Output: annotated matrix committed to docs/plans.

## H2 — Mock v1 (GATED: user approves before code)
One artifact covering: revised hero (wireframe-faithful), atlas block re-thought as action-first (chips → tap region → straight into /atlas pre-filtered; counts as support, not the content), Latest News full-stretch band, "Who's involved" as a CMS-driven organizations block (org logos/names from organization docs, grouped by role), block rhythm system (one container scale + gap token), mobile behavior for each.

## H3 — Homepage build (after approval)
Implement approved blocks; every block CMS-controlled (schema fields for copy/counts/links; no hardcoded vocab). Alignment pass using the agreed rhythm token (+7% block gap memory). Mobile verification at 375 incl. RTL spot-check.

## H4 — Regional community pages build
Template sections → TypedCard grid + typed section headers (Task 13 tail lands here); every section a CMS block editors control; region hero stays (§4.13). Any layout departure goes through the H2 artifact first.

## H5 — Continue robustness workstream (parallel track)
Fix-order from 2026-07-14 robustness audit, starting with optimistic concurrency (Prisma updatedAt guards + Sanity ifRevisionId), then per-doc autosave timers + unload flush, then discriminated read failures.

Sequence: H0 now → H1 → H2 (approval gate) → H3 → H4, with H5 slices interleaved between gates.
