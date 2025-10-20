"use client"

import React from "react"
import Image from "next/image"
import { UseFormReturn } from "react-hook-form"
import { useTranslations, useLocale } from "next-intl"
import { Users, Globe, Shield } from "lucide-react"

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
    <div className={cn(
      "space-y-6",
      isRTL && "text-right [&_input]:text-right [&_textarea]:text-right"
    )} dir={isRTL ? "rtl" : "ltr"}>
      {/* Hero Section */}
      <div className="text-center space-y-3">
        <div className={cn("flex justify-center", isRTL && "flex-row-reverse")}>
          <Image
            src="/connecting-climate-minds-logo.png"
            alt="Connecting Climate Minds"
            width={300}
            height={300}
            className="object-contain"
          />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          {content?.welcomeTitle || t("title")}
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {content?.welcomeDescription || t("description")}
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        {features.map((feature, index) => (
          <div
            key={index}
            className={cn(
              "text-center space-y-2 p-4 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 hover:from-primary/5 hover:to-primary/10 transition-colors",
              isRTL && "text-right"
            )}
          >
            <div className={cn("flex justify-center", isRTL && "flex-row-reverse")}>
              <div className="bg-white p-2.5 rounded-full shadow-sm">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
            </div>
            <h3 className="font-semibold text-sm text-gray-900">{feature.title}</h3>
            <p className="text-xs text-gray-600 break-words">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Getting Started */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg">
        <h3 className={cn("font-semibold text-sm text-gray-900 mb-1.5", isRTL && "text-right")}>
          {content?.gettingStartedTitle || t("gettingStarted.title")}
        </h3>
        <p className={cn("text-xs text-gray-600", isRTL && "text-right")}>
          {content?.gettingStartedDescription || t("gettingStarted.description")}
        </p>
      </div>
    </div>
  )
}