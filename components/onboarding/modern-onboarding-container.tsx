"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useTranslations, useLocale } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "framer-motion"
import { toast } from "sonner"

import { Form } from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { rtlLocales } from "@/i18n/routing"
import { ModernContentArea } from "./modern-content-area"
import { WelcomePanel } from "./panels/welcome-panel"
import { BasicInfoPanel } from "./panels/basic-info-panel"
import { WorkInfoPanel } from "./panels/work-info-panel"
import { RecentWorkPanel } from "./panels/recent-work-panel"
import { PrivacyPanel } from "./panels/privacy-panel"
import { ReviewPanel } from "./panels/review-panel"

import {
  createOnboardingSchema,
  defaultOnboardingValues,
  getStepFieldNames,
  type OnboardingFormData
} from "@/lib/schemas/onboarding-schema"

interface ModernOnboardingContainerProps {
  initialData?: any
  userManagementOptions: any
  sanityContent: any
}

// sessionStorage key for in-progress onboarding state (step + form values).
// Session-scoped on purpose: survives refreshes, not cross-device/staleness.
const PROGRESS_STORAGE_KEY = "onboarding-progress"

export function ModernOnboardingContainer({
  initialData,
  userManagementOptions,
  sanityContent
}: ModernOnboardingContainerProps) {
  const router = useRouter()
  const t = useTranslations("onboarding")
  const validationT = useTranslations("errors.validation")
  const locale = useLocale()
  const isRTL = rtlLocales.includes(locale)

  // Use initialData passed from server component
  const user = initialData

  // Form and state management
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isReviewConfirmed, setIsReviewConfirmed] = useState(false)

  // Create dynamic schema
  const dynamicSchema = createOnboardingSchema(sanityContent?.validationMessages)

  // Helper function to map Sanity IDs to enum keys (for submission)
  // Filters out IDs that have no matching key to prevent raw Sanity IDs from reaching the API
  const mapSanityToEnumKeys = (sanityIds: string[], sanityData: any[]): string[] => {
    return sanityIds
      .map(id => {
        const item = sanityData.find(d => d._id === id)
        return item?.key
      })
      .filter((key): key is string => !!key)
  }

  // Helper function to reverse map enum keys to Sanity IDs (for pre-population)
  const mapEnumKeysToSanityIds = (enumKeys: string[], sanityData: any[]): string[] => {
    return enumKeys
      .map(enumKey => {
        const item = sanityData.find(d => d.key === enumKey)
        return item?._id
      })
      .filter(Boolean) as string[] // Remove any undefined values
  }

  const form = useForm({
    resolver: zodResolver(dynamicSchema),
    defaultValues: {
      ...defaultOnboardingValues,
      // Pre-populate with user data from server
      basicInfo: {
        ...defaultOnboardingValues.basicInfo,
        firstName: user?.firstName || defaultOnboardingValues.basicInfo.firstName,
        lastName: user?.lastName || defaultOnboardingValues.basicInfo.lastName,
        username: user?.username || defaultOnboardingValues.basicInfo.username,
        bio: user?.bio || defaultOnboardingValues.basicInfo.bio,
        ageGroup: user?.ageGroup || defaultOnboardingValues.basicInfo.ageGroup,
        country: user?.country || defaultOnboardingValues.basicInfo.country,
        city: user?.city || defaultOnboardingValues.basicInfo.city,
        preferredLanguage: user?.preferredLanguage || (locale.toUpperCase() as "EN" | "ES" | "FR" | "AR") || defaultOnboardingValues.basicInfo.preferredLanguage,
      },
      workInfo: {
        ...defaultOnboardingValues.workInfo,
        workTypes: user?.workTypes
          ? mapEnumKeysToSanityIds(user.workTypes, userManagementOptions?.workTypes || [])
          : defaultOnboardingValues.workInfo.workTypes,
        expertiseAreas: user?.expertiseAreas
          ? mapEnumKeysToSanityIds(user.expertiseAreas, userManagementOptions?.expertiseAreas || [])
          : defaultOnboardingValues.workInfo.expertiseAreas,
        communityIds: user?.communityIds || defaultOnboardingValues.workInfo.communityIds,
        organization: user?.organization || defaultOnboardingValues.workInfo.organization,
        position: user?.position || defaultOnboardingValues.workInfo.position,
        workBio: user?.workBio || defaultOnboardingValues.workInfo.workBio,
        linkedinProfile: user?.linkedinProfile || defaultOnboardingValues.workInfo.linkedinProfile,
        otherSocialLinks: user?.otherSocialLinks || defaultOnboardingValues.workInfo.otherSocialLinks,
        personalWebsite: user?.personalWebsite || defaultOnboardingValues.workInfo.personalWebsite,
      },
      recentWork: user?.recentWork || defaultOnboardingValues.recentWork,
      privacy: {
        ...defaultOnboardingValues.privacy,
        isSearchable: user?.isSearchable ?? defaultOnboardingValues.privacy.isSearchable,
        profileVisibility: user?.profileVisibility || defaultOnboardingValues.privacy.profileVisibility,
        showEmail: user?.showEmail ?? defaultOnboardingValues.privacy.showEmail,
        showPhoneNumber: user?.showPhoneNumber ?? defaultOnboardingValues.privacy.showPhoneNumber,
        showWorkDetails: user?.showWorkDetails ?? defaultOnboardingValues.privacy.showWorkDetails,
        showSocialLinks: user?.showSocialLinks ?? defaultOnboardingValues.privacy.showSocialLinks,
        showLocation: user?.showLocation ?? defaultOnboardingValues.privacy.showLocation,
      }
    },
    mode: "onChange"
  })

  // Steps configuration
  const steps = [
    {
      id: "welcome",
      title: sanityContent?.welcomeTitle || t("steps.welcome.title"),
      panel: WelcomePanel,
      isOptional: false
    },
    {
      id: "basicInfo",
      title: sanityContent?.basicInfoTitle || t("steps.basicInfo.title"),
      panel: BasicInfoPanel,
      isOptional: false
    },
    {
      id: "workInfo",
      title: sanityContent?.workInfoTitle || t("steps.workInfo.title"),
      panel: WorkInfoPanel,
      isOptional: false
    },
    {
      id: "recentWork",
      title: sanityContent?.recentWorkTitle || t("steps.recentWork.title"),
      panel: RecentWorkPanel,
      isOptional: true
    },
    {
      id: "privacy",
      title: sanityContent?.privacyTitle || t("steps.privacy.title"),
      panel: PrivacyPanel,
      isOptional: false
    },
    {
      id: "review",
      title: sanityContent?.reviewTitle || t("steps.review.title"),
      panel: ReviewPanel,
      isOptional: false
    }
  ]

  // --- Progress persistence (sessionStorage) ---
  // Only touched inside effects/handlers — never during render (SSR-safe).
  const totalSteps = steps.length
  const currentStepRef = useRef(currentStep)
  currentStepRef.current = currentStep

  // Restore saved progress on mount (ignore malformed payloads)
  const restoredRef = useRef(false)
  useEffect(() => {
    if (restoredRef.current) return
    restoredRef.current = true
    try {
      const raw = sessionStorage.getItem(PROGRESS_STORAGE_KEY)
      if (!raw) return
      const saved = JSON.parse(raw)
      if (!saved || typeof saved !== "object") return
      if (saved.values && typeof saved.values === "object" && typeof saved.values.basicInfo === "object") {
        // keepDefaultValues so the server-provided data stays the baseline
        form.reset(saved.values, { keepDefaultValues: true })
      }
      if (
        typeof saved.step === "number" &&
        Number.isInteger(saved.step) &&
        saved.step >= 0 &&
        saved.step < totalSteps
      ) {
        setCurrentStep(saved.step)
      }
    } catch {
      // Malformed or unavailable storage — start fresh
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const persistProgress = useCallback(() => {
    try {
      sessionStorage.setItem(
        PROGRESS_STORAGE_KEY,
        JSON.stringify({ step: currentStepRef.current, values: form.getValues() })
      )
    } catch {
      // Storage full/unavailable — persistence is best-effort
    }
  }, [form])

  // Persist immediately on step change
  useEffect(() => {
    persistProgress()
  }, [currentStep, persistProgress])

  // Persist form value changes, debounced ~500ms
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined
    const subscription = form.watch(() => {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(persistProgress, 500)
    })
    return () => {
      subscription.unsubscribe()
      if (timeout) clearTimeout(timeout)
    }
  }, [form, persistProgress])

  // Validation logic
  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    setValidationError(null)

    const stepFieldNames = getStepFieldNames(currentStep)
    if (stepFieldNames.length === 0) return true

    const isValid = await form.trigger(stepFieldNames)

    if (!isValid) {
      const errors = form.formState.errors
      console.log("Validation errors:", errors)
      setValidationError(validationT("requiredFields"))
    }

    return isValid
  }, [currentStep, form, validationT])

  // Navigation handlers
  const nextStep = useCallback(async () => {
    const isValid = await validateCurrentStep()
    if (!isValid) return

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      setValidationError(null)
    }
  }, [currentStep, validateCurrentStep])

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setValidationError(null)
    }
  }, [currentStep])

  // Form submission
  const handleSubmit = async (data: any) => {
    setIsSubmitting(true)
    setValidationError(null)

    try {
      // Final validation of all required steps
      const isValid = await form.trigger(["basicInfo", "workInfo", "privacy"])

      if (!isValid) {
        setValidationError(validationT("requiredFields"))
        return
      }

      // Transform data to match expected format with proper mapping
      const submissionData = {
        // Basic info
        firstName: data.basicInfo.firstName,
        lastName: data.basicInfo.lastName,
        username: data.basicInfo.username,
        bio: data.basicInfo.bio,
        ageGroup: data.basicInfo.ageGroup,
        country: data.basicInfo.country,
        city: data.basicInfo.city,
        preferredLanguage: data.basicInfo.preferredLanguage,

        // Work info - map Sanity IDs to enum keys
        workTypes: mapSanityToEnumKeys(data.workInfo.workTypes || [], userManagementOptions?.workTypes || []),
        expertiseAreas: mapSanityToEnumKeys(data.workInfo.expertiseAreas || [], userManagementOptions?.expertiseAreas || []),
        communityIds: data.workInfo.communityIds || [],
        organization: data.workInfo.organization,
        position: data.workInfo.position,
        workBio: data.workInfo.workBio,
        linkedinProfile: data.workInfo.linkedinProfile,
        otherSocialLinks: data.workInfo.otherSocialLinks || [],
        personalWebsite: data.workInfo.personalWebsite,

        // Recent work
        recentWork: data.recentWork || [],

        // Privacy
        isSearchable: data.privacy.isSearchable,
        profileVisibility: data.privacy.profileVisibility,
        showEmail: data.privacy.showEmail,
        showPhoneNumber: data.privacy.showPhoneNumber,
        showWorkDetails: data.privacy.showWorkDetails,
        showSocialLinks: data.privacy.showSocialLinks,
        showLocation: data.privacy.showLocation
      }

      // Submit with robust error handling
      let response
      try {
        response = await fetch('/api/onboarding/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submissionData)
        })
      } catch (networkError) {
        console.error('❌ Network error during onboarding submission:', networkError)
        throw new Error('Network connection failed. Please check your internet connection and try again.')
      }

      // Handle HTTP errors
      if (!response.ok) {
        let errorData
        try {
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json()
          } else {
            const htmlText = await response.text()
            console.error('❌ Received HTML instead of JSON:', htmlText.substring(0, 200))
            throw new Error('Server returned an unexpected response format. Please try again or contact support.')
          }
        } catch (parseError) {
          console.error('❌ Error parsing error response:', parseError)
          throw new Error(`Server error (${response.status}). Please try again or contact support.`)
        }

        // Handle specific error codes
        if (errorData.code === 'AUTH_REQUIRED') {
          throw new Error('You need to be logged in to complete onboarding.')
        } else if (errorData.code === 'VALIDATION_ERROR') {
          const fieldErrors = errorData.details?.map((d: any) => `${d.field}: ${d.message}`).join(', ')
          throw new Error(`Please correct the following: ${fieldErrors}`)
        } else if (errorData.code === 'USER_NOT_FOUND') {
          throw new Error('Your user account was not found. Please refresh and try again.')
        } else {
          throw new Error(errorData.error || `Server error (${response.status}). Please try again.`)
        }
      }

      // Parse successful response
      let result
      try {
        result = await response.json()
      } catch (parseError) {
        console.error('❌ Error parsing success response:', parseError)
        throw new Error('Onboarding may have completed, but we received an unexpected response. Please refresh to check your status.')
      }

      if (!result.success) {
        throw new Error(result.error || 'Onboarding submission failed')
      }

      console.log('✅ Onboarding completed:', result)

      // Clear persisted progress — onboarding is done
      try {
        sessionStorage.removeItem(PROGRESS_STORAGE_KEY)
      } catch {
        // Storage unavailable — nothing to clean up
      }

      // Show success message
      toast.success("Welcome! Your profile has been set up successfully.")

      // Navigate using Next.js router (NOT window.location)
      // router.refresh() tells Next.js to re-fetch server components with fresh session
      router.push(`/${locale}/collaborate`)
      router.refresh() // This gets fresh session data from Clerk
    } catch (error) {
      console.error("Submission error:", error)
      setValidationError(error instanceof Error ? error.message : "Failed to submit your information. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get current step component
  const CurrentPanel = steps[currentStep].panel

  return (
    <div className={cn(
      "h-screen bg-gray-50",
      isRTL && "font-arabic"
    )} dir={isRTL ? "rtl" : "ltr"}>
      {/* Main Content */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex-1 flex flex-col">
          <ModernContentArea
            currentStep={currentStep}
            totalSteps={steps.length}
            onNextAction={nextStep}
            onPreviousAction={prevStep}
            isSubmitting={isSubmitting}
            canGoNext={true}
            canGoPrevious={currentStep > 0}
            isConfirmed={isReviewConfirmed}
          >
            {/* Error Alert */}
            {validationError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{validationError}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            {/* Current Step Content */}
            <CurrentPanel
              form={form}
              content={sanityContent}
              isSubmitting={isSubmitting}
              workTypes={userManagementOptions?.workTypes || []}
              expertiseAreas={userManagementOptions?.expertiseAreas || []}
              communities={userManagementOptions?.communities || []}
              {...(userManagementOptions && { userManagementOptions })}
              onConfirmationChange={setIsReviewConfirmed}
            />
          </ModernContentArea>
        </form>
      </Form>

    </div>
  )
}
