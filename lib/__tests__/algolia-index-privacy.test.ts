import { describe, it, expect } from 'vitest'
import { transformUserForIndex } from '@/lib/algolia'

const baseUser = {
  id: 'u1',
  username: 'jdoe',
  firstName: 'Jane',
  lastName: 'Doe',
  isSearchable: true,
  profileVisibility: 'PUBLIC' as const,
  city: 'Nairobi',
  country: 'Kenya',
  organization: 'Climate Org',
  position: 'Researcher',
  workTypes: ['research'],
  expertiseAreas: ['climate'],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-06-01'),
  role: 'USER',
  communityMemberships: [],
}

describe('transformUserForIndex — privacy at index time', () => {
  it('includes location and work details when the user allows it', () => {
    const r = transformUserForIndex({ ...baseUser, showLocation: true, showWorkDetails: true })
    expect(r.city).toBe('Nairobi')
    expect(r.country).toBe('Kenya')
    expect(r.location).toBe('Nairobi, Kenya')
    expect(r.organization).toBe('Climate Org')
    expect(r.position).toBe('Researcher')
    expect(r.workTypes).toEqual(['research'])
    expect(r.expertiseAreas).toEqual(['climate'])
  })

  it('omits location from the index when showLocation is false', () => {
    const r = transformUserForIndex({ ...baseUser, showLocation: false, showWorkDetails: true })
    expect(r.city).toBeUndefined()
    expect(r.country).toBeUndefined()
    expect(r.location).toBeUndefined()
    // work details still present
    expect(r.organization).toBe('Climate Org')
  })

  it('omits work details from the index when showWorkDetails is false', () => {
    const r = transformUserForIndex({ ...baseUser, showLocation: true, showWorkDetails: false })
    expect(r.organization).toBeUndefined()
    expect(r.position).toBeUndefined()
    expect(r.workTypes).toEqual([])
    expect(r.expertiseAreas).toEqual([])
    // location still present
    expect(r.city).toBe('Nairobi')
  })

  it('never indexes a user who opted out of search', () => {
    expect(() => transformUserForIndex({ ...baseUser, isSearchable: false })).toThrow()
  })

  it('treats missing show* flags as "show" (default-true, matches schema defaults)', () => {
    // baseUser deliberately omits the show* flags entirely
    const r = transformUserForIndex({ ...baseUser })
    expect(r.city).toBe('Nairobi')
    expect(r.organization).toBe('Climate Org')
  })
})
