import { describe, it, expect } from 'vitest'
import {
  NONE_SENTINEL,
  encodeFilterParam,
  decodeFilterParam,
  buildCollaborateParams
} from '@/lib/collaborate-filters'

const ALL = ['A', 'B', 'C']

describe('encodeFilterParam', () => {
  it('omits the param (undefined) when all values are selected', () => {
    expect(encodeFilterParam(['A', 'B', 'C'], ALL)).toBeUndefined()
  })

  it('omits the param when selected is a superset of all', () => {
    expect(encodeFilterParam(['A', 'B', 'C', 'D'], ALL)).toBeUndefined()
  })

  it('yields the none sentinel when nothing is selected', () => {
    expect(encodeFilterParam([], ALL)).toBe(NONE_SENTINEL)
    expect(NONE_SENTINEL).toBe('none')
  })

  it('comma-joins a subset', () => {
    expect(encodeFilterParam(['A', 'C'], ALL)).toBe('A,C')
  })
})

describe('decodeFilterParam', () => {
  it('returns null for a missing param (means "all", no filter)', () => {
    expect(decodeFilterParam(undefined)).toBeNull()
    expect(decodeFilterParam('')).toBeNull()
  })

  it('returns [] for the none sentinel', () => {
    expect(decodeFilterParam('none')).toEqual([])
  })

  it('splits comma-joined values and drops empty segments', () => {
    expect(decodeFilterParam('A,C')).toEqual(['A', 'C'])
    expect(decodeFilterParam('A,,C,')).toEqual(['A', 'C'])
  })
})

describe('round-trips', () => {
  it('subset round-trips through encode/decode', () => {
    const encoded = encodeFilterParam(['B', 'C'], ALL)
    expect(decodeFilterParam(encoded)).toEqual(['B', 'C'])
  })

  it('empty selection round-trips to []', () => {
    const encoded = encodeFilterParam([], ALL)
    expect(decodeFilterParam(encoded)).toEqual([])
  })

  it('all-selected round-trips to null (no filter)', () => {
    const encoded = encodeFilterParam(['A', 'B', 'C'], ALL)
    expect(decodeFilterParam(encoded)).toBeNull()
  })
})

describe('buildCollaborateParams', () => {
  const all = {
    workTypes: ['W1', 'W2'],
    expertiseAreas: ['E1', 'E2'],
    communities: ['C1', 'C2']
  }

  it('produces no params when everything is selected and no search', () => {
    const params = buildCollaborateParams(
      '',
      { workTypes: ['W1', 'W2'], expertiseAreas: ['E1', 'E2'], communities: ['C1', 'C2'] },
      all
    )
    expect(params.toString()).toBe('')
  })

  it('sets search when provided', () => {
    const params = buildCollaborateParams(
      'amit',
      { workTypes: ['W1', 'W2'], expertiseAreas: ['E1', 'E2'], communities: ['C1', 'C2'] },
      all
    )
    expect(params.get('search')).toBe('amit')
    expect(params.get('workTypes')).toBeNull()
  })

  it('encodes subsets and none-sentinels per category', () => {
    const params = buildCollaborateParams(
      '',
      { workTypes: ['W1'], expertiseAreas: [], communities: ['C1', 'C2'] },
      all
    )
    expect(params.get('workTypes')).toBe('W1')
    expect(params.get('expertiseAreas')).toBe('none')
    expect(params.get('communities')).toBeNull()
  })
})
