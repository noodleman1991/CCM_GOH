/**
 * Shared URL-param codec for the collaborate page filters.
 * Used by both the server page (decoding searchParams) and the client
 * (encoding filter state into router params) so the semantics stay in sync.
 *
 * Encoding scheme per category:
 * - all values selected  -> param omitted (no filter applied)
 * - nothing selected     -> 'none' sentinel (explicit empty: show no one)
 * - subset selected      -> comma-joined values
 */

export const NONE_SENTINEL = 'none'

export interface CollaborateFilterState {
  workTypes: string[]
  expertiseAreas: string[]
  communities: string[]
}

/** all selected -> undefined (omit param) | none selected -> 'none' | subset -> comma-joined */
export function encodeFilterParam(selected: string[], all: string[]): string | undefined {
  if (selected.length === 0) return NONE_SENTINEL
  if (selected.length >= all.length) return undefined
  return selected.join(',')
}

/** missing -> null (means "all", no filter) | 'none' -> [] | otherwise split */
export function decodeFilterParam(value: string | undefined): string[] | null {
  if (!value) return null
  if (value === NONE_SENTINEL) return []
  return value.split(',').filter(Boolean)
}

export function buildCollaborateParams(
  search: string,
  filters: CollaborateFilterState,
  all: { workTypes: string[]; expertiseAreas: string[]; communities: string[] }
): URLSearchParams {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  const wt = encodeFilterParam(filters.workTypes, all.workTypes)
  if (wt) params.set('workTypes', wt)
  const ea = encodeFilterParam(filters.expertiseAreas, all.expertiseAreas)
  if (ea) params.set('expertiseAreas', ea)
  const cm = encodeFilterParam(filters.communities, all.communities)
  if (cm) params.set('communities', cm)
  return params
}
