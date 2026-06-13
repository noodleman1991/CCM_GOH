import { describe, it, expect } from 'vitest'
import {
  FIELD_WEIGHTS,
  calculateProfileCompleteness,
  getMissingProfileFields
} from '@/lib/profile-completeness'

/** A profile with every weighted field meaningfully filled. */
const fullProfile = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  username: 'ada',
  email: 'ada@example.com',
  image: 'https://example.com/ada.png',
  bio: 'Mathematician and writer.',
  ageGroup: 'ABOVE_18',
  country: 'UK',
  city: 'London',
  organization: 'Analytical Engines Ltd',
  position: 'Engineer',
  workBio: 'Working on computation.',
  workTypes: ['RESEARCH'],
  expertiseAreas: ['MATH'],
  personalWebsite: 'https://ada.example.com',
  linkedinProfile: 'ada-lovelace',
  phoneNumber: '+44 123456',
  communityMemberships: [{ communityId: 'c1' }],
  recentWork: [{ id: 'w1', title: 'Notes on the Analytical Engine' }]
}

describe('FIELD_WEIGHTS', () => {
  it('sums to exactly 100', () => {
    const total = Object.values(FIELD_WEIGHTS).reduce((sum, w) => sum + w, 0)
    expect(total).toBe(100)
  })

  it('includes communityMemberships and recentWork', () => {
    expect(FIELD_WEIGHTS.communityMemberships).toBe(5)
    expect(FIELD_WEIGHTS.recentWork).toBe(5)
  })
})

describe('calculateProfileCompleteness', () => {
  it('returns 100 for a fully populated profile including communityMemberships and recentWork', () => {
    expect(calculateProfileCompleteness(fullProfile)).toBe(100)
  })

  it('returns 0 for an empty object', () => {
    expect(calculateProfileCompleteness({})).toBe(0)
  })

  it('returns 0 for a profile with only null/undefined values', () => {
    expect(
      calculateProfileCompleteness({
        firstName: null,
        lastName: undefined,
        workTypes: null,
        communityMemberships: null,
        recentWork: null
      })
    ).toBe(0)
  })

  it('maxes out at 90 when communityMemberships and recentWork are omitted (the old call-site bug)', () => {
    const { communityMemberships, recentWork, ...withoutRelations } = fullProfile
    expect(calculateProfileCompleteness(withoutRelations)).toBe(90)
  })

  it('returns the weighted sum for core identity fields only (25%)', () => {
    expect(
      calculateProfileCompleteness({
        firstName: 'Ada',
        lastName: 'Lovelace',
        username: 'ada',
        email: 'ada@example.com',
        image: 'https://example.com/ada.png'
      })
    ).toBe(25)
  })

  it('returns the weighted sum for a mixed partial profile', () => {
    // bio (8) + workTypes (6) + recentWork (5) = 19
    expect(
      calculateProfileCompleteness({
        bio: 'Hello',
        workTypes: ['RESEARCH'],
        recentWork: [{ id: 'w1' }]
      })
    ).toBe(19)
  })

  it('treats empty and whitespace-only strings as incomplete', () => {
    expect(calculateProfileCompleteness({ firstName: '', bio: '   ' })).toBe(0)
  })

  it('treats empty arrays as incomplete', () => {
    expect(
      calculateProfileCompleteness({
        workTypes: [],
        expertiseAreas: [],
        communityMemberships: [],
        recentWork: []
      })
    ).toBe(0)
  })
})

describe('getMissingProfileFields', () => {
  it('returns no fields for a fully populated profile', () => {
    expect(getMissingProfileFields(fullProfile)).toEqual([])
  })

  it('lists every weighted field for an empty profile', () => {
    const missing = getMissingProfileFields({})
    expect(missing.sort()).toEqual(Object.keys(FIELD_WEIGHTS).sort())
  })

  it('reports communityMemberships and recentWork as missing when empty arrays', () => {
    const missing = getMissingProfileFields({
      ...fullProfile,
      communityMemberships: [],
      recentWork: []
    })
    expect(missing).toEqual(['communityMemberships', 'recentWork'])
  })
})
