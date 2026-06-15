# Block Text / Image / Button Sizing — Analysis & Recommendations

Measured live on the dev server (1440px desktop, 2× DPI). Screenshots in
/tmp/turbo2-ui/blocks-*.png. This is the analysis you asked for before I change
anything.

## Measured current state

```
HOMEPAGE
┌─────────────────────────────────────────────────────────────┐
│ HERO (hero-1)                                                 │
│   h1: 60px / lh 66px   ← very large; good for hero           │
│   tagline + body: default                                    │
│   buttons: 48px tall, 14px font, 32px h-padding  ✅ uniform   │
├─────────────────────────────────────────────────────────────┤
│ SPLIT ROWS ×4 (globalAgenda/howToUse/collaboration/project)  │
│   h2: 48px (text-3xl→5xl)                                     │
│   ⚠ button "Read the Global Agenda": 36px tall, 64px pad     │
│      ← DIFFERENT from every other button (48px/32px)         │
├─────────────────────────────────────────────────────────────┤
│ GRID ROW (agendas/reports/toolkits/case-studies cards)       │
│   section h2: 48px                                           │
│   card title: text-2xl, button: full-width ✅                │
│   images: maps, aspect 3:2, object-cover ✅                   │
├─────────────────────────────────────────────────────────────┤
│ GRID ROW (regional communities) — 7 cards                    │
│   ⚠ all card images are near-identical world maps           │
│   card title: text-2xl, can wrap to 2 lines                 │
├─────────────────────────────────────────────────────────────┤
│ CAROUSEL (lived experiences) / CTA / LOGO CLOUD              │
└─────────────────────────────────────────────────────────────┘

REGIONAL COMMUNITY PAGE (central-and-southern-asia)
┌─────────────────────────────────────────────────────────────┐
│ HERO: h1 ~60px "Welcome to the Central and Southern Asia…"   │
│ SPLIT "Why Join Our Regional Community?"                     │
│ GRID "research and action agenda"  → "No content available" │
│ GRID "Innovative case studies"     → "No content available" │
│   ⚠ empty grids render a big header + empty body (lots of   │
│      vertical whitespace, looks broken to a visitor)        │
│ CAROUSEL "lived experience insights" ✅                      │
│ TEAM GRID: avatars, 4 per row, circular ✅                   │
└─────────────────────────────────────────────────────────────┘
```

## Issues found (prioritized)

### 1. Inconsistent button sizing  ⚠ (you flagged this)
Most CTA buttons are **48px tall / 14px / px-8 (32px)**, but split-content's
link button renders **36px tall / 64px padding** — a different size from the
shared `<SanityButton>`. Cause: split-content uses a different button size/variant.
**Fix:** normalize all block CTA buttons to one size (the 48px `size="default"`
or a slightly larger `lg`), so every "Read X" / "View X" button matches.

### 2. Empty dynamic grids show a header over a blank body  ⚠
On the regional page, "research and action agenda" and "case studies" grids have
no content yet, so they render a large section heading followed by empty space
("No content available at this time"). To a visitor this looks broken.
**Fix options (pick one):** (a) hide the whole grid section when it has zero
items, or (b) render a compact, friendly empty-state card instead of bare text.
Recommend (a) for cleanliness — a section with nothing in it shouldn't take a
full screen of vertical space.

### 3. Hero h1 is fixed-large; long titles overflow on mid-widths
h1 is `text-4xl md:text-5xl lg:text-6xl` (up to 60px). "Welcome to the Central
and Southern Asia regional community of practice" is long and pushes the hero
tall. Fine on desktop; verify it doesn't crowd the image on tablet (768–1024px).
**Fix:** add `text-balance` and a slightly tighter clamp, or cap h1 width so it
wraps predictably.

### 4. Section headers (h2) at 48px are heavy when stacked
Multiple 48px section headers in a row (agendas, stories, regional comms) make
the page feel like a stack of billboards. **Optional polish:** step the scale
(e.g. `text-3xl md:text-4xl`, ~36px) so headers are present but less shouty, and
images/cards get more visual weight.

### 5. Regional-community cards all use the same world map
Every regional card image is the same globe with a different region highlighted —
low information value and visually repetitive. **Fix (content, not code):** give
each community a distinct image in Sanity; or **code:** make the highlight more
prominent / crop tighter so the difference reads at card size.

### 6. Image sizing is already solid (from phase-1/2 work)
Cards use `urlForCropped` + per-column `sizes`, hotspot honored, 800px sources.
No action needed — the earlier image work covers this. The remaining image issue
is purely the duplicate-map content (#5).

## Proposed implementation (if you approve)

1. **Normalize block button sizing** — one shared size for all block CTAs (low risk).
2. **Hide empty dynamic grid sections** — don't render a grid whose resolved
   items array is empty (regional template + homepage dynamic sections).
3. **Hero h1: add `text-balance`** + keep the responsive clamp (tiny, safe).
4. *(Optional, ask first)* step section-header scale down to `md:text-4xl`.
5. *(Content)* distinct regional images — your call, I can't author images.

Tell me which of 1–4 to implement.
