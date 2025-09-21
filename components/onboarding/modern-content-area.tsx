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
  onSubmit?: () => void
  isSubmitting?: boolean
  canGoNext?: boolean
  canGoPrevious?: boolean
  className?: string
}

export function ModernContentArea({
  children,
  currentStep,
  totalSteps,
  onNextAction,
  onPreviousAction,
  onSubmit,
  isSubmitting = false,
  canGoNext = true,
  canGoPrevious = true,
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
    if (isLastStep && onSubmit) {
      onSubmit()
    } else {
      onNextAction()
    }
  }

  return (
    <div className={cn(
      "flex-1 flex flex-col h-screen bg-gray-50",
      className
    )} dir={isRTL ? "rtl" : "ltr"}>
      {/* Main content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-8 lg:pt-8 pt-16"> {/* Add top padding for mobile menu */}
          <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
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
      <div className="border-t border-gray-200 bg-white px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-3xl mx-auto">
          <div className={cn(
            "flex items-center justify-between",
            isRTL && "flex-row-reverse"
          )}>
            <Button
              type="button"
              variant="outline"
              onClick={onPreviousAction}
              disabled={!canGoPrevious || currentStep === 0}
              className={cn(
                "flex items-center gap-2",
                isRTL && "flex-row-reverse"
              )}
            >
              <ArrowLeft className={cn("h-4 w-4", isRTL && "rotate-180")} />
              {t("back")}
            </Button>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{currentStep + 1}</span>
              <span>/</span>
              <span>{totalSteps}</span>
            </div>

            <Button
              type={isLastStep ? "submit" : "button"}
              onClick={handleNext}
              disabled={!canGoNext || isSubmitting}
              className={cn(
                "flex items-center gap-2 min-w-[120px]",
                isRTL && "flex-row-reverse"
              )}
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
                <ArrowRight className={cn("h-4 w-4", isRTL && "rotate-180")} />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
