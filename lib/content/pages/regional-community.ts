import "server-only";
import { safe } from "@/lib/content/internal/safe";
import { query, queryPreviewable } from "@/lib/content/internal/sanity-source";
import type { Locale } from "@/lib/content/types";
import {
  CAROUSEL_1_PROJECTION,
  CAROUSEL_2_PROJECTION,
  LIVED_EXPERIENCES_CAROUSEL_PROJECTION,
} from "./fragments/carousel";
import { CTA_1_PROJECTION } from "./fragments/cta";
import { GRID_ROW_PROJECTION } from "./fragments/grid";
import { HERO_1_PROJECTION, HERO_2_PROJECTION } from "./fragments/hero";
import {
  DYNAMIC_CONTENT_INSERT_PROJECTION,
  MANUAL_CONTENT_INSERT_PROJECTION,
  SEPARATOR_BLOCK_PROJECTION,
} from "./fragments/inserts";
import { SPLIT_ROW_PROJECTION } from "./fragments/split";
import {
  ALL_POSTS_PROJECTION,
  FAQS_PROJECTION,
  FORM_NEWSLETTER_PROJECTION,
  LOGO_CLOUD_1_PROJECTION,
  REGION_MAP_PROJECTION,
  SECTION_HEADER_PROJECTION,
  TEAM_GRID_PROJECTION,
  TIMELINE_ROW_PROJECTION,
} from "./fragments/standalone";
import { toSlugRows, type RawOgImage, type RawSlugRow } from "./shared";

// ---------------------------------------------------------------------------
// Regional community pages (app/[locale]/(main)/communities/[slug]/page.tsx,
// and the redirect check in the generic-page catch-all, ./page.ts) — moved from
// sanity/lib/fetch.ts's fetchSanityRCPageBySlug / fetchSanityRCPagesStaticParams.
//
// REGIONAL_COMMUNITY_PAGE_QUERY below is moved character-exact from
// sanity/queries/regional-community-page.ts, resolved the same way as
// PAGE_QUERY (./page.ts) (that file's own top-level `cachedFetch` import is
// unused/dead — the same pattern seen in fetch.ts's own commented-out
// duplicates — and had to be stubbed out for the capture step, same as
// grid-case-study.ts).
//
// Returned as a near-verbatim pass-through of the query result (not reshaped
// into a clean interface): communities/[slug]/page.tsx and
// regional-community-template.tsx destructure roughly twenty fields off this
// object directly (regionalCommunity, welcomeHero, whyJoinCTA, teamGrid,
// agendasGrid, newsGrid, caseStudiesGrid, livedExperiencesCarousel,
// atlasEmbed, logoCloud, contentFlow, useTemplate, plus SEO fields consumed
// by the same `generatePageMetadata` as generic pages) — an
// index signature is kept for anything else those call sites read, the same
// judgment call outputs.ts made for `Agenda` (that module's own comment:
// "reshaping the projection... would silently break rendering without
// touching a single Sanity import").
// ---------------------------------------------------------------------------//
// Task 14a split this module out of the 8,550-line `lib/content/pages.ts`.
// The GROQ below is unchanged: the block projections it interpolates are the
// same `sanity/queries/**` fragments this file used to carry expanded inline,
// restored under `./fragments/` from commit `fc7bc7c40`, and the composed
// query string is byte-identical to the one that shipped before the split
// (`lib/__tests__/content-pages-queries.test.ts` pins it).

export interface RegionalCommunityPage {
  _id: string;
  title?: string;
  slug?: { current: string };
  regionalCommunity?: {
    _id: string;
    name?: unknown;
    slug?: { current: string };
    coverImage?: unknown;
  } | null;
  language?: string;
  useTemplate?: boolean;
  welcomeHero?: Record<string, unknown> | null;
  whyJoinCTA?: Record<string, unknown> | null;
  teamGrid?: Record<string, unknown> | null;
  agendasGrid?: Record<string, unknown> | null;
  newsGrid?: Record<string, unknown> | null;
  caseStudiesGrid?: Record<string, unknown> | null;
  livedExperiencesCarousel?: Record<string, unknown> | null;
  testimonialsBlock?: unknown;
  atlasEmbed?: { enabled?: boolean; showBreakdown?: boolean } | null;
  logoCloud?: Record<string, unknown> | null;
  contentFlow?: Array<Record<string, unknown>> | null;
  meta_title?: string;
  meta_description?: string;
  noindex?: boolean;
  ogImage?: RawOgImage;
  /**
   * `titleHero`/`listHero`/`blocks` are read by communities/[slug]/page.tsx's
   * hero-fallback and "Legacy Mode" branches, but REGIONAL_COMMUNITY_PAGE_QUERY
   * does not (and, per the git history available here, never did) project any
   * of the three — those branches have always evaluated with these
   * `undefined`, i.e. they are already-dead code today, not something this
   * conversion breaks. Preserved as optional/unprojected rather than removed,
   * since deleting dead branches is a behaviour-neutral cleanup out of scope
   * for a code-move task.
   */
  titleHero?: unknown;
  listHero?: unknown;
  blocks?: unknown[];
  [key: string]: unknown;
}

export const REGIONAL_COMMUNITY_PAGE_QUERY = `
  *[_type == "regionalCommunityPage" && slug.current == $slug && language == $language][0]{
    _id,
    title,
    slug,
    regionalCommunity->{
      _id,
      name,
      slug,
      coverImage{
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
      }
    },
    language,
    useTemplate,

    // Template Components
    welcomeHero {
      _type,
      _key,
      background{
        ...,
      },
      tagLine,
      title,
      body[]{
        ...,
        _type == "image" => {
          ...,
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
          }
        }
      },
      image{
        ...,
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
      links[]{
        title,
        href,
        target,
        buttonVariant{
          variant,
          size,
          stroke
        }
      },
      padding,
      imagePosition,
    },
    whyJoinCTA {
      _type,
      _key,
      background{
        ...,
      },
      tagLine,
      title,
      body[]{
        ...,
        _type == "image" => {
          ...,
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
          }
        }
      },
      image{
        ...,
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
      links[]{
        title,
        href,
        target,
        buttonVariant{
          variant,
          size,
          stroke
        }
      },
      padding,
      imagePosition,
    },
    teamGrid {
      mode,
      manualMembers[]->{
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
      },
      gridColumns,
      showTitle,
      title,
      showDescription,
      description,
      displayRole,
      displayAffiliation
    },
    agendasGrid {
      mode,
      gridColumns,
      maxItems,
      initialDisplayCount,
      showTitle,
      title,
      subtitle,
      showDescription,
      description,
      headerImage {
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
      manualItems[]->{
        _id,
        title,
        subtitle,
        description,
        slug,
        agendaType,
        year,
        publishDate,
        coverImage {
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
        }
      }
    },
    newsGrid {
      mode,
      gridColumns,
      maxItems,
      initialDisplayCount,
      showTitle,
      title,
      subtitle,
      showDescription,
      description,
      headerImage {
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
      manualItems[]->{
        _id,
        _type,
        title,
        subtitle,
        excerpt,
        slug,
        publishedAt,
        featured,
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
          logo {
            asset->{
              _id,
              url
            }
          }
        }[_id != null],
        locationDetails {
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
        sourceUrl,
        publisher,
        sourceType
      }
    },
    caseStudiesGrid {
      mode,
      gridColumns,
      maxItems,
      initialDisplayCount,
      showTitle,
      title,
      subtitle,
      showDescription,
      description,
      headerImage {
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
      manualItems[]->{
        _id,
        title,
        excerpt,
        slug,
        publishedAt,
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
          alt
        }
      }
    },
    livedExperiencesCarousel {
      mode,
      maxItems,
      showTitle,
      title,
      showDescription,
      description,
      manualItems[]->{
        _id,
        title,
        excerpt,
        slug,
        thumbnail {
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
        videoUrl,
        duration,
        publishedAt
      }
    },
    testimonialsBlock,
    atlasEmbed {
      enabled,
      showBreakdown
    },
    logoCloud {
      ${LOGO_CLOUD_1_PROJECTION}
    },

    // Custom Content Flow (when not using template)
    contentFlow[]{
      ${HERO_1_PROJECTION},
      ${HERO_2_PROJECTION},
      ${SECTION_HEADER_PROJECTION},
      ${SPLIT_ROW_PROJECTION},
      ${GRID_ROW_PROJECTION},
      ${TEAM_GRID_PROJECTION},
      ${CAROUSEL_1_PROJECTION},
      ${CAROUSEL_2_PROJECTION},
      ${LIVED_EXPERIENCES_CAROUSEL_PROJECTION},
      ${TIMELINE_ROW_PROJECTION},
      ${CTA_1_PROJECTION},
      ${LOGO_CLOUD_1_PROJECTION},
      ${FAQS_PROJECTION},
      ${FORM_NEWSLETTER_PROJECTION},
      ${ALL_POSTS_PROJECTION},
      ${MANUAL_CONTENT_INSERT_PROJECTION},
      ${DYNAMIC_CONTENT_INSERT_PROJECTION},
      ${SEPARATOR_BLOCK_PROJECTION},
      ${REGION_MAP_PROJECTION}
    },

    meta_title,
    meta_description,
    noindex,
    ogImage {
      asset->{
        _id,
        url,
        metadata {
          dimensions {
            width,
            height
          }
        }
      },
      alt
    }
  }
`;

export async function getRegionalCommunityPage(
  slug: string,
  locale: Locale,
): Promise<RegionalCommunityPage | null> {
  // fetchSanityRCPageBySlug's original sanityFetch call omitted both
  // perspective/stega — same draft-preview requirement as getPageBySlug (./page.ts).
  let raw = await queryPreviewable<RegionalCommunityPage | null>(REGIONAL_COMMUNITY_PAGE_QUERY, { slug, language: locale });
  if (!raw && locale !== "en") {
    raw = await queryPreviewable<RegionalCommunityPage | null>(REGIONAL_COMMUNITY_PAGE_QUERY, { slug, language: "en" });
  }
  return raw ?? null;
}

// Another inline literal in fetch.ts, not the RCPAGES_SLUGS_QUERY constant
// regional-community-page.ts also exports (that one has zero importers
// anywhere — dead). Moved character-exact from the live function.
export const RC_PAGE_SLUGS_QUERY = `*[_type == "regionalCommunityPage" && defined(slug)]{
      _id,
      slug { current },
      language
    }`;


export async function getRegionalCommunityPageSlugs(): Promise<
  Array<{ id: string; slug: string; locale: Locale }>
> {
  return toSlugRows(await query<RawSlugRow[] | null>(RC_PAGE_SLUGS_QUERY));
}

// ---------------------------------------------------------------------------
// Regional hero live stats (components/regions/region-hero.tsx) — a call
// site the brief's file list names (`Modify: components/regions/
// region-hero.tsx`) but doesn't enumerate a helper for, because it never
// went through sanity/lib/fetch.ts: the component imported `client` from
// `@/sanity/lib/client` directly and ran its own inline count query. Same
// perspective as `query()` (published, useCdn true, read-token client), so
// this maps to `query()` like every other read here. The original wraps the
// call in try/catch with an EMPTY catch body (stats are decorative, no log
// at all on failure) — degraded via `safe()` like every other read-side
// failure in this migration; the only behavioural difference is that a
// failure now logs via `safe()`'s standard `console.error`, where previously
// it logged nothing. Not user-visible (the hero still renders without
// stats either way).
// ---------------------------------------------------------------------------

export const REGION_STATS_QUERY = `{
        "cs": count(*[_type == "caseStudy" && status == "approved" && (region == $code || relatedCommunity->slug.current == $slug)]),
        "le": count(*[_type == "livedExperience" && (status == "approved" || !defined(status)) && (region == $code || relatedCommunity->slug.current == $slug)])
      }`;

export interface RegionStats {
  caseStudies: number;
  livedExperiences: number;
}

const EMPTY_REGION_STATS: RegionStats = { caseStudies: 0, livedExperiences: 0 };

export async function getRegionStats(code: string, slug: string): Promise<RegionStats> {
  return safe("region-stats", EMPTY_REGION_STATS, async () => {
    const counts = await query<{ cs: number; le: number } | null>(REGION_STATS_QUERY, { code, slug });
    return { caseStudies: counts?.cs ?? 0, livedExperiences: counts?.le ?? 0 };
  });
}
