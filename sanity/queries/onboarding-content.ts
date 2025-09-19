import { groq } from 'next-sanity'

// Primary query for onboarding content with document-level internationalization
// Following Sanity 4 best practices: specific field selection, structured query, type safety
export const onboardingContentQuery = groq`
  *[_type == "onboardingContent" && language == $locale][0] {
    _id,
    _rev,
    title,
    language,

    // Welcome Step Content
    welcomeTitle,
    welcomeSubtitle,
    welcomeFeatures[] {
      title,
      description
    },
    welcomeSteps,
    getStartedText,
    timeEstimate,

    // Step Descriptions and Field Hints
    basicInfoTitle,
    basicInfoDescription,
    basicInfoFieldHints,
    workInfoTitle,
    workInfoDescription,
    workInfoFieldHints,
    recentWorkTitle,
    recentWorkDescription,
    recentWorkFieldHints,

    // Privacy Settings Content
    privacyTitle,
    privacyDescription,
    searchabilityTitle,
    searchabilityDescription,
    searchabilityHint,
    visibilityTitle,
    visibilityDescription,
    visibilityOptions,
    profileInfoTitle,
    profileInfoDescription,
    privacyFieldHints,

    // Review & Completion Content
    reviewTitle,
    reviewDescription,
    reviewReadyTitle,
    reviewReadyDescription,
    completeOnboardingText,

    // Redirect Dialog Content
    redirectDialogTitle,
    redirectDialogMessage,
    proceedToOnboardingText,
    continueToHubText,
    oneTimeWaiverText
  }
`

// Sanity 4 best practice: coalesce() for graceful fallbacks with type safety
// Tries requested locale first, then falls back to English, returns null if neither exists
export const onboardingContentQueryWithFallback = groq`
  coalesce(
    *[_type == "onboardingContent" && language == $locale][0],
    *[_type == "onboardingContent" && language == "en"][0]
  ) {
    _id,
    _rev,
    language,
    title,

    // Welcome Step
    welcomeTitle,
    welcomeSubtitle,
    welcomeFeatures,
    welcomeSteps,
    getStartedText,
    timeEstimate,

    // Step Descriptions and Hints
    basicInfoTitle,
    basicInfoDescription,
    basicInfoFieldHints,
    workInfoTitle,
    workInfoDescription,
    workInfoFieldHints,
    recentWorkTitle,
    recentWorkDescription,
    recentWorkFieldHints,

    // Privacy Settings
    privacyTitle,
    privacyDescription,
    searchabilityTitle,
    searchabilityDescription,
    searchabilityHint,
    visibilityTitle,
    visibilityDescription,
    visibilityOptions,
    profileInfoTitle,
    profileInfoDescription,
    privacyFieldHints,

    // Review & Submit
    reviewTitle,
    reviewDescription,
    reviewReadyTitle,
    reviewReadyDescription,
    completeOnboardingText,

    // Redirect Dialog
    redirectDialogTitle,
    redirectDialogMessage,
    proceedToOnboardingText,
    continueToHubText,
    oneTimeWaiverText
  }
`