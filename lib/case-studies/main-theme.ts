/** The first chosen tag whose category is `topic` — shown where the retired Topic used to be.
 *  A tag that no longer exists comes back as null from a dereferencing query; it is skipped. */
export function mainTheme<T extends { category?: string | null }>(tags: ReadonlyArray<T | null | undefined>): T | null {
  return tags.find((tag): tag is T => tag?.category === "topic") ?? null;
}
