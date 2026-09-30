# Regions and partners on the homepage — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **This programme runs inline, no subagents (user).**

**Goal:** All seven regional communities are presented equally — as a Region filter row in the atlas and as a living, CMS-editable carousel of community cards — and partner logos become a grouped wall on the homepage and a one-line carousel on community pages.

**Architecture:** Pure helpers (ordering, chip options, card building, carousel state, logo grouping) carry the logic and the tests; one server reader gathers every community's live data in a handful of queries; two blocks change (Logo strip, Region map), one block is added (Community carousel), one community field is added (Tagline); a dry-run-first script puts it on the pages.

**Tech Stack:** Next.js 16 App Router, Payload 3.88 (Postgres), Prisma (members), next-intl 4 (en/es/fr/ar, Arabic right-to-left), vitest + RTL, Playwright MCP.

**Spec:** `docs/superpowers/specs/2026-09-30-regions-and-partners-design.md`

## Global Constraints

- All seven regions presented equally: same size, **alphabetical in the reader's language** (`localeCompare(…, locale)`), none emphasised (R1).
- The atlas stays the one map; no second map (R2).
- Everything editable in the CMS (R4): section settings in the admin, taglines on the community record.
- Member faces: only members whose profile is **PUBLIC** and has a photo. Never show a MEMBERS/PRIVATE profile's face or name.
- Motion: pauses on hover, focus, hidden tab and after the visitor touches the controls; `prefers-reduced-motion` → no auto-advance and no cycling.
- Four languages for every new message; Arabic right-to-left (arrows mirrored); 375 px with no sideways page scroll; 44 px touch targets.
- Reuse the hub's design language and tokens (`ccm-*`, `design-tokens`, `FilterRow`/`FilterChip`, `RegionLocator`); no redesign of unrelated parts.
- Nothing outside `lib/content/` imports `lib/content/internal/`.
- Pushing master deploys production (Payload migrations run then); scripts on production are the user's (`scripts/with-prod-env.sh`). Push only when the user says so. No Claude/AI attribution in commits.
- After touching `payload/**`: `curl /admin` → 200.

## Review Focus

1. **Arabic ordering** — "alphabetical" must sort by the Arabic region names on `/ar`, not the English slugs. (Test in Task 1.)
2. **A community with no members, no stories and no events** — its card must still look complete (tagline or intro line, "Be the first to join"), not a card of zeros. (Test in Task 2.)
3. **The same organisation chosen as Funded by and as a partner** — it appears once, in the Funded by spot. (Test in Task 4.)
4. **A visitor who tabs into the carousel** — auto-advance stops for good (focus must not be yanked away by a slide change). (Test in Task 3.)
5. **Region row counts vs the map** — a chip's count equals the region's number on the map for the same filters (same data source). (Test in Task 1.)

---

### Task 1: Region row in the atlas

**Files:**
- Create: `lib/maps/region-chips.ts`, `lib/maps/__tests__/region-chips.test.ts`
- Modify: `components/atlas/atlas-explorer.tsx` (Region row first in `FilterRowGroup`, hidden when `lockedRegion`), `messages/*.json` (`filters.region` exists — reuse)

**Interfaces:**
- Produces: `regionChips(data: Array<{ code: RegionCode; value: number }>, labelFor: (c: RegionCode) => string, locale: string): Array<{ code: RegionCode; label: string; count: number }>` — all seven, always (a region with 0 still shows, count 0), sorted by label with `localeCompare(b, locale)`.

Note for the ledger: the spotlight already has "Visit the community" (`region-spotlight.tsx`), so spec §3.1's link needs no work — ruling "already built".

- [ ] **Step 1: Failing test**

```ts
import { describe, expect, it } from "vitest";
import { regionChips } from "@/lib/maps/region-chips";

const data = [
  { code: "oce", value: 3 }, { code: "ssa", value: 9 }, { code: "enam", value: 5 },
] as const;
const en: Record<string, string> = { ssa: "Sub-Saharan Africa", nawa: "Northern Africa and Western Asia", csa: "Central and Southern Asia", esea: "Eastern and South-Eastern Asia", lac: "Latin America and the Caribbean", oce: "Oceania", enam: "Europe and Northern America" };
const ar: Record<string, string> = { ssa: "أفريقيا جنوب الصحراء", nawa: "شمال أفريقيا وغرب آسيا", csa: "آسيا الوسطى والجنوبية", esea: "شرق وجنوب شرق آسيا", lac: "أمريكا اللاتينية والكاريبي", oce: "أوقيانوسيا", enam: "أوروبا وأمريكا الشمالية" };

describe("the atlas region row", () => {
  it("lists all seven regions alphabetically in the reader's language, with the map's counts", () => {
    const chips = regionChips([...data], (c) => en[c], "en");
    expect(chips.map((c) => c.label)).toEqual([...Object.values(en)].sort((a, b) => a.localeCompare(b, "en")));
    expect(chips.find((c) => c.code === "ssa")?.count).toBe(9);
    expect(chips.find((c) => c.code === "lac")?.count).toBe(0);
  });
  it("sorts by the Arabic names on the Arabic site", () => {
    const chips = regionChips([...data], (c) => ar[c], "ar");
    expect(chips.map((c) => c.label)).toEqual([...Object.values(ar)].sort((a, b) => a.localeCompare(b, "ar")));
    expect(chips.map((c) => c.code)).not.toEqual(regionChips([...data], (c) => en[c], "en").map((c) => c.code));
  });
});
```

- [ ] **Step 2: Run** `pnpm exec vitest run lib/maps/__tests__/region-chips.test.ts` → FAIL (module missing).
- [ ] **Step 3: Implement**

```ts
// lib/maps/region-chips.ts
import { REGION_CODES, type RegionCode } from "./region-codes";

/** The atlas Region row: all seven, equal, alphabetical in the reader's language (spec R1). Pure. */
export function regionChips(
  data: Array<{ code: RegionCode; value: number }>,
  labelFor: (code: RegionCode) => string,
  locale: string,
): Array<{ code: RegionCode; label: string; count: number }> {
  const count = new Map(data.map((d) => [d.code, d.value]));
  return REGION_CODES.map((code) => ({ code, label: labelFor(code), count: count.get(code) ?? 0 })).sort((a, b) =>
    a.label.localeCompare(b.label, locale),
  );
}
```

In `atlas-explorer.tsx`, before the Show row and only when `!lockedRegion`:

```tsx
<FilterRow label={tFilters('region')}>
  {regionChips(regionData, labelFor, locale).map((c) => (
    <FilterChip
      key={c.code}
      label={c.label}
      count={c.count}
      active={selected === c.code}
      icon={<RegionLocator region={c.code} label="" className="size-4" />}
      onClick={() => onSelect(c.code)}
    />
  ))}
</FilterRow>
```

Check `FilterChip`'s props first (`components/ui/filter-chip.tsx`); if it has no `icon` slot, add an optional `icon?: ReactNode` rendered before the label (with a test in its existing test file, or a new one). `regionData` is the same `region-data` response the map shades from (Review Focus 5). Mark the locator `aria-hidden`.

- [ ] **Step 4: Run** → PASS; `tsc`; eslint changed files.
- [ ] **Step 5: Rendered check:** `/en/atlas`, `/ar/atlas`, `/en` (Explore by region) at 375 and 1280: the Region row first, seven chips in alphabetical order, counts equal the map's numbers; tapping Oceania zooms and opens its spotlight, tapping again clears; `/en/communities/oceania` (locked embed) has no Region row. No sideways scroll; 0 console errors.
- [ ] **Step 6: Commit** — `feat(atlas): a Region row — all seven regions, equal and alphabetical`.

---

### Task 2: Taglines and the community carousel's data

**Files:**
- Modify: `payload/collections/regional-communities.ts` (`tagline`), `payload-types.ts`, `migrations/*` (generated)
- Create: `lib/communities/carousel-cards.ts` (pure), `lib/content/community-carousel.ts` (server reader, content-layer boundary: it may import `lib/content/internal/*`), `lib/__tests__/carousel-cards.test.ts`, `lib/__tests__/community-carousel-reader.test.ts`

**Interfaces:**
- Produces:
  - `type CarouselCard = { slug: string; code: RegionCode; name: string; tagline: string | null; members: number; stories: number; upcomingEvents: number; faces: Array<{ name: string; image: string }>; moreFaces: number; latest: Array<{ kind: "story" | "event" | "member"; text: string; href: string | null }> }`
  - `buildCarouselCards(raw: RawCommunity[], locale: string): CarouselCard[]` — alphabetical by `name` in `locale`; faces capped at 5 with `moreFaces` = rest; `latest` order story → event → member, each only when present.
  - `type RawCommunity = { slug: string; code: RegionCode; name: string; tagline: string | null; members: number; stories: number; upcomingEvents: number; publicFaces: Array<{ name: string; image: string | null }>; newestStory: { title: string; href: string } | null; nextEvent: { title: string; startAt: string; href: string } | null; newestMember: { firstName: string } | null }`
  - `getCommunityCarouselCards(locale: "en" | "es" | "fr" | "ar", now?: Date): Promise<CarouselCard[]>` (server; `safe(…, [])`).

- [ ] **Step 1: Tagline field.** In the community record's Details, after `name`: `localizedTextarea("tagline", { label: "Tagline", maxLength: 140, admin: { description: "One line about this community, shown on its card on the homepage." } })` (check `localizedTextarea`'s option names). Generate the migration (`payload migrate:create community_tagline` with the dev env — see the events ledger for the env and the standing dev-push prompt), inspect it is additive, apply on dev, regenerate types.

- [ ] **Step 2: Failing tests**

```ts
// lib/__tests__/carousel-cards.test.ts
import { describe, expect, it } from "vitest";
import { buildCarouselCards, type RawCommunity } from "@/lib/communities/carousel-cards";

const raw = (o: Partial<RawCommunity>): RawCommunity => ({
  slug: "oceania", code: "oce", name: "Oceania", tagline: null, members: 0, stories: 0, upcomingEvents: 0,
  publicFaces: [], newestStory: null, nextEvent: null, newestMember: null, ...o,
});

describe("community cards", () => {
  it("are alphabetical in the reader's language", () => {
    const cards = buildCarouselCards([raw({ slug: "b", name: "Oceania" }), raw({ slug: "a", name: "Europe and Northern America" })], "en");
    expect(cards.map((c) => c.slug)).toEqual(["a", "b"]);
  });
  it("show at most five public faces with photos, and count the rest", () => {
    const faces = Array.from({ length: 8 }, (_, i) => ({ name: `P${i}`, image: i === 2 ? null : `/p${i}.jpg` }));
    const [card] = buildCarouselCards([raw({ publicFaces: faces })], "en");
    expect(card.faces).toHaveLength(5);
    expect(card.faces.every((f) => f.image)).toBe(true);
    expect(card.moreFaces).toBe(2);
  });
  it("cycle the newest story, the next event and the newest member — only those that exist", () => {
    const [card] = buildCarouselCards([raw({
      newestStory: { title: "Reef grief", href: "/lived-experiences/reef" },
      nextEvent: { title: "Coastal circle", startAt: "2026-11-12T10:00:00Z", href: "/events/coastal" },
      newestMember: { firstName: "Amina" },
    })], "en");
    expect(card.latest.map((l) => l.kind)).toEqual(["story", "event", "member"]);
    const [quiet] = buildCarouselCards([raw({ newestMember: { firstName: "Amina" } })], "en");
    expect(quiet.latest.map((l) => l.kind)).toEqual(["member"]);
  });
  it("still reads as a complete card with nothing yet", () => {
    const [card] = buildCarouselCards([raw({})], "en");
    expect(card).toMatchObject({ members: 0, stories: 0, upcomingEvents: 0, faces: [], latest: [] });
  });
});
```

(The card's "latest" `text` is built in the component from message templates — the builder carries data only; ledger if you choose otherwise.)

Reader test (`community-carousel-reader.test.ts`): mock the Payload seam, Prisma and `getRegionStats`; assert (a) only `profileVisibility: "PUBLIC"` users are selected for faces (inspect the Prisma `where`), (b) upcoming events counted with `moderationStatus: approved` and `endAt ?? startAt ≥ now`, (c) one Prisma query for all seven communities' counts (`groupBy` or `findMany` with `_count`), not seven.

- [ ] **Step 3: Run** → FAIL. **Step 4: Implement** the pure builder (sort with `localeCompare(…, locale)`; `faces = publicFaces.filter(f => f.image).slice(0, 5)`; `moreFaces = members - faces.length` clamped ≥ 0 — ledger that "rest" means all other members, since only public ones are shown). Reader: Payload `regionalCommunities` (active, published; `name`, `tagline` at the request locale with fallback, `slug`, `region`); Prisma `community.findMany({ where: { type: "REGIONAL" }, select: { regionalName, _count: { select: { members: true } }, members: { where: { user: { profileVisibility: "PUBLIC" } }, take: 6, orderBy: … , select: { user: { select: { firstName, image } } } } } })` — check the join model's timestamp for "newest" (UserCommunity has none: use `user.createdAt` desc and ledger it); stories via `getRegionStats(code, slug)` summed; newest story: the newest approved case study or lived experience in that region (reuse the region-items reader: `getRegionFacetItems` for both types with limit 1, or a new small reader — pick the smaller change); upcoming events: Payload count on `events` with `relatedCommunity = id`, approved, not over; next event: same query sorted `startAt` asc, limit 1.
- [ ] **Step 5: Run** → PASS; `tsc`; boundary test (`lib/__tests__/content-layer-boundary*.test.ts`) green.
- [ ] **Step 6: Dev check** (throwaway script, deleted after): print the seven cards' counts; compare members with the community pages' hero numbers and stories with `region-data` case studies + lived experiences — equal.
- [ ] **Step 7: Commit** — `feat(communities): a tagline, and one read for every community's live numbers`.

---

### Task 3: The Community carousel section

**Files:**
- Create: `payload/blocks/community-carousel.ts`, `components/blocks/community-carousel/community-carousel.tsx` (server: reads cards), `components/blocks/community-carousel/carousel-track.tsx` (client), `lib/communities/carousel-state.ts` (pure reducer), `lib/__tests__/carousel-state.test.ts`, `components/blocks/community-carousel/__tests__/carousel-track.test.tsx`
- Modify: `payload/blocks/index.ts`, `payload/globals/homepage.ts` (`HOMEPAGE_SECTIONS` gains it — so pages and communities get it too), `lib/content/internal/payload/blocks.ts` (`case "communityCarousel"` → `_type: "community-carousel"` with its settings), `components/blocks/registry.tsx`, `migrations/*` (generated), `messages/*.json` (`communityCarousel.*`)

**Interfaces:**
- Consumes: Task 2 `getCommunityCarouselCards`, `CarouselCard`.
- Produces: block slug `communityCarousel`, fields `heading` (localized), `intro` (localized textarea), `communities` (relationship → regionalCommunities, hasMany, optional), `show` group of checkboxes `members`/`stories`/`events`/`faces`/`latest` (all default true), `autoplay` (checkbox, default true), `speed` (`calm` | `normal`, default `calm`); pure `carouselReducer(state, action)` with `State = { index: number; count: number; paused: Set<"hover" | "focus" | "hidden" | "touched">; reduced: boolean }` and actions `tick | next | prev | goto(i) | pause(reason) | resume(reason) | setReduced(b)`; `shouldAdvance(state)`.

- [ ] **Step 1: Failing tests**

```ts
// lib/__tests__/carousel-state.test.ts
import { describe, expect, it } from "vitest";
import { carouselReducer, initialCarousel, shouldAdvance } from "@/lib/communities/carousel-state";

describe("the community carousel", () => {
  it("loops forward on its own", () => {
    let s = initialCarousel(7, false);
    for (let i = 0; i < 7; i++) s = carouselReducer(s, { type: "tick" });
    expect(s.index).toBe(0);
  });
  it("stops moving while hovered or the tab is hidden, and resumes after", () => {
    let s = carouselReducer(initialCarousel(7, false), { type: "pause", reason: "hover" });
    expect(shouldAdvance(s)).toBe(false);
    s = carouselReducer(s, { type: "resume", reason: "hover" });
    expect(shouldAdvance(s)).toBe(true);
  });
  it("stops for good once the visitor focuses it or uses the arrows", () => {
    let s = carouselReducer(initialCarousel(7, false), { type: "pause", reason: "focus" });
    s = carouselReducer(s, { type: "resume", reason: "hover" });
    expect(shouldAdvance(s)).toBe(false);
    const t = carouselReducer(initialCarousel(7, false), { type: "next" });
    expect(t.index).toBe(1);
    expect(shouldAdvance(t)).toBe(false);
  });
  it("never moves with reduced motion", () => {
    expect(shouldAdvance(initialCarousel(7, true))).toBe(false);
  });
  it("wraps backwards", () => {
    expect(carouselReducer(initialCarousel(7, false), { type: "prev" }).index).toBe(6);
  });
});
```

Track test (RTL, jsdom, `matchMedia` stubbed): renders 7 cards with `role="group"` and `aria-roledescription="slide"` labelled "3 of 7" etc.; the region has `aria-label` from the section heading; Next/Previous buttons have labels; in RTL (`dir="rtl"` on a wrapper) the arrow icons carry `rtl:-scale-x-100`; with `matchMedia('(prefers-reduced-motion: reduce)')` → true, advancing timers (`vi.useFakeTimers(); vi.advanceTimersByTime(20000)`) leaves the first card current.

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.**
  - Reducer per the tests (`focus` and `touched` are sticky; `hover`/`hidden` are not).
  - `CarouselTrack` (client): a scroll-snap row (`overflow-x-auto snap-x snap-mandatory`, cards `snap-start`, card width: 85% on phones, 45% at `sm`, 30% at `lg`, 4 visible at `xl`); `tick` every 6 s (calm) or 4 s (normal) when `shouldAdvance`, scrolling the track with `scrollTo({ left, behavior: "smooth" })` (logical start in RTL); pause on `pointerenter/leave`, `focusin`, `visibilitychange`; arrows and dots set `touched`. The latest line cycles every 5 s under the same rules (`aria-live="off"`).
  - Card: `RegionLocator` (large, decorative), name (h3), tagline, counts row (icons + numbers; hide a zero events count; with 0 members show "Be the first to join" — Review Focus 2), faces (overlapping 28px avatars, `+N`), latest line (message templates: `communityCarousel.latestStory` "New story: {title}", `latestEvent` "Coming up: {title} · {date}", `latestMember` "Welcome, {name}"), whole-card link (`Link` to `/communities/<slug>`) with a visible focus ring.
  - Server `CommunityCarousel` reads cards (filtered/ordered by the block's `communities` if set, else all), applies `show` toggles, renders heading/intro (hub section header style) and the track. No cards → renders nothing.
  - Payload block + registry + blocks.ts case + `HOMEPAGE_SECTIONS`; admin picker entry "Community carousel" in group "Communities" (`pickerAdmin`). Migration: generate, inspect (new block tables for homepage, pages, communities, and their per-language layouts), apply on dev, types.
  - Messages (`communityCarousel.*`: heading default "Our regional communities", members/stories/events plural labels, beFirst, latest templates, previous/next/slideLabel "{n} of {total}") in en/es/fr/ar.
- [ ] **Step 4: Run** → PASS; `tsc`; eslint; `curl /admin` 200.
- [ ] **Step 5: Rendered check:** add the section to a dev page (or run Task 5's script early on dev) — at 1280 and 375, en and ar: equal cards, alphabetical, loop advances and pauses on hover; Tab into it → stops; reduced motion (Playwright `emulateMedia({ reducedMotion: 'reduce' })`) → no movement; no sideways page scroll; 0 console errors.
- [ ] **Step 6: Commit** — `feat(communities): a Community carousel — every community, equal, with its live numbers`.

---

### Task 4: Grouped logo wall and one-line logo carousel

**Files:**
- Create: `lib/logos/group-logos.ts`, `lib/__tests__/group-logos.test.ts`
- Modify: `payload/blocks/logo-cloud-1.ts` (`fundedBy`, `hostedBy`, layout option `carousel`), `lib/content/internal/payload/blocks.ts` (logo strip translation carries both lists), `components/blocks/logo-cloud/logo-cloud-1.tsx`, `migrations/*`, `messages/*.json` (`logos.fundedBy`, `logos.hostedBy`, `logos.partners`, `logos.previous`, `logos.next`)

**Interfaces:**
- Produces: `groupLogos(input: { fundedBy: Logo[]; hostedBy: Logo[]; partners: Logo[]; others: Logo[] }): { leads: Array<Logo & { role: "fundedBy" | "hostedBy" }>; partners: Logo[]; others: Logo[] }` with `Logo = { id: string; name: string; image: string | null; href: string | null }` — an organisation in `leads` is removed from `partners` (Review Focus 3); order kept as the editor set it.

- [ ] **Step 1: Failing test**

```ts
import { expect, it } from "vitest";
import { groupLogos } from "@/lib/logos/group-logos";

const org = (id: string) => ({ id, name: id.toUpperCase(), image: `/${id}.png`, href: `/organizations/${id}` });

it("puts funders and hosts first, once, and keeps the editor's order", () => {
  const out = groupLogos({ fundedBy: [org("wellcome")], hostedBy: [org("ccc")], partners: [org("imperial"), org("wellcome"), org("qcmhr")], others: [] });
  expect(out.leads.map((l) => [l.id, l.role])).toEqual([["wellcome", "fundedBy"], ["ccc", "hostedBy"]]);
  expect(out.partners.map((p) => p.id)).toEqual(["imperial", "qcmhr"]);
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** the helper; the block fields (`fundedBy`, `hostedBy`: relationship → organizations, hasMany, `filterOptions` like `organizations`, shown only when layout is Grid via `admin.condition`; layout options gain `{ label: "One line — scrolls sideways", value: "carousel" }` and the description explains all three); the translation in `blocks.ts`; the component:
  - Grid with leads: a top row of the lead tiles (larger: logo box 160×80, name, small role label), then "Partners" heading and equal tiles (logo box 120×56, `object-contain`, full colour, name under it, 2 / 3 / 4 across by container width), each an `<a>` / `Link` to the organisation page when `href`; then others without links. An organisation without a logo shows its name in the box.
  - Carousel: the same partner tiles in one scroll-snap row with previous/next buttons (hidden on touch-only devices, `rtl:-scale-x-100`), no auto-movement.
  - Marquee unchanged.
- [ ] **Step 4:** migration (generate, inspect additive, apply dev, types); run tests; `tsc`; eslint; `/admin` 200.
- [ ] **Step 5: Rendered check** after setting the homepage strip on dev (Task 5's script, or by hand in the admin): homepage "Who is involved" and a community page with a strip, 375/1280, en/ar; every tile links to its organisation page; 0 console errors.
- [ ] **Step 6: Commit** — `feat(partners): a grouped logo wall and a one-line logo carousel`.

---

### Task 5: The Region map switch, the script, the runbook

**Files:**
- Modify: `payload/blocks/region-map.ts` (`showRegionStories` checkbox, default true, label "Show the latest from each region"), `lib/content/internal/payload/blocks.ts` (`regionMapBlock` passes it), `components/blocks/maps/region-map.tsx` (hide `RegionHighlightsCards` when false), `migrations/*`, `docs/migration/payload-production-runbook.md`
- Create: `scripts/homepage/regions-and-partners-plan.ts` (pure), `scripts/homepage/regions-and-partners.ts`, `scripts/homepage/__tests__/regions-and-partners-plan.test.ts`

**Interfaces:**
- Produces: `planRegionsAndPartners(sections: Row[], orgs: { fundedBy: string | null; hostedBy: string | null }): { sections: Row[]; changes: string[]; missing: string[] }` — replaces the first `gridRow` whose heading mentions regional communities (or, failing that, the first `gridRow` directly after the `regionMap`) with `{ blockType: "communityCarousel", heading: <that grid's heading, every language>, intro: <its subtitle>, autoplay: true, speed: "calm" }`; sets `showRegionStories: false` on every `regionMap`; sets every `logoCloud1` to `layout: "grid"` with `fundedBy`/`hostedBy` when found; idempotent (a second run → no `changes`). `planCommunityLogos(sections: Row[]): { sections: Row[]; changes: string[] }` — every `logoCloud1` → `layout: "carousel"`.

- [ ] **Step 1: Failing planner tests** — replaces the regions grid (keeps its heading in all four languages), turns off the region stories, sets the logo wall with Wellcome/Climate Cares ids, reports `missing: ["Hosted by: Climate Cares Centre"]` when an id is null, and a second run on its own output returns `changes: []`; community planner switches strips to carousel and is idempotent.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** the switch (block + translation + component + migration on dev) and the planner; the script mirrors `scripts/communities/move-to-sections.ts` (flags `--execute`, `--revert`, `--production`; `assertPayloadDatabase`; English first then es/fr/ar onto the same rows with `toLocaleData`/`withIdsFrom`); before writing it saves `scripts/homepage/.backup/regions-and-partners-<timestamp>.json` (git-ignored — check `.gitignore`) with the previous homepage and community sections, and `--revert` restores the newest backup; organisations looked up by name (`Wellcome`, `Climate Cares Centre`, case-insensitive `like`).
- [ ] **Step 4: Run** tests → PASS; dev dry run, `--execute`, `--revert`, `--execute` again.
- [ ] **Step 5: Rendered check (whole feature):** `/en` and `/ar` at 375 and 1280 — Explore by region (with the Region row, no "Around the regions"), the Community carousel in place of the seven cards, the grouped "Who is involved" wall; `/en/communities/sub-saharan-africa` — one-line logos. 0 console errors, no sideways scroll.
- [ ] **Step 6: Runbook** section "2026-09-30 regions and partners": what visitors see; migrations (list); after the push the user runs `scripts/with-prod-env.sh pnpm exec tsx scripts/homepage/regions-and-partners.ts --production` (dry run) then with `--execute`, then clears the site cache; how to revert; checklist; editors: taglines are on each community's record (Details → Tagline), the carousel and logo settings in the homepage Sections.
- [ ] **Step 7: Commits** — `feat(atlas): the region map can hide the latest-from-each-region strip`, `feat(scripts): put the community carousel and logo wall on the pages`, `docs(runbook): regions and partners`.
