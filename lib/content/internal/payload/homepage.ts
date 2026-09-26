/**
 * The homepage, against Payload — Task 14d.
 *
 * Four Sanity `homepage` documents (`homepage-{en,es,fr,ar}`, all `slug:
 * "index"`, 0 drafts) are one Payload **global** with four locales, and its
 * eleven fixed slots stay slots. That ruling is binding and predates this task:
 * turning them into a generic `blocks` array would force a rewrite of
 * `components/pages/homepage.tsx` and its section components, and this phase
 * changes nothing under `components/`. So the global declares a `blockSlot` per
 * slot (`payload/globals/homepage.ts`) and this file reads them back into the
 * shape `HOMEPAGE_QUERY` returns.
 *
 * ---------------------------------------------------------------------------
 * 1. The slots are localized field by field, so one has to be picked by hand
 * ---------------------------------------------------------------------------
 *
 * `regionalCommunityPage` localizes each slot **container**, so `locale: "all"`
 * hands back `welcomeHero: {en: {...}, es: {...}}` — one clean locale map at the
 * top of each slot. The homepage cannot do that: eleven localized containers put
 * **135 columns** in `homepage_locales`, and Payload reads a localized table
 * through `json_agg(json_build_array(<every column>))` against Postgres's hard
 * 100-argument cap, which made the global unreadable (SQLSTATE 54023 on
 * `findGlobal`, `updateGlobal` and `/admin` — Task 12). So the containers are
 * unlocalized and each **field** keeps its own declaration, which puts the
 * locale maps at the leaves: `heroWelcome.title`, `heroWelcome.image.alt`,
 * `heroWelcome.links`, `news.columns`.
 *
 * Reading one locale instead of `"all"` would let Payload resolve those, and was
 * the first thing tried. It is wrong, and the 28-document comparison said so:
 * a pinned locale resolves the localized fields of the **relationship documents
 * a slot populates** as well, so `news.columns[].newsPost.title` came back as a
 * bare string where `GRID_NEWS_PROJECTION` returns Sanity's whole locale map —
 * and `internal/payload/blocks.ts`'s `newsPostCard`, which is 14c's and is
 * shared with the page reader, correctly refuses a string and emitted `null` for
 * the title, subtitle and excerpt of every news card.
 *
 * So this reads `locale: "all"` like every other reader and picks the arm with
 * `pickLocale` below, whose one job is to stop before it reaches a populated
 * document.
 *
 * ---------------------------------------------------------------------------
 * 2. The freeform `blocks[]` is `null`, and stays `null`
 * ---------------------------------------------------------------------------
 *
 * Sanity's homepage schema declares a freeform `blocks` array beside the eleven
 * slots ("the fixed sections below are legacy"). Measured: **null on all four
 * documents** — the dual-field transition never started — and 11 of the 18 block
 * types it offers do not exist in Payload at all. It was deliberately not
 * ported, so this emits the `null` Sanity emits. `components/pages/homepage.tsx`
 * branches on `homepage.blocks && homepage.blocks.length > 0` and therefore
 * takes the fixed-slot path on both backends, exactly as today.
 *
 * `INDEX_HOMEPAGE_QUERY` does not project `blocks[]` at all — the live query
 * composer never added it to the second variant — so `getIndexHomepage` omits
 * the key rather than emitting `null` for it.
 *
 * ---------------------------------------------------------------------------
 * 3. Two slots carry two keys the others do not
 * ---------------------------------------------------------------------------
 *
 * `agendasModule` and `news` prefix `mode, maxItems` to `GRID_ROW_PROJECTION`;
 * `regionalCommunities` interpolates the same projection with neither. That
 * asymmetry is load-bearing: `components/pages/homepage.tsx`'s
 * `resolveNewsSection`/`resolveAgendasSection` read `mode` and replace the
 * section's hand-picked columns with a fresh feed unless it is `"manual"`.
 * Measured, `mode` is **null** on both slots in all four documents, so both
 * sections resolve to `"dynamic-recent"` and both really do fetch on every
 * render — which is why `getHomepageNews`/`getHomepageAgendas` had to move with
 * this file rather than after it.
 *
 * ---------------------------------------------------------------------------
 * 4. `_id`, `slug` and `language` are synthesized, and nothing reads them
 * ---------------------------------------------------------------------------
 *
 * A global has no slug and no per-language id. `slug` is `"index"` on all four
 * documents and `_id` is `homepage-<language>`, both derivable, so they are
 * re-emitted in Sanity's spelling. The only consumer of a homepage id is
 * `generateStaticParams`, which passes it to `getPageTranslations` — a lookup
 * that answers `[]` for a homepage id on both backends.
 */
import "server-only";
import { imageGroup } from "@/lib/content/internal/image-shape";
import { groqObject, localized, orNull, type LocalizedRaw } from "@/lib/content/internal/localized";
import { slotBlock } from "@/lib/content/internal/payload/blocks";
import { query, queryPreviewable } from "@/lib/content/internal/payload-source";
import type { PageTranslation, RawSlugRow } from "@/lib/content/pages/shared";
import type { Locale } from "@/lib/content/types";
import { LOCALES } from "@/lib/content/types";

type Row = Record<string, unknown>;

const isRow = (value: unknown): value is Row =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function num(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/** One locale's arm of a localized text column. */
function arm(value: unknown, locale: Locale): string | undefined {
  return localized(value as LocalizedRaw)?.[locale];
}

/**
 * One locale's arm of a slot, everywhere inside it that Payload localized a
 * field rather than its container.
 *
 * The tree it walks is a `blockSlot` group: plain field names at every level,
 * with a locale map wherever `localizedText`/`localizedTextarea`/
 * `localizedRichText` — or `localizeRowLists`, which forces every `array`,
 * `blocks` and `hasMany` child back to `localized: true` — put one. A locale map
 * is recognised by having only configured-locale keys, which no declared field
 * name collides with; an empty object is one too (`links: {}` is Payload's
 * spelling for a row list nobody filled in), and picking from it gives the
 * `undefined` the mappers already turn into GROQ's `null`.
 *
 * **It stops at a populated document**, which is the whole reason it exists.
 * `news.columns[].newsPost`, an agenda, a testimonial and a media row are
 * collection documents Payload populated at this same `locale: "all"`, so their
 * own localized fields are locale maps that `GRID_NEWS_PROJECTION` and its
 * siblings are supposed to return **whole** — descending into them would hand
 * `newsPostCard` a string and blank the card. A document is told apart by
 * carrying `createdAt`: Payload stamps every collection row with it, and a block
 * row, an array row and a group have none.
 */
function pickLocale(value: unknown, locale: Locale): unknown {
  if (Array.isArray(value)) return value.map((entry) => pickLocale(entry, locale));
  if (!isRow(value)) return value;
  if ("createdAt" in value) return value;
  const keys = Object.keys(value);
  if (keys.every((key) => (LOCALES as readonly string[]).includes(key))) {
    return pickLocale(value[locale], locale);
  }
  return Object.fromEntries(keys.map((key) => [key, pickLocale(value[key], locale)]));
}

/** The one slug all four documents carry. `getHomepageBySlug` is the only
 *  caller that can ask for another, and Sanity answers `null` for it. */
const HOMEPAGE_SLUG = "index";

/**
 * The eleven slots and the SEO fields, as `HOMEPAGE_FIXED_SLOTS` projects them.
 *
 * Split from the read so the mapping can be checked against a global taken
 * straight out of the Local API, the same way
 * `internal/payload/regional-community.ts` splits its own.
 */
export function toHomepage(global: Row, locale: Locale, opts: { blocks?: boolean } = {}): Row {
  const slot = (name: string) => pickLocale(global[name], locale);
  const grid = (row: unknown) => ({
    maxItems: orNull(num(isRow(row) ? row.maxItems : undefined)),
    mode: orNull(text(isRow(row) ? row.mode : undefined)),
  });
  const agendasModule = slot("agendasModule");
  const news = slot("news");
  return groqObject({
    _id: `homepage-${locale}`,
    ...(opts.blocks === false ? {} : { blocks: null }),
    agendasModule: slotBlock(agendasModule, "gridRow", { extra: grid(agendasModule) }),
    collaboration: slotBlock(slot("collaboration"), "splitRow"),
    globalAgenda: slotBlock(slot("globalAgenda"), "splitRow"),
    heroWelcome: slotBlock(slot("heroWelcome"), "hero1"),
    howToUse: slotBlock(slot("howToUse"), "splitRow"),
    language: locale,
    livedExperiences: slotBlock(slot("livedExperiences"), "carousel2"),
    mentalHealthDefinition: slotBlock(slot("mentalHealthDefinition"), "cta1"),
    meta_description: orNull(arm(global.meta_description, locale)),
    meta_title: orNull(arm(global.meta_title, locale)),
    news: slotBlock(news, "gridRow", { extra: grid(news) }),
    // Not localized in Payload, and `false` where Sanity holds `null` — the same
    // difference `pages.ts` records in its note 4, and equally falsy wherever
    // `generatePageMetadata` reads it.
    noindex: global.noindex ?? null,
    ogImage: imageGroup(global.ogImage, { asset: ["_id", "url", "dimensions"], keys: ["alt"] }),
    partnerLogos: slotBlock(slot("partnerLogos"), "logoCloud1"),
    projectInfo: slotBlock(slot("projectInfo"), "splitRow"),
    regionalCommunities: slotBlock(slot("regionalCommunities"), "gridRow"),
    slug: groqObject({ _type: "slug", current: HOMEPAGE_SLUG }),
    title: orNull(arm(global.title, locale)),
  });
}

/**
 * `HOMEPAGE_QUERY` / `INDEX_HOMEPAGE_QUERY`.
 *
 * `queryPreviewable`, matching all three Sanity twins: `fetchSanityHomepageBySlug`,
 * `fetchHomepageBySlug` and `fetchIndexHomepage` each omitted `perspective`, so
 * an editor in the Presentation tool sees their unpublished draft. A Payload
 * global carries no `_status`, so the two perspectives read the same row today;
 * the primitive is chosen for the contract, not for the current data.
 *
 * `depth: 3` for the reason `pages.ts` records — `news.columns[].newsPost` is a
 * relationship whose own `author.image.asset` is two further hops in, and 14c's
 * grid parity run is what proved a shallower read renders a hollow card.
 */
export async function findHomepage(
  locale: Locale,
  slug: string = HOMEPAGE_SLUG,
  opts: { blocks?: boolean } = {},
): Promise<Row | null> {
  // Sanity filters on `slug.current == $slug`; the global holds exactly one.
  if (slug !== HOMEPAGE_SLUG) return null;
  const global = await queryPreviewable<Row | null>({
    type: "global",
    slug: "homepage",
    locale: "all",
    depth: 3,
  });
  if (!global) return null;
  return toHomepage(global, locale, opts);
}

/**
 * `*[_type == "homepage" && defined(slug)]{_id, slug{current}, language}`.
 *
 * One row per locale, the shape `toSlugRows` maps. The global exists or it does
 * not; there is no per-locale existence question to ask, because all four Sanity
 * documents were merged into it and each locale's arm is what `findHomepage`
 * then reads. Ordered by `payload.config.ts`'s locale order, where Sanity's
 * unordered query leaves the Content Lake to choose — this feeds
 * `generateStaticParams`, which is order-insensitive.
 *
 * `query`, matching the Sanity twin.
 */
export async function homepageSlugs(): Promise<RawSlugRow[]> {
  const global = await query<Row | null>({
    type: "global",
    slug: "homepage",
    locale: "all",
    depth: 0,
  });
  if (!global) return [];
  return LOCALES.map((language) => ({
    _id: `homepage-${language}`,
    slug: { current: HOMEPAGE_SLUG },
    language,
  }));
}

/**
 * The other language versions of the homepage.
 *
 * Sanity asks `translation.metadata` for documents referencing an id, and
 * **no such document references a homepage** — measured, all 8 of them cover the
 * seven regional communities and the `about` page — so the live function answers
 * `null` for every homepage id today. It also has zero call sites anywhere in
 * the repo; `generateStaticParams` uses `getPageTranslations`, not this.
 *
 * Payload models the same fact structurally, one arm per locale, so this answers
 * the four locales the global carries — the same choice
 * `internal/payload/pages.ts` made for `pageTranslations`, and made here for
 * consistency rather than because anything depends on it. The `null` path the
 * Sanity arm's own test pins is preserved for a missing global.
 */
export async function homepageTranslations(homepageId: string): Promise<PageTranslation[] | null> {
  const global = await query<Row | null>({ type: "global", slug: "homepage", locale: "all", depth: 0 });
  if (!global) return null;
  // Sanity matches on a reference to this id; only a homepage id can match.
  if (!/^homepage(-(en|es|fr|ar))?$/.test(homepageId)) return null;
  return LOCALES.map((language) => ({
    _id: `homepage-${language}`,
    language,
    slug: { current: HOMEPAGE_SLUG },
  }));
}
