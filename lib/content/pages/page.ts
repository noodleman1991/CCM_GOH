import "server-only";
import * as payloadPages from "@/lib/content/internal/payload/pages";
import { safe } from "@/lib/content/internal/safe";
import { query, queryPreviewable } from "@/lib/content/internal/sanity-source";
import type { Locale } from "@/lib/content/types";
import { CAROUSEL_1_PROJECTION, CAROUSEL_2_PROJECTION } from "./fragments/carousel";
import { CTA_1_PROJECTION } from "./fragments/cta";
import { GRID_ROW_PROJECTION } from "./fragments/grid";
import { HERO_1_PROJECTION, HERO_2_PROJECTION } from "./fragments/hero";
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
import {
  onPayload,
  toSlugRows,
  type ContentBlock,
  type PageTranslation,
  type RawOgImage,
  type RawSlugRow,
} from "./shared";

// ---------------------------------------------------------------------------
// Generic pages (app/[locale]/(main)/[...slug]/page.tsx) — moved from
// sanity/lib/fetch.ts's fetchSanityPageBySlug / fetchSanityPagesStaticParams /
// fetchTranslationsForPage.
//
// PAGE_QUERY below was moved character-exact (including every block-type
// projection's own comments) from sanity/queries/page.ts. That file composes
// it from 15 further fragment files (sanity/queries/hero/hero-1.ts, hero-2.ts,
// section-header.ts, split/split-row.ts, grid/grid-row.ts, team-grid.ts,
// carousel/carousel-1.ts, carousel-2.ts, timeline.ts, cta/cta-1.ts,
// logo-cloud/logo-cloud-1.ts, faqs.ts, forms/newsletter.ts, all-posts.ts,
// maps/region-map.ts). Task 14a restored those 15 under ./fragments/ as plain
// copies — the seam boundary still forbids importing anything under
// @/sanity/* other than through sanity-source.ts, and the originals were
// deleted with the rest of the Sanity query tree in `fc7bc7c40` anyway.
// Before that, the fully-resolved text was captured by importing the
// real PAGE_QUERY constant in a throwaway script and writing its resolved
// value to disk, rather than hand-transcribing 15 nested template literals —
// verified byte-identical to what PAGE_QUERY produces today (one of those 15
// fragments, grid-row.ts -> grid-case-study.ts, itself imports cachedFetch
// via an unused/dead import, which is what made a plain re-import of page.ts
// impossible without stubbing that unused import out for the capture step).
//
// `getPageBySlug` mirrors fetchSanityPageBySlug's own locale fallback: if the
// requested locale has no translation yet, retry with "en" rather than 404.
//
// Task 14a split this module out of the 8,550-line `lib/content/pages.ts`.
// The GROQ below is unchanged: the block projections it interpolates are the
// same `sanity/queries/**` fragments this file used to carry expanded inline,
// restored under `./fragments/` from commit `fc7bc7c40`, and the composed
// query string is byte-identical to the one that shipped before the split
// (`lib/__tests__/content-pages-queries.test.ts` pins it).
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
 *    `generatePageMetadata` (now lib/content/metadata.ts, moved off
 *    sanity/lib/metadata.ts and @/sanity.types by Task 10b), reads
 *    `page.meta_title` / `page.ogImage.asset.metadata.dimensions...`
 *    directly. Nesting them under `seo` the way the brief sketches would
 *    silently break Open Graph images and page titles site-wide unless
 *    `generatePageMetadata` were also restructured — out of scope for this task.
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

export const PAGE_QUERY = `
  *[_type == "page" && slug.current == $slug && language == $language][0]{
    blocks[]{
      ${HERO_1_PROJECTION},
      ${HERO_2_PROJECTION},
      ${SECTION_HEADER_PROJECTION},
      ${SPLIT_ROW_PROJECTION},
      ${GRID_ROW_PROJECTION},
      ${TEAM_GRID_PROJECTION},
      ${CAROUSEL_1_PROJECTION},
      ${CAROUSEL_2_PROJECTION},
      ${TIMELINE_ROW_PROJECTION},
      ${CTA_1_PROJECTION},
      ${LOGO_CLOUD_1_PROJECTION},
      ${FAQS_PROJECTION},
      ${FORM_NEWSLETTER_PROJECTION},
      ${ALL_POSTS_PROJECTION},
      ${REGION_MAP_PROJECTION},
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

/**
 * Task 14b swapped the three functions below; `blocks[]` is still 14c's.
 *
 * `internal/payload/pages.ts` reproduces the document envelope — the SEO
 * fields, `ogImage`, the English fallback and the null semantics — and returns
 * `blocks: null`, which `toPage` turns into the empty list. So a page on the
 * Payload arm renders its chrome and none of its blocks today, and the pages
 * domain must not be flipped until 14c maps the block families. That is a
 * visible, deliberate gap, not a silent one.
 */
export async function getPageBySlug(slug: string, locale: Locale): Promise<Page | null> {
  if (onPayload()) {
    const raw = await payloadPages.findPage(slug, locale);
    return raw ? toPage(raw as RawPageDoc, slug, locale) : null;
  }
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
export const PAGE_SLUGS_QUERY = `*[_type == "page" && defined(slug)]{
      _id,
      slug { current },
      language
    }`;

export async function getPageSlugs(): Promise<Array<{ id: string; slug: string; locale: Locale }>> {
  if (onPayload()) return toSlugRows(await payloadPages.pageSlugs());
  return toSlugRows(await query<RawSlugRow[] | null>(PAGE_SLUGS_QUERY));
}

// The original wraps this in try/catch, warning and degrading to `[]` on
// failure ("expected if internationalization isn't fully set up") — the same
// degrade-on-read shape every other domain module standardises through
// `safe()`. Also degrades to `[]` on a plain miss (no translation.metadata
// doc referencing this id), matching `data || []` in the original.
export const PAGE_TRANSLATIONS_QUERY = `
        *[_type == "translation.metadata" && references($pageId)][0]{
          "translations": translations[].value->{
            _id,
            language,
            slug
          }
        }.translations`;

export async function getPageTranslations(pageId: string): Promise<PageTranslation[]> {
  return safe("page-translations", [], async () => {
    if (onPayload()) return payloadPages.pageTranslations(pageId);
    const rows = await query<PageTranslation[] | null>(PAGE_TRANSLATIONS_QUERY, { pageId });
    return rows ?? [];
  });
}
