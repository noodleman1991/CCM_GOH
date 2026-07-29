# Design overview & responsiveness findings — 2026-07-29

Scope requested: design-language consistency, gaps/borders standardization, sizes (logo, favicon,
minimized workspace logo), overall workspace design, responsiveness, RTL/mixed-direction.
Evidence: rendered passes on /en (1280) + /ar + /ar/news via Playwright against localhost:3000,
asset inspection, component code. ⚠️ Coverage limits this pass: case-studies/communities/collaborate
listing pages and /atlas couldn't be full-page-rendered (Sanity quota outage + dev-server contention;
atlas has a known local SSR timeout), and all workspace/(collaborations) surfaces are Clerk-gated —
the workspace design review needs a signed-in session (same blocker as the 4 owed E-slice screenshots).

## Fixed during this pass (validated)

- **Overscroll flash** ("pull-to-refresh flicker"): `overscroll-none` moved to `<html>` (body placement
  is a no-op for the viewport). Root cause of the white flash behind the navy shell at scroll edges.
- **Mixed-direction text** (user directive): `dir="auto"` on CMS-derived titles/excerpts (card family +
  detail h1s) so English fallback content on /ar orders punctuation correctly and aligns to its own
  script — and Arabic content embedded in LTR pages likewise. (Seen live: /ar/news featured card
  rendered `.Connecting Climate Minds'` with the period on the wrong side before the fix.)
- **Duplicate `<main>` landmark**: shadcn `SidebarInset` is a `<main>`; the (main) layout nested a second
  one. Inner element now a div (also fixes axe `landmark-no-duplicate-main` / `landmark-unique` /
  `main-is-top-level`).

## Findings — assets & sizes (user's specific asks)

1. **Favicon is legacy-only**: `public/favicon.ico` (16px+32px) wired via a bare `<link rel="icon">`.
   Missing: `apple-touch-icon` (180px — iOS home screen falls back to a page screenshot), PNG 192/512
   (Android/PWA), SVG icon, and any `icons` metadata in the Next metadata API. Recommendation: move to
   the App Router convention (`app/icon.svg` + `app/apple-icon.png`) and drop the manual link tag.
2. **Logo source files are heavy**: `public/connecting-climate-minds-logo.png` = **572 KB**,
   white variant 116 KB. Fine when routed through `next/image`, but any plain `<img>`/CSS use ships
   half a megabyte. Recommendation: export SVG (the lockup is flat shapes) or compressed WebP.
3. **Sidebar brand lockup**: 68px tall (`h-[4.25rem]`), generous px-5/pt-6/pb-6 — consistent between
   desktop rail and mobile sheet (good). **Minimized (icon-rail) mark** is a text-based `size-8` white
   circle with lowercase "ccm" (11px bold): legible, but it's a *typed* stand-in rather than the brand
   mark, and 32px with 11px text is at the small edge next to the 32px nav icons. Recommendation:
   use the actual round mark asset (or at least the wordmark's blob shape) at `size-9`, matching the
   sidebar-menu icon column, so the collapsed rail reads as the same brand.

## Findings — design-language consistency (code-level + rendered where possible)

4. **Border standardization is good** where seen: hairline `border-border` + the section-header
   ccm-water vertical bar rule (left-aligned headers only) are applied consistently; the one accent
   border found (profiles page `border-s-4` ccm-water) now uses logical sides.
5. **Gap standardization**: the block system uses `lib/design-tokens.ts` spacing consistently, but
   hand-rolled surfaces drift: onboarding panels use `space-y-5`/`space-y-6` inconsistently between
   sibling panels; dashboard sections mix `gap-4`/`gap-6` for peer cards. Not visually broken, but a
   pass pinning section gaps to the tokens would close it. (Full-page gap audit of case-studies/
   communities/collaborate is owed once those routes render again.)
6. **Landmark/region structure** (axe, /ar/news): 8 elements sit outside any landmark (sidebar
   header/quick-actions among them) — moderate, fix by ensuring the sidebar wraps content in
   `<nav>`/labelled regions. No color-contrast or missing-label violations on the audited page — the
   June contrast fixes are holding.
7. **Broken-image resilience**: /ar and /en homepages show raw broken-image icons for the seed images
   the Sanity CDN 404s (dev-data artifact, but SafeCoverImage exists for exactly this — the homepage
   hero/carousel slots don't use it yet).
8. **Dangling nav links** (pre-existing, re-confirmed in code): footer/header still link `/blog`,
   `/research-and-action`, `/communities` which have no index routes — 404s.

## Responsiveness

- Homepage/news at 375px (spot-checked earlier passes + this session's sidebar work): sheet-based
  sidebar, cards single-column, no horizontal scroll — consistent with the mobile-first directives.
- Full 375px matrix across case-studies/communities/collaborate/atlas is **owed** (blocked routes above).

## Owed / next

- Signed-in workspace design review (overall workspace + icon-rail behavior on /collaborations/[id]).
- Full-page rendered matrix (both breakpoints × en+ar) for the blocked routes once quota restores.
- Landmark/region cleanup; homepage SafeCoverImage adoption; favicon/logo asset work (items 1–3).
