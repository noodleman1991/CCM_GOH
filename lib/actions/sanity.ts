"use server"

import { unstable_cache } from 'next/cache'
import { sanityFetch } from "@/sanity/lib/live"
import { onboardingContentQueryWithFallback } from "@/sanity/queries/onboarding-content"
import { workTypesQuery, expertiseAreasQuery, userManagementOptionsQuery } from "@/sanity/queries/work-types"

// Cached onboarding content fetch with Next.js cache
const getCachedOnboardingContent = unstable_cache(
  async (locale: string) => {
    const response = await sanityFetch({
      query: onboardingContentQueryWithFallback,
      params: { locale }
    })
    return response.data
  },
  ['onboarding-content'],
  {
    revalidate: 3600, // Cache for 1 hour
    tags: ['onboarding-content']
  }
)

// Fetch onboarding content with fallback for missing translations
export async function getOnboardingContent(locale: string = 'en') {
  try {
    return await getCachedOnboardingContent(locale)
  } catch (error) {
    console.error('Error fetching onboarding content:', error)
    // Return minimal fallback content
    return {
      title: "Onboarding",
      welcomeTitle: "Welcome",
      welcomeSubtitle: "Let's get started",
      welcomeFeatures: [],
      welcomeSteps: [],
      getStartedText: "Get Started",
      timeEstimate: "Takes about 5 minutes",

      basicInfoTitle: "Basic Information",
      basicInfoDescription: "",
      basicInfoFieldHints: {},

      workInfoTitle: "Work & Expertise",
      workInfoDescription: "",
      workInfoFieldHints: {},

      recentWorkTitle: "Recent Work",
      recentWorkDescription: "",
      recentWorkFieldHints: {},

      privacyTitle: "Privacy Settings",
      privacyDescription: "",
      searchabilityTitle: "Profile Discoverability",
      searchabilityDescription: "",
      searchabilityHint: "",
      visibilityTitle: "Profile Visibility",
      visibilityDescription: "",
      visibilityOptions: {},
      profileInfoTitle: "Information Visibility",
      profileInfoDescription: "",
      privacyFieldHints: {},

      reviewTitle: "Almost Done!",
      reviewDescription: "",
      reviewReadyTitle: "Ready to Join",
      reviewReadyDescription: "",
      completeOnboardingText: "Complete Setup",

      redirectDialogTitle: "Complete Your Profile",
      redirectDialogMessage: "",
      proceedToOnboardingText: "Complete Profile",
      continueToHubText: "Continue to Hub",
      oneTimeWaiverText: "You can complete this later",

      navigationTexts: {
        next: "Next",
        previous: "Previous",
        continue: "Continue",
        cancel: "Cancel"
      }
    }
  }
}

// Cached user management options (work types + expertise areas)
const getCachedUserManagementOptions = unstable_cache(
  async (locale: string) => {
    const response = await sanityFetch({
      query: userManagementOptionsQuery,
      params: { locale }
    })
    return response.data
  },
  ['user-management-options'],
  {
    revalidate: 7200, // Cache for 2 hours (less frequent changes)
    tags: ['user-management', 'work-types', 'expertise-areas']
  }
)

// Cached work types only
const getCachedWorkTypes = unstable_cache(
  async (locale: string) => {
    const response = await sanityFetch({
      query: workTypesQuery,
      params: { locale }
    })
    return response.data
  },
  ['work-types'],
  {
    revalidate: 7200, // Cache for 2 hours
    tags: ['work-types']
  }
)

// Cached expertise areas only
const getCachedExpertiseAreas = unstable_cache(
  async (locale: string) => {
    const response = await sanityFetch({
      query: expertiseAreasQuery,
      params: { locale }
    })
    return response.data
  },
  ['expertise-areas'],
  {
    revalidate: 7200, // Cache for 2 hours
    tags: ['expertise-areas']
  }
)

// Fetch work types and expertise areas for user management
export async function getUserManagementOptions(locale: string = 'en') {
  try {
    return await getCachedUserManagementOptions(locale)
  } catch (error) {
    console.error('Error fetching user management options:', error)
    return {
      workTypes: [],
      expertiseAreas: []
    }
  }
}

// Fetch work types only
export async function getWorkTypes(locale: string = 'en') {
  try {
    return await getCachedWorkTypes(locale)
  } catch (error) {
    console.error('Error fetching work types:', error)
    return []
  }
}

// Fetch expertise areas only
export async function getExpertiseAreas(locale: string = 'en') {
  try {
    return await getCachedExpertiseAreas(locale)
  } catch (error) {
    console.error('Error fetching expertise areas:', error)
    return []
  }
}

// Helper function to revalidate cache when content changes
export async function revalidateSanityCache(tags: string[] = []) {
  const { revalidateTag } = await import('next/cache')

  if (tags.length === 0) {
    // Revalidate all Sanity content
    revalidateTag('onboarding-content')
    revalidateTag('work-types')
    revalidateTag('expertise-areas')
    revalidateTag('user-management')
  } else {
    tags.forEach(tag => revalidateTag(tag))
  }
}

// Alias for the new unified onboarding system
export const fetchOnboardingContent = getOnboardingContent