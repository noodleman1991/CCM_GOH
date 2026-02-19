"use client"

import React from "react"
import { useTranslations, useLocale } from "next-intl"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { rtlLocales } from "@/i18n/routing"

interface ModernContentAreaProps {
  children: React.ReactNode
  currentStep: number
  totalSteps: number
  onNextAction: () => void
  onPreviousAction: () => void
  isSubmitting?: boolean
  canGoNext?: boolean
  canGoPrevious?: boolean
  isConfirmed?: boolean
  className?: string
}

// Convert numbers to Arabic-Indic numerals
const toArabicNumerals = (num: number): string => {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
  return num.toString().split('').map(digit => arabicNumerals[parseInt(digit)]).join('')
}

export function ModernContentArea({
  children,
  currentStep,
  totalSteps,
  onNextAction,
  onPreviousAction,
  isSubmitting = false,
  canGoNext = true,
  canGoPrevious = true,
  isConfirmed = true,
  className
}: ModernContentAreaProps) {
  const t = useTranslations("onboarding")
  const locale = useLocale()
  const isRTL = rtlLocales.includes(locale)
  const isLastStep = currentStep === totalSteps - 1

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? (isRTL ? -1000 : 1000) : (isRTL ? 1000 : -1000),
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? (isRTL ? -1000 : 1000) : (isRTL ? 1000 : -1000),
      opacity: 0
    })
  }

  const handleNext = () => {
    // This only runs on navigation steps (not on review/last step)
    // Review step has no onClick handler - uses native form submission via type="submit"
    onNextAction()
  }

  return (
    <div className={cn(
      "flex-1 flex flex-col h-screen bg-muted",
      className
    )} dir={isRTL ? "rtl" : "ltr"}>
      {/* Main content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full px-4 sm:px-6 md:px-6 lg:max-w-[960px] lg:mx-auto lg:px-0 py-4 sm:py-6 lg:py-8">
          {/* Step indicator */}
          <div className="mb-4 text-sm text-muted-foreground">
            {locale === 'ar'
              ? `خطوة ${toArabicNumerals(currentStep + 1)} من ${toArabicNumerals(totalSteps)}`
              : `Step ${currentStep + 1} of ${totalSteps}`}
          </div>

          <Card className="shadow-sm border-0 bg-card">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <AnimatePresence mode="wait" custom={1}>
                <motion.div
                  key={currentStep}
                  custom={1}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 }
                  }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action bar */}
      <div className="border-t border-border bg-card px-4 sm:px-6 py-4 sm:py-5">
        <div className="w-full md:px-6 lg:max-w-[960px] lg:mx-auto">
          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 mb-4">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all duration-200",
                  index === currentStep
                    ? "bg-primary w-6"
                    : index < currentStep
                    ? "bg-primary/40"
                    : "bg-gray-300"
                )}
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            {isRTL ? (
              <>
                {/* RTL: Next button on the left */}
                <Button
                  type={isLastStep ? "submit" : "button"}
                  onClick={isLastStep ? undefined : handleNext}
                  disabled={!canGoNext || isSubmitting || (isLastStep && !isConfirmed)}
                  className="flex items-center gap-2 min-w-[120px] flex-row-reverse"
                >
                  {isSubmitting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  )}
                  <span>
                    {isSubmitting
                      ? t("submitting")
                      : isLastStep
                        ? t("steps.review.completeOnboarding")
                        : t("next")
                    }
                  </span>
                  {!isSubmitting && (
                    <ArrowRight className="h-4 w-4 rotate-180" />
                  )}
                </Button>

                {/* RTL: Back button on the right */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={onPreviousAction}
                  disabled={!canGoPrevious || currentStep === 0}
                  className="flex items-center gap-2 flex-row-reverse"
                >
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                  {t("back")}
                </Button>
              </>
            ) : (
              <>
                {/* LTR: Back button on the left */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={onPreviousAction}
                  disabled={!canGoPrevious || currentStep === 0}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t("back")}
                </Button>

                {/* LTR: Next button on the right */}
                <Button
                  type={isLastStep ? "submit" : "button"}
                  onClick={isLastStep ? undefined : handleNext}
                  disabled={!canGoNext || isSubmitting || (isLastStep && !isConfirmed)}
                  className="flex items-center gap-2 min-w-[120px]"
                >
                  {isSubmitting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  )}
                  <span>
                    {isSubmitting
                      ? t("submitting")
                      : isLastStep
                        ? t("steps.review.completeOnboarding")
                        : t("next")
                    }
                  </span>
                  {!isSubmitting && (
                    <ArrowRight className="h-4 w-4" />
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
