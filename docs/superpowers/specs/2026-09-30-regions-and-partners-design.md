# Regions and partners on the homepage — design

**Date:** 2026-09-30 · **Status:** approved in conversation ("yes write the spec and plan, no subagents")

## 1. What we found

- The homepage says "regions" three times in a row: the atlas ("Explore by region", with its "Around the regions" strip of one case study per region), then seven large cards that all read "Regional Community of Practice" with identical **View Community** buttons. Heavy, repetitive, and the cards say nothing about the community.
- The atlas has no Region filter row: a region is chosen only by clicking the map.
- "Who is involved" is a fast scrolling strip of small grey logos cut off at the edges; no names, nothing says they're links. The same scrolling strip is on 4 community pages.

## 2. Decisions (user, 2026-09-30)

| # | Decision |
|---|---|
| R1 | All seven regions are presented **equally** — same size, alphabetical in the reader's language; nothing ranks one above another. |
| R2 | Regions become a **filter row in the atlas**; the atlas stays the one map (no second map). |
| R3 | Where the seven cards are, a **carousel of community cards** with live, looping data about each community. |
| R4 | Everything is **editable in the CMS**. |
| P1 | Homepage partners: a **grouped logo wall** — Funded by / Hosted by larger on top, then equal partner tiles with names; each links to the organisation's hub page. |
| P2 | Community pages: a **one-line logo carousel** the visitor moves (arrows / swipe), not an auto-running ticker. |

## 3. Design

**3.1 Region row in the atlas.** The atlas filter bar gains **Region** as its first row: seven chips, alphabetical in the reader's language, each with a tiny region silhouette (the existing `RegionLocator` artwork, 16px) and the count of items the current filters find there. Choosing a chip is the same as clicking the region on the map (the existing single `?region=` state: zoom, spotlight, scoped counts); choosing it again clears it. One region at a time — the map's zoom and spotlight are single-region. The region spotlight gains **Go to the community →** (the community page for that region). The row is hidden on a community page's embedded atlas (its region is fixed). Applies to `/atlas`, the homepage "Explore by region" and any page's region map.

**3.2 "Around the regions" becomes optional.** The Region map section gets **Show the latest from each region** (checkbox, default on so nothing changes by itself). The homepage turns it off (script, §3.6) because the carousel carries that news.

**3.3 Community carousel (new section, "Community carousel").** One line of equal cards, one per regional community, alphabetical in the reader's language.
- Card: region silhouette (`RegionLocator`, large), community name, **tagline** (from the community record), counts — members · stories (case studies + lived experiences, same matching as the atlas) · upcoming events (hidden when 0), a stack of up to 5 member faces (only members whose profile is public and has a photo; "+N" for the rest), and a **latest** line that cycles every 5 s through: the newest story ("New story: …"), the next event ("Coming up: … · 12 Nov"), the newest public member ("Welcome, Amina"). The whole card links to the community page.
- Motion: the row advances one card every 6 s in a loop; pauses on hover, keyboard focus, when the tab is hidden and when the visitor has touched the arrows; with reduced motion nothing moves (no auto-advance, no cycling — the latest line shows its first item). Arrows on desktop, swipe (scroll-snap) on phones, dots under it. Screen readers: a labelled region with "Card 3 of 7"; the cycling line is `aria-live="off"`.
- Section settings (CMS): heading, intro, communities (default: all active, alphabetical; picking some shows those), show counts (members / stories / events — each on/off), show faces (on/off), show the latest line (on/off), move by itself (on/off, default on), speed (calm / normal).
- Community record: new **Tagline** (translatable, up to 140 characters, "One line about this community, shown on its card"). Empty → the card shows no tagline.

**3.4 Grouped logo wall (homepage).** The Logo strip section gains **Funded by** and **Hosted by** (organisations, optional). With the Grid layout: those show first, larger (logo, name, and a small "Funded by" / "Hosted by" label), then **Partners**: equal tiles (logo in a fixed box, full colour, name underneath), 2 across on phones, 4 at wide widths; each tile links to the organisation's hub page. Unlinked "Other logos" follow as tiles without links. The existing grouping by institution type stays for pages that use it.

**3.5 One-line carousel (community pages).** The Logo strip's Layout gains **One line — scrolls sideways** (`carousel`): a single row of the same tiles, arrows on desktop, swipe on phones, no auto-movement. The marquee remains as an option but no page uses it after §3.6.

**3.6 Putting it on the pages.** `scripts/homepage/regions-and-partners.ts` (dry run by default, `--execute`, `--revert`, `--production` for the user): on the homepage, replaces the seven-card grid section with a Community carousel (heading from the grid's own heading, in every language), turns off "Show the latest from each region" on the Region map, switches the Logo strip to Grid with Funded by = Wellcome and Hosted by = Climate Cares Centre (looked up among organisations by name; the script stops and says which it couldn't find); on each community page, switches Logo strips to One line. English first, then each language onto the same rows (the established pattern). `--revert` restores the previous rows from a JSON backup the script writes before changing anything.

## 4. Build order (each rendered-checked at 375 and 1280, en and ar, before the next)

1. Atlas Region row + Go to the community.
2. Tagline + community carousel data (one server read for all seven).
3. Community carousel section.
4. Logo wall + one-line carousel.
5. Region map switch + the script + runbook.

## 5. Testing

Unit: alphabetical order per language (Arabic sorts by Arabic names); region chip counts from the same data as the map; carousel data (counts match the community page's, faces only public-with-photo, latest line items and order, upcoming events only approved and not over); carousel state (advance, pause reasons, reduced motion); logo grouping (funders/hosts first, no duplicates if an organisation is also a partner); script planner (idempotent, revert). Rendered: the homepage (region row, carousel moving and pausing, logo wall), a community page (one-line logos), `/atlas` (region row), all at 375/1280 in en and ar; keyboard-only pass of the carousel. Full suite, `tsc`, eslint on changed files.

## 6. Out of scope

A second map; per-region custom artwork; logo uploads for organisations lacking one (they show their name in the tile); sponsorship tiers beyond Funded by / Hosted by.
