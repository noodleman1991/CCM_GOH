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
  if (viewerId && (user as any).id === viewerId) return user

  const redacted = { ...user }

  // Email redaction
  if (!(user as any).showEmail) {
    (redacted as any).email = null
  }

  // Phone redaction
  if (!(user as any).showPhoneNumber) {
    (redacted as any).phoneNumber = null
  }

  // Location redaction
  if (!(user as any).showLocation) {
    (redacted as any).city = null;
    (redacted as any).country = null
  }

  // Work details redaction
  if (!(user as any).showWorkDetails) {
    (redacted as any).organization = null;
    (redacted as any).position = null;
    (redacted as any).workBio = null;
    (redacted as any).workTypes = [];
    (redacted as any).expertiseAreas = []
  }

  // Social links redaction
  if (!(user as any).showSocialLinks) {
    (redacted as any).linkedinProfile = null;
    (redacted as any).personalWebsite = null;
    (redacted as any).otherSocialLinks = []
  }

  return redacted
}
