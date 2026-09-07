import "server-only";
import * as payloadFeeds from "@/lib/content/internal/payload/page-feeds";
import { query, queryPreviewable } from "@/lib/content/internal/sanity-source";
import type { Localized } from "@/lib/content/types";
import { onPayload } from "./shared";

// ---------------------------------------------------------------------------
// Task 6b — the five page-domain query files Task 6 could not reach: five
// `sanity/queries/*.ts` files importing Sanity directly from
// app/[locale]/(main)/communities/[slug]/page.tsx, components/pages/homepage.tsx
// and components/templates/regional-community-template.tsx, unclaimed by any
// of the 13 task briefs. See the report for the full gap history.
//
// Scoping decision, stated up front: each of the three source files below
// (regional-community-team.ts, regional-community-case-studies.ts,
// regional-community-lived-experiences.ts, regional-community-news.ts) also
// exports a second query variant with ZERO call sites anywhere in the repo —
// `fetchTeamMembersByIds` (by author id list) and the non-"BySlug"
// `fetchRegionalCommunityCaseStudies` / `fetchRegionalCommunityLivedExperiences`
// / `fetchRegionalCommunityNews` (by regional-community id, not slug). Unlike
// Tasks 3-5's brief-named-but-dead helpers (getApprovedCaseStudies,
// getNewsPosts, …), this task's own brief does not sketch signatures for
// these — its Produces list only names "the regional community's team, its
// case studies, its lived experiences, its news" in prose. Verified dead by
// grep (only self-definitions and sanity/lib/fetch.ts's own dead re-export
// barrel reference them — see below); declined rather than ported, to keep
// this addition to the functions something in the app actually calls. Their
// GROQ dies with the query files that held them.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Regional-community team members, dynamic mode
// (app/[locale]/(main)/communities/[slug]/page.tsx AND
// components/blocks/grid/team-grid.tsx — the brief names only the former;
// team-grid.tsx is a second genuine call site this task found the same way
// Task 6's reviewer found this task's five files, by grepping for
// `@/sanity/queries/regional-community-team` rather than trusting the brief's
// file list. Both call fetchRegionalCommunityTeamMembers with an identical
// `{ communityId, limit }` shape, so one converted function serves both.
// Leaving team-grid.tsx unconverted would have kept regional-community-team.ts
// non-orphaned and undeletable.
//
// GROQ moved character-exact from sanity/queries/regional-community-team.ts's
// REGIONAL_COMMUNITY_TEAM_QUERY (the `groq` tag is the identity function
// next-sanity re-exports for editor tooling only — same as every other
// character-exact move already in this file).
// ---------------------------------------------------------------------------

export interface RegionalCommunityTeamMember {
  _id: string;
  /** Required in the `author` schema (`Rule.required()`), matching
   *  team-grid.tsx's own local `TeamMember.name`. */
  name: string;
  slug?: { current: string };
  image?: {
    asset?: {
      _id: string;
      url: string;
      metadata?: { lqip?: string; dimensions?: { width: number; height: number } };
    };
    hotspot?: unknown;
    crop?: unknown;
    alt?: string;
  };
  organizationalAffiliation?: string;
  communityMemberships?: Array<{
    community: { _id: string; name?: { [key: string]: string } };
    role?: string;
  }>;
}

export const REGIONAL_COMMUNITY_TEAM_QUERY = `
  *[_type == "author" && $communityId in communityMemberships[].community._ref] | order(name asc) [0...$limit] {
    _id,
    name,
    slug,
    image {
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
      hotspot,
      crop,
      alt
    },
    organizationalAffiliation,
    communityMemberships[] {
      community->{
        _id,
        name
      },
      role
    }
  }
`;

/**
 * fetchRegionalCommunityTeamMembers's original sanityFetch call omitted both
 * perspective/stega — same draft-preview requirement as getPageBySlug
 * (./page.ts),
 * so this maps to `queryPreviewable`, not `query`.
 *
 * No `safe()` wrapper: the original had no try/catch of its own (`return
 * data;`, no `|| []` fallback either — an array query like this always
 * resolves to `[]` rather than `null`, so none was needed). The two call
 * sites disagree on failure behaviour and this preserves BOTH by not
 * deciding for them: communities/[slug]/page.tsx calls this with no
 * try/catch (a failure still 500s the page, unchanged), while
 * team-grid.tsx keeps its own local try/catch degrading to `[]` around its
 * call — same pattern already established for trackAgendaDownload/
 * trackReportDownload in lib/content/outputs.ts.
 */
export async function getRegionalCommunityTeamMembers(params: {
  communityId: string;
  limit?: number;
}): Promise<RegionalCommunityTeamMember[]> {
  const { communityId, limit = 20 } = params;
  // Task 14d.
  if (onPayload()) {
    return (await payloadFeeds.regionalCommunityTeamMembers({ communityId, limit })) as unknown as RegionalCommunityTeamMember[];
  }
  return queryPreviewable<RegionalCommunityTeamMember[]>(REGIONAL_COMMUNITY_TEAM_QUERY, {
    communityId,
    limit,
  });
}

// ---------------------------------------------------------------------------
// Regional-community dynamic grids, by slug
// (components/templates/regional-community-template.tsx) — Task 5 already
// routed this component's agenda query through lib/content/outputs.ts
// (getAgendasByRegion); these three cover the remaining case-studies/
// lived-experiences/news grids it fetches directly, each called twice
// (the featured-mode fetch, and the empty-featured-results fallback to
// recent). GROQ moved character-exact from sanity/queries/
// regional-community-case-studies.ts, -lived-experiences.ts, -news.ts's
// own "BySlug" query constants.
//
// All three original fetchers passed perspective: "published", stega: false
// explicitly, so all three map to `query`, not `queryPreviewable`. None had
// a try/catch of its own; regional-community-template.tsx's call sites don't
// wrap them either (an unhandled rejection here still fails the same way it
// did before), so none of these three degrade via `safe()`.
//
// Return shape: kept as a loosely-typed, indexable record (not reshaped into
// a flat normalized type) for the same reason lib/content/outputs.ts declined
// toTag/toRegion for `Agenda` — mergePinnedWithDynamic (lib/community/
// grid-items.ts) is generic over `WithId = { _id?; _key?; [k: string]:
// unknown }`, mixing these dynamic results with editor-authored manualItems
// (raw Sanity block data) in the same array, and the template hands each
// item straight into a synthesized grid-* block (`caseStudy: caseStudy`,
// `newsPost/externalSource: news`) that the block renderer reads in this
// exact raw `_id`-keyed shape.
// ---------------------------------------------------------------------------

export interface RegionalCommunityCaseStudyItem {
  [key: string]: unknown;
  _id: string;
  _type?: string;
  title?: Localized;
  subtitle?: Localized;
  excerpt?: Localized;
  slug?: { current: string };
  status?: string;
  publishedAt?: string;
  featured?: boolean;
  image?: {
    asset?: {
      _id: string;
      url: string;
      mimeType?: string;
      metadata?: { lqip?: string; dimensions?: { width: number; height: number } };
    };
    hotspot?: unknown;
    crop?: unknown;
    alt?: string;
  } | null;
  studyPeriod?: unknown;
  primaryLocation?: unknown;
  methodology?: unknown;
  participants?: unknown;
  findings?: unknown;
  recommendations?: unknown;
  authors?: Array<{
    name?: string;
    role?: string;
    organization?: { name?: string; slug?: { current: string } } | null;
  }>;
  organizations?: Array<{
    _id: string;
    name?: string;
    slug?: { current: string };
    logo?: { asset?: { _id: string; url: string } } | null;
  }>;
  tags?: Array<{ _id: string; label?: Localized; value?: string; color?: string; category?: string }>;
  relatedCommunities?: Array<{ _id: string; name?: Localized; slug?: { current: string } }>;
  downloads?: number;
  views?: number;
}

export const REGIONAL_COMMUNITY_CASE_STUDIES_BY_SLUG_QUERY = `
  *[_type == "caseStudy" &&
    references(*[_type == "regionalCommunity" && slug.current == $slug][0]._id) &&
    (!$featured || featured == true) &&
    status == "approved"
  ] | order(featured desc, publishedAt desc) [0...$limit] {
    _id,
    _type,
    title,
    subtitle,
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
      hotspot,
      crop,
      alt
    },
    studyPeriod,
    primaryLocation,
    methodology,
    participants,
    findings,
    recommendations,
    authors[]{
      name,
      role,
      organization->{
        name,
        slug
      }
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
    }[_id != null],
    tags[]->{
      _id,
      label,
      value,
      color,
      category
    }[_id != null],
    relatedCommunities[]->{
      _id,
      name,
      slug
    }[_id != null],
    downloads,
    views
  }
`;

export async function getRegionalCommunityCaseStudiesBySlug(params: {
  slug: string;
  limit?: number;
  featured?: boolean;
}): Promise<RegionalCommunityCaseStudyItem[]> {
  const { slug, limit = 6, featured = false } = params;
  // Task 14d.
  if (onPayload()) {
    return (await payloadFeeds.regionalCommunityCaseStudies({ slug, limit, featured })) as unknown as RegionalCommunityCaseStudyItem[];
  }
  return query<RegionalCommunityCaseStudyItem[]>(REGIONAL_COMMUNITY_CASE_STUDIES_BY_SLUG_QUERY, {
    slug,
    limit,
    featured,
  });
}

export interface RegionalCommunityLivedExperienceItem {
  [key: string]: unknown;
  _id: string;
  _type?: string;
  title?: Localized;
  description?: Localized;
  issue?: Localized;
  personContext?: Localized;
  videoLink?: string;
  thumbnail?: {
    asset?: {
      _id: string;
      url: string;
      mimeType?: string;
      metadata?: { lqip?: string; dimensions?: { width: number; height: number } };
    };
    alt?: string;
  } | null;
  duration?: string;
  publishedAt?: string;
  featured?: boolean;
  author?: { _id: string; name?: string; image?: unknown; organizationalAffiliation?: string } | null;
  relatedCommunity?: { _id: string; name?: Localized; slug?: { current: string } } | null;
  tags?: Array<{ _id: string; label?: Localized; value?: string; color?: string; category?: string }>;
  language?: string;
  transcription?: unknown;
  subtitles?: unknown;
  views?: number;
  slug?: { current: string };
}

export const REGIONAL_COMMUNITY_LIVED_EXPERIENCES_BY_SLUG_QUERY = `
  *[_type == "livedExperience" &&
    (status == "approved" || !defined(status)) &&
    references(*[_type == "regionalCommunity" && slug.current == $slug][0]._id) &&
    (!$featured || featured == true) &&
    publishedAt <= now()
  ] | order(featured desc, publishedAt desc) [0...$limit] {
    _id,
    _type,
    title,
    description,
    issue,
    personContext,
    videoLink,
    thumbnail{
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
      alt
    },
    duration,
    publishedAt,
    featured,
    author->{
      _id,
      name,
      image,
      organizationalAffiliation
    },
    relatedCommunity->{
      _id,
      name,
      slug
    },
    tags[]->{
      _id,
      label,
      value,
      color,
      category
    }[_id != null],
    language,
    transcription,
    subtitles,
    views,
    slug
  }
`;

export async function getRegionalCommunityLivedExperiencesBySlug(params: {
  slug: string;
  limit?: number;
  featured?: boolean;
}): Promise<RegionalCommunityLivedExperienceItem[]> {
  const { slug, limit = 10, featured = false } = params;
  // Task 14d.
  if (onPayload()) {
    return (await payloadFeeds.regionalCommunityLivedExperiences({ slug, limit, featured })) as unknown as RegionalCommunityLivedExperienceItem[];
  }
  return query<RegionalCommunityLivedExperienceItem[]>(REGIONAL_COMMUNITY_LIVED_EXPERIENCES_BY_SLUG_QUERY, {
    slug,
    limit,
    featured,
  });
}

export interface RegionalCommunityNewsItem {
  [key: string]: unknown;
  _id: string;
  _type?: string;
  title?: Localized;
  subtitle?: Localized;
  excerpt?: Localized;
  slug?: { current: string };
  publishedAt?: string;
  featured?: boolean;
  image?: {
    asset?: {
      _id: string;
      url: string;
      mimeType?: string;
      metadata?: { lqip?: string; dimensions?: { width: number; height: number } };
    };
    hotspot?: unknown;
    crop?: unknown;
    alt?: string;
  } | null;
  author?: { _id: string; name?: string; image?: unknown; organizationalAffiliation?: string } | null;
  organizations?: Array<{
    _id: string;
    name?: string;
    slug?: { current: string };
    logo?: { asset?: { _id: string; url: string } } | null;
  }>;
  locationDetails?: { city?: string; country?: string; region?: string; coordinates?: unknown };
  tags?: Array<{ _id: string; label?: Localized; value?: string; color?: string; category?: string }>;
  relatedCommunities?: Array<{ _id: string; name?: Localized; slug?: { current: string } }>;
  language?: string;
  priority?: number;
  views?: number;
  /** externalSource-only fields — present when `_type === "externalSource"`. */
  sourceUrl?: string;
  publisher?: string;
  sourceType?: string;
}

// Combines newsPost and externalSource, unlike REGIONAL_COMMUNITY_NEWS_QUERY
// (the by-id sibling this task declined — see the scoping note above), which
// selects newsPost only. Moved character-exact including that asymmetry.
export const REGIONAL_COMMUNITY_NEWS_BY_SLUG_QUERY = `
  *[
    (_type == "newsPost" || _type == "externalSource") &&
    references(*[_type == "regionalCommunity" && slug.current == $slug][0]._id) &&
    (!$featured || featured == true) &&
    (
      (_type == "newsPost" && publishedAt <= now()) ||
      (_type == "externalSource" && approved == true)
    )
  ] | order(featured desc, publishedAt desc) [0...$limit] {
    _id,
    _type,
    title,
    subtitle,
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
      hotspot,
      crop,
      alt
    },
    author->{
      _id,
      name,
      image,
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
    }[_id != null],
    locationDetails{
      city,
      country,
      region,
      coordinates
    },
    tags[]->{
      _id,
      label,
      value,
      color,
      category
    }[_id != null],
    relatedCommunities[]->{
      _id,
      name,
      slug
    }[_id != null],
    language,
    priority,
    views,
    // External source specific fields
    sourceUrl,
    publisher,
    sourceType
  }
`;

export async function getRegionalCommunityNewsBySlug(params: {
  slug: string;
  limit?: number;
  featured?: boolean;
}): Promise<RegionalCommunityNewsItem[]> {
  const { slug, limit = 6, featured = false } = params;
  // Task 14d.
  if (onPayload()) {
    return (await payloadFeeds.regionalCommunityNews({ slug, limit, featured })) as unknown as RegionalCommunityNewsItem[];
  }
  return query<RegionalCommunityNewsItem[]>(REGIONAL_COMMUNITY_NEWS_BY_SLUG_QUERY, {
    slug,
    limit,
    featured,
  });
}

// ---------------------------------------------------------------------------
// Homepage dynamic sections (components/pages/homepage.tsx's
// resolveNewsSection/resolveAgendasSection) — the homepage's News and
// Agendas grid sections replace their manually-picked columns with freshly
// fetched items when the CMS section's `mode` is "dynamic-recent" or
// "dynamic-featured". THE getHomepage RULING APPLIES: this converts data
// fetching only. homepage.tsx still branches on its 11 fixed named slots and
// its own `blocks[]` freeform path exactly as before — no blocksFromFields,
// no reshaping.
//
// GROQ moved character-exact from sanity/queries/homepage-dynamic.ts. Both
// original fetchers passed perspective: "published", stega: false explicitly,
// so both map to `query`, not `queryPreviewable`. Neither had a try/catch of
// its own; homepage.tsx's own resolveNewsSection/resolveAgendasSection each
// wrap their whole body (including this call) in a local try/catch that logs
// and falls back to the section's original manual columns — that pre-existing
// call-site behaviour is preserved unchanged by NOT wrapping these two in
// `safe()` as well (a double degrade would just be redundant, not wrong, but
// the original had exactly one layer of catch and this keeps it at one).
// ---------------------------------------------------------------------------

export interface HomepageDynamicNewsItem {
  [key: string]: unknown;
  _id: string;
  _type?: string;
  title?: Localized;
  subtitle?: Localized;
  excerpt?: Localized;
  slug?: { current: string };
  publishedAt?: string;
  featured?: boolean;
  image?: {
    asset?: {
      _id: string;
      url: string;
      mimeType?: string;
      metadata?: { lqip?: string; dimensions?: { width: number; height: number } };
    };
    hotspot?: unknown;
    crop?: unknown;
    alt?: string;
  } | null;
  author?: { _id: string; name?: string; image?: unknown; organizationalAffiliation?: string } | null;
  organizations?: Array<{
    _id: string;
    name?: string;
    slug?: { current: string };
    logo?: { asset?: { _id: string; url: string } } | null;
  }>;
  locationDetails?: { city?: string; country?: string; region?: string; coordinates?: unknown };
  tags?: Array<{ _id: string; label?: Localized; value?: string; color?: string; category?: string }>;
  relatedCommunities?: Array<{ _id: string; name?: Localized; slug?: { current: string } }>;
  language?: string;
  priority?: number;
  views?: number;
  sourceUrl?: string;
  publisher?: string;
  sourceType?: string;
}

// Shared projection for global news items (newsPost + externalSource). Kept
// as its own constant, spliced into the two queries below by string
// interpolation, exactly as sanity/queries/homepage-dynamic.ts composed it —
// character-exact down to the interpolation boundary.
export const HOMEPAGE_NEWS_PROJECTION = `{
  _id,
  _type,
  title,
  subtitle,
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
    hotspot,
    crop,
    alt
  },
  author->{
    _id,
    name,
    image,
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
  }[_id != null],
  locationDetails{
    city,
    country,
    region,
    coordinates
  },
  tags[]->{
    _id,
    label,
    value,
    color,
    category
  }[_id != null],
  relatedCommunities[]->{
    _id,
    name,
    slug
  }[_id != null],
  language,
  priority,
  views,
  // External source specific fields
  sourceUrl,
  publisher,
  sourceType
}`;

export const HOMEPAGE_RECENT_NEWS_QUERY = `
  *[
    (_type == "newsPost" || _type == "externalSource") &&
    (
      (_type == "newsPost" && publishedAt <= now()) ||
      (_type == "externalSource" && approved == true)
    )
  ] | order(publishedAt desc) [0...$limit] ${HOMEPAGE_NEWS_PROJECTION}
`;

export const HOMEPAGE_FEATURED_NEWS_QUERY = `
  *[
    (_type == "newsPost" || _type == "externalSource") &&
    featured == true &&
    (
      (_type == "newsPost" && publishedAt <= now()) ||
      (_type == "externalSource" && approved == true)
    )
  ] | order(publishedAt desc) [0...$limit] ${HOMEPAGE_NEWS_PROJECTION}
`;

export async function getHomepageNews(params: {
  limit?: number;
  featured?: boolean;
}): Promise<HomepageDynamicNewsItem[]> {
  const { limit = 3, featured = false } = params;
  // Task 14d. The homepage's News module really does call this on every render:
  // `mode` is null on all four documents, so `resolveNewsSection` reads it as
  // "dynamic-recent" and replaces the section's hand-picked columns.
  if (onPayload()) {
    return (await payloadFeeds.homepageNews({ limit, featured })) as unknown as HomepageDynamicNewsItem[];
  }
  return query<HomepageDynamicNewsItem[]>(
    featured ? HOMEPAGE_FEATURED_NEWS_QUERY : HOMEPAGE_RECENT_NEWS_QUERY,
    { limit },
  );
}

export interface HomepageDynamicAgendaItem {
  [key: string]: unknown;
  _id: string;
  _type?: string;
  title?: Localized;
  subtitle?: Localized;
  description?: Localized;
  slug?: { current: string };
  agendaType?: string;
  year?: number;
  publishDate?: string;
  totalDownloadCount?: number;
  featured?: boolean;
  accessLevel?: string;
  coverImage?: {
    asset?: {
      _id: string;
      url: string;
      mimeType?: string;
      metadata?: { lqip?: string; dimensions?: { width: number; height: number } };
    };
    hotspot?: unknown;
    crop?: unknown;
    alt?: string;
  } | null;
  files?: Array<{
    language?: string;
    file?: { asset?: { _id: string; url: string; originalFilename?: string; size?: number; mimeType?: string } };
    downloadCount?: number;
    lastDownloaded?: string;
  }>;
  tags?: Array<{ _id: string; label?: Localized; value?: string; color?: string; category?: string }>;
  organizations?: Array<{
    _id: string;
    name?: string;
    slug?: { current: string };
    acronym?: string;
    logo?: { asset?: { _id: string; url: string } | null; alt?: string } | null;
  }>;
  regionalCommunities?: Array<{ _id: string; name?: Localized; slug?: { current: string }; code?: string }>;
}

// Shared projection for global agendas, matching the shape grid-agenda column
// items expect (the same fields as getAgendasByRegion in lib/content/outputs.ts,
// plus `_type`) — kept as its own copy rather than a shared fragment, same as
// the original's own duplication.
export const HOMEPAGE_AGENDA_PROJECTION = `{
  _id,
  _type,
  title,
  subtitle,
  description,
  slug,
  agendaType,
  year,
  publishDate,
  totalDownloadCount,
  featured,
  accessLevel,
  coverImage{
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
    alt
  },
  files[]{
    language,
    file{
      asset->{
        _id,
        url,
        originalFilename,
        size,
        mimeType
      }
    },
    downloadCount,
    lastDownloaded
  },
  tags[]->{
    _id,
    label,
    value,
    color,
    category
  }[_id != null],
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
  }[_id != null],
  regionalCommunities[]->{
    _id,
    name,
    slug,
    code
  }[_id != null]
}`;

export const HOMEPAGE_RECENT_AGENDAS_QUERY = `
  *[_type == "agenda"] | order(publishDate desc) [0...$limit] ${HOMEPAGE_AGENDA_PROJECTION}
`;

export const HOMEPAGE_FEATURED_AGENDAS_QUERY = `
  *[_type == "agenda" && featured == true] | order(publishDate desc) [0...$limit] ${HOMEPAGE_AGENDA_PROJECTION}
`;

export async function getHomepageAgendas(params: {
  limit?: number;
  featured?: boolean;
}): Promise<HomepageDynamicAgendaItem[]> {
  const { limit = 3, featured = false } = params;
  // Task 14d. Same as the News module above.
  if (onPayload()) {
    return (await payloadFeeds.homepageAgendas({ limit, featured })) as unknown as HomepageDynamicAgendaItem[];
  }
  return query<HomepageDynamicAgendaItem[]>(
    featured ? HOMEPAGE_FEATURED_AGENDAS_QUERY : HOMEPAGE_RECENT_AGENDAS_QUERY,
    { limit },
  );
}
