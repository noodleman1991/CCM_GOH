"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useTranslations, useLocale } from "next-intl"
import { motion, AnimatePresence } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, ArrowLeft, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { rtlLocales } from "@/i18n/routing"
import { getOnboardingContent, getUserManagementOptions } from "@/lib/actions/sanity"

import { WelcomeStep } from "./steps/welcome-step"
import { BasicInfoStep } from "./steps/basic-info-step"
import { WorkInfoStep } from "./steps/work-info-step"
import { RecentWorkStep } from "./steps/recent-work-step"
import { PrivacyStep } from "./steps/privacy-step"
import { ReviewStep } from "./steps/review-step"

export interface OnboardingData {
  // Basic Info
  firstName: string
  lastName: string
  username: string
  bio: string
  ageGroup?: "UNDER_18" | "ABOVE_18"
  country: string
  city: string
  preferredLanguage: "EN" | "ES" | "FR" | "AR"

  // Work Info
  workTypes: string[]
  expertiseAreas: string[]
  organization: string
  position: string
  workBio: string

  // Social Links
  personalWebsite: string
  linkedinProfile: string
  otherSocialLinks: Array<{platform: string, url: string}>

  // Recent Work
  recentWork: Array<{
    title: string
    description: string
    link?: string
    isOngoing: boolean
    startDate: string
    endDate?: string
  }>

  // Privacy
  isSearchable: boolean
  profileVisibility: "PUBLIC" | "MEMBERS" | "PRIVATE"
  showEmail: boolean
  showPhoneNumber: boolean
  showWorkDetails: boolean
  showSocialLinks: boolean
  showLocation: boolean
}

const steps = [
  { id: "welcome", title: "Welcome", component: WelcomeStep },
  { id: "basic-info", title: "Basic Info", component: BasicInfoStep },
  { id: "work-info", title: "Work & Expertise", component: WorkInfoStep },
  { id: "recent-work", title: "Recent Work", component: RecentWorkStep },
  { id: "privacy", title: "Privacy Settings", component: PrivacyStep },
  { id: "review", title: "Review & Submit", component: ReviewStep }
]

export default function OnboardingContainer() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sanityContent, setSanityContent] = useState<any>(null)
  const [userManagementOptions, setUserManagementOptions] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [canProceed, setCanProceed] = useState(true)
  const [stepValidation, setStepValidation] = useState<{ [key: number]: boolean }>({
    0: true, // Welcome step always valid
    1: false, // Basic info
    2: false, // Work info
    3: true, // Recent work (optional)
    4: true, // Privacy (has defaults)
    5: true, // Review (always valid)
  })
  const [data, setData] = useState<OnboardingData>({
    firstName: "",
    lastName: "",
    username: "",
    bio: "",
    country: "",
    city: "",
    preferredLanguage: "EN",
    workTypes: [],
    expertiseAreas: [],
    organization: "",
    position: "",
    workBio: "",
    personalWebsite: "",
    linkedinProfile: "",
    otherSocialLinks: [],
    recentWork: [],
    isSearchable: true,
    profileVisibility: "PUBLIC",
    showEmail: false,
    showPhoneNumber: false,
    showWorkDetails: true,
    showSocialLinks: true,
    showLocation: true
  })

  const { user } = useUser()
  const router = useRouter()
  const t = useTranslations("onboarding")
  const locale = useLocale()
  const isRTL = rtlLocales.includes(locale)

  // Fetch Sanity content on mount
  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true)
      try {
        const [content, options] = await Promise.all([
          getOnboardingContent(locale),
          getUserManagementOptions(locale)
        ])
        setSanityContent(content)
        setUserManagementOptions(options)
      } catch (error) {
        console.error('Error fetching Sanity content:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchContent()
  }, [locale])

  // Initialize data with user info from Clerk
  useEffect(() => {
    if (user) {
      setData(prev => ({
        ...prev,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        username: user.username || "",
        preferredLanguage: (locale.toUpperCase() as any) || "EN"
      }))
    }
  }, [user, locale])

  const updateData = (stepData: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...stepData }))
  }

  const handleValidationChange = (isValid: boolean) => {
    setStepValidation(prev => ({ ...prev, [currentStep]: isValid }))
    setCanProceed(isValid)
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  // Validation functions
  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1: // Basic info
        return !!(data.firstName?.trim() && data.lastName?.trim() && data.username?.trim() && data.country?.trim() && data.city?.trim())
      case 2: // Work info
        return !!(data.workTypes.length > 0 && data.expertiseAreas.length > 0)
      default:
        return true
    }
  }

  // Update validation state when data changes
  useEffect(() => {
    const isValid = validateCurrentStep()
    setStepValidation(prev => ({ ...prev, [currentStep]: isValid }))
    setCanProceed(isValid)
  }, [data, currentStep])

  // Get step title from Sanity content with fallback to translations
  const getStepTitle = () => {
    if (!sanityContent) {
      // Fallback to translation keys when Sanity content is not available
      return steps[currentStep].title
    }

    switch (currentStep) {
      case 0: // Welcome step
        return sanityContent.welcomeTitle || "Welcome"
      case 1: // Basic info step
        return sanityContent.basicInfoTitle || "Basic Information"
      case 2: // Work info step
        return sanityContent.workInfoTitle || "Work & Expertise"
      case 3: // Recent work step
        return sanityContent.recentWorkTitle || "Recent Work"
      case 4: // Privacy step
        return sanityContent.privacyTitle || "Privacy Settings"
      case 5: // Review step
        return sanityContent.reviewTitle || "Review & Submit"
      default:
        return steps[currentStep].title
    }
  }

  // Get context-aware button text (uses next-intl translations)
  const getNextButtonText = () => {
    switch (currentStep) {
      case 0: // Welcome step
        return t("getStarted")
      case steps.length - 2: // Privacy step (second to last)
        return t("reviewProfile")
      case steps.length - 1: // Review step (last)
        return t("completeProfile")
      default:
        return t("continue")
    }
  }

  // Enhanced next step function with validation
  const handleNextStep = async () => {
    if (currentStep === steps.length - 1) {
      // Handle final submission on review step
      setIsSubmitting(true)
      try {
        // Import the server action
        const { completeOnboarding } = await import("@/lib/actions/onboarding")

        // Submit onboarding data - server action handles redirect
        await completeOnboarding(data)
      } catch (error) {
        console.error('Onboarding submission error:', error)
        setIsSubmitting(false)
        // You could add toast notification here if needed
      }
      return
    }

    if (canProceed && currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  const CurrentStepComponent = steps[currentStep].component

  // Show loading state while fetching content
  if (isLoading) {
    return (
      <div className={cn("min-h-screen bg-gradient-to-br from-background via-background to-muted/20", isRTL && "rtl")} dir={isRTL ? "rtl" : "ltr"}>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Loading...</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-background via-background to-muted/20", isRTL && "rtl")} dir={isRTL ? "rtl" : "ltr"}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">{t("title")}</h1>
              <div className="text-sm text-muted-foreground">
                {currentStep + 1} {t("of")} {steps.length}
              </div>
            </div>

            <Progress value={progress} className="h-2 mb-4" />

            {/* Step indicators */}
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
                    index < currentStep
                      ? "bg-primary border-primary text-primary-foreground"
                      : index === currentStep
                        ? "border-primary text-primary"
                        : "border-muted-foreground/30 text-muted-foreground"
                  )}>
                    {index < currentStep ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-medium">{index + 1}</span>
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "h-0.5 w-8 mx-2 transition-colors",
                      index < currentStep ? "bg-primary" : "bg-muted-foreground/30"
                    )} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">
                {getStepTitle()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <CurrentStepComponent
                    data={data}
                    updateDataAction={updateData}
                    onNextAction={handleNextStep}
                    onPrev={prevStep}
                    isFirst={currentStep === 0}
                    isLast={currentStep === steps.length - 1}
                    isSubmitting={isSubmitting}
                    setIsSubmittingAction={setIsSubmitting}
                    content={sanityContent}
                    workTypes={userManagementOptions?.workTypes}
                    expertiseAreas={userManagementOptions?.expertiseAreas}
                    onValidationChange={handleValidationChange}
                  />
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Error Message */}
          {!canProceed && currentStep > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700 flex items-center gap-2">
                <span className="text-red-500">⚠️</span>
                Please fill in all required fields before continuing.
              </p>
            </div>
          )}

          {/* Navigation Footer */}
          <div className={cn("flex justify-between mt-6", isRTL && "flex-row-reverse")}>
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0 || isSubmitting}
              className={cn("gap-2", isRTL && "flex-row-reverse")}
            >
              <ArrowLeft className="h-4 w-4" />
              {t("previous")}
            </Button>

            <Button
              onClick={handleNextStep}
              disabled={!canProceed || isSubmitting}
              className={cn("gap-2", isRTL && "flex-row-reverse")}
            >
              {isSubmitting && currentStep === steps.length - 1 && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background" />
              )}
              {getNextButtonText()}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
