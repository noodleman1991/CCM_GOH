/**
 * Profile Completeness Utility
 * Calculates the completeness percentage of a user's profile based on filled fields
 * Following Next.js 15 best practices for server-side utilities
 */

type ProfileData = {
  firstName?: string | null
  lastName?: string | null
  username?: string | null
  email?: string | null
  image?: string | null
  bio?: string | null
  ageGroup?: string | null
  country?: string | null
  city?: string | null
  organization?: string | null
  position?: string | null
  workBio?: string | null
  workTypes?: string[] | null
  expertiseAreas?: string[] | null
  personalWebsite?: string | null
  linkedinProfile?: string | null
  phoneNumber?: string | null
}

/**
 * Field weights define the importance of each field in the profile
 * Total should add up to 100
 */
const FIELD_WEIGHTS = {
  // Core identity fields (30%)
  firstName: 5,
  lastName: 5,
  username: 5,
  email: 5,
  image: 10,

  // Bio and personal info (20%)
  bio: 10,
  ageGroup: 5,
  country: 3,
  city: 2,

  // Professional information (30%)
  organization: 5,
  position: 5,
  workBio: 10,
  workTypes: 5,
  expertiseAreas: 5,

  // Contact and social (20%)
  personalWebsite: 5,
  linkedinProfile: 5,
  phoneNumber: 10,
} as const

/**
 * Calculates the completeness percentage of a user profile
 * @param profile - The user profile data
 * @returns A number between 0 and 100 representing the completion percentage
 */
export function calculateProfileCompleteness(profile: ProfileData): number {
  if (!profile) return 0

  let totalScore = 0
  let maxPossibleScore = 0

  // Iterate through all defined field weights
  Object.entries(FIELD_WEIGHTS).forEach(([field, weight]) => {
    maxPossibleScore += weight
    const value = profile[field as keyof ProfileData]

    // Check if field has a meaningful value
    if (isFieldComplete(value)) {
      totalScore += weight
    }
  })

  // Calculate percentage
  const percentage = maxPossibleScore > 0
    ? Math.round((totalScore / maxPossibleScore) * 100)
    : 0

  return Math.min(100, Math.max(0, percentage))
}

/**
 * Checks if a field value is considered "complete"
 * @param value - The field value to check
 * @returns true if the field has a meaningful value
 */
function isFieldComplete(value: unknown): boolean {
  if (value === null || value === undefined) return false

  // String fields
  if (typeof value === 'string') {
    return value.trim().length > 0
  }

  // Array fields (workTypes, expertiseAreas)
  if (Array.isArray(value)) {
    return value.length > 0
  }

  // Boolean or other types
  return Boolean(value)
}

/**
 * Gets a list of missing fields for profile completion suggestions
 * @param profile - The user profile data
 * @returns Array of field names that are incomplete
 */
export function getMissingProfileFields(profile: ProfileData): string[] {
  const missing: string[] = []

  Object.keys(FIELD_WEIGHTS).forEach((field) => {
    const value = profile[field as keyof ProfileData]
    if (!isFieldComplete(value)) {
      missing.push(field)
    }
  })

  return missing
}

/**
 * Gets a human-readable profile completion status
 * @param percentage - The completion percentage
 * @returns A status string
 */
export function getProfileCompletenessStatus(percentage: number): {
  status: 'incomplete' | 'partial' | 'complete' | 'excellent'
  message: string
} {
  if (percentage >= 90) {
    return {
      status: 'excellent',
      message: 'Your profile is excellent! Great job!',
    }
  }

  if (percentage >= 70) {
    return {
      status: 'complete',
      message: 'Your profile is looking good!',
    }
  }

  if (percentage >= 40) {
    return {
      status: 'partial',
      message: 'Your profile is partially complete. Add more details to increase visibility.',
    }
  }

  return {
    status: 'incomplete',
    message: 'Complete your profile to connect with the community!',
  }
}
