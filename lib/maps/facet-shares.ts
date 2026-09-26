import type { FacetId } from '@/lib/maps/region-facets'

export type FacetShare = { id: FacetId; count: number; share: number }

/**
 * The Regional-spotlight composition bar's math (mock v6 §3): each ACTIVE
 * layer's share of the selected region's total, zero-count layers dropped.
 * Shares always sum to 1 (the bar is full-width whenever anything shows).
 */
export function facetShares(
  byFacet: Partial<Record<FacetId, number>>,
  layers: FacetId[]
): FacetShare[] {
  const counts = layers
    .map((id) => ({ id, count: byFacet[id] ?? 0 }))
    .filter((s) => s.count > 0)
  const total = counts.reduce((sum, s) => sum + s.count, 0)
  if (total === 0) return []
  return counts.map((s) => ({ ...s, share: s.count / total }))
}
