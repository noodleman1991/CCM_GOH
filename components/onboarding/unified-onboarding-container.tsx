"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations, useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, CheckCircle, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Form } from "@/components/ui/form"
import { cn } from "@/lib/utils"
import { rtlLocales } from "@/i18n/routing"

import {
  createOnboardingSchema,
  defaultOnboardingValues,
  stepSchemas,
  getStepFieldNames,
  type OnboardingFormData
} from "@/lib/schemas/onboarding-schema"

// Import panel components
import { WelcomePanel } from "./panels/welcome-panel"
import { BasicInfoPanel } from "./panels/basic-info-panel"
import { WorkInfoPanel } from "./panels/work-info-panel"
import { RecentWorkPanel } from "./panels/recent-work-panel"
import { PrivacyPanel } from "./panels/privacy-panel"
import { ReviewPanel } from "./panels/review-panel"

import { fetchOnboardingContent } from "@/lib/actions/sanity"
import { fetchUserManagementOptions } from "@/lib/actions/sync-user-management"

const defaultSteps = [
  { id: "welcome", title: "Welcome", panel: WelcomePanel },
  { id: "basic-info", title: "Basic Info", panel: BasicInfoPanel },
  { id: "work-info", title: "Work & Expertise", panel: WorkInfoPanel },
  { id: "recent-work", title: "Recent Work", panel: RecentWorkPanel },
  { id: "privacy", title: "Privacy Settings", panel: PrivacyPanel },
  { id: "review", title: "Review & Submit", panel: ReviewPanel }
]

export default function UnifiedOnboardingContainer() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sanityContent, setSanityContent] = useState<any>(null)
  const [userManagementOptions, setUserManagementOptions] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [dynamicSchema, setDynamicSchema] = useState<any>(null)

  const t = useTranslations("onboarding")
  const locale = useLocale()
  const router = useRouter()
  const isRTL = rtlLocales.includes(locale)

  // Single form instance for the entire onboarding flow - will be updated when schema is ready
  const form = useForm({
    resolver: dynamicSchema ? zodResolver(dynamicSchema) : undefined,
    defaultValues: defaultOnboardingValues,
    mode: "onChange"
  }) as any

  // Get step titles with Sanity content fallbacks
  const getStepTitle = (stepIndex: number) => {
    const stepId = defaultSteps[stepIndex].id
    return sanityContent?.stepTitles?.[stepId] || defaultSteps[stepIndex].title
  }

  // Get dynamic steps with Sanity titles
  const steps = defaultSteps.map((step, index) => ({
    ...step,
    title: getStepTitle(index)
  }))

  // Load content and options
  useEffect(() => {
    const loadData = async () => {
      try {
        const [content, options] = await Promise.all([
          fetchOnboardingContent(locale),
          fetchUserManagementOptions()
        ])

        setSanityContent(content)
        setUserManagementOptions(options)

        // Create dynamic schema with Sanity validation messages
        const schema = createOnboardingSchema(content?.validationMessages)
        setDynamicSchema(schema)
      } catch (error) {
        console.error("Failed to load onboarding data:", error)
        // Fallback to default schema
        setDynamicSchema(createOnboardingSchema())
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [locale])

  // Update form resolver when schema changes
  useEffect(() => {
    if (dynamicSchema) {
      // Reset form with new schema
      form.reset(defaultOnboardingValues)
    }
  }, [dynamicSchema, form])

  // Validate current step
  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    setValidationError(null)

    if (currentStep === 0) return true // Welcome step always valid

    const fieldNames = getStepFieldNames(currentStep)
    if (fieldNames.length === 0) return true

    try {
      const isValid = await form.trigger(fieldNames)

      if (!isValid) {
        const errors = form.formState.errors
        let errorMessage = "Please fix the following errors before continuing:"

        // Collect error messages for display
        const errorMessages: string[] = []
        fieldNames.forEach(fieldName => {
          const fieldError = errors[fieldName]
          if (fieldError && typeof fieldError === 'object') {
            Object.values(fieldError).forEach(error => {
              if (error && typeof error === 'object' && 'message' in error) {
                errorMessages.push(error.message as string)
              }
            })
          }
        })

        if (errorMessages.length > 0) {
          errorMessage += "\n• " + errorMessages.join("\n• ")
        }

        setValidationError(errorMessage)
      }

      return isValid
    } catch (error) {
      console.error("Validation error:", error)
      setValidationError("An error occurred during validation. Please try again.")
      return false
    }
  }, [currentStep, form])

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

  const goToStep = useCallback(async (stepIndex: number) => {
    if (stepIndex === currentStep) return

    if (stepIndex > currentStep) {
      // Validate current step before moving forward
      const isValid = await validateCurrentStep()
      if (!isValid) return
    }

    setCurrentStep(stepIndex)
    setValidationError(null)
  }, [currentStep, validateCurrentStep])

  // Form submission
  const handleSubmit = async (data: any) => {
    setIsSubmitting(true)
    setValidationError(null)

    try {
      // Final validation of all required steps
      const isValid = await form.trigger(["basicInfo", "workInfo", "privacy"])

      if (!isValid) {
        setValidationError("Please complete all required fields before submitting.")
        return
      }

      // Transform data to match expected format
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

        // Work info
        workTypes: data.workInfo.workTypes,
        expertiseAreas: data.workInfo.expertiseAreas,
        organization: data.workInfo.organization,
        position: data.workInfo.position,
        workBio: data.workInfo.workBio,
        linkedinProfile: data.workInfo.linkedinProfile,
        portfolio: data.workInfo.portfolio,
        githubProfile: data.workInfo.githubProfile,
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

      // Submit to our new API endpoint
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Submission failed')
      }

      const result = await response.json()
      console.log('✅ Onboarding completed:', result)

      router.push("/collaborate")
    } catch (error) {
      console.error("Submission error:", error)
      setValidationError("Failed to submit your information. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get navigation button texts
  const getNextButtonText = () => {
    if (isSubmitting) return t("submitting")
    if (currentStep === steps.length - 1) return t("submit")
    return sanityContent?.navigationTexts?.continue || t("continue")
  }

  const getPrevButtonText = () => {
    return sanityContent?.navigationTexts?.back || t("back")
  }

  // Calculate progress
  const progress = ((currentStep + 1) / steps.length) * 100

  if (isLoading || !dynamicSchema) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const CurrentPanel = steps[currentStep].panel

  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4", isRTL && "font-arabic")} dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-4xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            {/* Progress Header */}
            <div className="mb-8">
              <div className={cn("flex items-center justify-between mb-4", isRTL && "flex-row-reverse")}>
                <h1 className="text-2xl font-bold text-gray-900">
                  {sanityContent?.title || t("title")}
                </h1>
                <div className="text-sm text-gray-600">
                  {currentStep + 1} / {steps.length}
                </div>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Step Indicators */}
            <div className={cn("flex justify-center mb-8", isRTL && "flex-row-reverse")}>
              <div className={cn("flex space-x-4", isRTL && "space-x-reverse")}>
                {steps.map((step, index) => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => goToStep(index)}
                    className={cn(
                      "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isRTL && "space-x-reverse",
                      index === currentStep
                        ? "bg-primary text-primary-foreground"
                        : index < currentStep
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    )}
                  >
                    {index < currentStep ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <div className={cn(
                        "w-4 h-4 rounded-full flex items-center justify-center text-xs",
                        index === currentStep ? "bg-white text-primary" : "bg-gray-300"
                      )}>
                        {index + 1}
                      </div>
                    )}
                    <span className="hidden sm:inline">{step.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content */}
            <Card>
              <CardContent className="p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CurrentPanel
                      form={form}
                      content={sanityContent}
                      workTypes={userManagementOptions?.workTypes}
                      expertiseAreas={userManagementOptions?.expertiseAreas}
                      isSubmitting={isSubmitting}
                    />
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Validation Error */}
            {validationError && (
              <Alert className="mt-4" variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="whitespace-pre-line">
                  {validationError}
                </AlertDescription>
              </Alert>
            )}

            {/* Navigation */}
            <div className={cn("flex justify-between mt-6", isRTL && "flex-row-reverse")}>
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className={cn("flex items-center space-x-2", isRTL && "space-x-reverse")}
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{getPrevButtonText()}</span>
              </Button>

              <Button
                type={currentStep === steps.length - 1 ? "submit" : "button"}
                onClick={currentStep === steps.length - 1 ? undefined : nextStep}
                disabled={isSubmitting}
                className={cn("flex items-center space-x-2", isRTL && "space-x-reverse")}
              >
                {isSubmitting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background" />
                )}
                <span>{getNextButtonText()}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}