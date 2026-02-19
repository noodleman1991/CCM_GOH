"use client"

import { useTranslations, useLocale } from "next-intl"
import { Card } from "@/components/ui/card"
import { Heart, Users, Globe, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import { rtlLocales } from "@/i18n/routing"
import type { OnboardingData } from "../onboarding-container"

interface OnboardingContent {
  welcomeTitle?: string
  welcomeSubtitle?: string
  welcomeFeatures?: Array<{
    title: string
    description: string
  }>
  welcomeSteps?: string[]
  getStartedText?: string
  timeEstimate?: string
}

interface WelcomeStepProps {
  data: OnboardingData
  updateData?: (data: Partial<OnboardingData>) => void
  updateDataAction?: (data: Partial<OnboardingData>) => void
  onNext?: () => void
  onNextAction?: () => void
  onPrev: () => void
  isFirst: boolean
  isLast: boolean
  content?: OnboardingContent
}

export function WelcomeStep({ content }: WelcomeStepProps) {
  const locale = useLocale()
  const isRTL = rtlLocales.includes(locale)

  // All content now comes from Sanity with proper fallbacks
  const welcomeTitle = content?.welcomeTitle || "Welcome to our Global Community!"
  const welcomeSubtitle = content?.welcomeSubtitle || "Join climate researchers, activists, and experts from around the world working together to create meaningful change."
  const timeEstimate = content?.timeEstimate || "This will take about 5 minutes"

  // Use Sanity features if available, otherwise use translation-based features
  const features = content?.welcomeFeatures && content.welcomeFeatures.length > 0
    ? content.welcomeFeatures.map((feature, index) => ({
        icon: [Users, Globe, Target, Heart][index] || Users,
        title: feature.title,
        description: feature.description
      }))
    : [
        {
          icon: Users,
          title: "Global Community",
          description: "Connect with climate minds from every continent and background"
        },
        {
          icon: Globe,
          title: "Collaborate",
          description: "Work together on research, advocacy, and actionable solutions"
        },
        {
          icon: Target,
          title: "Share Expertise",
          description: "Contribute your unique perspective and learn from others"
        },
        {
          icon: Heart,
          title: "Create Impact",
          description: "Turn ideas into action with real-world climate solutions"
        }
      ]

  // Use Sanity steps if available, otherwise use fallback steps
  const welcomeSteps = content?.welcomeSteps && content.welcomeSteps.length > 0
    ? content.welcomeSteps
    : [
        "Tell us about yourself and your background",
        "Share your work experience and expertise areas",
        "Add recent projects to showcase your contributions",
        "Choose your privacy and visibility settings"
      ]

  return (
    <div className={cn("space-y-6", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
      <div className="text-center space-y-4">
        <div className="text-6xl mb-4">🌍</div>
        <h2 className="text-3xl font-bold text-primary">
          {welcomeTitle}
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {welcomeSubtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature, index) => (
          <Card key={index} className="p-4 hover:shadow-md transition-shadow">
            <div className={cn("flex items-start gap-4", isRTL && "flex-row-reverse")}>
              <div className="flex-shrink-0 mt-1">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2 min-w-0 flex-1">
                <h3 className="font-semibold text-base leading-tight">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="bg-muted/50 rounded-lg p-6">
        <h3 className="font-semibold mb-3">What to expect during setup:</h3>
        <ul className="space-y-2 text-sm">
          {welcomeSteps.map((step, index) => (
            <li key={index} className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
              {step}
            </li>
          ))}
        </ul>
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {timeEstimate}
        </p>
      </div>
    </div>
  )
}
