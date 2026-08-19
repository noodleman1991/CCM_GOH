"use client"

import React from "react"
import { useTranslations, useLocale } from "next-intl"
import { motion } from "motion/react"
import {
  CheckCircle2,
  Circle,
  User,
  Briefcase,
  FolderOpen,
  Shield,
  Eye,
  Sparkles,
  Clock,
  type LucideIcon
} from "lucide-react"

import { cn } from "@/lib/utils"
import { rtlLocales } from "@/i18n/routing"

interface Step {
  id: string
  title: string
  description: string
  icon: LucideIcon
  status: 'completed' | 'current' | 'upcoming'
}

interface ModernProgressSidebarProps {
  currentStep: number
  totalSteps: number
  className?: string
}

export function ModernProgressSidebar({
  currentStep,
  totalSteps,
  className
}: ModernProgressSidebarProps) {
  const t = useTranslations("onboarding")
  const locale = useLocale()
  const isRTL = rtlLocales.includes(locale)

  const steps: Step[] = [
    {
      id: "welcome",
      title: t("steps.welcome.title"),
      description: t("steps.welcome.tagline"),
      icon: Sparkles,
      status: currentStep > 0 ? 'completed' : currentStep === 0 ? 'current' : 'upcoming'
    },
    {
      id: "basicInfo",
      title: t("steps.basicInfo.title"),
      description: t("steps.basicInfo.tagline"),
      icon: User,
      status: currentStep > 1 ? 'completed' : currentStep === 1 ? 'current' : 'upcoming'
    },
    {
      id: "workInfo",
      title: t("steps.workInfo.title"),
      description: t("steps.workInfo.tagline"),
      icon: Briefcase,
      status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'current' : 'upcoming'
    },
    {
      id: "recentWork",
      title: t("steps.recentWork.title"),
      description: t("steps.recentWork.tagline"),
      icon: FolderOpen,
      status: currentStep > 3 ? 'completed' : currentStep === 3 ? 'current' : 'upcoming'
    },
    {
      id: "privacy",
      title: t("steps.privacy.title"),
      description: t("steps.privacy.tagline"),
      icon: Shield,
      status: currentStep > 4 ? 'completed' : currentStep === 4 ? 'current' : 'upcoming'
    },
    {
      id: "review",
      title: t("steps.review.title"),
      description: t("steps.review.tagline"),
      icon: Eye,
      status: currentStep > 5 ? 'completed' : currentStep === 5 ? 'current' : 'upcoming'
    }
  ]

  const progress = ((currentStep + 1) / totalSteps) * 100

  return (
    <div className={cn(
      "bg-card border-e border-border flex flex-col",
      "w-64 h-screen overflow-y-auto",
      "shadow-sm lg:shadow-none", // Add subtle shadow on mobile
      className
    )} dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
          <div className="bg-primary/10 p-2 rounded-lg">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">{t("title")}</h2>
            <p className="text-sm text-gray-500">{t("stepOf", { current: currentStep + 1, total: totalSteps })}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>{t("percentComplete", { value: Math.round(progress) })}</span>
            <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
              <Clock className="h-3 w-3" />
              <span>{t("minutesLeft", { minutes: Math.max(1, totalSteps - 1 - currentStep) })}</span>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <motion.div
              className="bg-primary h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="flex-1 p-6">
        <div className="space-y-1">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = step.status === 'current'
            const isCompleted = step.status === 'completed'
            const isUpcoming = step.status === 'upcoming'

            return (
              <motion.div
                key={step.id}
                className={cn(
                  "relative flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
                  isRTL && "flex-row-reverse",
                  isActive && "bg-primary/5 border border-primary/20",
                  isCompleted && "bg-green-50 border border-green-200",
                  isUpcoming && "hover:bg-gray-50"
                )}
                initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                {/* Step indicator */}
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all",
                  isCompleted && "bg-green-500 border-green-500 text-white",
                  isActive && "bg-primary border-primary text-white",
                  isUpcoming && "bg-background border-gray-300 text-gray-400"
                )}>
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : isActive ? (
                    <Icon className="h-4 w-4" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                </div>

                {/* Step content */}
                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    "font-medium text-sm",
                    isCompleted && "text-green-700",
                    isActive && "text-primary",
                    isUpcoming && "text-gray-500"
                  )}>
                    {step.title}
                  </h3>
                  <p className={cn(
                    "text-xs mt-0.5",
                    isCompleted && "text-green-600",
                    isActive && "text-primary/70",
                    isUpcoming && "text-gray-400"
                  )}>
                    {step.description}
                  </p>
                </div>

                {/* Connection line */}
                {index < steps.length - 1 && (
                  <div className={cn(
                    "absolute top-11 w-px h-4 bg-gray-200",
                    "start-9",
                    isCompleted && "bg-green-300"
                  )} />
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-100">
        <div className="text-center">
          <p className="text-xs text-gray-500">
            {t("footerTagline")}
          </p>
          <div className="flex justify-center mt-2 space-x-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-6 h-6 bg-muted rounded-full border overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-400" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}