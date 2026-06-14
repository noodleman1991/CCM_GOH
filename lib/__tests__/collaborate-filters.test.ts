import { describe, it, expect } from 'vitest'
import {
  encodeFilterParam,
  decodeFilterParam,
  buildCollaborateParams
} from '@/lib/collaborate-filters'

// Inclusion model: state holds only what the user actively selected.
// empty = no filter (show everyone); subset = show only those.

describe('encodeFilterParam', () => {
  it('omits the param (undefined) when nothing is selected', () => {
    expect(encodeFilterParam([])).toBeUndefined()
  })

  it('comma-joins a selected subset', () => {
    expect(encodeFilterParam(['A', 'C'])).toBe('A,C')
  })

  it('handles a single selection', () => {
    expect(encodeFilterParam(['A'])).toBe('A')
  })
})

describe('decodeFilterParam', () => {
  it('returns [] for a missing param (no filter)', () => {
    expect(decodeFilterParam(undefined)).toEqual([])
    expect(decodeFilterParam('')).toEqual([])
  })

  it('splits comma-joined values and drops empty segments', () => {
    expect(decodeFilterParam('A,C')).toEqual(['A', 'C'])
    expect(decodeFilterParam('A,,C,')).toEqual(['A', 'C'])
  })
})

describe('round-trips', () => {
  it('subset round-trips through encode/decode', () => {
    const encoded = encodeFilterParam(['B', 'C'])
    expect(decodeFilterParam(encoded)).toEqual(['B', 'C'])
  })

  it('empty selection round-trips to [] (no filter)', () => {
    const encoded = encodeFilterParam([])
    expect(decodeFilterParam(encoded)).toEqual([])
  })
})

describe('buildCollaborateParams', () => {
  it('produces no params when nothing is selected and no search', () => {
    const params = buildCollaborateParams('', {
      workTypes: [],
      expertiseAreas: [],
      communities: [],
    })
    expect(params.toString()).toBe('')
  })

  it('sets search when provided', () => {
    const params = buildCollaborateParams('amit', {
      workTypes: [],
      expertiseAreas: [],
      communities: [],
    })
    expect(params.get('search')).toBe('amit')
    expect(params.get('workTypes')).toBeNull()
  })

  it('encodes only the selected categories', () => {
    const params = buildCollaborateParams('', {
      workTypes: ['W1'],
      expertiseAreas: [],
      communities: ['C1', 'C2'],
    })
    expect(params.get('workTypes')).toBe('W1')
    expect(params.get('expertiseAreas')).toBeNull()
    expect(params.get('communities')).toBe('C1,C2')
  })
})
