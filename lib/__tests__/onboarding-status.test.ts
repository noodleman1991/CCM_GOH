import { describe, it, expect } from 'vitest'
import { isOnboardingComplete } from '@/lib/onboarding-status'

describe('isOnboardingComplete', () => {
  it('reads publicMetadata.onboardingCompleted', () => {
    expect(isOnboardingComplete({ publicMetadata: { onboardingCompleted: true } })).toBe(true)
  })

  it('reads legacy publicMetadata.onboardingComplete', () => {
    expect(isOnboardingComplete({ publicMetadata: { onboardingComplete: true } })).toBe(true)
  })

  it('reads legacy metadata.onboardingComplete', () => {
    expect(isOnboardingComplete({ metadata: { onboardingComplete: true } })).toBe(true)
  })

  it('reads metadata.onboardingCompleted', () => {
    expect(isOnboardingComplete({ metadata: { onboardingCompleted: true } })).toBe(true)
  })

  it('false when flags are explicitly false', () => {
    expect(isOnboardingComplete({ publicMetadata: { onboardingCompleted: false } })).toBe(false)
    expect(isOnboardingComplete({ metadata: { onboardingComplete: false } })).toBe(false)
  })

  it('false when absent or null', () => {
    expect(isOnboardingComplete({})).toBe(false)
    expect(isOnboardingComplete({ publicMetadata: {} })).toBe(false)
    expect(isOnboardingComplete(undefined)).toBe(false)
    expect(isOnboardingComplete(null)).toBe(false)
  })

  it('prefers publicMetadata over metadata when both present', () => {
    expect(
      isOnboardingComplete({
        publicMetadata: { onboardingCompleted: true },
        metadata: { onboardingComplete: false }
      })
    ).toBe(true)
  })
})
