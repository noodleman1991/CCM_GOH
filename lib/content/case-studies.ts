import "server-only";
import { v4 as uuidv4 } from "uuid";
import { activeBackend } from "@/lib/content/internal/backend";
import * as payloadCaseStudies from "@/lib/content/internal/payload/case-studies";
import { uploadFileAsset as uploadPayloadFileAsset } from "@/lib/content/internal/payload-source";
import { safe } from "@/lib/content/internal/safe";
import {
  createDocument,
  deleteDocument,
  query,
  queryPreviewable,
  queryRaw,
  updateDocument,
  uploadFileAsset,
} from "@/lib/content/internal/sanity-source";
import type { Locale, Localized, RichText, SearchRecord } from "@/lib/content/types";
import { localize } from "@/lib/content/types";
import { prisma, safeQuery } from "@/lib/prisma";
import { generateCaseStudySlug } from "@/lib/validation/case-study";

/**
 * The module's own name, as `CONTENT_BACKEND_CASE_STUDIES` spells it.
 *
 * Every export below keeps its signature and gains one `if (onPayload())`
 * line; the Payload half lives in `lib/content/internal/payload/case-studies.ts`,
 * whose header carries the measurements and the eight decisions this swap rests
 * on — the bidirectional `status`/`moderationStatus` mapping, the two published
 * documents that make the approved filter load-bearing, the `_id asc` tie-break
 * that reproduces Sanity's order, and which read primitive each of the six
 * write-feeding reads must call.
 */
const DOMAIN = "case-studies";

function onPayload(): boolean {
  return activeBackend(DOMAIN) === "payload";
}

export type CaseStudyStatus = "pending" | "rejected" | "revision" | "approved";

export interface CaseStudyImage {
  asset?: {
    _id: string;
    url: string;
    mimeType?: string;
    metadata?: { lqip?: string; dimensions?: { width: number; height: number } };
  };
  hotspot?: unknown;
  crop?: unknown;
  alt?: string;
  caption?: string;
}

export interface CaseStudyAuthor {
  userId?: string;
  name?: string;
  email?: string;
  role?: string;
  affiliation?: {
    _id: string;
    name?: string;
    slug?: { current: string };
    acronym?: string;
    logo?: { asset?: { _id: string; url: string }; alt?: string };
  };
}

export interface CaseStudyOrganization {
  _id: string;
  name?: string;
  slug?: { current: string };
  acronym?: string;
  logo?: { asset?: { _id: string; url: string }; alt?: string };
}

export interface CaseStudyProject {
  _id: string;
  name?: string;
  slug?: { current: string };
}

export interface CaseStudyTagRef {
  _id: string;
  label?: Localized;
  value?: unknown;
  color?: string;
}

/**
 * The canonical case-study shape. A superset of every projection below (list,
 * grid, detail, admin) — fields a given query doesn't select are simply
 * absent, not wrong. Two of the eleven moved helpers (getCaseStudiesByRegion,
 * searchCaseStudies) project `tags` as raw un-dereferenced references rather
 * than this shape; those two return their own dedicated type
 * (CaseStudyRegionListItem / CaseStudySearchResult) rather than bending this
 * type or casting into it (see the note at each).
 */
export interface CaseStudy {
  _id: string;
  language?: string;
  title?: Localized;
  excerpt?: Localized;
  /** Portable Text today, Lexical after Phase 3 — never PortableTextBlock[]. */
  content?: RichText;
  layout?: "story" | "feature" | "report";
  slug?: { current: string };
  status?: CaseStudyStatus;
  publishedAt?: string;
  submittedAt?: string;
  submittedBy?: string;
  featured?: boolean;
  image?: CaseStudyImage;
  authors?: CaseStudyAuthor[];
  organizations?: CaseStudyOrganization[];
  projects?: CaseStudyProject[];
  tags?: CaseStudyTagRef[];
  studyPeriod?: { startDate?: string; endDate?: string };
  studyLocation?: { lat: number; lng: number; alt?: number };
  locationPrecision?: "exact" | "city" | "country" | "region" | null;
  locationCountryCode?: string | null;
  locationDisplayText?: string | null;
  studyAreas?: Array<{
    location: { lat: number; lng: number; alt?: number };
    name?: string;
    description?: string;
  }>;
  /** Polymorphic connection targets — opaque, per RELATED_CONTENT_PROJECTION. */
  relatedContent?: unknown;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  reviewNotes?: string;
  /** Sometimes a raw ref id, sometimes dereferenced to {name} — query-dependent. */
  reviewedBy?: unknown;
  reviewedAt?: string;
}

// ---------------------------------------------------------------------------
// Shared projection fragments, inlined verbatim from
// sanity/queries/shared/styled-body.ts and sanity/queries/grid/grid-case-study.ts
// (CASE_STUDY_PROJECTION_FRAGMENT / RELATED_CONTENT_PROJECTION) at conversion
// time, rather than imported — this module's only Sanity contact stays
// sanity-source.ts.
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

const RELATED_CONTENT_PROJECTION = `
  relatedContent[]{
    relation,
    "target": target->{
      _type,
      _id,
      "slug": slug.current,
      title,
      excerpt,
      "image": image{ asset->{ _id, url }, alt },
      // lived experience specifics
      videoUrl,
      // project specifics (title is plain string there)
      status
    }
  }
`;

const CASE_STUDY_PROJECTION_FRAGMENT = `
  _id,
  title,
  excerpt,
  slug,
  status,
  publishedAt,
  submittedAt,
  submittedBy,
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
    hotspot,
    crop,
    alt,
    caption
  },
  authors[]{
    userId,
    name,
    email,
    role,
    affiliation->{
      _id,
      name,
      slug,
      acronym,
      logo{
        asset->{
          _id,
          url
        },
        alt
      }
    }
  },
  organizations[]->{
    _id,
    name,
    slug,
    acronym,
    logo{
      asset->{
        _id,
        url
      },
      alt
    }
  },
  projects[]->{
    _id,
    name,
    slug
  },
  tags[]->{
    _id,
    label,
    value,
    color
  },
  studyPeriod,
  studyLocation,
  studyAreas[]{
    location,
    name,
    description
  }
`;

const CASE_STUDY_DETAIL_PROJECTION_FRAGMENT = `
  ${CASE_STUDY_PROJECTION_FRAGMENT},
  layout,
  content[]{ ${STYLED_BODY_PROJECTION} },
  ${RELATED_CONTENT_PROJECTION},
  seoTitle,
  seoDescription,
  canonicalUrl,
  reviewNotes,
  reviewedBy,
  reviewedAt
`;

// ---------------------------------------------------------------------------
// Detail page (app/[locale]/(main)/research-and-action/case-studies/[slug]/page.tsx)
// — moved from sanity/queries/grid/grid-case-study.ts's fetchCaseStudyBySlug /
// fetchCaseStudiesStaticParams, the LIVE implementations that page actually
// called (sanity/lib/fetch.ts also shipped same-named helpers importing the
// same query constants, but nothing called them — see report).
// ---------------------------------------------------------------------------

const CASE_STUDY_BY_SLUG_QUERY = `
  *[_type == "caseStudy" && slug.current == $slug && status == "approved"][0]{
    ${CASE_STUDY_DETAIL_PROJECTION_FRAGMENT}
  }
`;

const CASE_STUDIES_STATIC_PARAMS_QUERY = `
  *[_type == "caseStudy" && status == "approved" && defined(slug)]{
    "slug": slug.current
  }
`;

export async function getCaseStudyBySlug(slug: string): Promise<CaseStudy | null> {
  if (onPayload()) return payloadCaseStudies.getCaseStudyBySlug(slug);
  // fetchCaseStudyBySlug's original sanityFetch call omitted both
  // perspective/stega, so cachedFetch's own draftMode() check decided draft
  // vs. published — that is what let an editor previewing this case study in
  // Sanity's Presentation tool see their unpublished draft.
  return queryPreviewable<CaseStudy | null>(CASE_STUDY_BY_SLUG_QUERY, { slug });
}

export async function getCaseStudySlugs(): Promise<string[]> {
  if (onPayload()) return payloadCaseStudies.getCaseStudySlugs();
  const rows = await query<{ slug: string }[]>(CASE_STUDIES_STATIC_PARAMS_QUERY);
  return (rows ?? []).map((r) => r.slug);
}

// ---------------------------------------------------------------------------
// OG card (app/[locale]/(main)/research-and-action/case-studies/[slug]/og.png/route.tsx)
// — another call site the brief didn't list, found on review (the
// lived-experiences equivalent of this route was converted in Task 2). The
// original wrapped its fetch in `.catch(() => null)`; this degrades via
// `safe()` the same way, per Task 2's precedent for the same pattern.
// ---------------------------------------------------------------------------

export interface CaseStudyOgData {
  // Kept as a plain indexable record (not `Localized`) — the og route indexes
  // it with a runtime locale string, which needs a string index signature.
  title: Record<string, string> | string | null;
  region: string | null;
}

export async function getCaseStudyOgData(slug: string): Promise<CaseStudyOgData | null> {
  return safe("case-study-og", null, async () => {
    if (onPayload()) return payloadCaseStudies.getCaseStudyOgData(slug);
    const doc = await query<CaseStudyOgData | null>(
      `*[_type == "caseStudy" && slug.current == $slug][0]{ title, "region": relatedCommunity->name.en }`,
      { slug },
    );
    return doc ?? null;
  });
}

// ---------------------------------------------------------------------------
// sanity/lib/fetch.ts's fetchApprovedCaseStudies / fetchApprovedCaseStudiesByLocale
// / fetchFeaturedCaseStudies — dead code (zero call sites; grepped app/lib/
// components), but named in the brief's 11-helper move list, so implemented
// here per the documented Produces signature. The `locale` param mirrors the
// original's own (equally inert) `language` param — the query never filtered
// on it. Uses the SAME query constants grid-case-study.ts already re-exports
// (APPROVED_CASE_STUDIES_QUERY / FEATURED_CASE_STUDIES_QUERY), moved verbatim.
// ---------------------------------------------------------------------------

const APPROVED_CASE_STUDIES_QUERY = `
  *[_type == "caseStudy" && status == "approved"] | order(publishedAt desc, featured desc)[0...$limit]{
    ${CASE_STUDY_PROJECTION_FRAGMENT}
  }
`;

const FEATURED_CASE_STUDIES_QUERY = `
  *[_type == "caseStudy" && status == "approved" && featured == true] | order(publishedAt desc)[0...$limit]{
    ${CASE_STUDY_PROJECTION_FRAGMENT}
  }
`;

export async function getApprovedCaseStudies(locale?: Locale, limit = 12): Promise<CaseStudy[]> {
  void locale; // inert — preserved from the original dead helper, which never filtered on it
  if (onPayload()) return payloadCaseStudies.getApprovedCaseStudies(limit);
  const rows = await query<CaseStudy[] | null>(APPROVED_CASE_STUDIES_QUERY, { limit });
  return rows ?? [];
}

export async function getFeaturedCaseStudies(limit = 3): Promise<CaseStudy[]> {
  if (onPayload()) return payloadCaseStudies.getFeaturedCaseStudies(limit);
  const rows = await query<CaseStudy[] | null>(FEATURED_CASE_STUDIES_QUERY, { limit });
  return rows ?? [];
}

// ---------------------------------------------------------------------------
// sanity/lib/fetch.ts's fetchCaseStudiesByUser — dead code (zero call sites).
// ---------------------------------------------------------------------------

const CASE_STUDIES_BY_USER_QUERY = `*[_type == "caseStudy" && submittedBy == $userId] | order(_updatedAt desc)[0...$limit]{
  _id,
  language,
  title,
  excerpt,
  slug,
  status,
  publishedAt,
  submittedAt,
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
  authors[]{
    name,
    role
  }
}`;

export async function getCaseStudiesByUser(userId: string, limit = 12): Promise<CaseStudy[]> {
  if (onPayload()) return payloadCaseStudies.getCaseStudiesByUser(userId, limit);
  // fetchCaseStudiesByUser's original sanityFetch call omitted both
  // perspective/stega — same draft-preview requirement as getCaseStudyBySlug above.
  const rows = await queryPreviewable<CaseStudy[] | null>(CASE_STUDIES_BY_USER_QUERY, { userId, limit });
  return rows ?? [];
}

// ---------------------------------------------------------------------------
// sanity/lib/fetch.ts's fetchCaseStudiesByStatus — dead code (zero call sites).
// ---------------------------------------------------------------------------

const CASE_STUDIES_BY_STATUS_QUERY = `*[_type == "caseStudy" && status == $status] | order(_updatedAt desc)[0...$limit]{
  _id,
  language,
  title,
  excerpt,
  slug,
  status,
  publishedAt,
  submittedAt,
  submittedBy,
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
  authors[]{
    name,
    role,
    email
  },
  reviewNotes,
  reviewedBy->{
    name
  },
  reviewedAt
}`;

export async function getCaseStudiesByStatus(status: CaseStudyStatus, limit = 50): Promise<CaseStudy[]> {
  // The public vocabulary is `status`; Payload stores `moderationStatus`. The
  // reader maps the filter, so this signature — and this value set — is
  // unchanged on both backends.
  if (onPayload()) return payloadCaseStudies.getCaseStudiesByStatus(status, limit);
  // fetchCaseStudiesByStatus's original sanityFetch call omitted both
  // perspective/stega — same draft-preview requirement as getCaseStudyBySlug above.
  const rows = await queryPreviewable<CaseStudy[] | null>(CASE_STUDIES_BY_STATUS_QUERY, { status, limit });
  return rows ?? [];
}

// ---------------------------------------------------------------------------
// sanity/lib/fetch.ts's fetchCaseStudyTranslations — dead code (zero call sites).
// ---------------------------------------------------------------------------

export interface CaseStudyTranslations {
  _id: string;
  language?: string;
  baseDocument?: { _id: string; language?: string; slug?: { current: string }; title?: Localized } | null;
  translations?: Array<{
    language?: string;
    translationStatus?: string;
    document?: {
      _id: string;
      language?: string;
      slug?: { current: string };
      title?: Localized;
      status?: string;
    } | null;
  }>;
}

const CASE_STUDY_TRANSLATIONS_QUERY = `*[_type == "caseStudy" && _id == $caseStudyId][0]{
  _id,
  language,
  baseDocument->{
    _id,
    language,
    slug,
    title
  },
  translations[]{
    language,
    translationStatus,
    document->{
      _id,
      language,
      slug,
      title,
      status
    }
  }
}`;

export async function getCaseStudyTranslations(caseStudyId: string): Promise<CaseStudyTranslations | null> {
  if (onPayload()) return payloadCaseStudies.getCaseStudyTranslations(caseStudyId);
  return query<CaseStudyTranslations | null>(CASE_STUDY_TRANSLATIONS_QUERY, { caseStudyId });
}

// ---------------------------------------------------------------------------
// sanity/lib/fetch.ts's fetchApprovedCaseStudiesByRC — dead code (zero call
// sites; the LIVE regional-community case-study strip is Task 6's
// fetchRegionalCommunityCaseStudies, a different function/file, untouched).
// `tags` here is a raw, un-dereferenced reference array (no `->`) — the
// original's own projection, not this module's usual dereferenced
// CaseStudyTagRef[] shape — so this gets its own return type (below) rather
// than widening CaseStudy.tags for one dead call path.
// ---------------------------------------------------------------------------

/** A tag field left un-dereferenced by GROQ (no `->`) — a plain Sanity
 *  reference, not the `{ label, value, color }` shape CaseStudyTagRef promises. */
export interface CaseStudyRawTagRef {
  _type: "reference";
  _ref: string;
  _key?: string;
}

/** The shape getCaseStudiesByRegion's query actually returns — identical to
 *  CaseStudy except `tags`, which this query leaves un-dereferenced. */
export interface CaseStudyRegionListItem {
  _id: string;
  language?: string;
  title?: Localized;
  excerpt?: Localized;
  slug?: { current: string };
  status?: CaseStudyStatus;
  publishedAt?: string;
  featured?: boolean;
  image?: CaseStudyImage;
  authors?: CaseStudyAuthor[];
  organizations?: CaseStudyOrganization[];
  projects?: CaseStudyProject[];
  tags?: CaseStudyRawTagRef[];
  studyPeriod?: { startDate?: string; endDate?: string };
  studyLocation?: { lat: number; lng: number; alt?: number };
  studyAreas?: Array<{
    location: { lat: number; lng: number; alt?: number };
    name?: string;
    description?: string;
  }>;
}

const APPROVED_CASE_STUDIES_BY_RC_QUERY_TEMPLATE = (orderDirection: "asc" | "desc") => `*[_type == "caseStudy" && status == "approved" && references(*[_type == "regionalCommunity" && slug.current == $slug][0]._id)] | order(publishedAt ${orderDirection}, featured desc)[0...$limit]{
  _id,
  language,
  title,
  excerpt,
  slug,
  status,
  publishedAt,
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
  authors[]{
    userId,
    name,
    email,
    role,
    affiliation->{
      _id,
      name,
      slug,
      acronym,
      logo{
        asset->{
          _id,
          url
        },
        alt
      }
    }
  },
  organizations[]->{
    _id,
    name,
    slug,
    acronym,
    logo{
      asset->{
        _id,
        url
      },
      alt
    }
  },
  projects[]->{
    _id,
    name,
    slug
  },
  tags,
  studyPeriod,
  studyLocation,
  studyAreas[]{
    location,
    name,
    description
  }
}`;

export async function getCaseStudiesByRegion(
  rcSlug: string,
  locale: Locale = "en",
  limit = 12,
): Promise<CaseStudyRegionListItem[]> {
  // SAFETY: orderDirection is derived from a boolean check and can only be 'asc' or 'desc'.
  // GROQ parameters cannot be used for sort directions — string interpolation is required here.
  const isRTL = locale === "ar";
  const orderDirection = isRTL ? "asc" : "desc";
  if (onPayload()) return payloadCaseStudies.getCaseStudiesByRegion(rcSlug, orderDirection, limit);
  const rows = await query<CaseStudyRegionListItem[] | null>(APPROVED_CASE_STUDIES_BY_RC_QUERY_TEMPLATE(orderDirection), {
    slug: rcSlug,
    limit,
  });
  return rows ?? [];
}

// ---------------------------------------------------------------------------
// sanity/lib/fetch.ts's searchCaseStudies — dead code (zero call sites; the
// client-side search UI at components/search/search-interface.tsx uses
// Algolia InstantSearch, an unrelated pipeline). `tags` is again a raw
// reference array — same rationale as getCaseStudiesByRegion above, so this
// gets its own return type too.
// ---------------------------------------------------------------------------

export interface CaseStudySearchOptions {
  language?: Locale;
  tags?: string[];
  limit?: number;
}

/** The shape searchCaseStudies' query actually returns — a narrower
 *  projection than CaseStudy (no status; authors/tags shaped differently). */
export interface CaseStudySearchResult {
  _id: string;
  language?: string;
  title?: Localized;
  excerpt?: Localized;
  slug?: { current: string };
  publishedAt?: string;
  featured?: boolean;
  image?: CaseStudyImage;
  authors?: Array<{
    name?: string;
    role?: string;
    affiliation?: { name?: string; acronym?: string };
  }>;
  tags?: CaseStudyRawTagRef[];
}

export async function searchCaseStudies(
  term?: string,
  options: CaseStudySearchOptions = {},
): Promise<CaseStudySearchResult[]> {
  if (onPayload()) return payloadCaseStudies.searchCaseStudies(term, options);
  const { language, tags, limit = 20 } = options;
  const filters = [`_type == "caseStudy"`, `status == "approved"`];
  const params: Record<string, unknown> = { limit };

  if (language) {
    filters.push(`language == $language`);
    params.language = language;
  }

  if (term) {
    filters.push(`(
      title.en match $searchPattern ||
      title.es match $searchPattern ||
      title.fr match $searchPattern ||
      title.ar match $searchPattern ||
      excerpt.en match $searchPattern ||
      excerpt.es match $searchPattern ||
      excerpt.fr match $searchPattern ||
      excerpt.ar match $searchPattern
    )`);
    params.searchPattern = `${term}*`;
  }

  // Tag filtering using parameterized $tags array
  if (tags && tags.length > 0) {
    filters.push(`(
      count((tags.en[]->value.current)[@ in $tags]) > 0 ||
      count((tags.es[]->value.current)[@ in $tags]) > 0 ||
      count((tags.fr[]->value.current)[@ in $tags]) > 0 ||
      count((tags.ar[]->value.current)[@ in $tags]) > 0
    )`);
    params.tags = tags;
  }

  const rows = await query<CaseStudySearchResult[] | null>(
    `*[${filters.join(" && ")}] | order(featured desc, publishedAt desc)[0...$limit]{
      _id,
      language,
      title,
      excerpt,
      slug,
      publishedAt,
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
      authors[]{
        name,
        role,
        affiliation->{
          name,
          acronym
        }
      },
      tags
    }`,
    params,
  );
  return rows ?? [];
}

// ---------------------------------------------------------------------------
// List page (app/[locale]/(main)/research-and-action/case-studies/page.tsx) —
// the dynamic filtered gallery/map GROQ was inlined in the page itself
// (fetchFilteredCaseStudies), calling `client.fetch` directly. Not one of the
// 11 named helpers; found while converting the page, per the brief's
// "convert every call site" rule.
// ---------------------------------------------------------------------------

export interface CaseStudyListFilters {
  topics?: string[];
  tags?: string[];
  communities?: string[];
  search?: string;
}

/** The loosely-projected shape the list page's gallery/map view actually reads. */
export interface CaseStudyListItem {
  _id: string;
  topic?: string;
  slug: string;
  title?: Localized;
  excerpt?: Localized;
  image?: { asset?: { _id: string; url: string }; alt?: string } | null;
  publishedAt?: string;
  featured?: boolean;
  tags?: CaseStudyTagRef[];
  authors?: unknown;
  organizations?: Array<{ _id: string; name?: string }>;
  relatedCommunity?: Localized | string | null;
  communitySlug?: string | null;
}

export async function getFilteredCaseStudies(filters: CaseStudyListFilters): Promise<CaseStudyListItem[]> {
  if (onPayload()) return payloadCaseStudies.getFilteredCaseStudies(filters);
  const conditions: string[] = ['_type == "caseStudy"', 'status == "approved"'];
  const params: Record<string, unknown> = {};

  if (filters.topics && filters.topics.length > 0) {
    conditions.push(`topic in $topics`);
    params.topics = filters.topics;
  }

  if (filters.tags && filters.tags.length > 0) {
    conditions.push(`count((tags[]->value.current)[@ in $tags]) > 0`);
    params.tags = filters.tags;
  }

  if (filters.communities && filters.communities.length > 0) {
    conditions.push(`relatedCommunity->slug.current in $communities`);
    params.communities = filters.communities;
  }

  if (filters.search) {
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

  const groq = `*[${conditions.join(" && ")}] | order(featured desc, publishedAt desc)[0...50] {
    _id,
    topic,
    "slug": slug.current,
    title,
    excerpt,
    image{
      asset->{
        _id,
        url
      },
      alt
    },
    publishedAt,
    featured,
    tags[]-> {
      _id,
      label,
      value,
      color
    },
    authors,
    organizations[]->{
      _id,
      name
    },
    "relatedCommunity": relatedCommunity->name,
    "communitySlug": relatedCommunity->slug.current
  }`;

  const rows = await query<CaseStudyListItem[] | null>(groq, params);
  return rows ?? [];
}

// ---------------------------------------------------------------------------
// Filters wrapper (components/case-studies/case-studies-filters.tsx, fed by
// the list page's CaseStudiesFiltersWrapper) — moved from
// sanity/queries/case-study-queries.ts's fetchCaseStudyTags /
// fetchCaseStudyCommunities. Not one of the 11 named helpers; found while
// converting the list page. That source file is now orphaned and deleted.
// ---------------------------------------------------------------------------

export interface CaseStudyFilterTag {
  _id: string;
  label?: Localized;
  value?: string;
  color?: string;
  category?: string;
  caseStudyCount: number;
}

export interface CaseStudyFilterCommunity {
  _id: string;
  name?: Localized;
  slug: string;
  caseStudyCount: number;
}

export async function getCaseStudyFilterTags(): Promise<CaseStudyFilterTag[]> {
  if (onPayload()) return payloadCaseStudies.getCaseStudyFilterTags();
  return query<CaseStudyFilterTag[]>(`
      *[_type == "tag" && count(*[_type == "caseStudy" && references(^._id)]) > 0]
      | order(label.en asc) {
        _id,
        label,
        "value": value.current,
        color,
        category,
        "caseStudyCount": count(*[_type == "caseStudy" && references(^._id)])
      }
    `);
}

export async function getCaseStudyFilterCommunities(): Promise<CaseStudyFilterCommunity[]> {
  if (onPayload()) return payloadCaseStudies.getCaseStudyFilterCommunities();
  return query<CaseStudyFilterCommunity[]>(`
      *[_type == "regionalCommunity"]
      | order(order asc, name.en asc) {
        _id,
        name,
        "slug": slug.current,
        "caseStudyCount": count(*[_type == "caseStudy" && references(^._id)])
      }
    `);
}

// ---------------------------------------------------------------------------
// Submit form option lists (app/[locale]/(main)/research-and-action/case-studies/
// submit/page.tsx) — moved from that page's own inline fetchAvailableTags /
// fetchRegionalCommunities. Not one of the 11 named helpers; found while
// converting the submit page.
// ---------------------------------------------------------------------------

export interface CaseStudyTagOption {
  _id: string;
  label?: Localized;
  value?: string;
}

export interface CaseStudyCommunityOption {
  _id: string;
  name?: Localized | string;
  slug?: { current: string };
}

export async function getAvailableCaseStudyTags(): Promise<CaseStudyTagOption[]> {
  if (onPayload()) return payloadCaseStudies.getAvailableCaseStudyTags();
  return query<CaseStudyTagOption[]>(`
    *[_type == "tag"] | order(label.en asc) {
      _id,
      label,
      value
    }
  `);
}

export async function getActiveCaseStudyCommunities(): Promise<CaseStudyCommunityOption[]> {
  if (onPayload()) return payloadCaseStudies.getActiveCaseStudyCommunities();
  return query<CaseStudyCommunityOption[]>(`
    *[_type == "regionalCommunity" && active == true] | order(name.en asc) {
      _id,
      name,
      slug
    }
  `);
}

// ---------------------------------------------------------------------------
// Dashboard (app/[locale]/(main)/dashboard/submissions/page.tsx) — moved from
// sanity/lib/fetch.ts's fetchUserSubmissionsAndDrafts, one of the 11 named
// helpers and the only one of the eleven with a real caller. The original
// wrapped its query in a try/catch degrading to
// `{ submissions: [], drafts: [] }`, so this degrades via safe() too.
// ---------------------------------------------------------------------------

export interface CaseStudySubmissionSummary {
  _id: string;
  title?: Localized;
  excerpt?: Localized;
  topic?: string;
  status?: CaseStudyStatus;
  featured?: boolean;
  slug?: string;
  submittedAt?: string;
  publishedAt?: string;
  reviewNotes?: string;
  image?: string;
  authors?: Array<{ name?: string; role?: string }>;
  // `title` here mirrors the original GROQ verbatim, which dereferences the
  // tag as `{ _id, title, "value": value.current }` — tag documents don't
  // actually have a `title` field (that's `label` everywhere else in this
  // module), so this has always resolved to `undefined`. Preserved as-is.
  tags?: Array<{ _id: string; title?: unknown; value?: string }>;
}

export interface CaseStudyDraftSummary {
  _id: string;
  title?: Localized;
  excerpt?: Localized;
  topic?: string;
  lastSaved?: string;
  formMetadata?: { currentStep?: string; completedSections?: string[] };
}

export interface UserSubmissionsAndDrafts {
  submissions: CaseStudySubmissionSummary[];
  drafts: CaseStudyDraftSummary[];
}

const EMPTY_SUBMISSIONS_AND_DRAFTS: UserSubmissionsAndDrafts = { submissions: [], drafts: [] };

export async function getUserSubmissionsAndDrafts(userId: string): Promise<UserSubmissionsAndDrafts> {
  return safe("case-study-user-submissions", EMPTY_SUBMISSIONS_AND_DRAFTS, async () => {
    if (onPayload()) return payloadCaseStudies.getUserSubmissionsAndDrafts(userId);
    // fetchUserSubmissionsAndDrafts's original sanityFetch call omitted both
    // perspective/stega — same draft-preview requirement as getCaseStudyBySlug above
    // (the dashboard route's own "authenticated, no CDN" comment on the original
    // notwithstanding: the original never actually passed a raw/authenticated
    // perspective, just the omitted fields that route draftMode() decides).
    const data = await queryPreviewable<UserSubmissionsAndDrafts | null>(
      `{
        "submissions": *[_type == "caseStudy" && submittedBy == $userId] | order(submittedAt desc) {
          _id, title, excerpt, topic, status, featured,
          "slug": slug.current, submittedAt, publishedAt, reviewNotes,
          "image": image.asset->url,
          authors[]{ name, role },
          tags[]-> { _id, title, "value": value.current }
        },
        "drafts": *[_type == "caseStudyDraft" && userId == $userId] | order(lastSaved desc) {
          _id, title, excerpt, topic, lastSaved, formMetadata
        }
      }`,
      { userId },
    );
    return data ?? EMPTY_SUBMISSIONS_AND_DRAFTS;
  });
}

// ---------------------------------------------------------------------------
// Revisions route (app/api/case-studies/revisions/route.ts) — the whole
// route's Sanity call, moved. Not one of the 11 named helpers; found while
// converting that route. Throws (matching the original's un-degraded
// try/catch, which mapped any failure to an explicit 500 JSON response, not
// a silent empty-and-looks-fine state) — the route's own try/catch is
// unchanged, so it reproduces the same 500 on a thrown error.
//
// Uses queryRaw, not query: the original called writeClient.fetch() directly
// (uncached, tokened, raw perspective). A revision-status case study may
// exist only as a draft document, which the cached/published-perspective
// `query()` cannot see, and `query()`'s hour-long CDN cache would also show a
// member stale moderation feedback. Both regressions are gated — see
// lib/__tests__/content-case-studies.test.ts's "uses the raw/authenticated
// primitive" test, which pins this.
// ---------------------------------------------------------------------------

export interface CaseStudyRevision {
  _id: string;
  title?: Localized;
  status?: CaseStudyStatus;
  reviewNotes?: string;
  submittedAt?: string;
}

export async function getCaseStudyRevisions(userId: string): Promise<CaseStudyRevision[]> {
  if (onPayload()) return payloadCaseStudies.getCaseStudyRevisions(userId);
  return queryRaw<CaseStudyRevision[]>(
    `*[_type == "caseStudy" && submittedBy == $userId && status == "revision"]{
      _id,
      title,
      status,
      reviewNotes,
      submittedAt
    }`,
    { userId },
  );
}

// ---------------------------------------------------------------------------
// Edit flow (lib/case-studies/edit.ts) — X7 tail: load a case study the
// current user may edit, mapped to the submission form's field shape.
// May edit = the original submitter, OR a member of a workspace that lists
// the doc as an output. Only draft/pending/revision docs are editable.
// A read, not a write — but gated and drafts-visible, so it throws on
// failure like the write paths below rather than degrading via `safe()`.
// ---------------------------------------------------------------------------

interface RawEditableCaseStudyDoc {
  _id: string;
  title?: Localized;
  excerpt?: Localized;
  content?: RichText;
  topic?: string;
  layout?: string;
  submittedBy?: string;
  status?: string | null;
  reviewNotes?: string | null;
  studyPeriod?: { startDate?: string; endDate?: string };
  locationText?: { country?: string; city?: string };
  locationDisplayText?: string;
  relatedCommunity?: string;
  tags?: string[];
  organizationName?: string;
}

export async function loadEditableCaseStudy(
  sanityId: string,
  userId: string,
): Promise<(Record<string, unknown> & { _sanityId: string }) | null> {
  const id = sanityId.replace(/^drafts\./, "");
  // Raw perspective: drafts.* docs are invisible to the public read client,
  // and edit mode is exactly about reopening drafts. On Payload the same
  // requirement is `queryRaw`'s `draft: true` — there are no `drafts.`-prefixed
  // ids there, a draft is a version of the same id, so the id-juggling above
  // collapses into one lookup. The `status` returned by the Payload arm is
  // `moderationStatus`, verbatim: the "draft" literal in the allow-list below
  // is Sanity conflating a moderation state with a draft state, and nothing
  // synthesises it onto Payload's field.
  const doc = onPayload()
    ? await payloadCaseStudies.loadEditableCaseStudyDoc(id)
    : await queryRaw<RawEditableCaseStudyDoc | null>(
        `*[_type == "caseStudy" && (_id == $id || _id == "drafts." + $id)][0]{
      _id, title, excerpt, content, topic, layout, submittedBy, status, reviewNotes,
      studyPeriod, locationText, locationDisplayText,
      "relatedCommunity": relatedCommunity._ref,
      "tags": tags[]._ref,
      organizationName
    }`,
        { id },
      );
  if (!doc) return null;
  if (!["pending", "revision", "draft", null, undefined].includes(doc.status)) return null;

  let allowed = doc.submittedBy === userId;
  if (!allowed) {
    const membership = await safeQuery(() =>
      prisma.workspaceOutput.findFirst({
        where: {
          sanityId: { in: [id, `drafts.${id}`] },
          collaboration: { members: { some: { userId } } },
        },
        select: { id: true },
      }),
    );
    allowed = membership.success && !!membership.data;
  }
  if (!allowed) return null;

  return {
    _sanityId: doc._id,
    // Pipeline context for the edit UI — stripped before applyDraft.
    _review: { status: doc.status ?? "draft", reviewNotes: doc.reviewNotes ?? null },
    title: doc.title ?? { en: "", es: "", fr: "", ar: "" },
    excerpt: doc.excerpt ?? { en: "", es: "", fr: "", ar: "" },
    content: doc.content ?? [],
    topic: doc.topic ?? "",
    layout: doc.layout ?? "story",
    studyPeriod: doc.studyPeriod ?? { startDate: "", endDate: "" },
    locationText: doc.locationText ?? { country: "", city: "" },
    relatedCommunity: doc.relatedCommunity ?? "",
    organizationName: doc.organizationName ?? "",
    selectedTags: doc.tags ?? [],
  };
}

// ---------------------------------------------------------------------------
// Submission (app/api/case-studies/submit/route.ts) — a write path. Writes
// throw, not degrade: a submission that silently fails is worse than one
// that errors.
// ---------------------------------------------------------------------------

export interface CaseStudyInput {
  userId: string;
  title: Localized;
  excerpt?: Localized;
  /** Portable Text from the editor. */
  content: RichText;
  topic?: string;
  layout?: "story" | "feature" | "report";
  authors: Array<{ userId?: string; name: string; email?: string; role?: string }>;
  tags: string[];
  organizationName?: string;
  relatedCommunity?: string;
  studyPeriod?: { startDate?: string; endDate?: string };
  locationText?: { country?: string; city?: string };
  studyLocation?: { lat?: number; lng?: number };
  place?: {
    lat: number;
    lng: number;
    text: string;
    precision: "exact" | "city" | "country" | "region";
    countryCode3: string | null;
  };
  /** X7 edit mode: resubmit an existing draft/pending/revision doc. */
  editId?: string;
  /** Clerk data for the submitter, attached to authors[0] — Clerk is a route
   *  concern; the route reads currentUser() and passes these through. */
  clerkImageUrl?: string;
  clerkUsername?: string | null;
  image?: { buffer: Buffer; filename: string; contentType: string } | null;
  /** Internal notification bookkeeping (see updateCaseStudy / case-study-emails.ts)
   *  — never set by the submission form itself. */
  notifiedStatus?: string;
}

/**
 * Thrown when an edit-mode resubmission isn't allowed — the caller (the API
 * route) maps this to a 403 rather than a 500.
 */
export class CaseStudyEditNotAllowedError extends Error {
  constructor() {
    super("You can't edit this submission.");
    this.name = "CaseStudyEditNotAllowedError";
  }
}

interface RawExistingCaseStudy {
  _id: string;
  submittedBy?: string;
  status?: string | null;
  slug?: { current: string };
}

export async function submitCaseStudy(
  input: CaseStudyInput,
): Promise<{ id: string; slug: string; status: string }> {
  const slug = generateCaseStudySlug(input.title.en ?? "");

  let studyLocation: { _type: string; lat: number; lng: number } | null = null;
  if (input.studyLocation?.lat != null && input.studyLocation?.lng != null) {
    studyLocation = { _type: "geopoint", lat: input.studyLocation.lat, lng: input.studyLocation.lng };
  }

  const doc: { _type: string } & Record<string, unknown> = {
    _type: "caseStudy",
    title: input.title,
    slug: { current: slug },
    excerpt: input.excerpt,
    content: input.content,

    submittedBy: input.userId,
    submittedAt: new Date().toISOString(),

    authors: input.authors.map((author, index) => ({
      _key: uuidv4(),
      userId: author.userId || (index === 0 ? input.userId : undefined),
      name: author.name,
      email: author.email,
      role: author.role,
      ...(index === 0 && {
        clerkUserId: input.userId,
        clerkImageUrl: input.clerkImageUrl,
        clerkUsername: input.clerkUsername,
      }),
    })),

    // A1: Include topic from form
    topic: input.topic || "other",

    // Task E3: detail-page layout archetype chosen in the editor shell
    layout: input.layout ?? "story",

    tags: input.tags.map((tagId) => ({
      _type: "reference",
      _ref: tagId,
      _key: uuidv4(), // A2: Sanity arrays require _key
    })),

    studyPeriod: input.studyPeriod,
    locationText: input.locationText,
    studyLocation: studyLocation,

    // PlacePicker value (Task 4) — takes precedence over the legacy
    // city/country geocode pair above when the submitter used the
    // new picker.
    ...(input.place
      ? {
          studyLocation: { _type: "geopoint", lat: input.place.lat, lng: input.place.lng },
          locationDisplayText: input.place.text,
          locationPrecision: input.place.precision,
          locationCountryCode: input.place.countryCode3 ?? undefined,
        }
      : {}),

    // Default status for review workflow
    status: "pending",
    featured: false,
  };

  // Add regional community reference if provided
  if (input.relatedCommunity && input.relatedCommunity !== "") {
    doc.relatedCommunity = { _type: "reference", _ref: input.relatedCommunity };
  }

  // If organization name is provided, try to find or create it. The read is
  // `queryRaw` on both backends: a cached miss on a find-or-create makes a
  // duplicate organization, and the answer feeds a write.
  const organizationIds: string[] = [];
  if (input.organizationName) {
    const orgSlug = generateCaseStudySlug(input.organizationName);
    const existingOrg = onPayload()
      ? await payloadCaseStudies.findOrganizationByName(input.organizationName)
      : await queryRaw<{ _id: string } | null>(
          `*[_type == "organization" && name == $name][0]`,
          { name: input.organizationName },
        );

    if (existingOrg) {
      organizationIds.push(existingOrg._id);
      doc.organizations = [{ _type: "reference", _ref: existingOrg._id }];
    } else if (onPayload()) {
      const newOrg = await payloadCaseStudies.createOrganization({
        id: uuidv4(),
        name: input.organizationName,
        slug: orgSlug,
      });
      organizationIds.push(newOrg.id);
    } else {
      const newOrg = await createDocument({
        _type: "organization",
        name: input.organizationName,
        slug: { current: orgSlug },
        type: "other",
      });
      organizationIds.push(newOrg.id);
      doc.organizations = [{ _type: "reference", _ref: newOrg.id }];
    }
  }

  // Handle image upload if provided (size/type validated by the route). The
  // upload is the one primitive whose two implementations agree on a signature,
  // so only the asset store differs.
  let imageAssetId: string | undefined;
  const imageAlt = `Featured image for ${input.title.en}`;
  if (input.image) {
    const upload = onPayload() ? uploadPayloadFileAsset : uploadFileAsset;
    const asset = await upload(input.image.buffer, {
      filename: input.image.filename,
      contentType: input.image.contentType,
    });
    imageAssetId = asset.id;
    doc.image = {
      _type: "image",
      asset: { _type: "reference", _ref: asset.id },
      alt: imageAlt,
    };
  }

  // The field values, in neither store's vocabulary. Computed once so the two
  // backends cannot disagree about what a submission carries — the same split
  // Tasks 9 and 11 established. `status` appears nowhere in it: the Payload arm
  // sets `moderationStatus: "pending"` itself rather than being handed a field
  // name that would silently write a column Payload does not have.
  const draft: payloadCaseStudies.CaseStudyDraft = {
    title: input.title,
    excerpt: input.excerpt,
    content: input.content,
    topic: input.topic || "other",
    layout: input.layout ?? "story",
    tagIds: input.tags,
    relatedCommunity: input.relatedCommunity && input.relatedCommunity !== "" ? input.relatedCommunity : undefined,
    organizationIds: organizationIds.length > 0 ? organizationIds : undefined,
    studyPeriod: input.studyPeriod,
    locationText: input.locationText,
    studyLocation: input.place
      ? { lat: input.place.lat, lng: input.place.lng }
      : input.studyLocation?.lat != null && input.studyLocation?.lng != null
        ? { lat: input.studyLocation.lat, lng: input.studyLocation.lng }
        : undefined,
    locationDisplayText: input.place?.text,
    locationPrecision: input.place?.precision,
    locationCountryCode: input.place?.countryCode3 ?? undefined,
    imageAssetId,
    imageAlt: imageAssetId ? imageAlt : undefined,
    authors: input.authors.map((author, index) => ({
      userId: author.userId || (index === 0 ? input.userId : undefined),
      name: author.name,
      email: author.email,
      role: author.role,
      ...(index === 0
        ? {
            clerkUserId: input.userId,
            clerkImageUrl: input.clerkImageUrl,
            clerkUsername: input.clerkUsername,
          }
        : {}),
    })),
  };

  // X7 edit mode: resubmit an existing draft/pending doc — verify the
  // caller may edit it, then patch (status returns to pending for
  // re-review). Slug and submittedBy are preserved.
  if (input.editId) {
    // `queryRaw` on both backends: this read decides an authorization question
    // about the very document about to be written. `queryLive` returns the same
    // shape and is the wrong answer — that swap is how the Phase-1 bypass
    // happened.
    const existing = onPayload()
      ? await payloadCaseStudies.loadExistingCaseStudy(input.editId)
      : await queryRaw<RawExistingCaseStudy | null>(
          `*[_id == $id][0]{ _id, submittedBy, status, slug }`,
          { id: input.editId },
        );
    const editable = !!existing && ["pending", "revision", "draft", null].includes(existing.status ?? null);
    const isSubmitter = existing?.submittedBy === input.userId;
    let isWorkspaceMember = false;
    if (existing && !isSubmitter) {
      const row = await prisma.workspaceOutput.findFirst({
        where: {
          sanityId: { in: [existing._id, existing._id.replace(/^drafts\./, "")] },
          collaboration: { members: { some: { userId: input.userId } } },
        },
        select: { id: true },
      });
      isWorkspaceMember = !!row;
    }
    if (!existing || !editable || (!isSubmitter && !isWorkspaceMember)) {
      throw new CaseStudyEditNotAllowedError();
    }

    if (onPayload()) {
      // The write direction of the status mapping: `{...updatable, status:
      // "pending"}` below becomes `moderationStatus: "pending"`, set inside the
      // reader. Slug and submittedBy are preserved on this arm too — neither is
      // in the data the reader writes.
      await payloadCaseStudies.updateCaseStudySubmission(existing._id, draft);
      return { id: existing._id, slug: existing.slug?.current ?? slug, status: "pending" };
    }

    const { slug: _slug, submittedBy: _sb, ...updatable } = doc;
    void _slug;
    void _sb;
    // A plain set, matching the original's own `.set({...updatable, status:'pending'})` —
    // unlike lived-experiences' edit branch, this write never nulled out omitted
    // optional fields; keys not present in `updatable` are simply left untouched.
    await updateDocument(existing._id, { ...updatable, status: "pending" });
    return { id: existing._id, slug: existing.slug?.current ?? slug, status: "pending" };
  }

  if (onPayload()) {
    const created = await payloadCaseStudies.createCaseStudy(draft, {
      // Sanity mints its own `_id`; Payload's `id` is a text column carrying
      // Sanity's, so a new document needs one.
      id: uuidv4(),
      slug,
      submittedBy: input.userId,
      submittedAt: doc.submittedAt as string,
    });
    return { id: created.id, slug, status: "pending" };
  }

  const created = await createDocument(doc);
  return { id: created.id, slug, status: "pending" };
}

/**
 * Generic partial update for an existing case study — `null` in `patch`
 * unsets the field (the seam's own convention, see updateDocument). Used by
 * submitCaseStudy's edit-mode branch above, and by
 * lib/case-study-emails.ts's notifiedStatus bookkeeping patch.
 */
export async function updateCaseStudy(id: string, patch: Partial<CaseStudyInput>): Promise<void> {
  if (onPayload()) {
    // The write half of the status mapping again: a caller passing the public
    // `status` (lib/case-study-emails.ts's notifiedStatus bookkeeping does not,
    // but the signature allows it) gets it renamed to `moderationStatus` rather
    // than silently writing a column Payload does not have.
    await payloadCaseStudies.patchCaseStudy(id, patch as Record<string, unknown>);
    return;
  }
  await updateDocument(id, patch as Record<string, unknown>);
}

// ---------------------------------------------------------------------------
// Drafts (app/api/case-studies/drafts/route.ts) — GET/POST/DELETE. All three
// route handlers' Sanity calls, moved. Not one of the 11 named helpers;
// found while converting that route. Reads throw (the route's own try/catch
// already mapped a failure to an explicit error JSON, unchanged here); the
// two "not found" cases get a typed error so the route can keep returning
// 404 instead of 500.
// ---------------------------------------------------------------------------

export class CaseStudyDraftNotFoundError extends Error {
  constructor() {
    super("Draft not found");
    this.name = "CaseStudyDraftNotFoundError";
  }
}

export async function getLatestCaseStudyDraft(userId: string): Promise<Record<string, unknown> | null> {
  if (onPayload()) return payloadCaseStudies.getLatestCaseStudyDraft(userId);
  const draft = await queryRaw<Record<string, unknown> | null>(
    `*[_type == "caseStudyDraft" && userId == $userId] | order(lastSaved desc)[0]`,
    { userId },
  );
  return draft ?? null;
}

export async function saveCaseStudyDraft(
  userId: string,
  draftId: string | undefined,
  draftData: Record<string, unknown>,
): Promise<{ id: string }> {
  const lastSaved = new Date().toISOString();
  const data = {
    ...draftData,
    _type: "caseStudyDraft",
    userId,
    lastSaved,
  };

  if (draftId) {
    // Verify ownership before updating. `queryRaw` on both backends: the answer
    // authorizes a write, and a cached read must never be what decides it.
    const existing = onPayload()
      ? await payloadCaseStudies.findOwnedDraftId(userId, draftId)
      : await queryRaw<string | null>(
          `*[_type == "caseStudyDraft" && _id == $draftId && userId == $userId][0]._id`,
          { draftId, userId },
        );
    if (!existing) throw new CaseStudyDraftNotFoundError();
    if (onPayload()) {
      await payloadCaseStudies.updateCaseStudyDraft(draftId, draftData, lastSaved);
      return { id: draftId };
    }
    await updateDocument(draftId, data);
    return { id: draftId };
  }

  if (onPayload()) {
    // Sanity mints its own `_id`; Payload's `id` is a text column carrying
    // Sanity's, so a new document needs one.
    return payloadCaseStudies.createCaseStudyDraft(userId, uuidv4(), draftData, lastSaved);
  }
  const created = await createDocument(data);
  return { id: created.id };
}

export async function deleteCaseStudyDraft(userId: string, draftId: string): Promise<void> {
  // Verify ownership before deleting — `queryRaw` on both backends, same reason.
  const existing = onPayload()
    ? await payloadCaseStudies.findOwnedDraftId(userId, draftId)
    : await queryRaw<string | null>(
        `*[_type == "caseStudyDraft" && _id == $draftId && userId == $userId][0]._id`,
        { draftId, userId },
      );
  if (!existing) throw new CaseStudyDraftNotFoundError();
  if (onPayload()) {
    await payloadCaseStudies.deleteCaseStudyDraft(draftId);
    return;
  }
  await deleteDocument(draftId);
}

// ---------------------------------------------------------------------------
// Search index (consumed by Task 10's getSearchIndexRecords dispatcher — no
// call site exists yet). Degrades to an empty list on failure: a search-index
// sync job should skip one content kind on error, not fail the whole run.
// ---------------------------------------------------------------------------

interface RawSearchRecordDoc {
  _id: string;
  language?: string;
  title?: Localized | string;
  excerpt?: Localized | string;
  slug: string;
}

const SEARCH_RECORDS_QUERY = `
  *[_type == "caseStudy" && status == "approved" && defined(slug.current)]{
    _id,
    language,
    title,
    excerpt,
    "slug": slug.current
  }
`;

export async function getCaseStudySearchRecords(): Promise<SearchRecord[]> {
  return safe("case-study-search-records", [], async () => {
    const docs = onPayload()
      ? await payloadCaseStudies.getCaseStudySearchRecordDocs()
      : await query<RawSearchRecordDoc[] | null>(SEARCH_RECORDS_QUERY);
    return (docs ?? []).map((d) => {
      const locale = (["en", "es", "fr", "ar"].includes(d.language ?? "") ? d.language : "en") as Locale;
      return {
        objectID: d._id,
        kind: "caseStudy" as const,
        title: localize(d.title, locale),
        excerpt: d.excerpt ? localize(d.excerpt, locale) : undefined,
        url: `/${locale}/research-and-action/case-studies/${d.slug}`,
        locale,
      };
    });
  });
}

// ---------------------------------------------------------------------------
// Algolia search-index sync (app/api/search/case-studies/sync/route.ts,
// app/api/search/case-studies/webhook/route.ts) — a raw index-shaped doc
// distinct from CaseStudy above: the Algolia transform needs
// region/themes/populations/studyLocation/studyPeriod, which the page-facing
// projection doesn't select. The three original queries (full sync,
// partial-by-ids sync, single-by-id webhook) selected an IDENTICAL field
// list, just re-indented by copy-paste at each of the three call sites (see
// news.ts's NewsIndexDoc for the same pattern); consolidated into one
// fragment here (content character-identical, whitespace normalized). Both
// routes already wrap their whole handler body in try/catch, so these keep
// throwing (no safe()) — the route's existing catch is the original failure
// behaviour.
// ---------------------------------------------------------------------------

export interface CaseStudyIndexDoc {
  _id: string;
  title?: { en: string; es?: string; fr?: string; ar?: string };
  slug?: { current?: string };
  excerpt?: { en: string; es?: string; fr?: string; ar?: string };
  status?: "approved" | "pending" | "rejected";
  featured?: boolean;
  publishedAt?: string;
  _updatedAt?: string;
  region?: string;
  themes?: string[];
  populations?: string[];
  authors?: Array<{ name?: string; role?: string; affiliation?: { name?: string } }>;
  tags?: Array<{ name?: string }>;
  studyLocation?: { lat: number; lng: number };
  studyPeriod?: { startDate: string; endDate: string };
  organizations?: Array<{ name?: string }>;
  image?: { asset?: { url?: string } };
}

const CASE_STUDY_INDEX_FIELDS = `
  _id,
  title,
  slug,
  excerpt,
  status,
  featured,
  publishedAt,
  _updatedAt,
  region,
  themes,
  populations,
  authors[] {
    name,
    role,
    affiliation->{name}
  },
  tags[]->{name},
  studyLocation,
  studyPeriod,
  organizations[]->{name},
  image {
    asset->{url}
  }
`;

export async function getApprovedCaseStudyIndexDocs(): Promise<CaseStudyIndexDoc[]> {
  if (onPayload()) return payloadCaseStudies.getApprovedCaseStudyIndexDocs();
  const rows = await query<CaseStudyIndexDoc[] | null>(
    `*[_type == "caseStudy" && status == "approved"] {
      ${CASE_STUDY_INDEX_FIELDS}
    }`,
  );
  return rows ?? [];
}

export async function getCaseStudyIndexDocsByIds(ids: string[]): Promise<CaseStudyIndexDoc[]> {
  if (onPayload()) return payloadCaseStudies.getCaseStudyIndexDocsByIds(ids);
  const rows = await query<CaseStudyIndexDoc[] | null>(
    `*[_type == "caseStudy" && _id in $ids] {
      ${CASE_STUDY_INDEX_FIELDS}
    }`,
    { ids },
  );
  return rows ?? [];
}

export async function getCaseStudyIndexDocById(id: string): Promise<CaseStudyIndexDoc | null> {
  if (onPayload()) return payloadCaseStudies.getCaseStudyIndexDocById(id);
  return query<CaseStudyIndexDoc | null>(
    `*[_type == "caseStudy" && _id == $id][0] {
      ${CASE_STUDY_INDEX_FIELDS}
    }`,
    { id },
  );
}

export async function getApprovedCaseStudyCount(): Promise<number> {
  if (onPayload()) return payloadCaseStudies.getApprovedCaseStudyCount();
  return query<number>(`count(*[_type == "caseStudy" && status == "approved"])`);
}

// ---------------------------------------------------------------------------
// Community contribution rows (lib/community/region-data.ts) — call sites
// found while auditing lib/community for Task 8's mandated
// app/[locale]/onboarding + app/api/onboarding + app/api/profile +
// lib/utils/sanity-prisma-sync.ts + lib/actions/sync-user-management.ts +
// lib/community grep. Not onboarding/taxonomy content itself, but genuinely
// unclaimed by any task-*.md brief (grepped every one) and case-study-domain
// reads (`_type == "caseStudy"`), so they live here rather than in
// onboarding.ts/taxonomy.ts. lib/community/region-data.ts may not import
// Sanity directly (Task 11's boundary test covers all of `lib`), so these
// small, purpose-built projections are exposed here for it to call.
//
// Both originals called `client.fetch` directly, each with their own
// try/catch swallowing to a fixed empty fallback → query() + safe().
// ---------------------------------------------------------------------------

/** Approved case-study counts keyed by submitter Clerk id, for a set of users. */
export async function getApprovedCaseStudyCountsBySubmitter(userIds: string[]): Promise<Record<string, number>> {
  if (userIds.length === 0) return {};
  return safe("case-study-counts-by-submitter", {}, async () => {
    if (onPayload()) return payloadCaseStudies.getApprovedCaseStudyCountsBySubmitter(userIds);
    const rows = await query<{ uid: string }[]>(
      `*[_type == "caseStudy" && status == "approved" && submittedBy in $ids]{ "uid": submittedBy }`,
      { ids: userIds },
    );
    const counts: Record<string, number> = {};
    for (const r of rows) if (r.uid) counts[r.uid] = (counts[r.uid] ?? 0) + 1;
    return counts;
  });
}

export interface CaseStudyContributionRow {
  _id: string;
  title?: Localized | string;
  slug?: { current: string };
  publishedAt?: string | null;
}

/**
 * A user's approved case studies (submitted by them, or where they're a
 * listed author), newest first, capped at 50 — feeds the public
 * Contributions block on region/profile pages.
 */
export async function getApprovedCaseStudiesByContributor(userId: string): Promise<CaseStudyContributionRow[]> {
  return safe("case-studies-by-contributor", [], async () => {
    if (onPayload()) {
      return payloadCaseStudies.getApprovedCaseStudiesByContributor(userId) as Promise<
        CaseStudyContributionRow[]
      >;
    }
    const rows = await query<CaseStudyContributionRow[]>(
      `*[_type == "caseStudy" && status == "approved" && (submittedBy == $uid || $uid in authors[].userId)]
        | order(publishedAt desc)[0...50]{ _id, title, slug, publishedAt }`,
      { uid: userId },
    );
    return rows ?? [];
  });
}
