import { isFiltering, type ActiveFilters } from "@/lib/filters/core";

/** Which view the news page shows. It is never an empty page (user, 2026-09-30). Pure. */
export type NewsView = "latest" | "results" | "noMatchesThenLatest";

export function newsView(active: ActiveFilters, matches: number): NewsView {
  if (!isFiltering(active)) return "latest";
  return matches > 0 ? "results" : "noMatchesThenLatest";
}
