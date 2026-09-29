/** The admin home's "Recent changes" list — pure, safe for any admin component. */
export type Change = { label: string; href: string; updatedAt: string; kind: string };

/** The newest `n` changes, newest first. */
export function latestChanges(items: Change[], n: number): Change[] {
  return [...items].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0)).slice(0, n);
}
