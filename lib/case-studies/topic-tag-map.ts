/**
 * Retired case-study topic → theme tag SLUG (`value.current` — the same slug
 * the list page's `tags` filter matches against, not a tag `_id`). Filled from
 * the user-confirmed dry-run table (plan Task 16).
 */
export const LEGACY_TOPIC_TO_TAG: Record<string, string> = {};

/**
 * An old `?topics=` link's values, converted to the theme-tag slugs the
 * `tags` filter actually matches (`lib/content/case-studies.ts`'s
 * `tags[]->value.current`). An unmapped/unknown topic is dropped rather than
 * erroring; duplicate slugs (two topics mapping to the same tag) are removed.
 */
export function legacyTopicsToTagSlugs(
  topics: string[],
  map: Record<string, string> = LEGACY_TOPIC_TO_TAG,
): string[] {
  const slugs = topics.map((topic) => map[topic]).filter((slug): slug is string => Boolean(slug));
  return Array.from(new Set(slugs));
}
