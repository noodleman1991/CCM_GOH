/**
 * Shared URL-param codec for the collaborate page filters.
 * Used by both the server page (decoding searchParams) and the client
 * (encoding filter state into router params) so the semantics stay in sync.
 *
 * INCLUSION model (intuitive): the filter state holds only what the user has
 * actively selected.
 * - nothing selected -> param omitted -> NO filter (show everyone)
 * - some selected    -> comma-joined values -> show only matches
 *
 * (This replaced an earlier "exclusion" model where everything started selected
 * and you unchecked to hide — which did the opposite of what users expect.)
 */

export interface CollaborateFilterState {
  workTypes: string[]
  expertiseAreas: string[]
  communities: string[]
}

/** selected subset -> comma-joined | empty -> undefined (omit param = no filter) */
export function encodeFilterParam(selected: string[]): string | undefined {
  if (!selected || selected.length === 0) return undefined
  return selected.join(',')
}

/** missing/empty -> [] (no filter) | otherwise split */
export function decodeFilterParam(value: string | undefined): string[] {
  if (!value) return []
  return value.split(',').filter(Boolean)
}

export function buildCollaborateParams(
  search: string,
  filters: CollaborateFilterState
): URLSearchParams {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  const wt = encodeFilterParam(filters.workTypes)
  if (wt) params.set('workTypes', wt)
  const ea = encodeFilterParam(filters.expertiseAreas)
  if (ea) params.set('expertiseAreas', ea)
  const cm = encodeFilterParam(filters.communities)
  if (cm) params.set('communities', cm)
  return params
}
