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
  headline: 'Researcher on computation & climate',
  bio: 'Mathematician and writer.',
  pronouns: 'she/her',
  ageGroup: 'ABOVE_18',
  motivation: 'I care about the planet.',
  country: 'UK',
  city: 'London',
  organization: 'Analytical Engines Ltd',
  position: 'Engineer',
  workBio: 'Working on computation.',
  workTypes: ['RESEARCH'],
  expertiseAreas: ['MATH'],
  focusTopics: ['climate-anxiety'],
  openToCollaboration: true,
  collaborationInterests: 'Open to co-authoring.',
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

  it('includes the domain-rich K4 fields', () => {
    expect(FIELD_WEIGHTS.headline).toBe(6)
    expect(FIELD_WEIGHTS.focusTopics).toBe(6)
    expect(FIELD_WEIGHTS.openToCollaboration).toBe(3)
    expect(FIELD_WEIGHTS.collaborationInterests).toBe(3)
    expect(FIELD_WEIGHTS.pronouns).toBe(1)
    expect(FIELD_WEIGHTS.motivation).toBe(2)
  })

  it('keeps community + recent work weighted', () => {
    expect(FIELD_WEIGHTS.communityMemberships).toBe(5)
    expect(FIELD_WEIGHTS.recentWork).toBe(5)
  })
})

describe('calculateProfileCompleteness', () => {
  it('returns 100 for a fully populated profile', () => {
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

  it('returns the weighted sum for core identity fields only (20%)', () => {
    // firstName 3 + lastName 3 + username 3 + email 3 + image 8 = 20
    expect(
      calculateProfileCompleteness({
        firstName: 'Ada',
        lastName: 'Lovelace',
        username: 'ada',
        email: 'ada@example.com',
        image: 'https://example.com/ada.png'
      })
    ).toBe(20)
  })

  it('counts the domain-rich fields toward completeness', () => {
    // headline 6 + focusTopics 6 + openToCollaboration 3 + collaborationInterests 3 = 18
    expect(
      calculateProfileCompleteness({
        headline: 'Climate researcher',
        focusTopics: ['eco-grief'],
        openToCollaboration: true,
        collaborationInterests: 'Looking for partners.'
      })
    ).toBe(18)
  })

  it('does not count openToCollaboration when false', () => {
    expect(calculateProfileCompleteness({ openToCollaboration: false })).toBe(0)
    expect(calculateProfileCompleteness({ openToCollaboration: true })).toBe(3)
  })

  it('returns the weighted sum for a mixed partial profile', () => {
    // bio (7) + workTypes (5) + recentWork (5) = 17
    expect(
      calculateProfileCompleteness({
        bio: 'Hello',
        workTypes: ['RESEARCH'],
        recentWork: [{ id: 'w1' }]
      })
    ).toBe(17)
  })

  it('treats empty and whitespace-only strings as incomplete', () => {
    expect(calculateProfileCompleteness({ firstName: '', bio: '   ' })).toBe(0)
  })

  it('treats empty arrays as incomplete', () => {
    expect(
      calculateProfileCompleteness({
        workTypes: [],
        expertiseAreas: [],
        focusTopics: [],
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

  it('reports domain-rich fields as missing when empty', () => {
    const missing = getMissingProfileFields({
      ...fullProfile,
      headline: null,
      focusTopics: [],
      openToCollaboration: false
    })
    expect(missing.sort()).toEqual(['focusTopics', 'headline', 'openToCollaboration'])
  })
})
