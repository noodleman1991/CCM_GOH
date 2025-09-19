"use client"

import React from "react"
import { UseFormReturn } from "react-hook-form"
import { useTranslations, useLocale } from "next-intl"
import { Sparkles, Users, Globe, Shield } from "lucide-react"

import { cn } from "@/lib/utils"
import { rtlLocales } from "@/i18n/routing"
import type { OnboardingFormData } from "@/lib/schemas/onboarding-schema"

interface WelcomePanelProps {
  form: any
  content?: any
  isSubmitting?: boolean
}

export function WelcomePanel({ content }: WelcomePanelProps) {
  const t = useTranslations("onboarding.steps.welcome")
  const locale = useLocale()
  const isRTL = rtlLocales.includes(locale)

  const features = [
    {
      icon: Users,
      title: content?.welcomeFeatures?.[0]?.title || t("features.community.title"),
      description: content?.welcomeFeatures?.[0]?.description || t("features.community.description"),
    },
    {
      icon: Globe,
      title: content?.welcomeFeatures?.[1]?.title || t("features.global.title"),
      description: content?.welcomeFeatures?.[1]?.description || t("features.global.description"),
    },
    {
      icon: Shield,
      title: content?.welcomeFeatures?.[2]?.title || t("features.privacy.title"),
      description: content?.welcomeFeatures?.[2]?.description || t("features.privacy.description"),
    },
  ]

  return (
    <div className={cn("space-y-8", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className={cn("flex justify-center", isRTL && "flex-row-reverse")}>
          <div className="bg-primary/10 p-3 rounded-full">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-900">
          {content?.welcomeTitle || t("title")}
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {content?.welcomeDescription || t("description")}
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6 mt-12">
        {features.map((feature, index) => (
          <div
            key={index}
            className={cn(
              "text-center space-y-3 p-6 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 hover:from-primary/5 hover:to-primary/10 transition-colors",
              isRTL && "text-right"
            )}
          >
            <div className={cn("flex justify-center", isRTL && "flex-row-reverse")}>
              <div className="bg-white p-3 rounded-full shadow-sm">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h3 className="font-semibold text-gray-900">{feature.title}</h3>
            <p className="text-sm text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Getting Started */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-xl">
        <h3 className={cn("font-semibold text-gray-900 mb-2", isRTL && "text-right")}>
          {content?.gettingStartedTitle || t("gettingStarted.title")}
        </h3>
        <p className={cn("text-gray-600", isRTL && "text-right")}>
          {content?.gettingStartedDescription || t("gettingStarted.description")}
        </p>
      </div>
    </div>
  )
}