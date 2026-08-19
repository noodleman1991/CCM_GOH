/**
 * TypeScript types for Sanity-Prisma integration
 *
 * These types ensure type safety when working with content from Sanity CMS
 * that corresponds to Prisma database enums and constraints.
 */

import { WorkType, ExpertiseArea, Language } from '../../generated/prisma'

// Base internationalized content types
export interface InternationalizedString {
  _key: string
  value: string
}

export interface InternationalizedText {
  _key: string
  value: string
}

export type SupportedLocale = 'en' | 'es' | 'fr' | 'ar'

// Sanity content types that correspond to Prisma enums

export interface SanityWorkType {
  _id: string
  _type: 'workType'
  key: WorkType // Must match Prisma enum exactly
  label: InternationalizedString[]
  description?: InternationalizedText[]
  order: number
  isActive: boolean
  _createdAt: string
  _updatedAt: string
}

export interface SanityExpertiseArea {
  _id: string
  _type: 'expertiseArea'
  key: ExpertiseArea // Must match Prisma enum exactly
  label: InternationalizedString[]
  description?: InternationalizedText[]
  order: number
  isActive: boolean
  _createdAt: string
  _updatedAt: string
}

export interface SanityOnboardingContent {
  _id: string
  _type: 'onboardingContent'
  language: 'en' | 'es' | 'fr' | 'ar'
  title: string

  // Welcome Step
  welcomeTitle: string
  welcomeSubtitle: string
  welcomeFeatures: {
    title: string
    description: string
  }[]
  welcomeSteps: string[]
  getStartedText: string
  timeEstimate: string

  // Step Descriptions
  basicInfoTitle: string
  basicInfoDescription: string
  basicInfoFieldHints: {
    usernameHint?: string
    bioHint?: string
    languageHint?: string
  }

  workInfoTitle: string
  workInfoDescription: string
  workInfoFieldHints: {
    workTypesDescription?: string
    expertiseDescription?: string
    workBioHint?: string
    socialLinksDescription?: string
  }

  recentWorkTitle: string
  recentWorkDescription: string
  recentWorkFieldHints: {
    workLinkHint?: string
    isOngoingHint?: string
    noWorkDescription?: string
  }

  // Privacy Settings
  privacyTitle: string
  privacyDescription: string
  searchabilityTitle: string
  searchabilityDescription: string
  searchabilityHint: string
  visibilityTitle: string
  visibilityDescription: string
  visibilityOptions: {
    publicTitle?: string
    publicDescription?: string
    membersTitle?: string
    membersDescription?: string
    privateTitle?: string
    privateDescription?: string
  }
  profileInfoTitle: string
  profileInfoDescription: string
  privacyFieldHints: {
    emailHint?: string
    phoneHint?: string
    workHint?: string
    socialHint?: string
    locationHint?: string
  }

  // Review & Submit
  reviewTitle: string
  reviewDescription: string
  reviewReadyTitle: string
  reviewReadyDescription: string
  completeOnboardingText: string

  // Redirect Dialog
  redirectDialogTitle: string
  redirectDialogMessage: string
  proceedToOnboardingText: string
  continueToHubText: string
  oneTimeWaiverText: string

  // Navigation
  navigationTexts: {
    next: string
    previous: string
    continue: string
    cancel: string
  }

  _createdAt: string
  _updatedAt: string
}

// Processed types for use in components (with proper locale fallbacks)

export interface WorkTypeOption {
  key: WorkType
  label: string // Localized label
  description?: string // Localized description
  isActive: boolean
  order: number
}

export interface ExpertiseAreaOption {
  key: ExpertiseArea
  label: string // Localized label
  description?: string // Localized description
  isActive: boolean
  order: number
}

// User management query results
export interface UserManagementOptions {
  workTypes: WorkTypeOption[]
  expertiseAreas: ExpertiseAreaOption[]
}

// Helper function type for extracting localized content
export type LocalizeContent<T> = (
  content: InternationalizedString[] | InternationalizedText[],
  locale: SupportedLocale,
  fallback?: string
) => string

// Validation types for Sanity-Prisma sync
export interface SyncValidationResult {
  workTypes: {
    valid: boolean
    errors: string[]
  }
  expertiseAreas: {
    valid: boolean
    errors: string[]
  }
}

export interface MissingSanityContent {
  missingWorkTypes: WorkType[]
  missingExpertiseAreas: ExpertiseArea[]
}

export interface SyncHealthCheck {
  isHealthy: boolean
  validation: SyncValidationResult
  missing: MissingSanityContent
  recommendations: string[]
}

// Admin component props for key field management
export interface AdminKeyFieldProps {
  value?: string
  onChange: (value: string) => void
  schemaType: {
    title?: string
    description?: string
    options?: {
      adminEmails?: string[]
    }
  }
  isAdmin: boolean
  isNewDocument: boolean
}

// Cache types for Sanity data
export interface CachedSanityData<T> {
  data: T
  timestamp: number
  tags: string[]
}

export interface SanityFetchOptions {
  query: string
  params?: Record<string, unknown>
  revalidate?: number
  tags?: string[]
}

// Error types for Sanity operations
export interface SanityError extends Error {
  details?: {
    type: string
    description: string
  }
  statusCode?: number
}

// Webhook payload types for real-time updates
export interface SanityWebhookPayload {
  _type: string
  _id: string
  _rev: string
  projectId: string
  dataset: string
}

export interface WorkTypeWebhookPayload extends SanityWebhookPayload {
  _type: 'workType'
  key: WorkType
  isActive: boolean
}

export interface ExpertiseAreaWebhookPayload extends SanityWebhookPayload {
  _type: 'expertiseArea'
  key: ExpertiseArea
  isActive: boolean
}

export interface OnboardingContentWebhookPayload extends SanityWebhookPayload {
  _type: 'onboardingContent'
  language: SupportedLocale
}

export type SanityWebhookEvent =
  | WorkTypeWebhookPayload
  | ExpertiseAreaWebhookPayload
  | OnboardingContentWebhookPayload

// Form integration types
export interface OnboardingFormData {
  // Basic Info
  username: string
  bio: string
  firstName: string
  lastName: string
  ageGroup: 'UNDER_18' | 'ABOVE_18'
  country: string
  city: string
  preferredLanguage: Language

  // Work Info
  workTypes: WorkType[]
  expertiseAreas: ExpertiseArea[]
  organization?: string
  position?: string
  workBio?: string
  personalWebsite?: string
  linkedinProfile?: string
  otherSocialLinks?: Array<{platform: string, url: string}>

  // Recent Work
  recentWork: {
    title: string
    description: string
    link?: string
    isOngoing: boolean
    startDate: Date
    endDate?: Date
  }[]

  // Privacy
  isSearchable: boolean
  profileVisibility: 'PUBLIC' | 'MEMBERS' | 'PRIVATE'
  showEmail: boolean
  showPhoneNumber: boolean
  showWorkDetails: boolean
  showSocialLinks: boolean
  showLocation: boolean
}

// Component prop types for onboarding steps
export interface OnboardingStepProps {
  data: OnboardingFormData
  updateData?: (data: Partial<OnboardingFormData>) => void
  updateDataAction?: (data: Partial<OnboardingFormData>) => void
  onNext?: () => void
  onNextAction?: () => void
  onPrev: () => void
  isFirst: boolean
  isLast: boolean
  content?: SanityOnboardingContent
  workTypes?: WorkTypeOption[]
  expertiseAreas?: ExpertiseAreaOption[]
}

// Utility types for content management
export type SanityDocumentType = 'workType' | 'expertiseArea' | 'onboardingContent'

export interface DocumentTemplate {
  _type: SanityDocumentType
  [key: string]: unknown
}

export interface SanityMutationResult {
  _id: string
  _type: string
  _createdAt?: string
  _updatedAt?: string
}