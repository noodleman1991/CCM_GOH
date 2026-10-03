/**
 * System feeds: the site announcement bar, the CMS-driven part of the
 * sitemap, the docs reader, the homepage "fresh content" bento, and the
 * Algolia search-index dispatcher.
 *
 * These don't belong to any single content domain — they either read across
 * domains (the sitemap, the fresh-content bento, the search dispatcher) or
 * back infrastructure rather than a page (the sitemap, search sync). Per-
 * domain data still lives in its own module (case-studies.ts, news.ts, …);
 * this file only adds the cross-cutting glue.
 */
import { activeBackend } from "@/lib/content/internal/backend";
import { safe } from "@/lib/content/internal/safe";
import { query, queryPreviewable } from "@/lib/content/internal/sanity-source";
import * as payloadSystem from "@/lib/content/internal/payload/system";
import type { ContentKind, Localized, RichText, SearchRecord } from "@/lib/content/types";
import { getCaseStudySearchRecords } from "@/lib/content/case-studies";
import { getNewsSearchRecords } from "@/lib/content/news";
import { getAgendaSearchRecords, getResearchOutputSearchRecords } from "@/lib/content/outputs";

/**
 * Which store answers, read per call rather than at module load so a test, a
 * script or a preview deployment can flip it after this module is imported.
 *
 * `getSearchIndexRecords` deliberately does not consult it: it holds no query
 * of its own and delegates to three domain modules that each carry their own
 * flag, so an opinion here would override theirs.
 */
const onPayload = (): boolean => activeBackend("system") === "payload";

// ---------------------------------------------------------------------------
// Site announcement bar (components/announcement/site-announcement-bar.tsx)
// ---------------------------------------------------------------------------

/** The singleton site announcement. Lives at the fixed id `siteAnnouncement`.
 *  Message/link.label are Lane-B localized objects; resolved per-locale at render. */
export interface SiteAnnouncement {
  enabled?: boolean;
  variant?: string;
  message?: Localized;
  dismissible?: boolean;
  startsAt?: string;
  endsAt?: string;
  link?: {
    url?: string;
    label?: Localized;
  };
}

const SITE_ANNOUNCEMENT_QUERY = `
  *[_type == "siteAnnouncement"][0]{
    enabled,
    variant,
    message,
    dismissible,
    startsAt,
    endsAt,
    link{
      url,
      label
    }
  }
`;

/**
 * Locale-agnostic fetch; the bar component resolves the localized message
 * itself. `queryPreviewable`, not `query` — the original
 * `sanityFetch({ query: SITE_ANNOUNCEMENT_QUERY })` call (`git show
 * cd7a5413e:sanity/lib/fetch.ts`) omitted both `perspective` and `stega`,
 * which is exactly the shape that keeps editor draft preview alive in
 * Sanity's Presentation tool (see queryPreviewable's own doc comment in
 * sanity-source.ts). Converting this to `query` would silently force the
 * published perspective and end draft preview for the announcement bar,
 * repeating the regression nine other functions had before it was caught
 * (draft-preview-fix-report.md). No try/catch in the original (nor in its
 * one caller) — failures propagate rather than degrade.
 */
export async function getSiteAnnouncement(): Promise<SiteAnnouncement | null> {
  if (onPayload()) return payloadSystem.getSiteAnnouncement();
  return queryPreviewable<SiteAnnouncement | null>(SITE_ANNOUNCEMENT_QUERY);
}

// ---------------------------------------------------------------------------
// Sitemap (app/sitemap.ts) — CMS-driven entries only. The hand-written
// static routes (home, list pages, legal) never touch Sanity and stay in
// app/sitemap.ts.
// ---------------------------------------------------------------------------

export type SitemapChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export interface SitemapEntry {
  url: string;
  lastModified?: string;
  changeFrequency?: SitemapChangeFrequency;
  priority?: number;
  alternates?: { languages: Record<string, string> };
}

const SITEMAP_LOCALES = ["en", "es", "fr", "ar"] as const;

const PAGES_SITEMAP_QUERY = `
    *[_type == 'page'] | order(slug.current) {
      'url': $baseUrl + select(slug.current == 'index' => '', '/' + slug.current),
      'lastModified': _updatedAt,
      'changeFrequency': 'daily',
      'priority': select(
        slug.current == 'index' => 1,
        0.5
      )
    }
  `;

/**
 * The `page` doctype's own sitemap entries. `queryPreviewable` — the
 * original `sanityFetch({ query: pagesQuery, params: {...} })` omitted
 * `perspective`/`stega` too. No try/catch in the original: a failure here
 * propagates and fails the whole `getSitemapEntries()` call (via
 * `Promise.all` below), unlike the per-content-type entries, which each
 * degrade to `[]` on their own.
 */
async function getPagesSitemapEntries(): Promise<SitemapEntry[]> {
  if (onPayload()) return payloadSystem.getPagesSitemapEntries();
  return queryPreviewable<SitemapEntry[]>(PAGES_SITEMAP_QUERY, {
    baseUrl: process.env.NEXT_PUBLIC_SITE_URL,
  });
}

interface RawContentSitemapRow {
  slug: string;
  lastModified: string;
}

interface ContentSitemapSpec {
  filter: string;
  pathPrefix: string;
  changeFrequency: SitemapChangeFrequency;
  priority: number;
}

const CONTENT_SITEMAP_SPECS: ContentSitemapSpec[] = [
  { filter: '_type == "caseStudy" && status == "approved"', pathPrefix: "/research-and-action/case-studies", changeFrequency: "monthly", priority: 0.8 },
  { filter: '_type == "newsPost"', pathPrefix: "/news", changeFrequency: "weekly", priority: 0.7 },
  { filter: '_type == "livedExperience" && (status == "approved" || !defined(status))', pathPrefix: "/lived-experiences", changeFrequency: "monthly", priority: 0.7 },
  // No `agenda` or `report` spec: neither type has a detail route (agendas
  // live on the section pages, e.g. /research-and-action/regional-agendas),
  // so listing them produced 116 dead URLs. Decision 11 of the 2026-09-16
  // hardening plan dropped the specs; next.config.mjs redirects the prefix.
  // B7 additions: the researchOutput successor type, the seven regional
  // community pages, and approved events — all public detail routes that
  // were invisible to crawlers.
  { filter: '_type == "researchOutput" && status == "approved"', pathPrefix: "/research-and-action/research-outputs", changeFrequency: "monthly", priority: 0.7 },
  { filter: '_type == "regionalCommunityPage" || _type == "regionalCommunity" && defined(slug.current)', pathPrefix: "/communities", changeFrequency: "weekly", priority: 0.8 },
  { filter: '_type == "event" && status == "approved"', pathPrefix: "/events", changeFrequency: "weekly", priority: 0.6 },
  // CMS project 2: organisation hub pages. Sanity never had them, so its arm lists none.
  { filter: '_type == "organization" && false', pathPrefix: "/organizations", changeFrequency: "monthly", priority: 0.5 },
];

/**
 * Per-locale entries for one content type, with hreflang alternates.
 * `queryPreviewable` — the original `getContentSitemap`'s `sanityFetch({
 * query })` call also omitted `perspective`/`stega`. Degrades to `[]` on
 * failure via `safe()` — the original wrapped its fetch in try/catch
 * returning `rows = []` — so one content type failing never takes the whole
 * sitemap down.
 */
async function getContentSitemapEntries(spec: ContentSitemapSpec): Promise<SitemapEntry[]> {
  return safe("sitemap-content", [], async () => {
    const rows = onPayload()
      ? await payloadSystem.getContentSitemapRows(spec.pathPrefix)
      : await queryPreviewable<RawContentSitemapRow[] | null>(
          `*[${spec.filter} && defined(slug.current)]{ "slug": slug.current, "lastModified": _updatedAt }`,
        );
    const base = process.env.NEXT_PUBLIC_SITE_URL || "https://connectingclimateminds.org";
    return (rows ?? []).flatMap((r) =>
      SITEMAP_LOCALES.map((locale) => ({
        url: `${base}/${locale}${spec.pathPrefix}/${r.slug}`,
        lastModified: r.lastModified,
        changeFrequency: spec.changeFrequency,
        priority: spec.priority,
        alternates: {
          languages: Object.fromEntries(
            SITEMAP_LOCALES.map((l) => [l, `${base}/${l}${spec.pathPrefix}/${r.slug}`]),
          ),
        },
      })),
    );
  });
}

/**
 * Every CMS-sourced sitemap entry: the `page` doctype plus per-locale
 * detail-page entries for the eight public content types. `app/sitemap.ts`
 * adds the hand-written static routes on top.
 */
export async function getSitemapEntries(): Promise<SitemapEntry[]> {
  const [pages, ...contentGroups] = await Promise.all([
    getPagesSitemapEntries(),
    ...CONTENT_SITEMAP_SPECS.map((spec) => getContentSitemapEntries(spec)),
  ]);
  return [...pages, ...contentGroups.flat()];
}

// ---------------------------------------------------------------------------
// Docs reader (app/[locale]/(main)/reader/[[...slug]]/page.tsx)
// ---------------------------------------------------------------------------

/**
 * Fragment inlined verbatim from sanity/queries/shared/styled-body.ts at
 * conversion time — the same fragment lived-experiences.ts already inlined
 * for its own detail page — so this module's only Sanity contact stays
 * sanity-source.ts.
 */
const STYLED_BODY_PROJECTION = `
  ...,
  _type == "image" => {
    ...,
    asset->{
      _id,
      url,
      mimeType,
      metadata { lqip, dimensions { width, height } }
    }
  },
  markDefs[]{
    ...,
    _type == "internalLink" => {
      ...,
      reference->{ _type, "slug": slug.current }
    }
  }
`;

/** Chapter list (nav) shape — no body, matches the original list query. */
export interface DocsChapter {
  slug: string;
  title: string;
  order: number;
}

/** One chapter's full body — matches the original single-chapter query. */
export interface DocsChapterDetail {
  title: string;
  order: number;
  body: RichText;
}

const DOCS_CHAPTERS_QUERY = `
  *[_type == "docsChapter" && collection == $collection] | order(order asc){
    "slug": slug.current,
    title,
    order
  }
`;

const DOCS_CHAPTER_QUERY = `
  *[_type == "docsChapter" && collection == $collection && slug.current == $slug][0]{
    title,
    order,
    body[]{ ${STYLED_BODY_PROJECTION} }
  }
`;

/**
 * Chapter list (nav) for a document collection. `query` — the original
 * (`sanity/queries/docs-reader.ts`'s `fetchDocsChapters`) called
 * `client.fetch` directly. No try/catch in the original or its one caller —
 * failures propagate.
 */
export async function getDocsChapters(collection: string): Promise<DocsChapter[]> {
  if (onPayload()) return payloadSystem.getDocsChapters(collection);
  return query<DocsChapter[]>(DOCS_CHAPTERS_QUERY, { collection });
}

/**
 * One chapter's full body by slug (with dereferenced images + internal
 * links). `query` — the original `fetchDocsChapter` also called
 * `client.fetch` directly. Same failure behaviour as `getDocsChapters`.
 */
export async function getDocsChapter(collection: string, slug: string): Promise<DocsChapterDetail | null> {
  if (onPayload()) return payloadSystem.getDocsChapter(collection, slug);
  return query<DocsChapterDetail | null>(DOCS_CHAPTER_QUERY, { collection, slug });
}

// ---------------------------------------------------------------------------
// Homepage "Fresh on the hub" bento (lib/cards/fresh-items.ts)
// ---------------------------------------------------------------------------

export interface FreshContentRow {
  id: string;
  type: string;
  title: string;
  slug: string | null;
  image: string | null;
  imageLqip: string | null;
  excerpt: string | null;
  place: string | null;
  date: string | null;
}

const FRESH_CONTENT_TYPES = ["caseStudy", "livedExperience", "newsPost", "researchOutput"] as const;

const FRESH_CONTENT_STATUS: Record<string, string> = {
  caseStudy: '&& status == "approved"',
  researchOutput: '&& status == "approved"',
  livedExperience: '&& (status == "approved" || !defined(status))',
  newsPost: "",
};

/**
 * The newest public content across the four card-capable types — one query
 * per type. The original (`lib/cards/fresh-items.ts`) wrapped each
 * `client.fetch` in `.catch(() => [] as Row[])`; reproduced per-type via
 * `safe()`, so one type failing still lets the others populate the bento.
 * `fresh-items.ts` keeps the cross-type sort/slice/`TypedCardItem` mapping —
 * this only owns the read.
 *
 * **The `, _id asc` tie-break is new, and it changes nothing.** The primary key
 * is a near-total tie — 25 of 28 case studies carry the same backfilled
 * `publishedAt` (`2024-01-01T00:00:00Z`) and all 29 research outputs carry
 * `2024-03-18T00:00:00.000Z` — so `order(… desc)` alone is unordered in
 * practice, and GROQ and Postgres are free to pick different representatives.
 * Measured against `production_2` at the published perspective on 2026-09-07
 * (control `count(*[_type=="agenda"])` = 29), with each type's real filter and
 * the real cap: adding `, _id asc` returns **the identical list** for all four
 * types, while `, _id desc` and `, _createdAt asc` both reorder case studies.
 * So this makes explicit the order Sanity was already serving, and gives the
 * Payload reader the same rule to reproduce instead of an unspecified one.
 */
export async function getFreshContentRows(cap: number): Promise<FreshContentRow[]> {
  const perType = await Promise.all(
    FRESH_CONTENT_TYPES.map((type) =>
      safe("fresh-content-rows", [] as FreshContentRow[], async () => {
        if (onPayload()) return payloadSystem.getFreshContentRowsForType(type, cap);
        const rows = await query<FreshContentRow[] | null>(
          `*[_type == $type ${FRESH_CONTENT_STATUS[type]} && defined(slug.current)] | order(coalesce(publishedAt, publishDate, _createdAt) desc, _id asc)[0...${cap}]{
            "id": _id,
            "type": _type,
            "title": coalesce(title.en, title, ""),
            "slug": slug.current,
            "image": coalesce(image.asset->url, coverImage.asset->url),
            "imageLqip": coalesce(image.asset->metadata.lqip, coverImage.asset->metadata.lqip),
            "excerpt": coalesce(excerpt.en, excerpt, description.en, description),
            "place": coalesce(locationDisplayText, locationText.city, place.text),
            "date": coalesce(publishedAt, publishDate, _createdAt)
          }`,
          { type },
        );
        return rows ?? [];
      }),
    ),
  );
  return perType.flat();
}

// ---------------------------------------------------------------------------
// Algolia search-index dispatcher — no live call site yet (`pnpm sync:search`
// drives the per-domain sync routes directly), the same "produced, not yet
// consumed" status Tasks 3-5 left their own per-domain producers in. Thin by
// design: switches on `kind` and delegates; no query lives here — each
// domain owns its own projection.
// ---------------------------------------------------------------------------

export async function getSearchIndexRecords(kind: ContentKind): Promise<SearchRecord[]> {
  switch (kind) {
    case "caseStudy":
      return getCaseStudySearchRecords();
    case "newsPost":
      return getNewsSearchRecords();
    case "agenda":
      return getAgendaSearchRecords();
    case "researchOutput":
      return getResearchOutputSearchRecords();
    case "livedExperience":
    case "event":
      // No Algolia index exists for either kind (lib/algolia.ts's
      // ALGOLIA_INDICES has no livedExperience/event entry) and no
      // per-domain producer exists to delegate to — an empty list, not a
      // gap: there is nothing to sync yet.
      return [];
  }
}
