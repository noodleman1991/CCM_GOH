/** The first chosen tag whose category is `topic` — shown where the retired Topic used to be. */
export function mainTheme<T extends { category?: string | null }>(tags: T[]): T | null {
  return tags.find((tag) => tag.category === "topic") ?? null;
}
