"use client"

import React from "react"
import Image from "next/image"
import { useTranslations, useLocale } from "next-intl"
import { Users, Globe, Shield } from "lucide-react"

import { cn } from "@/lib/utils"
import { rtlLocales } from "@/i18n/routing"
import type { OnboardingContent, OnboardingForm } from "../types"

interface WelcomePanelProps {
  form: OnboardingForm
  content?: OnboardingContent | null
  isSubmitting?: boolean
}

export function WelcomePanel({ content }: WelcomePanelProps) {
  const t = useTranslations("onboarding.steps.welcome")
  const locale = useLocale()
  const isRTL = rtlLocales.includes(locale)

  // Use localized message-file fallbacks if Sanity content is missing
  const hasSanityContent = !!(content?.welcomeTitle && content?.welcomeDescription && (content?.welcomeFeatures?.length ?? 0) > 0)

  const welcomeTitle = hasSanityContent
    ? content?.welcomeTitle
    : t("hero.title")

  const welcomeDescription = hasSanityContent
    ? content?.welcomeDescription
    : t("hero.description")

  const gettingStartedTitle = hasSanityContent
    ? content?.gettingStartedTitle
    : t("gettingStarted.title")

  const gettingStartedDescription = hasSanityContent
    ? content?.gettingStartedDescription
    : t("gettingStarted.description")

  const features = [
    {
      icon: Users,
      title: hasSanityContent
        ? content?.welcomeFeatures?.[0]?.title
        : t("highlights.connect.title"),
      description: hasSanityContent
        ? content?.welcomeFeatures?.[0]?.description
        : t("highlights.connect.description"),
    },
    {
      icon: Globe,
      title: hasSanityContent
        ? content?.welcomeFeatures?.[1]?.title
        : t("highlights.share.title"),
      description: hasSanityContent
        ? content?.welcomeFeatures?.[1]?.description
        : t("highlights.share.description"),
    },
    {
      icon: Shield,
      title: hasSanityContent
        ? content?.welcomeFeatures?.[2]?.title
        : t("highlights.privacy.title"),
      description: hasSanityContent
        ? content?.welcomeFeatures?.[2]?.description
        : t("highlights.privacy.description"),
    },
  ]

  return (
    <div className={cn(
      "space-y-6",
      "text-start [&_input]:text-start [&_textarea]:text-start"
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
        <h2 className="text-2xl font-bold text-foreground">
          {welcomeTitle}
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {welcomeDescription}
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        {features.map((feature, index) => (
          <div
            key={index}
            className="text-center space-y-2 p-4 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 hover:from-primary/5 hover:to-primary/10 transition-colors"
          >
            <div className={cn("flex justify-center", isRTL && "flex-row-reverse")}>
              <div className="bg-card p-2.5 rounded-full shadow-sm">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
            </div>
            <h3 className="font-semibold text-sm text-foreground">{feature.title}</h3>
            <p className="text-xs text-muted-foreground break-words">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Getting Started */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg">
        <h3 className={"font-semibold text-sm text-foreground mb-1.5 text-start"}>
          {gettingStartedTitle}
        </h3>
        <p className={"text-xs text-muted-foreground text-start"}>
          {gettingStartedDescription}
        </p>
      </div>
    </div>
  )
}
