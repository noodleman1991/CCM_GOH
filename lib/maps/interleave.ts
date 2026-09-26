/**
 * Merge per-type item lists so every active type is visible (2026-09-22).
 *
 * The Atlas fetches one list per content type and used to concatenate them,
 * sort by date and cut to the limit. With the strip capped at six and lived
 * experiences being the newest content, that produced six lived experiences
 * and nothing else — the map said four layers, the cards showed one type.
 *
 * Round-robin instead: each pass takes the newest remaining item from every
 * non-empty list, the passes ordered newest-head first. So the first N cards
 * cover all N types, and within a pass the order is still recency. Lists are
 * expected to arrive newest-first, as the fetchers return them.
 */
export function interleaveByType<T extends { date?: string | null }>(lists: T[][], limit: number): T[] {
  const queues = lists.map((list) => [...list]).filter((list) => list.length > 0);
  const out: T[] = [];
  while (out.length < limit && queues.some((q) => q.length > 0)) {
    const live = queues.filter((q) => q.length > 0).sort((a, b) => (b[0]?.date ?? "").localeCompare(a[0]?.date ?? ""));
    for (const queue of live) {
      if (out.length >= limit) break;
      const next = queue.shift();
      if (next) out.push(next);
    }
  }
  return out;
}
