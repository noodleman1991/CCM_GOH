import { describe, it, expect } from 'vitest'
import { redactUser } from '@/lib/services/user-redaction'

/**
 * Minimal user fixture covering every privacy-controlled field group.
 * redactUser accepts Partial<User>, so we only model what it touches.
 */
function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'private@example.com',
    phoneNumber: '+1234567890',
    city: 'Tel Aviv',
    country: 'IL',
    organization: 'ACME',
    position: 'Researcher',
    workBio: 'Works on things',
    workTypes: ['RESEARCH'],
    expertiseAreas: ['HEALTH'],
    linkedinProfile: 'https://linkedin.com/in/someone',
    personalWebsite: 'https://example.com',
    otherSocialLinks: ['https://social.example.com'],
    // privacy flags default to "hidden"
    showEmail: false,
    showPhoneNumber: false,
    showLocation: false,
    showWorkDetails: false,
    showSocialLinks: false,
    ...overrides
  } as any
}

describe('redactUser', () => {
  describe('non-owner viewers (anonymous)', () => {
    it('redacts email when showEmail is false', () => {
      const redacted = redactUser(makeUser(), null)
      expect(redacted.email).toBeNull()
    })

    it('redacts phone when showPhoneNumber is false', () => {
      const redacted = redactUser(makeUser(), null)
      expect(redacted.phoneNumber).toBeNull()
    })

    it('redacts location when showLocation is false', () => {
      const redacted = redactUser(makeUser(), null)
      expect(redacted.city).toBeNull()
      expect(redacted.country).toBeNull()
    })

    it('redacts work details when showWorkDetails is false', () => {
      const redacted = redactUser(makeUser(), null)
      expect(redacted.organization).toBeNull()
      expect(redacted.position).toBeNull()
      expect(redacted.workBio).toBeNull()
      expect(redacted.workTypes).toEqual([])
      expect(redacted.expertiseAreas).toEqual([])
    })

    it('redacts social links when showSocialLinks is false', () => {
      const redacted = redactUser(makeUser(), null)
      expect(redacted.linkedinProfile).toBeNull()
      expect(redacted.personalWebsite).toBeNull()
      expect(redacted.otherSocialLinks).toEqual([])
    })

    it('does not mutate the input user', () => {
      const user = makeUser()
      redactUser(user, null)
      expect(user.email).toBe('private@example.com')
      expect(user.workTypes).toEqual(['RESEARCH'])
    })
  })

  describe('non-owner viewers (authenticated, different user)', () => {
    it('still redacts hidden fields', () => {
      const redacted = redactUser(makeUser(), 'someone-else')
      expect(redacted.email).toBeNull()
      expect(redacted.phoneNumber).toBeNull()
      expect(redacted.city).toBeNull()
      expect(redacted.organization).toBeNull()
      expect(redacted.linkedinProfile).toBeNull()
    })
  })

  describe('opt-in visibility', () => {
    it('preserves fields whose show* flag is true', () => {
      const redacted = redactUser(
        makeUser({ showEmail: true, showLocation: true }),
        null
      )
      expect(redacted.email).toBe('private@example.com')
      expect(redacted.city).toBe('Tel Aviv')
      expect(redacted.country).toBe('IL')
      // others remain redacted
      expect(redacted.phoneNumber).toBeNull()
      expect(redacted.organization).toBeNull()
    })
  })

  describe('owner viewing own profile', () => {
    it('preserves all fields regardless of privacy flags', () => {
      const user = makeUser()
      const result = redactUser(user, 'user-1')
      expect(result.email).toBe('private@example.com')
      expect(result.phoneNumber).toBe('+1234567890')
      expect(result.city).toBe('Tel Aviv')
      expect(result.country).toBe('IL')
      expect(result.organization).toBe('ACME')
      expect(result.position).toBe('Researcher')
      expect(result.workBio).toBe('Works on things')
      expect(result.workTypes).toEqual(['RESEARCH'])
      expect(result.expertiseAreas).toEqual(['HEALTH'])
      expect(result.linkedinProfile).toBe('https://linkedin.com/in/someone')
      expect(result.personalWebsite).toBe('https://example.com')
      expect(result.otherSocialLinks).toEqual(['https://social.example.com'])
    })
  })
})
