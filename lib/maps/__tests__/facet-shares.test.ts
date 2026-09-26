import { describe, expect, it } from 'vitest'
import { facetShares } from '../facet-shares'
import { RC_SLUG_TO_REGION, REGION_CODES, REGION_TO_RC_SLUG } from '../region-codes'
import type { FacetId } from '../region-facets'

describe('facetShares', () => {
  it('splits the total by active layer, dropping zero-count layers', () => {
    const shares = facetShares(
      { caseStudyCount: 11, livedExpCount: 4, memberCount: 0 },
      ['caseStudyCount', 'livedExpCount', 'memberCount'] as FacetId[]
    )
    expect(shares.map((s) => s.id)).toEqual(['caseStudyCount', 'livedExpCount'])
    expect(shares[0].count).toBe(11)
    expect(shares[0].share).toBeCloseTo(11 / 15)
    expect(shares.reduce((sum, s) => sum + s.share, 0)).toBeCloseTo(1)
  })

  it('ignores counts for layers that are not active', () => {
    const shares = facetShares(
      { caseStudyCount: 5, newsCount: 5 },
      ['caseStudyCount'] as FacetId[]
    )
    expect(shares).toHaveLength(1)
    expect(shares[0].share).toBe(1)
  })

  it('returns [] when every active layer is empty', () => {
    expect(facetShares({}, ['caseStudyCount'] as FacetId[])).toEqual([])
    expect(facetShares({ caseStudyCount: 0 }, ['caseStudyCount'] as FacetId[])).toEqual([])
  })
})

describe('region ↔ community-slug mapping (spotlight CTA + art keying)', () => {
  it('round-trips every region code through its community slug', () => {
    for (const code of REGION_CODES) {
      const slug = REGION_TO_RC_SLUG[code]
      expect(slug, `slug for ${code}`).toBeTruthy()
      expect(RC_SLUG_TO_REGION[slug]).toBe(code)
    }
  })
})
