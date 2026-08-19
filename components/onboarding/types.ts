import type { UseFormReturn } from "react-hook-form"
import type { z } from "zod"
import type { onboardingSchema } from "@/lib/schemas/onboarding-schema"

/**
 * react-hook-form field values for the onboarding wizard: the schema's INPUT
 * type (fields with .default() are optional on input), matching the values
 * type `useForm` infers from `zodResolver` — the same pattern as
 * components/forms/lived-experience-form.tsx.
 */
export type OnboardingFormValues = z.input<typeof onboardingSchema>

/** The shared form instance created in ModernOnboardingContainer and passed to every panel. */
export type OnboardingForm = UseFormReturn<OnboardingFormValues>

/** A flat CMS group of user-facing strings (labels, hints, placeholders). */
export type OnboardingLabelGroup = Record<string, string | undefined>

/**
 * The Sanity `onboardingContent` document as consumed by the wizard panels.
 * Every leaf is an optional string — panels fall back to next-intl messages
 * when a CMS value is missing.
 */
export interface OnboardingContent {
  language?: string

  // Welcome step
  welcomeTitle?: string
  welcomeDescription?: string
  welcomeFeatures?: Array<{ title?: string; description?: string }>
  gettingStartedTitle?: string
  gettingStartedDescription?: string

  // Step titles/descriptions
  basicInfoTitle?: string
  basicInfoDescription?: string
  workInfoTitle?: string
  workInfoDescription?: string
  recentWorkTitle?: string
  recentWorkDescription?: string
  privacyTitle?: string
  privacyDescription?: string
  reviewTitle?: string
  reviewDescription?: string

  // Field hints per step
  basicInfoFieldHints?: OnboardingLabelGroup
  workInfoFieldHints?: OnboardingLabelGroup

  // Field labels and placeholders
  fieldLabels?: {
    basicInfo?: OnboardingLabelGroup
    workInfo?: OnboardingLabelGroup
    recentWork?: OnboardingLabelGroup
  }
  fieldPlaceholders?: OnboardingLabelGroup
  privacyFieldLabels?: OnboardingLabelGroup
  reviewFieldLabels?: OnboardingLabelGroup

  // Redirect dialog
  redirectDialogTitle?: string
  redirectDialogMessage?: string
  proceedToOnboardingText?: string
  continueToHubText?: string
  oneTimeWaiverText?: string

  // Validation messages (consumed by createOnboardingSchema)
  validationMessages?: Record<string, OnboardingLabelGroup | undefined>
}

/** A Sanity-managed taxonomy option (work type / expertise area) as the wizard receives it. */
export interface OnboardingTaxonomyOption {
  _id: string
  key: string
  label: string
  description?: string
  order?: number
}

/** A joinable community option as the wizard receives it. */
export interface OnboardingCommunityOption {
  id: string
  name: string
  regionalName: string | null
  type: string
}

/** The taxonomy/communities payload the server page passes to the wizard. */
export interface OnboardingUserManagementOptions {
  workTypes?: OnboardingTaxonomyOption[]
  expertiseAreas?: OnboardingTaxonomyOption[]
  communities?: OnboardingCommunityOption[]
}

/** The pre-populated user profile fields the server passes as `initialData`. */
export interface OnboardingUserData {
  firstName?: string | null
  lastName?: string | null
  username?: string | null
  headline?: string | null
  bio?: string | null
  motivation?: string | null
  ageGroup?: "UNDER_18" | "ABOVE_18" | null
  country?: string | null
  city?: string | null
  preferredLanguage?: "EN" | "ES" | "FR" | "AR" | null
  workTypes?: string[] | null
  expertiseAreas?: string[] | null
  communityIds?: string[] | null
  organization?: string | null
  position?: string | null
  workBio?: string | null
  linkedinProfile?: string | null
  otherSocialLinks?: Array<{ platform: string; url: string }> | null
  personalWebsite?: string | null
  recentWork?: OnboardingFormValues["recentWork"] | null
  isSearchable?: boolean | null
  profileVisibility?: "PUBLIC" | "MEMBERS" | "PRIVATE" | null
  showEmail?: boolean | null
  showPhoneNumber?: boolean | null
  showWorkDetails?: boolean | null
  showSocialLinks?: boolean | null
  showLocation?: boolean | null
}
