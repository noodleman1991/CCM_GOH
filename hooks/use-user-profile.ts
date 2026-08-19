import { useState, useEffect, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { useUser } from '@clerk/nextjs'
import { isRTL } from '@/i18n/i18n-helpers'
import type { 
  LocalizedUser, 
  UserProfileUpdateData,
  SupportedLocale 
} from '@/types/prisma'

interface Community {
  id: string
  name: Record<string, string> | string
  type: string
  regionalName: string | null
}

interface RecentWork {
  id: string
  title: string
  description: string | null
  link: string | null
  startDate: Date
  endDate: Date | null
  isOngoing: boolean
}

interface UseUserProfileReturn {
  user: LocalizedUser | null
  communities: Community[]
  recentWork: RecentWork[]
  loading: boolean
  error: string | null
  updating: boolean
  updateProfile: (data: UserProfileUpdateData) => Promise<boolean>
  refreshProfile: () => Promise<void>
  isRTL: boolean
  locale: SupportedLocale
}

interface ApiResponse {
  success?: boolean
  user?: LocalizedUser
  error?: string
  message?: string
  details?: Array<{ field: string; message: string }>
}

/**
 * Hook for managing user profile with TypeScript safety and i18n support
 */
export function useUserProfile(): UseUserProfileReturn {
  const [user, setUser] = useState<LocalizedUser | null>(null)
  const [communities, setCommunities] = useState<Community[]>([])
  const [recentWork, setRecentWork] = useState<RecentWork[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  const locale = useLocale() as SupportedLocale
  const { user: clerkUser, isLoaded } = useUser()
  const currentIsRTL = isRTL(locale)

  /**
   * Fetch user profile with current locale
   */
  const fetchProfile = useCallback(async () => {
    if (!clerkUser?.id || !isLoaded) {
      setLoading(false)
      return
    }

    try {
      setError(null)
      const response = await fetch('/api/profile', {
        headers: {
          'Accept-Language': locale,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        // Check if response is HTML (redirect) instead of JSON
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('text/html')) {
          // This means we got redirected (likely to sign-in)
          throw new Error('Authentication required. Please sign in.')
        }
        
        try {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch profile')
        } catch (parseError) {
          throw new Error('Failed to fetch profile. Please try again.')
        }
      }

      const profileData: LocalizedUser & {
        _locale: SupportedLocale
        _isRTL: boolean
        availableCommunities?: Community[]
        recentWork?: RecentWork[]
      } = await response.json()

      // Ensure the profile has all required computed fields
      const enhancedProfile: LocalizedUser = {
        ...profileData,
        displayName: profileData.displayName || generateDisplayName(profileData, currentIsRTL),
        fullName: profileData.fullName || generateFullName(profileData),
        initials: profileData.initials || generateInitials(profileData)
      }

      setUser(enhancedProfile)

      // Set communities and recent work from API response
      if (profileData.availableCommunities) {
        setCommunities(profileData.availableCommunities)
      }
      if (profileData.recentWork) {
        setRecentWork(profileData.recentWork)
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }, [clerkUser?.id, isLoaded, locale, currentIsRTL])

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (data: UserProfileUpdateData): Promise<boolean> => {
    if (!clerkUser?.id) {
      setError('User not authenticated')
      return false
    }

    setUpdating(true)
    setError(null)

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': locale
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        // Check if response is HTML (redirect) instead of JSON
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('text/html')) {
          throw new Error('Authentication required. Please sign in.')
        }
        
        try {
          const result: ApiResponse = await response.json()
          if (result.details) {
            // Handle validation errors
            const errorMessages = result.details.map(d => `${d.field}: ${d.message}`).join(', ')
            throw new Error(`Validation errors: ${errorMessages}`)
          }
          throw new Error(result.error || 'Failed to update profile')
        } catch (parseError) {
          throw new Error('Failed to update profile. Please try again.')
        }
      }

      const result: ApiResponse = await response.json()

      if (result.success && result.user) {
        const enhancedUser: LocalizedUser = {
          ...result.user,
          displayName: result.user.displayName || generateDisplayName(result.user, currentIsRTL),
          fullName: result.user.fullName || generateFullName(result.user),
          initials: result.user.initials || generateInitials(result.user)
        }
        setUser(enhancedUser)
        return true
      }

      return false
    } catch (err) {
      console.error('Profile update failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to update profile')
      return false
    } finally {
      setUpdating(false)
    }
  }, [clerkUser?.id, locale, currentIsRTL])

  /**
   * Refresh profile data
   */
  const refreshProfile = useCallback(async () => {
    setLoading(true)
    await fetchProfile()
  }, [fetchProfile])

  // Initial fetch
  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return {
    user,
    communities,
    recentWork,
    loading,
    error,
    updating,
    updateProfile,
    refreshProfile,
    isRTL: currentIsRTL,
    locale
  }
}

/**
 * Generate display name with RTL support
 */
function generateDisplayName(user: Partial<LocalizedUser>, isRTL: boolean): string {
  if (user.firstName && user.lastName) {
    return isRTL 
      ? `${user.lastName} ${user.firstName}` // Arabic: family name first
      : `${user.firstName} ${user.lastName}`
  }
  
  if (user.firstName) return user.firstName
  if (user.lastName) return user.lastName
  if (user.username) return user.username
  
  return 'Anonymous User'
}

/**
 * Generate full name
 */
function generateFullName(user: Partial<LocalizedUser>): string {
  const fullName = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(' ')
  
  return fullName || user.username || 'Anonymous User'
}

/**
 * Generate user initials
 */
function generateInitials(user: Partial<LocalizedUser>): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
  }
  
  if (user.firstName) return user.firstName.charAt(0).toUpperCase()
  if (user.lastName) return user.lastName.charAt(0).toUpperCase()
  if (user.username) return user.username.charAt(0).toUpperCase()
  
  return 'A'
}

/**
 * Hook for user statistics
 */
export function useUserStats(userId?: string) {
  const [stats, setStats] = useState<{
    profileCompleteness: number
    totalCommunities: number
    totalRecentWork: number
    joinedDate: Date | null
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/profile/stats?userId=${userId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch user stats')
        }
        
        const data = await response.json()
        setStats({
          ...data,
          joinedDate: data.joinedDate ? new Date(data.joinedDate) : null
        })
      } catch (err) {
        console.error('Failed to fetch user stats:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch stats')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [userId])

  return { stats, loading, error }
}

export default useUserProfile