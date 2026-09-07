/**
 * The page domain's **document** readers, against Payload.
 *
 * Task 14 is split four ways and this file is 14b's half of it: the document
 * envelope and the two slug/translation readers. The block projections are
 * 14c's, and the homepage's eleven fixed slots and `regionalCommunityPage`'s
 * parameterised `contentGrid` are 14d's. Nothing here maps a block.
 *
 * ---------------------------------------------------------------------------
 * 1. Four Sanity documents are one Payload document, and the English id wins
 * ---------------------------------------------------------------------------
 *
 * Sanity keeps one `page` per (slug, language): measured 2026-09-07 against
 * `production_2` on the published perspective (control `count(*[_type ==
 * "agenda"])` = 29), **36 pages = 9 slugs x 4 languages, complete**, with the
 * slug identical across the four. `regionalCommunityPage` is the same shape at
 * **28 = 7 x 4**.
 *
 * Payload's `perLocale` import lane collapsed each group onto one row with
 * localized fields — **9 pages and 7 regional community pages, verified** —
 * and kept the **English** document's `_id` as the row id (`groupSources`:
 * "The English id is the one kept as the Payload id"). The es/fr/ar Sanity ids
 * are not stored anywhere in Payload. That is load-bearing twice below, and
 * both times it is invisible to a caller, because the only two consumers of a
 * page id read `language` and `slug.current` off the result and never the id
 * itself (`app/[locale]/(main)/[...slug]/page.tsx`, `app/[locale]/(main)/page.tsx`,
 * both inside `generateStaticParams`).
 *
 * ---------------------------------------------------------------------------
 * 2. `translation.metadata` has no Payload counterpart, and is 1/9 complete
 * ---------------------------------------------------------------------------
 *
 * `getPageTranslations` asks Sanity for the `translation.metadata` document
 * referencing an id. Measured: **8 such documents exist** — one per regional
 * community (7, each listing all four languages) and exactly **one for a
 * `page`**, `about`, whose two entries are `page-about-en` and a **dangling
 * reference** that the GROQ projects as a literal `null` array element. The
 * other eight page groups have none, so the Sanity arm answers `[]` for eight
 * of the nine pages that plainly do have four translations each.
 *
 * Payload models the same fact structurally instead: one row, one arm per
 * locale. So this reader answers "which locales does this document carry", and
 * the answer is right where Sanity's is missing. What that changes is only the
 * *duplicate* params `generateStaticParams` pushes — every locale it would name
 * is already named by `getPageSlugs`/`getRegionalCommunityPageSlugs`, which
 * enumerate one row per (slug, locale) on both backends. No route appears or
 * disappears, and nothing rendered changes.
 *
 * An id belonging to neither collection answers `[]`, which is also what Sanity
 * answers for it: `getPageTranslations` is called with a **homepage** id too,
 * and no `translation.metadata` references one.
 *
 * ---------------------------------------------------------------------------
 * 3. Why `locale: "all"` and not the requested locale
 * ---------------------------------------------------------------------------
 *
 * Two reasons, and the second is the one that bites.
 *
 * `getPageBySlug` reproduces `fetchSanityPageBySlug`'s document-level fallback:
 * no document in the requested language, retry in English. Payload has one row
 * per slug, so "this language has no document" becomes "no localized field
 * carries this locale's arm" — which is only answerable by reading every arm.
 *
 * And Payload's localization sets `fallback: true`, so a read pinned to one
 * locale silently answers with English wherever that locale is empty. That is
 * **not** what Sanity does: measured, `meta_title` is unset in es/fr/ar on
 * three of the nine pages (`research-and-action/{community-agendas,
 * global-agenda,regional-agendas}`) and GROQ returns `null` for them. A pinned
 * read would have handed those three pages an English `<title>` in three
 * languages. Reading `locale: "all"` and picking the arm by hand keeps the
 * empty arm empty.
 *
 * ---------------------------------------------------------------------------
 * 4. `noindex` is one boolean where Sanity has four, and it reads `false`
 * ---------------------------------------------------------------------------
 *
 * Payload declares `noindex` NOT localized, and the import wrote the English
 * document's value (`canonical.noindex === true`). Measured: Sanity holds
 * `null` for it on the es/fr/ar documents of the same three pages, and `false`
 * on the other 33; Payload holds `false` on all 9. So a Payload read of those
 * nine locale-arms answers `false` where Sanity answers `null`.
 *
 * Both are falsy, `generatePageMetadata` branches on truthiness, and `noindex`
 * never reaches a client component — so the rendered `robots` meta is identical.
 * Recorded rather than papered over: it is a real difference in the value this
 * reader returns, and it cannot be removed without localizing the column.
 *
 * ---------------------------------------------------------------------------
 * 5. `ogImage` is projected without its `alt`
 * ---------------------------------------------------------------------------
 *
 * `PAGE_QUERY` writes `ogImage { asset->{_id, url, metadata{dimensions{…}}} }`
 * and names neither `alt` nor `lqip`, so neither is emitted here — even though
 * Payload stores an `alt` (measured: the one page that has an OG image,
 * `research-and-action/toolkits`, carries one in all four locales). A
 * projection emits the keys it names and no others.
 *
 * The flattened media row goes on, as everywhere else: `lib/content/metadata.ts`
 * hands the whole `ogImage` object to `payload-image-source`, which resolves a
 * media row and declines an object carrying only a Sanity `asset._id`. Note
 * that `metadata.ts` reads `activeBackend("metadata")`, not `"pages"` — a
 * deployment that overrides **only** `CONTENT_BACKEND_PAGES` leaves the OG
 * formatter on the Sanity builder, which cannot resolve a Payload image and
 * falls back to the site default. Move the two together, or move the whole
 * process with `CONTENT_BACKEND`.
 */
import "server-only";
import { imageGroup } from "@/lib/content/internal/image-shape";
import { localized, type LocalizedRaw } from "@/lib/content/internal/localized";
import { query, queryPreviewable } from "@/lib/content/internal/payload-source";
import type { PageTranslation, RawSlugRow } from "@/lib/content/pages/shared";
import type { Locale } from "@/lib/content/types";
import { LOCALES } from "@/lib/content/types";

interface Paginated<T> {
  docs: T[];
}

/** The `pages` and `regionalCommunityPages` columns this module reads, as they
 *  arrive at `locale: "all"`. */
interface PageRow {
  id?: unknown;
  slug?: string | null;
  title?: LocalizedRaw;
  blocks?: Partial<Record<Locale, unknown[]>> | null;
  meta_title?: LocalizedRaw;
  meta_description?: LocalizedRaw;
  noindex?: boolean | null;
  ogImage?: unknown;
}

/**
 * The subset of `RawPageDoc` this reader produces, mapped into `Page` by
 * `pages/page.ts`'s own `toPage` — the same function the Sanity arm uses, so
 * the envelope cannot be shaped two ways.
 */
export interface RawPayloadPage {
  blocks?: unknown[] | null;
  meta_title?: string;
  meta_description?: string;
  noindex?: boolean;
  ogImage?: unknown;
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/** One locale's arm of a localized text column. */
function arm(value: LocalizedRaw, locale: Locale): string | undefined {
  return localized(value)?.[locale];
}

/**
 * Did a Sanity document exist for this locale?
 *
 * The import wrote each localized field only for the languages that had a
 * document, so a locale with no arm anywhere had no document. `blocks` alone is
 * not enough of a signal — a page could legitimately have none — so the four
 * fields the import writes are all consulted.
 *
 * Measured as never false today (36 = 9 x 4 and 28 = 7 x 4, both complete), so
 * this only exists to keep `getPageBySlug`'s English fallback meaningful rather
 * than quietly dead.
 */
function carriesLocale(row: PageRow, locale: Locale): boolean {
  const blocks = row.blocks?.[locale];
  if (Array.isArray(blocks) && blocks.length > 0) return true;
  return Boolean(
    arm(row.title, locale) ?? arm(row.meta_title, locale) ?? arm(row.meta_description, locale),
  );
}

/** The locales a document carries, in `payload.config.ts`'s order. */
function localesOf(row: PageRow): Locale[] {
  return LOCALES.filter((locale) => carriesLocale(row, locale));
}

/** `ogImage { asset->{_id, url, metadata{dimensions{width,height}}} }` — see
 *  note 5 for why `alt` and `lqip` are absent. */
function ogImageProjection(group: unknown): unknown {
  return imageGroup(group, { asset: ["_id", "url", "dimensions"] }) ?? undefined;
}

/**
 * One `page` document, as `PAGE_QUERY`'s row.
 *
 * `queryPreviewable`, matching the Sanity twin: `fetchSanityPageBySlug` omitted
 * `perspective`, so an editor in the Presentation tool sees their unpublished
 * draft. (`pages` declares no `versions.drafts` — measured 36 documents, 0
 * drafts — so today the two perspectives hold the same row. The primitive is
 * chosen for the contract, not for the current data.)
 *
 * `depth: 1` so `ogImage.asset` resolves to its `media` row rather than an id.
 */
export async function findPage(slug: string, locale: Locale): Promise<RawPayloadPage | null> {
  const result = await queryPreviewable<Paginated<PageRow>>({
    type: "find",
    collection: "pages",
    where: { slug: { equals: slug } },
    locale: "all",
    depth: 1,
    limit: 1,
    pagination: false,
  });
  const row = result?.docs?.[0];
  if (!row) return null;

  // The English fallback `fetchSanityPageBySlug` performs. See note 3.
  const chosen = carriesLocale(row, locale) ? locale : "en";
  if (!carriesLocale(row, chosen)) return null;

  return {
    // 14c's. See the header: mapping a Payload block into the `_type`/`_key`
    // shape `components/blocks/index.tsx` dispatches on is the block-family
    // work, and handing the renderer unmapped rows would put objects it cannot
    // dispatch on into the flight payload. `null` is what `toPage` turns into
    // the empty list, so a page renders its chrome and no blocks until 14c.
    blocks: null,
    meta_title: arm(row.meta_title, chosen),
    meta_description: arm(row.meta_description, chosen),
    // Not localized in Payload; see note 4.
    noindex: row.noindex ?? undefined,
    ogImage: ogImageProjection(row.ogImage),
  };
}

/**
 * `*[_type == "page" && defined(slug)]{_id, slug{current}, language}` — one row
 * per (slug, locale), the shape `toSlugRows` maps.
 *
 * Sanity returns 36 rows carrying four different ids per slug; Payload returns
 * the same 36 pairs carrying the English id four times, because that is the
 * only id it kept (note 1). Ordered by slug and then by locale, where Sanity's
 * unordered query leaves the Content Lake to choose: this feeds
 * `generateStaticParams`, which is order-insensitive, and a stable order beats
 * an arbitrary one.
 */
export async function pageSlugs(): Promise<RawSlugRow[]> {
  return slugRows("pages");
}

/** `*[_type == "regionalCommunityPage" && defined(slug)]{…}`, the same shape.
 *  `query`, not `queryPreviewable`, matching the Sanity twin — and unlike
 *  `pages`, this collection **does** carry drafts, so the published-only filter
 *  `query()` applies is doing real work here. */
export async function regionalCommunityPageSlugs(): Promise<RawSlugRow[]> {
  return slugRows("regionalCommunityPages");
}

async function slugRows(collection: "pages" | "regionalCommunityPages"): Promise<RawSlugRow[]> {
  const result = await query<Paginated<PageRow>>({
    type: "find",
    collection,
    locale: "all",
    depth: 0,
    pagination: false,
    sort: "slug",
  });
  const rows: RawSlugRow[] = [];
  for (const row of result?.docs ?? []) {
    const slug = text(row.slug);
    if (!slug) continue;
    for (const locale of localesOf(row)) {
      rows.push({ _id: String(row.id ?? ""), slug: { current: slug }, language: locale });
    }
  }
  return rows;
}

/**
 * The other language versions of one page or regional community page.
 *
 * See note 2: this answers structurally what Sanity answers out of
 * `translation.metadata`, which exists for one of nine pages and all seven
 * regional communities. `_id` is the Payload document id on every entry — the
 * English Sanity id — because no other is stored; both call sites read only
 * `language` and `slug.current`.
 *
 * `query`, matching the Sanity twin's `query()`. Wrapped in `safe()` by the
 * caller, as it already is.
 */
export async function pageTranslations(pageId: string): Promise<PageTranslation[]> {
  for (const collection of ["pages", "regionalCommunityPages"] as const) {
    const row = await query<PageRow | null>({
      type: "findByID",
      collection,
      id: pageId,
      locale: "all",
      depth: 0,
    });
    const slug = text(row?.slug);
    if (!row || !slug) continue;
    return localesOf(row).map((language) => ({
      _id: String(row.id ?? ""),
      language,
      slug: { current: slug },
    }));
  }
  return [];
}
