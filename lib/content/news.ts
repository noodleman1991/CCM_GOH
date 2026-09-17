import "server-only";
import { activeBackend } from "@/lib/content/internal/backend";
import * as payloadNews from "@/lib/content/internal/payload/news";
import { safe } from "@/lib/content/internal/safe";
import { query } from "@/lib/content/internal/sanity-source";
import type { Locale, Localized, RichText, SearchRecord } from "@/lib/content/types";
import { localize } from "@/lib/content/types";

// ---------------------------------------------------------------------------
// Which store answers
//
// Phase 3 moves this module to Payload behind `CONTENT_BACKEND` (or
// `CONTENT_BACKEND_NEWS` for this module alone). Every export below keeps the
// signature it already had: the branch is one line at the top of each
// function, and the GROQ underneath it is untouched, so reverting this module
// is deleting seventeen lines. `activeBackend()` is read per call, never
// cached in a module constant, so a test or a preview deployment can flip it
// after import.
//
// Two things below changed on the SANITY path as part of this swap, and both
// are deliberate:
//
//   * `NEWS_POST_FIELDS` and `getApprovedExternalSources` bound a bare `value`
//     inside `tags[]->{…}`. `tag.value` is a Sanity `slug`, so those two
//     projections handed consumers `{_type:"slug", current:"…"}` while
//     `NewsPostTag.value` and `NewsExternalSource.tags[].value` promise a
//     string and Payload's column IS a string. Both now project
//     `"value": value.current`. Nothing on the news surfaces reads either one
//     (grepped) — the tag filter is fed by `getNewsTags()`, which has always
//     projected `value.current` — so unlike `/lived-experiences` this changes
//     no rendering. See `internal/payload/news.ts`, note 2.
//
//   * every `order(...)` gained `_id asc` as a final tie-break, matching
//     Task 7's decision. `publishedAt` is 4/4 distinct today, so it reorders
//     nothing; it is here so a future duplicate timestamp cannot make the two
//     backends disagree silently.
// ---------------------------------------------------------------------------

const DOMAIN = "news";

function onPayload(): boolean {
  return activeBackend(DOMAIN) === "payload";
}

// ---------------------------------------------------------------------------
// Shared fragments, inlined verbatim from sanity/queries/shared/styled-body.ts
// at conversion time (identical to the fragment already inlined in
// lib/content/lived-experiences.ts / lib/content/case-studies.ts), so this
// module's only Sanity contact stays sanity-source.ts.
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// The canonical news-post shape — a superset of every projection below (list,
// detail, dynamic-insert). Fields a given query doesn't select are simply
// absent, not wrong. `_id`/`_type`/`title`/`slug`/`publishedAt` are required:
// every list/detail query selects them, and lib/news-utils.ts's pre-existing
// (Sanity-free) `NewsPost` type — which several news components already
// import — declares the same fields required, so this stays a drop-in for
// those props.
// ---------------------------------------------------------------------------

export interface NewsPostImage {
  asset?: {
    _id: string;
    url: string;
    mimeType?: string;
    metadata?: { lqip?: string; dimensions?: { width: number; height: number } };
  };
  alt?: Localized | string;
  caption?: Localized | string;
}

export interface NewsPostAuthor {
  _id: string;
  name: string;
  /** Sanity image reference — passed straight to urlFor, never inspected here. */
  image?: unknown;
  bio?: Localized | string;
  organizationalAffiliation?: string;
}

export interface NewsPostOrganization {
  _id: string;
  name: string;
  slug?: { current: string };
  logo?: { asset?: { _id: string; url: string } };
}

export interface NewsPostProject {
  _id: string;
  name: string;
  description?: Localized | string;
  slug?: { current: string };
}

export interface NewsPostTag {
  _id: string;
  label: Localized;
  /** A slug string, not a slug object. `NEWS_POST_FIELDS` used to bind a bare
   *  `value` — and `tag.value` is a Sanity `slug` — so this really did hand
   *  consumers `{_type:"slug", current:"…"}` while every other tag projection
   *  in `lib/content/` returned the string. The projection now flattens it,
   *  which is also the shape Payload's flat `text` column has. Nothing on the
   *  news surfaces reads it (grepped); the tag filter uses `NewsFilterTag`,
   *  which has always been a string. */
  value: string;
  color?: string;
  category?: string;
}

export interface NewsPostSource {
  title: string;
  url: string;
  publisher?: string;
  date?: string;
}

export interface NewsPost {
  _id: string;
  _type: string;
  title: Localized;
  subtitle?: Localized;
  excerpt?: Localized;
  slug: string;
  publishedAt: string;
  _updatedAt?: string;
  featured?: boolean;
  image?: NewsPostImage;
  author?: NewsPostAuthor;
  organizations?: NewsPostOrganization[];
  projects?: NewsPostProject[];
  locationDetails?: {
    city?: string;
    country?: string;
    region?: string;
    coordinates?: { lat: number; lng: number };
  };
  tags?: NewsPostTag[];
  relatedCommunity?: { _id: string; name: Localized; slug: string } | null;
  language?: string;
  priority?: number;
  views?: number;
  /** Detail-only (getNewsPostBySlug). Portable Text today, Lexical after Phase 3. */
  content?: RichText;
  sources?: NewsPostSource[];
  meta_title?: string;
  meta_description?: string;
  noindex?: boolean;
  /** Sanity image reference — passed straight to urlFor, never inspected here. */
  ogImage?: { asset?: { _id: string; url: string } };
}

// Shared fragment for the news-post fields every list/detail query selects.
// Moved verbatim from sanity/queries/news-queries.ts's NEWS_POST_FIELDS.
const NEWS_POST_FIELDS = `
  _id,
  _type,
  title,
  subtitle,
  excerpt,
  "slug": slug.current,
  publishedAt,
  _updatedAt,
  featured,
  image{
    asset->{
      _id,
      url,
      mimeType,
      metadata {
        lqip,
        dimensions {
          width,
          height
        }
      }
    },
    alt,
    caption
  },
  author->{
    _id,
    name,
    image,
    bio,
    organizationalAffiliation
  },
  organizations[]->{
    _id,
    name,
    slug,
    logo{
      asset->{
        _id,
        url
      }
    }
  },
  projects[]->{
    _id,
    name,
    description,
    slug
  },
  locationDetails{
    city,
    country,
    region,
    coordinates
  },
  tags[]->{
    _id,
    label,
    "value": value.current,
    color,
    category
  },
  relatedCommunity->{
    _id,
    name,
    "slug": slug.current
  },
  language,
  priority,
  views
`;

// ---------------------------------------------------------------------------
// News listing (app/[locale]/(main)/news/page.tsx) — moved from
// sanity/queries/news-queries.ts's fetchFeaturedNews / fetchRegularNews /
// fetchAllNews. That source file had no try/catch around any of these three,
// so they keep throwing (no safe()) — the page's own Suspense boundaries are
// the original failure behaviour, not a content-layer degrade.
// ---------------------------------------------------------------------------

export async function getFeaturedNews(limit: number = 3, language?: string): Promise<NewsPost[]> {
  if (onPayload()) return payloadNews.getFeaturedNews(limit, language);
  const conditions = [
    '_type == "newsPost"',
    'featured == true',
    'publishedAt <= now()',
  ];
  const orderClause = language
    ? `order(language == $language desc, publishedAt desc, _id asc)`
    : `order(publishedAt desc, _id asc)`;
  const rows = await query<NewsPost[] | null>(
    `
      *[${conditions.join(' && ')}] | ${orderClause}[0...${limit}] {
        ${NEWS_POST_FIELDS}
      }
    `,
    language ? { language } : {}
  );
  return rows ?? [];
}

export interface NewsListFilters {
  tags?: string[];
  communities?: string[];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  limit?: number;
  language?: string;
}

export async function getRegularNews(filters?: NewsListFilters): Promise<NewsPost[]> {
  if (onPayload()) return payloadNews.getRegularNews(filters);
  const conditions: string[] = [
    '_type == "newsPost"',
    'publishedAt <= now()',
    '(!defined(featured) || featured == false)', // Exclude featured from regular grid
  ];
  const params: Record<string, unknown> = {};

  // Multi-select (OR within a facet): match if ANY selected tag/community matches.
  if (filters?.tags?.length) {
    conditions.push(`count((tags[]->value.current)[@ in $filterTags]) > 0`);
    params.filterTags = filters.tags;
  }

  if (filters?.communities?.length) {
    conditions.push(`relatedCommunity->slug.current in $filterCommunities`);
    params.filterCommunities = filters.communities;
  }

  if (filters?.dateFrom) {
    conditions.push(`publishedAt >= $filterDateFrom`);
    params.filterDateFrom = filters.dateFrom;
  }

  if (filters?.dateTo) {
    conditions.push(`publishedAt <= $filterDateTo`);
    params.filterDateTo = filters.dateTo;
  }

  if (filters?.search) {
    conditions.push(`(
      lower(title.en) match $searchPattern ||
      lower(title.es) match $searchPattern ||
      lower(title.fr) match $searchPattern ||
      lower(title.ar) match $searchPattern ||
      lower(excerpt.en) match $searchPattern ||
      lower(excerpt.es) match $searchPattern ||
      lower(excerpt.fr) match $searchPattern ||
      lower(excerpt.ar) match $searchPattern
    )`);
    params.searchPattern = `*${filters.search.toLowerCase()}*`;
  }

  const limit = filters?.limit || 50;
  const orderClause = filters?.language
    ? `order(language == $language desc, publishedAt desc, _id asc)`
    : `order(publishedAt desc, _id asc)`;

  if (filters?.language) {
    params.language = filters.language;
  }

  const rows = await query<NewsPost[] | null>(
    `
      *[${conditions.join(' && ')}] | ${orderClause}[0...${limit}] {
        ${NEWS_POST_FIELDS}
      }
    `,
    params
  );
  return rows ?? [];
}

export async function getAllNews(filters?: NewsListFilters): Promise<NewsPost[]> {
  if (onPayload()) return payloadNews.getAllNews(filters);
  const conditions: string[] = [
    '_type == "newsPost"',
    'publishedAt <= now()',
  ];
  const params: Record<string, unknown> = {};

  // Multi-select (OR within a facet).
  if (filters?.tags?.length) {
    conditions.push(`count((tags[]->value.current)[@ in $filterTags]) > 0`);
    params.filterTags = filters.tags;
  }

  if (filters?.communities?.length) {
    conditions.push(`relatedCommunity->slug.current in $filterCommunities`);
    params.filterCommunities = filters.communities;
  }

  if (filters?.dateFrom) {
    conditions.push(`publishedAt >= $filterDateFrom`);
    params.filterDateFrom = filters.dateFrom;
  }

  if (filters?.dateTo) {
    conditions.push(`publishedAt <= $filterDateTo`);
    params.filterDateTo = filters.dateTo;
  }

  if (filters?.search) {
    conditions.push(`(
      lower(title.en) match $searchPattern ||
      lower(title.es) match $searchPattern ||
      lower(title.fr) match $searchPattern ||
      lower(title.ar) match $searchPattern ||
      lower(excerpt.en) match $searchPattern ||
      lower(excerpt.es) match $searchPattern ||
      lower(excerpt.fr) match $searchPattern ||
      lower(excerpt.ar) match $searchPattern
    )`);
    params.searchPattern = `*${filters.search.toLowerCase()}*`;
  }

  const limit = filters?.limit || 50;
  const orderClause = filters?.language
    ? `order(language == $language desc, featured desc, publishedAt desc, _id asc)`
    : `order(featured desc, publishedAt desc, _id asc)`;

  if (filters?.language) {
    params.language = filters.language;
  }

  const rows = await query<NewsPost[] | null>(
    `
      *[${conditions.join(' && ')}] | ${orderClause}[0...${limit}] {
        ${NEWS_POST_FIELDS}
      }
    `,
    params
  );
  return rows ?? [];
}

// ---------------------------------------------------------------------------
// Detail page (app/[locale]/(main)/news/[slug]/page.tsx) — moved from
// fetchNewsBySlug. No try/catch in the original; the page calls notFound()
// on null but never catches a throw, so this keeps throwing too.
// ---------------------------------------------------------------------------

const NEWS_POST_DETAIL_QUERY = `
  *[_type == "newsPost" && slug.current == $slug][0] {
    ${NEWS_POST_FIELDS},
    content[]{ ${STYLED_BODY_PROJECTION} },
    sources[]{
      title,
      url,
      publisher,
      date
    },
    meta_title,
    meta_description,
    noindex,
    ogImage{
      asset->{
        _id,
        url
      }
    }
  }
`;

export async function getNewsPostBySlug(slug: string): Promise<NewsPost | null> {
  if (onPayload()) return payloadNews.getNewsPostBySlug(slug);
  return query<NewsPost | null>(NEWS_POST_DETAIL_QUERY, { slug });
}

// ---------------------------------------------------------------------------
// generateStaticParams (same detail page) — the inline
// `client.fetch(groq\`*[_type == "newsPost" && defined(slug.current)]...\`)`
// call the brief didn't name explicitly but is squarely the getNewsSlugs
// interface it does name.
// ---------------------------------------------------------------------------

const NEWS_SLUGS_QUERY = `*[_type == "newsPost" && defined(slug.current)] | order(_id asc) {
  "slug": slug.current
}`;

export async function getNewsSlugs(): Promise<string[]> {
  const rows = onPayload()
    ? await payloadNews.getNewsSlugs()
    : await query<{ slug: string }[]>(NEWS_SLUGS_QUERY);
  return (rows ?? []).map((r) => r.slug);
}

// ---------------------------------------------------------------------------
// Related news (same detail page) — moved from fetchRelatedNews. A narrower
// projection than NewsPost (no organizations/projects/relatedCommunity/etc.),
// so it gets its own type rather than a NewsPost with more optionals.
// ---------------------------------------------------------------------------

export interface RelatedNewsItem {
  _id: string;
  title?: Localized;
  subtitle?: Localized;
  excerpt?: Localized;
  slug: string;
  publishedAt?: string;
  featured?: boolean;
  image?: {
    asset?: { _id: string; url: string; metadata?: { lqip?: string } };
    alt?: Localized | string;
  };
  tags?: Array<{ _id: string; label?: Localized; color?: string }>;
}

export async function getRelatedNews(
  newsId: string,
  tags: string[],
  limit: number = 3
): Promise<RelatedNewsItem[]> {
  if (tags.length === 0) {
    return [];
  }

  if (onPayload()) return payloadNews.getRelatedNews(newsId, tags, limit);

  const rows = await query<RelatedNewsItem[] | null>(
    `
      *[_type == "newsPost" &&
        _id != $newsId &&
        publishedAt <= now() &&
        count((tags[]->_id)[@ in $tags]) > 0
      ] | order(publishedAt desc, _id asc)[0...${limit}] {
        _id,
        title,
        subtitle,
        excerpt,
        "slug": slug.current,
        publishedAt,
        featured,
        image{
          asset->{
            _id,
            url,
            metadata {
              lqip
            }
          },
          alt
        },
        tags[]->{
          _id,
          label,
          color
        }
      }
    `,
    { newsId, tags }
  );
  return rows ?? [];
}

// ---------------------------------------------------------------------------
// Filters wrapper (components/news/news-filters.tsx, fed by the list page's
// NewsFiltersWrapper) — moved from fetchNewsTags / fetchRegionalCommunities.
// Both projections carry a `newsCount` the shared toTag/toRegion normalizers
// (lib/content/internal/normalize.ts) don't produce, and the tag shape also
// carries `category`, which RawTag doesn't have — see the module-level
// normalizer-decision note in the Task 4 report. Kept as raw _id-keyed shapes,
// same judgment call case-studies.ts made for its own filter projections.
// ---------------------------------------------------------------------------

export interface NewsFilterTag {
  _id: string;
  label: Localized;
  value: string;
  color?: string;
  category?: string;
  newsCount?: number;
}

export async function getNewsTags(): Promise<NewsFilterTag[]> {
  if (onPayload()) return payloadNews.getNewsTags();
  const rows = await query<NewsFilterTag[] | null>(
    `
      *[_type == "tag" && count(*[_type == "newsPost" && references(^._id)]) > 0]
      | order(label.en asc, _id asc) {
        _id,
        label,
        "value": value.current,
        color,
        category,
        "newsCount": count(*[_type == "newsPost" && references(^._id)])
      }
    `
  );
  return rows ?? [];
}

export interface NewsFilterCommunity {
  _id: string;
  name: Localized;
  slug: string;
  newsCount?: number;
}

export async function getRegionalCommunities(): Promise<NewsFilterCommunity[]> {
  if (onPayload()) return payloadNews.getRegionalCommunities();
  const rows = await query<NewsFilterCommunity[] | null>(
    `
      *[_type == "regionalCommunity"]
      | order(order asc, name.en asc, _id asc) {
        _id,
        name,
        "slug": slug.current,
        "newsCount": count(*[_type == "newsPost" && relatedCommunity._ref == ^._id])
      }
    `
  );
  return rows ?? [];
}

// ---------------------------------------------------------------------------
// External sources (same list page) — moved from fetchApprovedExternalSources.
// externalSource is a distinct Sanity document type from newsPost, but it's
// used ONLY by the news list page (merged into one feed via
// lib/news-feed.ts's mergeNewsFeed), and no other Task 4-2026-09-02 brief
// claims it, so it lives here rather than getting its own domain module.
// ---------------------------------------------------------------------------

export interface NewsExternalSource {
  _id: string;
  _type: string;
  title?: Localized;
  excerpt?: Localized;
  sourceUrl?: string;
  publisher?: string;
  publishedAt?: string;
  featured?: boolean;
  sourceType?: string;
  language?: string;
  image?: {
    asset?: {
      _id: string;
      url: string;
      metadata?: { lqip?: string; dimensions?: { width: number; height: number } };
    };
    alt?: Localized | string;
  };
  organizations?: Array<{ _id: string; name?: string; slug?: { current: string } }>;
  tags?: Array<{
    _id: string;
    label?: Localized;
    title?: Localized;
    value?: string;
    color?: string;
    category?: string;
  }>;
}

export interface NewsExternalSourceFilters {
  tags?: string[];
  communities?: string[];
  search?: string;
  limit?: number;
}

export async function getApprovedExternalSources(
  filters?: NewsExternalSourceFilters
): Promise<NewsExternalSource[]> {
  if (onPayload()) return payloadNews.getApprovedExternalSources(filters);

  const conditions: string[] = [
    '_type == "externalSource"',
    'approved == true',
  ];
  const params: Record<string, unknown> = {};

  if (filters?.tags?.length) {
    conditions.push('count((tags[]->value.current)[@ in $filterTags]) > 0');
    params.filterTags = filters.tags;
  }

  if (filters?.communities?.length) {
    conditions.push('relatedCommunity->slug.current in $filterCommunities');
    params.filterCommunities = filters.communities;
  }

  if (filters?.search) {
    conditions.push(`(
      lower(title.en) match $searchPattern ||
      lower(title.es) match $searchPattern ||
      lower(title.fr) match $searchPattern ||
      lower(title.ar) match $searchPattern ||
      lower(excerpt.en) match $searchPattern ||
      lower(excerpt.es) match $searchPattern ||
      lower(excerpt.fr) match $searchPattern ||
      lower(excerpt.ar) match $searchPattern
    )`);
    params.searchPattern = `*${filters.search.toLowerCase()}*`;
  }

  const limit = filters?.limit || 20;

  const rows = await query<NewsExternalSource[] | null>(
    `
      *[${conditions.join(' && ')}] | order(publishedAt desc, _id asc)[0...${limit}] {
        _id,
        _type,
        title,
        excerpt,
        sourceUrl,
        publisher,
        publishedAt,
        featured,
        sourceType,
        language,
        image{
          asset->{
            _id,
            url,
            metadata {
              lqip,
              dimensions {
                width,
                height
              }
            }
          },
          alt
        },
        organizations[]->{
          _id,
          name,
          slug
        },
        tags[]->{
          _id,
          label,
          title,
          "value": value.current,
          color,
          category
        }
      }
    `,
    params
  );
  return rows ?? [];
}

// ---------------------------------------------------------------------------
// sanity/queries/news-queries.ts's fetchLatestNews — dead code (zero call
// sites; grepped app/lib/components), but named in the brief's Produces list
// as getNewsPosts(locale?), so implemented here per the documented signature.
// Mirrors Task 3's precedent for brief-named-but-dead helpers
// (getApprovedCaseStudies / getFeaturedCaseStudies).
// ---------------------------------------------------------------------------

export async function getNewsPosts(locale?: Locale, limit: number = 10): Promise<NewsPost[]> {
  if (onPayload()) return payloadNews.getNewsPosts(locale, limit);
  const conditions = [
    '_type == "newsPost"',
    'publishedAt <= now()',
  ];
  if (locale) {
    conditions.push('language == $language');
  }
  const rows = await query<NewsPost[] | null>(
    `
      *[${conditions.join(' && ')}]
      | order(publishedAt desc, _id asc)[0...${limit}] {
        ${NEWS_POST_FIELDS}
      }
    `,
    locale ? { language: locale } : {}
  );
  return rows ?? [];
}

// ---------------------------------------------------------------------------
// sanity/lib/fetch.ts's fetchDynamicNews (regional community template's
// "dynamic-featured"/"dynamic-recent" grid insert) — dead code (zero call
// sites; the live dynamic-insert path is lib/dynamic-queries.ts /
// lib/dynamic-queries-client.ts, an unrelated generic system outside this
// domain). Brief-named ("You own exactly one: fetchDynamicNews"), so moved
// here rather than left in fetch.ts. The original wrapped the whole body in
// try/catch returning [], so this degrades via safe() too.
// ---------------------------------------------------------------------------

export interface DynamicNewsOptions {
  regionalCommunityId: string;
  mode?: "dynamic-featured" | "dynamic-recent";
  maxItems?: number;
}

const DYNAMIC_NEWS_FIELDS = `
  _id,
  title,
  subtitle,
  excerpt,
  slug,
  image{
    asset->{
      _id,
      url,
      metadata {
        lqip,
        dimensions {
          width,
          height
        }
      }
    },
    alt
  },
  author->{
    _id,
    name,
    image{
      asset->{
        _id,
        url
      }
    }
  },
  publishedAt,
  organizations[]->{
    _id,
    name
  },
  locationDetails,
  tags[]->{
    _id,
    label,
    color
  },
  featured
`;

export async function getDynamicNews({
  regionalCommunityId,
  mode = "dynamic-featured",
  maxItems = 6,
}: DynamicNewsOptions): Promise<NewsPost[]> {
  return safe("dynamic-news", [], async () => {
    if (onPayload()) return payloadNews.getDynamicNews({ regionalCommunityId, mode, maxItems });

    let items: NewsPost[] = [];

    if (mode === "dynamic-featured") {
      // First get featured news
      const featuredNews = await query<NewsPost[] | null>(
        `*[_type == "newsPost" && featured == true && references($regionalCommunityId)] | order(publishedAt desc, _id asc)[0...${maxItems}]{
          ${DYNAMIC_NEWS_FIELDS}
        }`,
        { regionalCommunityId }
      );

      items = featuredNews || [];

      // If we need more items, get recent non-featured news
      if (items.length < maxItems) {
        const remainingCount = maxItems - items.length;
        const featuredIds = items.map((item) => item._id);

        const recentNews = await query<NewsPost[] | null>(
          `*[_type == "newsPost" && !(_id in $featuredIds) && references($regionalCommunityId)] | order(publishedAt desc, _id asc)[0...${remainingCount}]{
            ${DYNAMIC_NEWS_FIELDS}
          }`,
          { featuredIds, regionalCommunityId }
        );

        items = [...items, ...(recentNews || [])];
      }
    } else {
      // Just get recent news
      const data = await query<NewsPost[] | null>(
        `*[_type == "newsPost" && references($regionalCommunityId)] | order(publishedAt desc, _id asc)[0...${maxItems}]{
          ${DYNAMIC_NEWS_FIELDS}
        }`,
        { regionalCommunityId }
      );

      items = data || [];
    }

    return items;
  });
}

// ---------------------------------------------------------------------------
// OG card (app/[locale]/(main)/news/[slug]/og.png/route.tsx) — a call site
// the brief didn't list, found while auditing this domain (the
// lived-experiences / case-studies equivalents were converted in Tasks 2/3).
// The original wrapped its fetch in `.catch(() => null)`; this degrades via
// `safe()` the same way.
// ---------------------------------------------------------------------------

export interface NewsOgData {
  // Kept as a plain indexable record (not `Localized`) — the og route indexes
  // it with a runtime locale string, which needs a string index signature.
  title: Record<string, string> | string | null;
  region: string | null;
}

export async function getNewsOgData(slug: string): Promise<NewsOgData | null> {
  return safe("news-og", null, async () => {
    if (onPayload()) return payloadNews.getNewsOgData(slug);

    const doc = await query<NewsOgData | null>(
      `*[_type == "newsPost" && slug.current == $slug][0]{ title, "region": relatedCommunity->name.en }`,
      { slug }
    );
    return doc ?? null;
  });
}

// ---------------------------------------------------------------------------
// Algolia search-index sync (app/api/search/news/sync/route.ts,
// app/api/search/news/webhook/route.ts) — a raw index-shaped doc distinct
// from NewsPost: the Algolia transform needs region/themes/populations/
// location, which the page-facing NEWS_POST_FIELDS projection doesn't select,
// and doesn't need the dereferenced author/organizations/tags NewsPost
// carries. The three original queries (full sync, partial-by-ids sync,
// single-by-id webhook) selected an IDENTICAL field list, just re-indented by
// copy-paste at each of the three call sites; consolidated into one fragment
// here (content character-identical, whitespace normalized — see the Task 4
// report). Both routes already wrap their whole handler body in try/catch, so
// these keep throwing (no safe()) — the route's existing catch is the
// original failure behaviour.
// ---------------------------------------------------------------------------

export interface NewsIndexDoc {
  _id: string;
  // `en` required (not `Localized`, where it's optional) — matches the
  // Algolia NewsSearchRecord shape (lib/algolia.ts) this feeds, which the
  // original route's own local type already required in the same way.
  title?: { en: string; es?: string; fr?: string; ar?: string };
  subtitle?: { en: string; es?: string; fr?: string; ar?: string };
  excerpt?: { en: string; es?: string; fr?: string; ar?: string };
  slug?: { current?: string };
  publishedAt?: string;
  _updatedAt?: string;
  featured?: boolean;
  author?: { _id?: string; name?: string };
  tags?: Array<{ _id?: string; label?: Localized | null; value?: string | null }>;
  organizations?: Array<{ name?: string }>;
  projects?: Array<{ name?: string }>;
  location?: { lat?: number; lng?: number };
  locationDetails?: { city?: string; country?: string };
  language?: string;
  region?: string;
  themes?: string[];
  populations?: string[];
}

const NEWS_INDEX_FIELDS = `
  _id,
  title,
  subtitle,
  excerpt,
  slug,
  publishedAt,
  _updatedAt,
  region,
  themes,
  populations,
  featured,
  author->{_id, name},
  tags[]->{ _id, label, "value": value.current },
  organizations[]->{name},
  projects[]->{name},
  location,
  locationDetails {
    city,
    country
  },
  language
`;

export async function getPublishedNewsIndexDocs(): Promise<NewsIndexDoc[]> {
  if (onPayload()) return payloadNews.getPublishedNewsIndexDocs();
  const rows = await query<NewsIndexDoc[] | null>(
    `*[_type == "newsPost" && publishedAt <= now()] | order(publishedAt desc, _id asc) {
      ${NEWS_INDEX_FIELDS}
    }`
  );
  return rows ?? [];
}

export async function getNewsIndexDocsByIds(ids: string[]): Promise<NewsIndexDoc[]> {
  if (onPayload()) return payloadNews.getNewsIndexDocsByIds(ids);
  const rows = await query<NewsIndexDoc[] | null>(
    `*[_type == "newsPost" && _id in $ids] | order(_id asc) {
      ${NEWS_INDEX_FIELDS}
    }`,
    { ids }
  );
  return rows ?? [];
}

export async function getNewsIndexDocById(id: string): Promise<NewsIndexDoc | null> {
  if (onPayload()) return payloadNews.getNewsIndexDocById(id);
  return query<NewsIndexDoc | null>(
    `*[_type == "newsPost" && _id == $id][0] {
      ${NEWS_INDEX_FIELDS}
    }`,
    { id }
  );
}

export async function getPublishedNewsCount(): Promise<number> {
  if (onPayload()) return payloadNews.getPublishedNewsCount();
  return query<number>(`count(*[_type == "newsPost" && publishedAt <= now()])`);
}

// ---------------------------------------------------------------------------
// Search index (consumed by Task 10's getSearchIndexRecords dispatcher — no
// call site exists yet). Degrades to an empty list on failure: a search-index
// sync job should skip one content kind on error, not fail the whole run.
// Distinct from the Algolia-sync NewsIndexDoc above — this produces the
// generic SearchRecord[] shape every domain module feeds Task 10, not the
// richer doc the news search index itself is built from.
// ---------------------------------------------------------------------------

interface RawNewsSearchRecordDoc {
  _id: string;
  language?: string;
  title?: Localized | string;
  excerpt?: Localized | string;
  slug: string;
}

const NEWS_SEARCH_RECORDS_QUERY = `
  *[_type == "newsPost" && defined(slug.current) && publishedAt <= now()] | order(_id asc) {
    _id,
    language,
    title,
    excerpt,
    "slug": slug.current
  }
`;

export async function getNewsSearchRecords(): Promise<SearchRecord[]> {
  return safe("news-search-records", [], async () => {
    const docs = onPayload()
      ? await payloadNews.getNewsSearchRecords()
      : await query<RawNewsSearchRecordDoc[] | null>(NEWS_SEARCH_RECORDS_QUERY);
    return (docs ?? []).map((d) => {
      const locale = (["en", "es", "fr", "ar"].includes(d.language ?? "") ? d.language : "en") as Locale;
      return {
        objectID: d._id,
        kind: "newsPost" as const,
        title: localize(d.title, locale),
        excerpt: d.excerpt ? localize(d.excerpt, locale) : undefined,
        url: `/${locale}/news/${d.slug}`,
        locale,
      };
    });
  });
}
