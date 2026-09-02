import "server-only";
import { safe } from "@/lib/content/internal/safe";
import { query, queryPreviewable } from "@/lib/content/internal/sanity-source";
import type { Locale } from "@/lib/content/types";

/**
 * `{ type, key } & Record<string, unknown>` per the Task 6 brief — deliberately
 * loose. Phase 2 narrows it once the 12 live block types are modelled in
 * Payload. NOTE: the actual raw Sanity block objects this module returns use
 * `_type`/`_key`, not `type`/`key` (see the comment on `Page.blocks` below) —
 * this alias is a label for the exported signature, not a shape the runtime
 * values are transformed into.
 */
export type ContentBlock = { type: string; key: string } & Record<string, unknown>;

interface RawOgImage {
  asset?: {
    _id: string;
    url: string;
    metadata?: { dimensions?: { width: number; height: number } };
  } | null;
  alt?: string;
}

// ---------------------------------------------------------------------------
// Generic pages (app/[locale]/(main)/[...slug]/page.tsx) — moved from
// sanity/lib/fetch.ts's fetchSanityPageBySlug / fetchSanityPagesStaticParams /
// fetchTranslationsForPage.
//
// PAGE_QUERY below is moved character-exact (including every block-type
// projection's own comments) from sanity/queries/page.ts. That file composes
// it from 15 further fragment files (sanity/queries/hero/hero-1.ts, hero-2.ts,
// section-header.ts, split/split-row.ts, grid/grid-row.ts, team-grid.ts,
// carousel/carousel-1.ts, carousel-2.ts, timeline.ts, cta/cta-1.ts,
// logo-cloud/logo-cloud-1.ts, faqs.ts, forms/newsletter.ts, all-posts.ts,
// maps/region-map.ts) — none of which this module imports, since the seam
// boundary forbids importing anything under @/sanity/* other than through
// sanity-source.ts. The fully-resolved text was captured by importing the
// real PAGE_QUERY constant in a throwaway script and writing its resolved
// value to disk, rather than hand-transcribing 15 nested template literals —
// verified byte-identical to what PAGE_QUERY produces today (one of those 15
// fragments, grid-row.ts -> grid-case-study.ts, itself imports cachedFetch
// via an unused/dead import, which is what made a plain re-import of page.ts
// impossible without stubbing that unused import out for the capture step).
//
// `getPageBySlug` mirrors fetchSanityPageBySlug's own locale fallback: if the
// requested locale has no translation yet, retry with "en" rather than 404.
// ---------------------------------------------------------------------------

/**
 * The generic-page shape this module returns. Deliberately NOT identical to
 * the brief's sketched `Page` interface (`{ id, slug, locale, title, blocks,
 * seo: { metaTitle, metaDescription, noindex } }`), for two reasons proven
 * against the live query and its one real consumer:
 *
 * 1. PAGE_QUERY selects `blocks[]` and four SEO/meta fields only — it never
 *    projects `_id` or a `title` (a generic page's heading lives inside
 *    `blocks[]`, not as a top-level field). Adding either would mean
 *    editing the GROQ, which the byte-identical constraint forbids, so `id`
 *    and `title` are left off rather than invented.
 * 2. `meta_title`/`meta_description`/`noindex`/`ogImage` stay top-level
 *    (not nested under `seo`) because the one live consumer of this data,
 *    `generatePageMetadata` (sanity/lib/metadata.ts — Task 10b's file,
 *    still typed against `@/sanity.types` and therefore untouched here)
 *    reads `page.meta_title` / `page.ogImage.asset.metadata.dimensions...`
 *    directly. Nesting them under `seo` the way the brief sketches would
 *    silently break Open Graph images and page titles site-wide unless
 *    `generatePageMetadata` were also converted — out of scope for this task.
 *
 * This is the same category of correction as the `getHomepage`-must-not-
 * return-blocks ruling: the brief's interface sketch is Phase 2's target
 * shape, not something Phase 1 can produce without a behaviour change.
 *
 * `blocks` stays in RAW Sanity shape (`_type`/`_key`, not `type`/`key`):
 * components/blocks/index.tsx's renderer dispatches on `block._type`, so
 * renaming those keys would silently break every block on every page. The
 * `ContentBlock[]` type is therefore a label for the exported signature, not
 * a literal transform — callers cast back to whatever the `Blocks` component
 * actually expects, the same pattern already used in
 * regional-community-template.tsx (`blocks as ComponentProps<typeof
 * Blocks>['blocks']`).
 */
export interface Page {
  slug: string;
  locale: Locale;
  blocks: ContentBlock[];
  meta_title?: string;
  meta_description?: string;
  noindex?: boolean;
  ogImage?: RawOgImage;
}

interface RawPageDoc {
  blocks?: unknown[] | null;
  meta_title?: string;
  meta_description?: string;
  noindex?: boolean;
  ogImage?: RawOgImage | null;
}

function toPage(raw: RawPageDoc, slug: string, locale: Locale): Page {
  return {
    slug,
    locale,
    blocks: (raw.blocks ?? []) as unknown as ContentBlock[],
    meta_title: raw.meta_title,
    meta_description: raw.meta_description,
    noindex: raw.noindex,
    ogImage: raw.ogImage ?? undefined,
  };
}

const PAGE_QUERY = `
  *[_type == "page" && slug.current == $slug && language == $language][0]{
    blocks[]{
      
  _type == "hero-1" => {
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
  }
,
      
  _type == "hero-2" => {
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
  }
,
      
  _type == "section-header" => {
    _type,
    _key,
    padding,
    sectionWidth,
    stackAlign,
    tagLine,
    title,
    description,
    link{
      title,
      href,
      target,
      buttonVariant{
        variant,
        size,
        stroke
      }
    },
  }
,
      
  _type == "split-row" => {
    _type,
    _key,
    padding,
    noGap,
    splitColumns[]{
      
  _type == "split-content" => {
    _type,
    _key,
    sticky,
    padding,
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
    link{
      title,
      href,
      target,
      buttonVariant{
        variant,
        size,
        stroke
      }
    },
  }
,
      
  _type == "split-cards-list" => {
    _type,
    _key,
    list[]{
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
    },
  }
,
      
  _type == "split-image" => {
    _type,
    _key,
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
      alt
    },
  }
,
      
  _type == "split-info-list" => {
    _type,
    _key,
    list[]{
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
      tags[],
    },
  }
,
    },
  }
,
      
  _type == "grid-row" => {
    _type,
    _key,
    padding,
    background,
    title,
    subtitle,
    description,
    gridColumns,
    cardVariant,
    initialDisplayCount,
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
    columns[]{
      
  _type == "grid-card" => {
    _type,
    _key,
    title,
    excerpt,
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
    link{
      title,
      href,
      target,
      buttonVariant{
        variant,
        size,
        stroke
      }
    },
  }
,
      
  _type == "grid-post" => {
    _type,
    _key,
    featured,
    newsPost->{
      _id,
      title,
      subtitle,
      slug,
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
      publishedAt,
      tags[]->{
        _id,
        label,
      },
    },
  }
,
      
  _type == "grid-agenda" => {
    _type,
    _key,
    showTags,
    showDownloadButtons,
    showMetadata,
    agenda->{
      _id,
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
      regionalCommunities[]->{
        _id,
        name,
        slug,
        code
      }
    }
  }
,
      
  _type == "grid-case-study" => {
    _type,
    _key,
    showTags,
    showAuthors,
    showMetadata,
    showStudyPeriod,
    showLocation,
    customExcerpt,
    customLayout,
    // Properly filter case study by status - use select for conditional referencing
    "caseStudy": select(
      caseStudy->status == "approved" => caseStudy->{
        
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

      },
      null
    )
  }
,
      
  _type == "grid-news" => {
    _type,
    _key,
    showTags,
    showAuthor,
    showMetadata,
    showLocation,
    customExcerpt,
    newsPost->{
      _id,
      title,
      subtitle,
      excerpt,
      slug,
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
        image{
          asset->{
            _id,
            url
          },
          alt
        }
      },
      publishedAt,
      organizations[]->{
        _id,
        name,
        slug,
        acronym
      },
      locationDetails,
      tags[]->{
        _id,
        label,
        value,
        color
      },
      featured
    }
  }
,
      
  _type == "grid-lived-experience" => {
    _type,
    _key,
    showTags,
    showMetadata,
    showCommunity,
    showOrganizations,
    customExcerpt,
    livedExperience->{
      _id,
      title,
      excerpt,
      slug,
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
      videoUrl,
      duration,
      publishedAt,
      relatedCommunity->{
        _id,
        name,
        slug
      },
      organizations[]->{
        _id,
        name,
        slug,
        acronym
      },
      tags[]->{
        _id,
        label,
        value,
        color
      },
      featured
    }
  }
,
    },
  }
,
      
  _type == "team-grid" => {
    _type,
    _key,
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
    },
    regionalCommunity->{
      _id,
      name,
      slug
    },
    gridColumns,
    showTitle,
    title,
    showDescription,
    description,
    displayRole,
    displayAffiliation
  }
,
      
  _type == "carousel-1" => {
    _type,
    _key,
    title,
    description,
    background,
    padding,
    size,
    orientation,
    indicators,
    cardVariant,
    images[]{
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
  }
,
      
  _type == "carousel-2" => {
    _type,
    _key,
    title,
    description,
    padding,
    testimonial[]->{
      _id,
      name,
      // Localized job title (Lane B) with legacy single-language fallback.
      "title": coalesce(jobTitle, { "en": title }),
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
      // Localized rich quote object ({en,es,fr,ar}); the renderer resolves the
      // active locale. Falls back to wrapping the legacy single-language body.
      "quote": coalesce(quote, { "en": body }),
      rating,
      featured,
      relatedCommunity->{
        _id,
        name
      },
      organization->{
        _id,
        name
      },
      project->{
        _id,
        name
      },
    },
  }
,
      
  _type == "timeline-row" => {
    _type,
    _key,
    padding,
    timelines[]{
      title,
      tagLine,
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
    },
  }
,
      
  _type == "cta-1" => {
    _type,
    _key,
    padding,
    background,
    sectionWidth,
    stackAlign,
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
  }
,
      
  _type == "logo-cloud-1" => {
    _type,
    _key,
    padding,
    title,
    description,
    layout,
    motionSpeed,
    images[]{
      ...,
      label,
      orgType,
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
  }
,
      
  _type == "faqs" => {
    _type,
    _key,
    padding,
    faqs[]->{
      _id,
      // Localized question (Lane B), with legacy single-language fallback.
      "question": coalesce(question, { "en": title }),
      "title": coalesce(question.en, title),
      // Localized rich answer; fall back to legacy single-language body.
      "answer": coalesce(answer, { "en": body }),
      "body": coalesce(answer.en, body)[]{
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
    },
  }
,
      
  _type == "form-newsletter" => {
    _type,
    _key,
    padding,
    stackAlign,
    consentText,
    buttonText,
    successMessage,
  }
,
      
  _type == "all-posts" => {
    _type,
    _key,
    padding,
    mode,
    limit,
    manualPosts[]->{
      _ref
    },
  }
,
      
  _type == "region-map" => {
    _type,
    _key,
    padding,
    title,
    description,
    defaultFacet,
    allowedFacets,
  }
,
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
    }
  }
`;

export async function getPageBySlug(slug: string, locale: Locale): Promise<Page | null> {
  // fetchSanityPageBySlug's original sanityFetch call omitted both
  // perspective/stega, so cachedFetch's own draftMode() check decided
  // draft vs. published — that is what let an editor previewing this page
  // in Sanity's Presentation tool see their unpublished draft.
  let raw = await queryPreviewable<RawPageDoc | null>(PAGE_QUERY, { slug, language: locale });
  if (!raw && locale !== "en") {
    raw = await queryPreviewable<RawPageDoc | null>(PAGE_QUERY, { slug, language: "en" });
  }
  if (!raw) return null;
  return toPage(raw, slug, locale);
}

// The static-params query fetchSanityPagesStaticParams actually called: an
// inline literal in sanity/lib/fetch.ts, NOT the PAGES_SLUGS_QUERY constant
// sanity/queries/page.ts also exports (that one is only ever referenced by a
// commented-out duplicate of this same function — dead on both ends). Moved
// character-exact from the live function.
const PAGE_SLUGS_QUERY = `*[_type == "page" && defined(slug)]{
      _id,
      slug { current },
      language
    }`;

interface RawSlugRow {
  _id: string;
  slug?: { current?: string } | null;
  language?: string | null;
}

export async function getPageSlugs(): Promise<Array<{ id: string; slug: string; locale: Locale }>> {
  const rows = await query<RawSlugRow[] | null>(PAGE_SLUGS_QUERY);
  return (rows ?? [])
    .filter((r): r is RawSlugRow & { slug: { current: string } } => !!r.slug?.current)
    .map((r) => ({ id: r._id, slug: r.slug.current, locale: (r.language as Locale) || "en" }));
}

// The original wraps this in try/catch, warning and degrading to `[]` on
// failure ("expected if internationalization isn't fully set up") — the same
// degrade-on-read shape every other domain module standardises through
// `safe()`. Also degrades to `[]` on a plain miss (no translation.metadata
// doc referencing this id), matching `data || []` in the original.
const PAGE_TRANSLATIONS_QUERY = `
        *[_type == "translation.metadata" && references($pageId)][0]{
          "translations": translations[].value->{
            _id,
            language,
            slug
          }
        }.translations`;

export interface PageTranslation {
  _id: string;
  language?: string;
  slug?: { current?: string };
}

export async function getPageTranslations(pageId: string): Promise<PageTranslation[]> {
  return safe("page-translations", [], async () => {
    const rows = await query<PageTranslation[] | null>(PAGE_TRANSLATIONS_QUERY, { pageId });
    return rows ?? [];
  });
}

// ---------------------------------------------------------------------------
// Regional community pages (app/[locale]/(main)/communities/[slug]/page.tsx,
// and the redirect check in the generic-page catch-all above) — moved from
// sanity/lib/fetch.ts's fetchSanityRCPageBySlug / fetchSanityRCPagesStaticParams.
//
// REGIONAL_COMMUNITY_PAGE_QUERY below is moved character-exact from
// sanity/queries/regional-community-page.ts, resolved the same way as
// PAGE_QUERY above (that file's own top-level `cachedFetch` import is
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
// by the same untouched `generatePageMetadata` as generic pages above) — an
// index signature is kept for anything else those call sites read, the same
// judgment call outputs.ts made for `Agenda` (that module's own comment:
// "reshaping the projection... would silently break rendering without
// touching a single Sanity import").
// ---------------------------------------------------------------------------

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

const REGIONAL_COMMUNITY_PAGE_QUERY = `
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
      
  _type == "logo-cloud-1" => {
    _type,
    _key,
    padding,
    title,
    description,
    layout,
    motionSpeed,
    images[]{
      ...,
      label,
      orgType,
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
  }

    },

    // Custom Content Flow (when not using template)
    contentFlow[]{
      
  _type == "hero-1" => {
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
  }
,
      
  _type == "hero-2" => {
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
  }
,
      
  _type == "section-header" => {
    _type,
    _key,
    padding,
    sectionWidth,
    stackAlign,
    tagLine,
    title,
    description,
    link{
      title,
      href,
      target,
      buttonVariant{
        variant,
        size,
        stroke
      }
    },
  }
,
      
  _type == "split-row" => {
    _type,
    _key,
    padding,
    noGap,
    splitColumns[]{
      
  _type == "split-content" => {
    _type,
    _key,
    sticky,
    padding,
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
    link{
      title,
      href,
      target,
      buttonVariant{
        variant,
        size,
        stroke
      }
    },
  }
,
      
  _type == "split-cards-list" => {
    _type,
    _key,
    list[]{
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
    },
  }
,
      
  _type == "split-image" => {
    _type,
    _key,
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
      alt
    },
  }
,
      
  _type == "split-info-list" => {
    _type,
    _key,
    list[]{
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
      tags[],
    },
  }
,
    },
  }
,
      
  _type == "grid-row" => {
    _type,
    _key,
    padding,
    background,
    title,
    subtitle,
    description,
    gridColumns,
    cardVariant,
    initialDisplayCount,
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
    columns[]{
      
  _type == "grid-card" => {
    _type,
    _key,
    title,
    excerpt,
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
    link{
      title,
      href,
      target,
      buttonVariant{
        variant,
        size,
        stroke
      }
    },
  }
,
      
  _type == "grid-post" => {
    _type,
    _key,
    featured,
    newsPost->{
      _id,
      title,
      subtitle,
      slug,
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
      publishedAt,
      tags[]->{
        _id,
        label,
      },
    },
  }
,
      
  _type == "grid-agenda" => {
    _type,
    _key,
    showTags,
    showDownloadButtons,
    showMetadata,
    agenda->{
      _id,
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
      regionalCommunities[]->{
        _id,
        name,
        slug,
        code
      }
    }
  }
,
      
  _type == "grid-case-study" => {
    _type,
    _key,
    showTags,
    showAuthors,
    showMetadata,
    showStudyPeriod,
    showLocation,
    customExcerpt,
    customLayout,
    // Properly filter case study by status - use select for conditional referencing
    "caseStudy": select(
      caseStudy->status == "approved" => caseStudy->{
        
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

      },
      null
    )
  }
,
      
  _type == "grid-news" => {
    _type,
    _key,
    showTags,
    showAuthor,
    showMetadata,
    showLocation,
    customExcerpt,
    newsPost->{
      _id,
      title,
      subtitle,
      excerpt,
      slug,
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
        image{
          asset->{
            _id,
            url
          },
          alt
        }
      },
      publishedAt,
      organizations[]->{
        _id,
        name,
        slug,
        acronym
      },
      locationDetails,
      tags[]->{
        _id,
        label,
        value,
        color
      },
      featured
    }
  }
,
      
  _type == "grid-lived-experience" => {
    _type,
    _key,
    showTags,
    showMetadata,
    showCommunity,
    showOrganizations,
    customExcerpt,
    livedExperience->{
      _id,
      title,
      excerpt,
      slug,
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
      videoUrl,
      duration,
      publishedAt,
      relatedCommunity->{
        _id,
        name,
        slug
      },
      organizations[]->{
        _id,
        name,
        slug,
        acronym
      },
      tags[]->{
        _id,
        label,
        value,
        color
      },
      featured
    }
  }
,
    },
  }
,
      
  _type == "team-grid" => {
    _type,
    _key,
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
    },
    regionalCommunity->{
      _id,
      name,
      slug
    },
    gridColumns,
    showTitle,
    title,
    showDescription,
    description,
    displayRole,
    displayAffiliation
  }
,
      
  _type == "carousel-1" => {
    _type,
    _key,
    title,
    description,
    background,
    padding,
    size,
    orientation,
    indicators,
    cardVariant,
    images[]{
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
  }
,
      
  _type == "carousel-2" => {
    _type,
    _key,
    title,
    description,
    padding,
    testimonial[]->{
      _id,
      name,
      // Localized job title (Lane B) with legacy single-language fallback.
      "title": coalesce(jobTitle, { "en": title }),
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
      // Localized rich quote object ({en,es,fr,ar}); the renderer resolves the
      // active locale. Falls back to wrapping the legacy single-language body.
      "quote": coalesce(quote, { "en": body }),
      rating,
      featured,
      relatedCommunity->{
        _id,
        name
      },
      organization->{
        _id,
        name
      },
      project->{
        _id,
        name
      },
    },
  }
,
      
  _type == "lived-experiences-carousel" => {
    _type,
    _key,
    title,
    subtitle,
    background,
    padding,
    filterBy,
    maxItems,
    featured,
  }
,
      
  _type == "timeline-row" => {
    _type,
    _key,
    padding,
    timelines[]{
      title,
      tagLine,
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
    },
  }
,
      
  _type == "cta-1" => {
    _type,
    _key,
    padding,
    background,
    sectionWidth,
    stackAlign,
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
  }
,
      
  _type == "logo-cloud-1" => {
    _type,
    _key,
    padding,
    title,
    description,
    layout,
    motionSpeed,
    images[]{
      ...,
      label,
      orgType,
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
  }
,
      
  _type == "faqs" => {
    _type,
    _key,
    padding,
    faqs[]->{
      _id,
      // Localized question (Lane B), with legacy single-language fallback.
      "question": coalesce(question, { "en": title }),
      "title": coalesce(question.en, title),
      // Localized rich answer; fall back to legacy single-language body.
      "answer": coalesce(answer, { "en": body }),
      "body": coalesce(answer.en, body)[]{
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
    },
  }
,
      
  _type == "form-newsletter" => {
    _type,
    _key,
    padding,
    stackAlign,
    consentText,
    buttonText,
    successMessage,
  }
,
      
  _type == "all-posts" => {
    _type,
    _key,
    padding,
    mode,
    limit,
    manualPosts[]->{
      _ref
    },
  }
,
      
  _type == "manualContentInsert" => {
    _type,
    _key,
    title,
    content,
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
      alt,
      caption
    },
    layout,
    backgroundColor,
    padding
  }
,
      
  _type == "dynamicContentInsert" => {
    _type,
    _key,
    queryType,
    displayStyle,
    itemCount,
    title,
    subtitle,
    showViewAllButton,
    backgroundColor,
    padding
  }
,
      
  _type == "separatorBlock" => {
    _type,
    _key,
    style,
    spacing,
    color
  }
,
      
  _type == "region-map" => {
    _type,
    _key,
    padding,
    title,
    description,
    defaultFacet,
    allowedFacets,
  }

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
  // perspective/stega — same draft-preview requirement as getPageBySlug above.
  let raw = await queryPreviewable<RegionalCommunityPage | null>(REGIONAL_COMMUNITY_PAGE_QUERY, { slug, language: locale });
  if (!raw && locale !== "en") {
    raw = await queryPreviewable<RegionalCommunityPage | null>(REGIONAL_COMMUNITY_PAGE_QUERY, { slug, language: "en" });
  }
  return raw ?? null;
}

// Another inline literal in fetch.ts, not the RCPAGES_SLUGS_QUERY constant
// regional-community-page.ts also exports (that one has zero importers
// anywhere — dead). Moved character-exact from the live function.
const RC_PAGE_SLUGS_QUERY = `*[_type == "regionalCommunityPage" && defined(slug)]{
      _id,
      slug { current },
      language
    }`;

export async function getRegionalCommunityPageSlugs(): Promise<
  Array<{ id: string; slug: string; locale: Locale }>
> {
  const rows = await query<RawSlugRow[] | null>(RC_PAGE_SLUGS_QUERY);
  return (rows ?? [])
    .filter((r): r is RawSlugRow & { slug: { current: string } } => !!r.slug?.current)
    .map((r) => ({ id: r._id, slug: r.slug.current, locale: (r.language as Locale) || "en" }));
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

const REGION_STATS_QUERY = `{
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

// ---------------------------------------------------------------------------
// Homepage (app/[locale]/(main)/page.tsx) — moved from sanity/lib/fetch.ts's
// fetchSanityHomepageBySlug / fetchSanityHomepageStaticParams, plus the dead
// fetchHomepageBySlug / fetchIndexHomepage / fetchTranslationsForHomepage
// (implemented per the documented signatures anyway, per the Tasks 3-5
// precedent for brief-named-but-dead helpers — see the report).
//
// *** getHomepage returns the homepage in its CURRENT fixed-slot shape.
// It does NOT call blocksFromFields and does NOT synthesize a `blocks`
// array from the 11 named slots. HOMEPAGE_QUERY's own `blocks[]` field
// (the freeform page-builder path, distinct from the fixed slots) passes
// through completely untouched, exactly as the live query returns it —
// components/pages/homepage.tsx already branches on `homepage.blocks` vs.
// the 11 named slots itself; that branch is pre-existing production logic,
// not something this task introduces. The Phase-2-importer remodel
// (blocksFromFields running once over the data, per spec decision D9) is
// out of scope here — see the task ruling this report also restates. ***
//
// HOMEPAGE_QUERY below is moved character-exact from sanity/queries/homepage.ts,
// resolved the same way as PAGE_QUERY / REGIONAL_COMMUNITY_PAGE_QUERY above.
// ---------------------------------------------------------------------------

export interface Homepage {
  blocks?: ContentBlock[] | null;
  heroWelcome?: Record<string, unknown> | null;
  globalAgenda?: Record<string, unknown> | null;
  howToUse?: Record<string, unknown> | null;
  agendasModule?: Record<string, unknown> | null;
  livedExperiences?: Record<string, unknown> | null;
  regionalCommunities?: Record<string, unknown> | null;
  collaboration?: Record<string, unknown> | null;
  news?: Record<string, unknown> | null;
  projectInfo?: Record<string, unknown> | null;
  mentalHealthDefinition?: Record<string, unknown> | null;
  partnerLogos?: Record<string, unknown> | null;
  meta_title?: string;
  meta_description?: string;
  noindex?: boolean;
  ogImage?: RawOgImage;
}

const HOMEPAGE_QUERY = `
  *[_type == "homepage" && slug.current == $slug && language == $language][0]{
    _id,
    title,
    slug,
    language,

    // Freeform page-builder blocks (preferred; the fixed sections below are
    // legacy and removed post-migration).
    
  blocks[]{
    
  _type == "hero-1" => {
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
  }
,
    
  _type == "hero-2" => {
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
  }
,
    
  _type == "section-header" => {
    _type,
    _key,
    padding,
    sectionWidth,
    stackAlign,
    tagLine,
    title,
    description,
    link{
      title,
      href,
      target,
      buttonVariant{
        variant,
        size,
        stroke
      }
    },
  }
,
    
  _type == "split-row" => {
    _type,
    _key,
    padding,
    noGap,
    splitColumns[]{
      
  _type == "split-content" => {
    _type,
    _key,
    sticky,
    padding,
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
    link{
      title,
      href,
      target,
      buttonVariant{
        variant,
        size,
        stroke
      }
    },
  }
,
      
  _type == "split-cards-list" => {
    _type,
    _key,
    list[]{
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
    },
  }
,
      
  _type == "split-image" => {
    _type,
    _key,
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
      alt
    },
  }
,
      
  _type == "split-info-list" => {
    _type,
    _key,
    list[]{
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
      tags[],
    },
  }
,
    },
  }
,
    
  _type == "grid-row" => {
    _type,
    _key,
    padding,
    background,
    title,
    subtitle,
    description,
    gridColumns,
    cardVariant,
    initialDisplayCount,
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
    columns[]{
      
  _type == "grid-card" => {
    _type,
    _key,
    title,
    excerpt,
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
    link{
      title,
      href,
      target,
      buttonVariant{
        variant,
        size,
        stroke
      }
    },
  }
,
      
  _type == "grid-post" => {
    _type,
    _key,
    featured,
    newsPost->{
      _id,
      title,
      subtitle,
      slug,
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
      publishedAt,
      tags[]->{
        _id,
        label,
      },
    },
  }
,
      
  _type == "grid-agenda" => {
    _type,
    _key,
    showTags,
    showDownloadButtons,
    showMetadata,
    agenda->{
      _id,
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
      regionalCommunities[]->{
        _id,
        name,
        slug,
        code
      }
    }
  }
,
      
  _type == "grid-case-study" => {
    _type,
    _key,
    showTags,
    showAuthors,
    showMetadata,
    showStudyPeriod,
    showLocation,
    customExcerpt,
    customLayout,
    // Properly filter case study by status - use select for conditional referencing
    "caseStudy": select(
      caseStudy->status == "approved" => caseStudy->{
        
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

      },
      null
    )
  }
,
      
  _type == "grid-news" => {
    _type,
    _key,
    showTags,
    showAuthor,
    showMetadata,
    showLocation,
    customExcerpt,
    newsPost->{
      _id,
      title,
      subtitle,
      excerpt,
      slug,
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
        image{
          asset->{
            _id,
            url
          },
          alt
        }
      },
      publishedAt,
      organizations[]->{
        _id,
        name,
        slug,
        acronym
      },
      locationDetails,
      tags[]->{
        _id,
        label,
        value,
        color
      },
      featured
    }
  }
,
      
  _type == "grid-lived-experience" => {
    _type,
    _key,
    showTags,
    showMetadata,
    showCommunity,
    showOrganizations,
    customExcerpt,
    livedExperience->{
      _id,
      title,
      excerpt,
      slug,
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
      videoUrl,
      duration,
      publishedAt,
      relatedCommunity->{
        _id,
        name,
        slug
      },
      organizations[]->{
        _id,
        name,
        slug,
        acronym
      },
      tags[]->{
        _id,
        label,
        value,
        color
      },
      featured
    }
  }
,
    },
  }
,
    
  _type == "carousel-1" => {
    _type,
    _key,
    title,
    description,
    background,
    padding,
    size,
    orientation,
    indicators,
    cardVariant,
    images[]{
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
  }
,
    
  _type == "carousel-2" => {
    _type,
    _key,
    title,
    description,
    padding,
    testimonial[]->{
      _id,
      name,
      // Localized job title (Lane B) with legacy single-language fallback.
      "title": coalesce(jobTitle, { "en": title }),
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
      // Localized rich quote object ({en,es,fr,ar}); the renderer resolves the
      // active locale. Falls back to wrapping the legacy single-language body.
      "quote": coalesce(quote, { "en": body }),
      rating,
      featured,
      relatedCommunity->{
        _id,
        name
      },
      organization->{
        _id,
        name
      },
      project->{
        _id,
        name
      },
    },
  }
,
    
  _type == "lived-experiences-carousel" => {
    _type,
    _key,
    title,
    subtitle,
    background,
    padding,
    filterBy,
    maxItems,
    featured,
  }
,
    
  _type == "timeline-row" => {
    _type,
    _key,
    padding,
    timelines[]{
      title,
      tagLine,
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
    },
  }
,
    
  _type == "cta-1" => {
    _type,
    _key,
    padding,
    background,
    sectionWidth,
    stackAlign,
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
  }
,
    
  _type == "logo-cloud-1" => {
    _type,
    _key,
    padding,
    title,
    description,
    layout,
    motionSpeed,
    images[]{
      ...,
      label,
      orgType,
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
  }
,
    
  _type == "faqs" => {
    _type,
    _key,
    padding,
    faqs[]->{
      _id,
      // Localized question (Lane B), with legacy single-language fallback.
      "question": coalesce(question, { "en": title }),
      "title": coalesce(question.en, title),
      // Localized rich answer; fall back to legacy single-language body.
      "answer": coalesce(answer, { "en": body }),
      "body": coalesce(answer.en, body)[]{
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
    },
  }
,
    
  _type == "form-newsletter" => {
    _type,
    _key,
    padding,
    stackAlign,
    consentText,
    buttonText,
    successMessage,
  }
,
    
  _type == "region-map" => {
    _type,
    _key,
    padding,
    title,
    description,
    defaultFacet,
    allowedFacets,
  }
,
    
  _type == "people-widget" => {
    _type,
    _key,
    padding,
    title,
    description,
    limit,
  }
,
    
  _type == "events-calendar" => {
    _type,
    _key,
    padding,
    title,
    description,
    upcomingLimit,
  }
,
    
  _type == "submit-story-banner" => {
    _type,
    _key,
    padding,
    title,
    subtitle,
    ctaLabel,
    illustration{
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
      }
    },
  }
,
    
  _type == "fresh-content" => {
    _type,
    _key,
    title,
    limit,
  }
,
  }
,

    // Template sections based on JSON structure
    heroWelcome {
      
  _type == "hero-1" => {
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
  }

    },
    globalAgenda {
      
  _type == "split-row" => {
    _type,
    _key,
    padding,
    noGap,
    splitColumns[]{
      
  _type == "split-content" => {
    _type,
    _key,
    sticky,
    padding,
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
    link{
      title,
      href,
      target,
      buttonVariant{
        variant,
        size,
        stroke
      }
    },
  }
,
      
  _type == "split-cards-list" => {
    _type,
    _key,
    list[]{
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
    },
  }
,
      
  _type == "split-image" => {
    _type,
    _key,
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
      alt
    },
  }
,
      
  _type == "split-info-list" => {
    _type,
    _key,
    list[]{
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
      tags[],
    },
  }
,
    },
  }

    },
    howToUse {
      
  _type == "split-row" => {
    _type,
    _key,
    padding,
    noGap,
    splitColumns[]{
      
  _type == "split-content" => {
    _type,
    _key,
    sticky,
    padding,
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
    link{
      title,
      href,
      target,
      buttonVariant{
        variant,
        size,
        stroke
      }
    },
  }
,
      
  _type == "split-cards-list" => {
    _type,
    _key,
    list[]{
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
    },
  }
,
      
  _type == "split-image" => {
    _type,
    _key,
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
      alt
    },
  }
,
      
  _type == "split-info-list" => {
    _type,
    _key,
    list[]{
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
      tags[],
    },
  }
,
    },
  }

    },
    agendasModule {
      mode,
      maxItems,
      
  _type == "grid-row" => {
    _type,
    _key,
    padding,
    background,
    title,
    subtitle,
    description,
    gridColumns,
    cardVariant,
    initialDisplayCount,
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
    columns[]{
      
  _type == "grid-card" => {
    _type,
    _key,
    title,
    excerpt,
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
    link{
      title,
      href,
      target,
      buttonVariant{
        variant,
        size,
        stroke
      }
    },
  }
,
      
  _type == "grid-post" => {
    _type,
    _key,
    featured,
    newsPost->{
      _id,
      title,
      subtitle,
      slug,
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
      publishedAt,
      tags[]->{
        _id,
        label,
      },
    },
  }
,
      
  _type == "grid-agenda" => {
    _type,
    _key,
    showTags,
    showDownloadButtons,
    showMetadata,
    agenda->{
      _id,
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
      regionalCommunities[]->{
        _id,
        name,
        slug,
        code
      }
    }
  }
,
      
  _type == "grid-case-study" => {
    _type,
    _key,
    showTags,
    showAuthors,
    showMetadata,
    showStudyPeriod,
    showLocation,
    customExcerpt,
    customLayout,
    // Properly filter case study by status - use select for conditional referencing
    "caseStudy": select(
      caseStudy->status == "approved" => caseStudy->{
        
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

      },
      null
    )
  }
,
      
  _type == "grid-news" => {
    _type,
    _key,
    showTags,
    showAuthor,
    showMetadata,
    showLocation,
    customExcerpt,
    newsPost->{
      _id,
      title,
      subtitle,
      excerpt,
      slug,
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
        image{
          asset->{
            _id,
            url
          },
          alt
        }
      },
      publishedAt,
      organizations[]->{
        _id,
        name,
        slug,
        acronym
      },
      locationDetails,
      tags[]->{
        _id,
        label,
        value,
        color
      },
      featured
    }
  }
,
      
  _type == "grid-lived-experience" => {
    _type,
    _key,
    showTags,
    showMetadata,
    showCommunity,
    showOrganizations,
    customExcerpt,
    livedExperience->{
      _id,
      title,
      excerpt,
      slug,
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
      videoUrl,
      duration,
      publishedAt,
      relatedCommunity->{
        _id,
        name,
        slug
      },
      organizations[]->{
        _id,
        name,
        slug,
        acronym
      },
      tags[]->{
        _id,
        label,
        value,
        color
      },
      featured
    }
  }
,
    },
  }

    },
    livedExperiences {
      
  _type == "carousel-2" => {
    _type,
    _key,
    title,
    description,
    padding,
    testimonial[]->{
      _id,
      name,
      // Localized job title (Lane B) with legacy single-language fallback.
      "title": coalesce(jobTitle, { "en": title }),
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
      // Localized rich quote object ({en,es,fr,ar}); the renderer resolves the
      // active locale. Falls back to wrapping the legacy single-language body.
      "quote": coalesce(quote, { "en": body }),
      rating,
      featured,
      relatedCommunity->{
        _id,
        name
      },
      organization->{
        _id,
        name
      },
      project->{
        _id,
        name
      },
    },
  }

    },
    regionalCommunities {
      
  _type == "grid-row" => {
    _type,
    _key,
    padding,
    background,
    title,
    subtitle,
    description,
    gridColumns,
    cardVariant,
    initialDisplayCount,
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
    columns[]{
      
  _type == "grid-card" => {
    _type,
    _key,
    title,
    excerpt,
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
    link{
      title,
      href,
      target,
      buttonVariant{
        variant,
        size,
        stroke
      }
    },
  }
,
      
  _type == "grid-post" => {
    _type,
    _key,
    featured,
    newsPost->{
      _id,
      title,
      subtitle,
      slug,
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
      publishedAt,
      tags[]->{
        _id,
        label,
      },
    },
  }
,
      
  _type == "grid-agenda" => {
    _type,
    _key,
    showTags,
    showDownloadButtons,
    showMetadata,
    agenda->{
      _id,
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
      regionalCommunities[]->{
        _id,
        name,
        slug,
        code
      }
    }
  }
,
      
  _type == "grid-case-study" => {
    _type,
    _key,
    showTags,
    showAuthors,
    showMetadata,
    showStudyPeriod,
    showLocation,
    customExcerpt,
    customLayout,
    // Properly filter case study by status - use select for conditional referencing
    "caseStudy": select(
      caseStudy->status == "approved" => caseStudy->{
        
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

      },
      null
    )
  }
,
      
  _type == "grid-news" => {
    _type,
    _key,
    showTags,
    showAuthor,
    showMetadata,
    showLocation,
    customExcerpt,
    newsPost->{
      _id,
      title,
      subtitle,
      excerpt,
      slug,
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
        image{
          asset->{
            _id,
            url
          },
          alt
        }
      },
      publishedAt,
      organizations[]->{
        _id,
        name,
        slug,
        acronym
      },
      locationDetails,
      tags[]->{
        _id,
        label,
        value,
        color
      },
      featured
    }
  }
,
      
  _type == "grid-lived-experience" => {
    _type,
    _key,
    showTags,
    showMetadata,
    showCommunity,
    showOrganizations,
    customExcerpt,
    livedExperience->{
      _id,
      title,
      excerpt,
      slug,
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
      videoUrl,
      duration,
      publishedAt,
      relatedCommunity->{
        _id,
        name,
        slug
      },
      organizations[]->{
        _id,
        name,
        slug,
        acronym
      },
      tags[]->{
        _id,
        label,
        value,
        color
      },
      featured
    }
  }
,
    },
  }

    },
    collaboration {
      
  _type == "split-row" => {
    _type,
    _key,
    padding,
    noGap,
    splitColumns[]{
      
  _type == "split-content" => {
    _type,
    _key,
    sticky,
    padding,
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
    link{
      title,
      href,
      target,
      buttonVariant{
        variant,
        size,
        stroke
      }
    },
  }
,
      
  _type == "split-cards-list" => {
    _type,
    _key,
    list[]{
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
    },
  }
,
      
  _type == "split-image" => {
    _type,
    _key,
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
      alt
    },
  }
,
      
  _type == "split-info-list" => {
    _type,
    _key,
    list[]{
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
      tags[],
    },
  }
,
    },
  }

    },
    news {
      mode,
      maxItems,
      
  _type == "grid-row" => {
    _type,
    _key,
    padding,
    background,
    title,
    subtitle,
    description,
    gridColumns,
    cardVariant,
    initialDisplayCount,
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
    columns[]{
      
  _type == "grid-card" => {
    _type,
    _key,
    title,
    excerpt,
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
    link{
      title,
      href,
      target,
      buttonVariant{
        variant,
        size,
        stroke
      }
    },
  }
,
      
  _type == "grid-post" => {
    _type,
    _key,
    featured,
    newsPost->{
      _id,
      title,
      subtitle,
      slug,
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
      publishedAt,
      tags[]->{
        _id,
        label,
      },
    },
  }
,
      
  _type == "grid-agenda" => {
    _type,
    _key,
    showTags,
    showDownloadButtons,
    showMetadata,
    agenda->{
      _id,
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
      regionalCommunities[]->{
        _id,
        name,
        slug,
        code
      }
    }
  }
,
      
  _type == "grid-case-study" => {
    _type,
    _key,
    showTags,
    showAuthors,
    showMetadata,
    showStudyPeriod,
    showLocation,
    customExcerpt,
    customLayout,
    // Properly filter case study by status - use select for conditional referencing
    "caseStudy": select(
      caseStudy->status == "approved" => caseStudy->{
        
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

      },
      null
    )
  }
,
      
  _type == "grid-news" => {
    _type,
    _key,
    showTags,
    showAuthor,
    showMetadata,
    showLocation,
    customExcerpt,
    newsPost->{
      _id,
      title,
      subtitle,
      excerpt,
      slug,
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
        image{
          asset->{
            _id,
            url
          },
          alt
        }
      },
      publishedAt,
      organizations[]->{
        _id,
        name,
        slug,
        acronym
      },
      locationDetails,
      tags[]->{
        _id,
        label,
        value,
        color
      },
      featured
    }
  }
,
      
  _type == "grid-lived-experience" => {
    _type,
    _key,
    showTags,
    showMetadata,
    showCommunity,
    showOrganizations,
    customExcerpt,
    livedExperience->{
      _id,
      title,
      excerpt,
      slug,
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
      videoUrl,
      duration,
      publishedAt,
      relatedCommunity->{
        _id,
        name,
        slug
      },
      organizations[]->{
        _id,
        name,
        slug,
        acronym
      },
      tags[]->{
        _id,
        label,
        value,
        color
      },
      featured
    }
  }
,
    },
  }

    },
    projectInfo {
      
  _type == "split-row" => {
    _type,
    _key,
    padding,
    noGap,
    splitColumns[]{
      
  _type == "split-content" => {
    _type,
    _key,
    sticky,
    padding,
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
    link{
      title,
      href,
      target,
      buttonVariant{
        variant,
        size,
        stroke
      }
    },
  }
,
      
  _type == "split-cards-list" => {
    _type,
    _key,
    list[]{
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
    },
  }
,
      
  _type == "split-image" => {
    _type,
    _key,
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
      alt
    },
  }
,
      
  _type == "split-info-list" => {
    _type,
    _key,
    list[]{
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
      tags[],
    },
  }
,
    },
  }

    },
    mentalHealthDefinition {
      
  _type == "cta-1" => {
    _type,
    _key,
    padding,
    background,
    sectionWidth,
    stackAlign,
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
  }

    },
    partnerLogos {
      
  _type == "logo-cloud-1" => {
    _type,
    _key,
    padding,
    title,
    description,
    layout,
    motionSpeed,
    images[]{
      ...,
      label,
      orgType,
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
  }

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

/**
 * fetchSanityHomepageBySlug's own live callers (app/[locale]/(main)/page.tsx)
 * always pass `slug: "index"` — the only homepage document that exists in
 * production (1 per locale, per the go-live audit). The brief's documented
 * signature drops the slug param entirely for that reason; it is hardcoded
 * here rather than threaded through, matching real usage exactly. Unlike
 * getPageBySlug/getRegionalCommunityPage, the original has no locale ->"en"
 * fallback, so none is added here either.
 */
export async function getHomepage(locale: Locale): Promise<Homepage | null> {
  // fetchSanityHomepageBySlug's original sanityFetch call omitted both
  // perspective/stega — same draft-preview requirement as getPageBySlug above.
  return queryPreviewable<Homepage | null>(HOMEPAGE_QUERY, { slug: "index", language: locale });
}

/**
 * fetchHomepageBySlug — dead code (zero call sites; grepped app/lib/
 * components). Implemented per the documented signature anyway, mirroring
 * the general slug parameter the original (unlike getHomepage above) exposed.
 * Identical query/params to getHomepage; the only difference from the live
 * function is that `slug` isn't hardcoded.
 */
export async function getHomepageBySlug(slug: string, locale: Locale = "en"): Promise<Homepage | null> {
  // fetchHomepageBySlug's original sanityFetch call omitted both
  // perspective/stega — same draft-preview requirement as getPageBySlug above.
  return queryPreviewable<Homepage | null>(HOMEPAGE_QUERY, { slug, language: locale });
}

// ---------------------------------------------------------------------------
// fetchIndexHomepage — dead code (zero call sites). INDEX_HOMEPAGE_QUERY
// below is moved character-exact from sanity/queries/homepage.ts, the same
// way as the other three big queries above. Note it has NO `blocks[]` field
// at all (unlike HOMEPAGE_QUERY) — the live query composer never added the
// freeform page-builder projection to this second, hardcoded-slug variant.
// ---------------------------------------------------------------------------

const INDEX_HOMEPAGE_QUERY = `
  *[_type == "homepage" && slug.current == "index" && language == $language][0]{
    _id,
    title,
    slug,
    language,

    heroWelcome {
      
  _type == "hero-1" => {
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
  }

    },
    globalAgenda {
      
  _type == "split-row" => {
    _type,
    _key,
    padding,
    noGap,
    splitColumns[]{
      
  _type == "split-content" => {
    _type,
    _key,
    sticky,
    padding,
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
    link{
      title,
      href,
      target,
      buttonVariant{
        variant,
        size,
        stroke
      }
    },
  }
,
      
  _type == "split-cards-list" => {
    _type,
    _key,
    list[]{
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
    },
  }
,
      
  _type == "split-image" => {
    _type,
    _key,
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
      alt
    },
  }
,
      
  _type == "split-info-list" => {
    _type,
    _key,
    list[]{
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
      tags[],
    },
  }
,
    },
  }

    },
    howToUse {
      
  _type == "split-row" => {
    _type,
    _key,
    padding,
    noGap,
    splitColumns[]{
      
  _type == "split-content" => {
    _type,
    _key,
    sticky,
    padding,
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
    link{
      title,
      href,
      target,
      buttonVariant{
        variant,
        size,
        stroke
      }
    },
  }
,
      
  _type == "split-cards-list" => {
    _type,
    _key,
    list[]{
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
    },
  }
,
      
  _type == "split-image" => {
    _type,
    _key,
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
      alt
    },
  }
,
      
  _type == "split-info-list" => {
    _type,
    _key,
    list[]{
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
      tags[],
    },
  }
,
    },
  }

    },
    agendasModule {
      mode,
      maxItems,
      
  _type == "grid-row" => {
    _type,
    _key,
    padding,
    background,
    title,
    subtitle,
    description,
    gridColumns,
    cardVariant,
    initialDisplayCount,
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
    columns[]{
      
  _type == "grid-card" => {
    _type,
    _key,
    title,
    excerpt,
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
    link{
      title,
      href,
      target,
      buttonVariant{
        variant,
        size,
        stroke
      }
    },
  }
,
      
  _type == "grid-post" => {
    _type,
    _key,
    featured,
    newsPost->{
      _id,
      title,
      subtitle,
      slug,
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
      publishedAt,
      tags[]->{
        _id,
        label,
      },
    },
  }
,
      
  _type == "grid-agenda" => {
    _type,
    _key,
    showTags,
    showDownloadButtons,
    showMetadata,
    agenda->{
      _id,
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
      regionalCommunities[]->{
        _id,
        name,
        slug,
        code
      }
    }
  }
,
      
  _type == "grid-case-study" => {
    _type,
    _key,
    showTags,
    showAuthors,
    showMetadata,
    showStudyPeriod,
    showLocation,
    customExcerpt,
    customLayout,
    // Properly filter case study by status - use select for conditional referencing
    "caseStudy": select(
      caseStudy->status == "approved" => caseStudy->{
        
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

      },
      null
    )
  }
,
      
  _type == "grid-news" => {
    _type,
    _key,
    showTags,
    showAuthor,
    showMetadata,
    showLocation,
    customExcerpt,
    newsPost->{
      _id,
      title,
      subtitle,
      excerpt,
      slug,
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
        image{
          asset->{
            _id,
            url
          },
          alt
        }
      },
      publishedAt,
      organizations[]->{
        _id,
        name,
        slug,
        acronym
      },
      locationDetails,
      tags[]->{
        _id,
        label,
        value,
        color
      },
      featured
    }
  }
,
      
  _type == "grid-lived-experience" => {
    _type,
    _key,
    showTags,
    showMetadata,
    showCommunity,
    showOrganizations,
    customExcerpt,
    livedExperience->{
      _id,
      title,
      excerpt,
      slug,
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
      videoUrl,
      duration,
      publishedAt,
      relatedCommunity->{
        _id,
        name,
        slug
      },
      organizations[]->{
        _id,
        name,
        slug,
        acronym
      },
      tags[]->{
        _id,
        label,
        value,
        color
      },
      featured
    }
  }
,
    },
  }

    },
    livedExperiences {
      
  _type == "carousel-2" => {
    _type,
    _key,
    title,
    description,
    padding,
    testimonial[]->{
      _id,
      name,
      // Localized job title (Lane B) with legacy single-language fallback.
      "title": coalesce(jobTitle, { "en": title }),
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
      // Localized rich quote object ({en,es,fr,ar}); the renderer resolves the
      // active locale. Falls back to wrapping the legacy single-language body.
      "quote": coalesce(quote, { "en": body }),
      rating,
      featured,
      relatedCommunity->{
        _id,
        name
      },
      organization->{
        _id,
        name
      },
      project->{
        _id,
        name
      },
    },
  }

    },
    regionalCommunities {
      
  _type == "grid-row" => {
    _type,
    _key,
    padding,
    background,
    title,
    subtitle,
    description,
    gridColumns,
    cardVariant,
    initialDisplayCount,
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
    columns[]{
      
  _type == "grid-card" => {
    _type,
    _key,
    title,
    excerpt,
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
    link{
      title,
      href,
      target,
      buttonVariant{
        variant,
        size,
        stroke
      }
    },
  }
,
      
  _type == "grid-post" => {
    _type,
    _key,
    featured,
    newsPost->{
      _id,
      title,
      subtitle,
      slug,
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
      publishedAt,
      tags[]->{
        _id,
        label,
      },
    },
  }
,
      
  _type == "grid-agenda" => {
    _type,
    _key,
    showTags,
    showDownloadButtons,
    showMetadata,
    agenda->{
      _id,
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
      regionalCommunities[]->{
        _id,
        name,
        slug,
        code
      }
    }
  }
,
      
  _type == "grid-case-study" => {
    _type,
    _key,
    showTags,
    showAuthors,
    showMetadata,
    showStudyPeriod,
    showLocation,
    customExcerpt,
    customLayout,
    // Properly filter case study by status - use select for conditional referencing
    "caseStudy": select(
      caseStudy->status == "approved" => caseStudy->{
        
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

      },
      null
    )
  }
,
      
  _type == "grid-news" => {
    _type,
    _key,
    showTags,
    showAuthor,
    showMetadata,
    showLocation,
    customExcerpt,
    newsPost->{
      _id,
      title,
      subtitle,
      excerpt,
      slug,
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
        image{
          asset->{
            _id,
            url
          },
          alt
        }
      },
      publishedAt,
      organizations[]->{
        _id,
        name,
        slug,
        acronym
      },
      locationDetails,
      tags[]->{
        _id,
        label,
        value,
        color
      },
      featured
    }
  }
,
      
  _type == "grid-lived-experience" => {
    _type,
    _key,
    showTags,
    showMetadata,
    showCommunity,
    showOrganizations,
    customExcerpt,
    livedExperience->{
      _id,
      title,
      excerpt,
      slug,
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
      videoUrl,
      duration,
      publishedAt,
      relatedCommunity->{
        _id,
        name,
        slug
      },
      organizations[]->{
        _id,
        name,
        slug,
        acronym
      },
      tags[]->{
        _id,
        label,
        value,
        color
      },
      featured
    }
  }
,
    },
  }

    },
    collaboration {
      
  _type == "split-row" => {
    _type,
    _key,
    padding,
    noGap,
    splitColumns[]{
      
  _type == "split-content" => {
    _type,
    _key,
    sticky,
    padding,
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
    link{
      title,
      href,
      target,
      buttonVariant{
        variant,
        size,
        stroke
      }
    },
  }
,
      
  _type == "split-cards-list" => {
    _type,
    _key,
    list[]{
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
    },
  }
,
      
  _type == "split-image" => {
    _type,
    _key,
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
      alt
    },
  }
,
      
  _type == "split-info-list" => {
    _type,
    _key,
    list[]{
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
      tags[],
    },
  }
,
    },
  }

    },
    news {
      mode,
      maxItems,
      
  _type == "grid-row" => {
    _type,
    _key,
    padding,
    background,
    title,
    subtitle,
    description,
    gridColumns,
    cardVariant,
    initialDisplayCount,
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
    columns[]{
      
  _type == "grid-card" => {
    _type,
    _key,
    title,
    excerpt,
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
    link{
      title,
      href,
      target,
      buttonVariant{
        variant,
        size,
        stroke
      }
    },
  }
,
      
  _type == "grid-post" => {
    _type,
    _key,
    featured,
    newsPost->{
      _id,
      title,
      subtitle,
      slug,
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
      publishedAt,
      tags[]->{
        _id,
        label,
      },
    },
  }
,
      
  _type == "grid-agenda" => {
    _type,
    _key,
    showTags,
    showDownloadButtons,
    showMetadata,
    agenda->{
      _id,
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
      regionalCommunities[]->{
        _id,
        name,
        slug,
        code
      }
    }
  }
,
      
  _type == "grid-case-study" => {
    _type,
    _key,
    showTags,
    showAuthors,
    showMetadata,
    showStudyPeriod,
    showLocation,
    customExcerpt,
    customLayout,
    // Properly filter case study by status - use select for conditional referencing
    "caseStudy": select(
      caseStudy->status == "approved" => caseStudy->{
        
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

      },
      null
    )
  }
,
      
  _type == "grid-news" => {
    _type,
    _key,
    showTags,
    showAuthor,
    showMetadata,
    showLocation,
    customExcerpt,
    newsPost->{
      _id,
      title,
      subtitle,
      excerpt,
      slug,
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
        image{
          asset->{
            _id,
            url
          },
          alt
        }
      },
      publishedAt,
      organizations[]->{
        _id,
        name,
        slug,
        acronym
      },
      locationDetails,
      tags[]->{
        _id,
        label,
        value,
        color
      },
      featured
    }
  }
,
      
  _type == "grid-lived-experience" => {
    _type,
    _key,
    showTags,
    showMetadata,
    showCommunity,
    showOrganizations,
    customExcerpt,
    livedExperience->{
      _id,
      title,
      excerpt,
      slug,
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
      videoUrl,
      duration,
      publishedAt,
      relatedCommunity->{
        _id,
        name,
        slug
      },
      organizations[]->{
        _id,
        name,
        slug,
        acronym
      },
      tags[]->{
        _id,
        label,
        value,
        color
      },
      featured
    }
  }
,
    },
  }

    },
    projectInfo {
      
  _type == "split-row" => {
    _type,
    _key,
    padding,
    noGap,
    splitColumns[]{
      
  _type == "split-content" => {
    _type,
    _key,
    sticky,
    padding,
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
    link{
      title,
      href,
      target,
      buttonVariant{
        variant,
        size,
        stroke
      }
    },
  }
,
      
  _type == "split-cards-list" => {
    _type,
    _key,
    list[]{
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
    },
  }
,
      
  _type == "split-image" => {
    _type,
    _key,
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
      alt
    },
  }
,
      
  _type == "split-info-list" => {
    _type,
    _key,
    list[]{
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
      tags[],
    },
  }
,
    },
  }

    },
    mentalHealthDefinition {
      
  _type == "cta-1" => {
    _type,
    _key,
    padding,
    background,
    sectionWidth,
    stackAlign,
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
  }

    },
    partnerLogos {
      
  _type == "logo-cloud-1" => {
    _type,
    _key,
    padding,
    title,
    description,
    layout,
    motionSpeed,
    images[]{
      ...,
      label,
      orgType,
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
  }

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

export async function getIndexHomepage(locale: Locale = "en"): Promise<Homepage | null> {
  // fetchIndexHomepage's original sanityFetch call omitted both
  // perspective/stega — same draft-preview requirement as getPageBySlug above.
  return queryPreviewable<Homepage | null>(INDEX_HOMEPAGE_QUERY, { language: locale });
}

// ---------------------------------------------------------------------------
// fetchTranslationsForHomepage — dead code (zero call sites). Unlike
// fetchTranslationsForPage above, the original has NO try/catch, so this
// throws through rather than degrading via `safe()`. It also has no `|| []`
// fallback on a plain miss — a query that resolves to `null` (no matching
// translation.metadata doc) is returned as `null`, not coerced to an empty
// array. Both differences from getPageTranslations are preserved exactly.
// ---------------------------------------------------------------------------

const HOMEPAGE_TRANSLATIONS_QUERY = `
      *[_type == "translation.metadata" && references($homepageId)][0]{
        "translations": translations[].value->{
          _id,
          language,
          slug
        }
      }.translations`;

export async function getHomepageTranslations(homepageId: string): Promise<PageTranslation[] | null> {
  return query<PageTranslation[] | null>(HOMEPAGE_TRANSLATIONS_QUERY, { homepageId });
}

// A third inline literal, structurally identical to PAGE_SLUGS_QUERY /
// RC_PAGE_SLUGS_QUERY above but querying `homepage` docs. Moved
// character-exact from the live fetchSanityHomepageStaticParams.
const HOMEPAGE_SLUGS_QUERY = `*[_type == "homepage" && defined(slug)]{
      _id,
      slug { current },
      language
    }`;

export async function getHomepageSlugs(): Promise<Array<{ id: string; slug: string; locale: Locale }>> {
  const rows = await query<RawSlugRow[] | null>(HOMEPAGE_SLUGS_QUERY);
  return (rows ?? [])
    .filter((r): r is RawSlugRow & { slug: { current: string } } => !!r.slug?.current)
    .map((r) => ({ id: r._id, slug: r.slug.current, locale: (r.language as Locale) || "en" }));
}
