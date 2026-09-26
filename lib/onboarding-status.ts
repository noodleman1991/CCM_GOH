type ClaimsLike = Record<string, unknown> | null | undefined

/**
 * Single source of truth for "has this user finished onboarding".
 *
 * Tolerant of every key variant historically written to Clerk session
 * claims (publicMetadata vs metadata claim; onboardingCompleted vs
 * onboardingComplete), so old tokens issued before the key unification
 * still validate. Canonical writes use publicMetadata.onboardingCompleted.
 *
 * Pure function with no Node-only dependencies — safe in middleware.
 */
export function isOnboardingComplete(claims: ClaimsLike): boolean {
  if (!claims) return false
  const pm = (claims.publicMetadata ?? claims.metadata ?? {}) as Record<string, unknown>
  return Boolean(pm.onboardingCompleted ?? pm.onboardingComplete ?? false)
}
