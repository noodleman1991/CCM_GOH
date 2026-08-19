import type { User } from '@/generated/prisma'

/**
 * Redacts user fields based on their privacy settings.
 * Always returns unredacted data for the user viewing their own profile.
 */
export function redactUser<T extends Partial<User>>(
  user: T,
  viewerId: string | null
): T {
  // Own profile — no redaction
  if (viewerId && user.id === viewerId) return user

  // Mutations happen on the Partial<User> view of the copy; the input extends
  // Partial<User>, so this only writes fields the schema already declares.
  const redacted: Partial<User> = { ...user }

  // Email redaction
  if (!user.showEmail) {
    redacted.email = null
  }

  // Phone redaction
  if (!user.showPhoneNumber) {
    redacted.phoneNumber = null
  }

  // Location redaction
  if (!user.showLocation) {
    redacted.city = null;
    redacted.country = null
  }

  // Work details redaction
  if (!user.showWorkDetails) {
    redacted.organization = null;
    redacted.position = null;
    redacted.workBio = null;
    redacted.workTypes = [];
    redacted.expertiseAreas = []
  }

  // Social links redaction
  if (!user.showSocialLinks) {
    redacted.linkedinProfile = null;
    redacted.personalWebsite = null;
    redacted.otherSocialLinks = []
  }

  // Lived-experience redaction — sensitive; opt-in only. Hidden unless the
  // user has explicitly chosen to show it on their public profile.
  if (!user.showLivedExperience) {
    redacted.livedExperienceStatement = null
  }

  return redacted as T
}
