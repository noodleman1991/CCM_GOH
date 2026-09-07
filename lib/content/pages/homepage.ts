import "server-only";
import * as payloadHomepage from "@/lib/content/internal/payload/homepage";
import { query, queryPreviewable } from "@/lib/content/internal/sanity-source";
import type { Locale } from "@/lib/content/types";
import {
  CAROUSEL_1_PROJECTION,
  CAROUSEL_2_PROJECTION,
  LIVED_EXPERIENCES_CAROUSEL_PROJECTION,
} from "./fragments/carousel";
import { CTA_1_PROJECTION, SUBMIT_STORY_BANNER_PROJECTION } from "./fragments/cta";
import { GRID_ROW_PROJECTION } from "./fragments/grid";
import { HERO_1_PROJECTION, HERO_2_PROJECTION } from "./fragments/hero";
import { SPLIT_ROW_PROJECTION } from "./fragments/split";
import {
  EVENTS_CALENDAR_PROJECTION,
  FAQS_PROJECTION,
  FORM_NEWSLETTER_PROJECTION,
  FRESH_CONTENT_PROJECTION,
  LOGO_CLOUD_1_PROJECTION,
  PEOPLE_WIDGET_PROJECTION,
  REGION_MAP_PROJECTION,
  SECTION_HEADER_PROJECTION,
  TIMELINE_ROW_PROJECTION,
} from "./fragments/standalone";
import {
  onPayload,
  toSlugRows,
  type ContentBlock,
  type PageTranslation,
  type RawOgImage,
  type RawSlugRow,
} from "./shared";

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
// Both queries below are moved character-exact from
// sanity/queries/homepage.ts, resolved the same way as PAGE_QUERY (./page.ts)
// and REGIONAL_COMMUNITY_PAGE_QUERY (./regional-community.ts).
//
// Task 14a split this module out of the 8,550-line `lib/content/pages.ts`.
// The GROQ below is unchanged: the block projections it interpolates are the
// same `sanity/queries/**` fragments this file used to carry expanded inline,
// restored under `./fragments/` from commit `fc7bc7c40`, and the composed
// query strings are byte-identical to the ones that shipped before the split
// (`lib/__tests__/content-pages-queries.test.ts` pins them).
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

/**
 * The freeform page-builder array. Named separately because `HOMEPAGE_QUERY`
 * projects it and `INDEX_HOMEPAGE_QUERY` does not — the live query composer
 * never added it to the second, hardcoded-slug variant.
 */
const HOMEPAGE_BLOCKS_PROJECTION = `
  blocks[]{
    ${HERO_1_PROJECTION},
    ${HERO_2_PROJECTION},
    ${SECTION_HEADER_PROJECTION},
    ${SPLIT_ROW_PROJECTION},
    ${GRID_ROW_PROJECTION},
    ${CAROUSEL_1_PROJECTION},
    ${CAROUSEL_2_PROJECTION},
    ${LIVED_EXPERIENCES_CAROUSEL_PROJECTION},
    ${TIMELINE_ROW_PROJECTION},
    ${CTA_1_PROJECTION},
    ${LOGO_CLOUD_1_PROJECTION},
    ${FAQS_PROJECTION},
    ${FORM_NEWSLETTER_PROJECTION},
    ${REGION_MAP_PROJECTION},
    ${PEOPLE_WIDGET_PROJECTION},
    ${EVENTS_CALENDAR_PROJECTION},
    ${SUBMIT_STORY_BANNER_PROJECTION},
    ${FRESH_CONTENT_PROJECTION},
  }
`;

/**
 * The eleven fixed slots, and the reason Task 14a was worth doing: this text
 * appeared **twice** in `lib/content/pages.ts`, once inside each homepage
 * query, character for character. Both now interpolate this one constant.
 *
 * `HOMEPAGE_QUERY` and `INDEX_HOMEPAGE_QUERY` differ only in their opening
 * filter (`$slug` against the literal `"index"`) and in whether they project
 * `blocks[]` above this. Everything from `heroWelcome` down — the eleven
 * slots, and the SEO fields after them — is shared.
 */
const HOMEPAGE_FIXED_SLOTS = `    heroWelcome {
      ${HERO_1_PROJECTION}
    },
    globalAgenda {
      ${SPLIT_ROW_PROJECTION}
    },
    howToUse {
      ${SPLIT_ROW_PROJECTION}
    },
    agendasModule {
      mode,
      maxItems,
      ${GRID_ROW_PROJECTION}
    },
    livedExperiences {
      ${CAROUSEL_2_PROJECTION}
    },
    regionalCommunities {
      ${GRID_ROW_PROJECTION}
    },
    collaboration {
      ${SPLIT_ROW_PROJECTION}
    },
    news {
      mode,
      maxItems,
      ${GRID_ROW_PROJECTION}
    },
    projectInfo {
      ${SPLIT_ROW_PROJECTION}
    },
    mentalHealthDefinition {
      ${CTA_1_PROJECTION}
    },
    partnerLogos {
      ${LOGO_CLOUD_1_PROJECTION}
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

export const HOMEPAGE_QUERY = `
  *[_type == "homepage" && slug.current == $slug && language == $language][0]{
    _id,
    title,
    slug,
    language,

    // Freeform page-builder blocks (preferred; the fixed sections below are
    // legacy and removed post-migration).
    ${HOMEPAGE_BLOCKS_PROJECTION},

    // Template sections based on JSON structure
${HOMEPAGE_FIXED_SLOTS}`;

export async function getHomepage(locale: Locale): Promise<Homepage | null> {
  // Task 14d. `internal/payload/homepage.ts` reads the four Sanity documents'
  // successor — one global with four locales — and rebuilds the eleven fixed
  // slots. It does NOT synthesize a `blocks` array from them; that ruling is
  // Phase 2's and is restated in the comment at the top of this file.
  if (onPayload()) return (await payloadHomepage.findHomepage(locale, "index")) as Homepage | null;
  // fetchSanityHomepageBySlug's original sanityFetch call omitted both
  // perspective/stega — same draft-preview requirement as getPageBySlug (./page.ts).
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
  // Task 14d. A global has no slug, and all four Sanity documents carry
  // `"index"`, so any other slug answers `null` — which is what the GROQ
  // filter `slug.current == $slug` answers for it too.
  if (onPayload()) return (await payloadHomepage.findHomepage(locale, slug)) as Homepage | null;
  // fetchHomepageBySlug's original sanityFetch call omitted both
  // perspective/stega — same draft-preview requirement as getPageBySlug (./page.ts).
  return queryPreviewable<Homepage | null>(HOMEPAGE_QUERY, { slug, language: locale });
}

// ---------------------------------------------------------------------------
// fetchIndexHomepage — dead code (zero call sites). INDEX_HOMEPAGE_QUERY
// below is moved character-exact from sanity/queries/homepage.ts, the same
// way as the other three big queries (./page.ts, ./regional-community.ts).
// Note it has NO `blocks[]` field at all (unlike HOMEPAGE_QUERY) — the live
// query composer never added the
// freeform page-builder projection to this second, hardcoded-slug variant.
// ---------------------------------------------------------------------------

export const INDEX_HOMEPAGE_QUERY = `
  *[_type == "homepage" && slug.current == "index" && language == $language][0]{
    _id,
    title,
    slug,
    language,

${HOMEPAGE_FIXED_SLOTS}`;

export async function getIndexHomepage(locale: Locale = "en"): Promise<Homepage | null> {
  // Task 14d. `blocks: false` because INDEX_HOMEPAGE_QUERY does not project
  // `blocks[]` at all — see the comment above the query — and a projection
  // emits the keys it names and no others.
  if (onPayload()) {
    return (await payloadHomepage.findHomepage(locale, "index", { blocks: false })) as Homepage | null;
  }
  // fetchIndexHomepage's original sanityFetch call omitted both
  // perspective/stega — same draft-preview requirement as getPageBySlug (./page.ts).
  return queryPreviewable<Homepage | null>(INDEX_HOMEPAGE_QUERY, { language: locale });
}

// ---------------------------------------------------------------------------
// fetchTranslationsForHomepage — dead code (zero call sites). Unlike
// getPageTranslations (./page.ts), the original has NO try/catch, so this
// throws through rather than degrading via `safe()`. It also has no `|| []`
// fallback on a plain miss — a query that resolves to `null` (no matching
// translation.metadata doc) is returned as `null`, not coerced to an empty
// array. Both differences from getPageTranslations are preserved exactly.
// ---------------------------------------------------------------------------

export const HOMEPAGE_TRANSLATIONS_QUERY = `
      *[_type == "translation.metadata" && references($homepageId)][0]{
        "translations": translations[].value->{
          _id,
          language,
          slug
        }
      }.translations`;

export async function getHomepageTranslations(homepageId: string): Promise<PageTranslation[] | null> {
  // Task 14d. Payload has no `translation.metadata`; see the reader for what it
  // answers instead and why nothing depends on the difference.
  if (onPayload()) return payloadHomepage.homepageTranslations(homepageId);
  return query<PageTranslation[] | null>(HOMEPAGE_TRANSLATIONS_QUERY, { homepageId });
}

// A third inline literal, structurally identical to PAGE_SLUGS_QUERY /
// RC_PAGE_SLUGS_QUERY (./page.ts, ./regional-community.ts) but querying
// `homepage` docs. Moved
// character-exact from the live fetchSanityHomepageStaticParams.
export const HOMEPAGE_SLUGS_QUERY = `*[_type == "homepage" && defined(slug)]{
      _id,
      slug { current },
      language
    }`;

export async function getHomepageSlugs(): Promise<Array<{ id: string; slug: string; locale: Locale }>> {
  if (onPayload()) return toSlugRows(await payloadHomepage.homepageSlugs());
  return toSlugRows(await query<RawSlugRow[] | null>(HOMEPAGE_SLUGS_QUERY));
}
