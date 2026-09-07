/**
 * Types and one helper shared by more than one page-domain document module.
 *
 * Nothing here is re-exported from `lib/content/pages.ts` except
 * `ContentBlock` and `PageTranslation`, which were part of its public surface
 * before Task 14a split the file; the rest stayed private then and stays
 * private now.
 */
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

export interface RawOgImage {
  asset?: {
    _id: string;
    url: string;
    metadata?: { dimensions?: { width: number; height: number } };
  } | null;
  alt?: string;
}

/** A row from one of the three `*_SLUGS_QUERY` projections. */
export interface RawSlugRow {
  _id: string;
  slug?: { current?: string } | null;
  language?: string | null;
}

export interface PageTranslation {
  _id: string;
  language?: string;
  slug?: { current?: string };
}

/**
 * The shared tail of `getPageSlugs`, `getRegionalCommunityPageSlugs` and
 * `getHomepageSlugs`, which ran three character-identical copies of it before
 * Task 14a. Rows with no slug are dropped and a missing `language` defaults to
 * `en`, exactly as each copy did.
 */
export function toSlugRows(rows: RawSlugRow[] | null): Array<{ id: string; slug: string; locale: Locale }> {
  return (rows ?? [])
    .filter((r): r is RawSlugRow & { slug: { current: string } } => !!r.slug?.current)
    .map((r) => ({ id: r._id, slug: r.slug.current, locale: (r.language as Locale) || "en" }));
}
