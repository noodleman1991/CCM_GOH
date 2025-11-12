import type { LocalizedUser } from '@/types/prisma'

interface ProfilePrivacyChecks {
  showEmail: boolean
  showPhone: boolean
  showLocation: boolean
  showWork: boolean
  showSocial: boolean
  isOwnProfile: boolean
}

/**
 * Hook for checking profile privacy settings in UI components
 * Works with pre-redacted data from getUserForProfile
 * Defense-in-depth: Server redacts data, UI double-checks
 */
export function useProfilePrivacy(
  user: LocalizedUser | null,
  viewerId: string | null
): ProfilePrivacyChecks {
  if (!user) {
    return {
      showEmail: false,
      showPhone: false,
      showLocation: false,
      showWork: false,
      showSocial: false,
      isOwnProfile: false
    }
  }

  const isOwnProfile = user.id === viewerId

  return {
    // Always show own profile, otherwise check privacy setting
    showEmail: isOwnProfile || user.showEmail,
    showPhone: isOwnProfile || user.showPhoneNumber,
    showLocation: isOwnProfile || user.showLocation,
    showWork: isOwnProfile || user.showWorkDetails,
    showSocial: isOwnProfile || user.showSocialLinks,
    isOwnProfile
  }
}

export default useProfilePrivacy
