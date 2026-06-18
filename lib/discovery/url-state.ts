import type { DiscoveryConfig, SortId } from "./registry";
import type { TimeFrame } from "@/lib/filters/time-frame";

/**
 * Discovery state <-> URL querystring. One serialize/parse pair used by every
 * list page, so filters/sort/search are shareable and back-button-correct.
 *
 * Encoding:
 *   q       — search text
 *   sort    — sort id
 *   tf      — time-frame preset
 *   <facetId> — comma-separated selected values (one param per facet)
 */

export type DiscoveryState = {
  q: string;
  sort: SortId;
  timeFrame: TimeFrame;
  /** facetId -> selected values */
  facets: Record<string, string[]>;
};

export function emptyState(config: DiscoveryConfig): DiscoveryState {
  return {
    q: "",
    sort: config.defaultSort,
    timeFrame: "any",
    facets: Object.fromEntries(config.facets.map((f) => [f.id, []])),
  };
}

const RESERVED = new Set(["q", "sort", "tf"]);

export function parseDiscoveryState(
  config: DiscoveryConfig,
  params: URLSearchParams
): DiscoveryState {
  const state = emptyState(config);

  const q = params.get("q");
  if (q) state.q = q;

  const sort = params.get("sort");
  if (sort && config.sorts.some((s) => s.id === sort)) state.sort = sort as SortId;

  const tf = params.get("tf");
  if (config.timeFrame && tf && ["any", "year", "threeYears", "fiveYears"].includes(tf)) {
    state.timeFrame = tf as TimeFrame;
  }

  for (const facet of config.facets) {
    const raw = params.get(facet.id);
    if (raw) {
      state.facets[facet.id] = raw.split(",").map((v) => v.trim()).filter(Boolean);
    }
  }
  return state;
}

export function serializeDiscoveryState(
  config: DiscoveryConfig,
  state: DiscoveryState
): URLSearchParams {
  const params = new URLSearchParams();
  if (state.q.trim()) params.set("q", state.q.trim());
  if (state.sort !== config.defaultSort) params.set("sort", state.sort);
  if (config.timeFrame && state.timeFrame !== "any") params.set("tf", state.timeFrame);
  for (const facet of config.facets) {
    const vals = state.facets[facet.id];
    if (vals && vals.length > 0 && !RESERVED.has(facet.id)) {
      params.set(facet.id, vals.join(","));
    }
  }
  return params;
}

/** Toggle a value in a facet's multi-select (or set single). */
export function toggleFacetValue(
  state: DiscoveryState,
  facetId: string,
  value: string,
  multi: boolean
): DiscoveryState {
  const current = state.facets[facetId] ?? [];
  let next: string[];
  if (!multi) {
    next = current.includes(value) ? [] : [value];
  } else {
    next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
  }
  return { ...state, facets: { ...state.facets, [facetId]: next } };
}

export function hasActiveFilters(config: DiscoveryConfig, state: DiscoveryState): boolean {
  if (state.q.trim()) return true;
  if (config.timeFrame && state.timeFrame !== "any") return true;
  return config.facets.some((f) => (state.facets[f.id]?.length ?? 0) > 0);
}
