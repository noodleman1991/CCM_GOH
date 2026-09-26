/**
 * The cache tags every Payload-backed read is stored under, and every
 * Payload write revalidates. Side-effect free, and outside `lib/content/` on
 * purpose: `payload/hooks/revalidate-content.ts` and `payload/hooks/moderation.ts`
 * need the same names, and the content-layer boundary
 * (`lib/__tests__/content-layer-boundary.test.ts`) forbids them from reaching
 * into `lib/content/internal/`.
 *
 * Two levels:
 *
 *   - `CONTENT_CACHE_TAG` (`"payload"`) is on every entry. It mirrors the
 *     Sanity arm's blanket `"sanity"` tag, and it is what every write fires
 *     today — a case study populates media, tags, authors and organizations
 *     at depth 2, so a write to any of those has to be able to reach the case
 *     study's cache entry, and a per-collection tag alone cannot.
 *   - `collectionCacheTag`/`globalCacheTag` are ALSO on every entry, so that a
 *     future narrowing (fire only the collections a write can affect) needs
 *     no change to the readers and no cache flush to take effect.
 */
export const CONTENT_CACHE_TAG = "payload";

export function collectionCacheTag(slug: string): string {
  return `${CONTENT_CACHE_TAG}:${slug}`;
}

export function globalCacheTag(slug: string): string {
  return `${CONTENT_CACHE_TAG}:global:${slug}`;
}
