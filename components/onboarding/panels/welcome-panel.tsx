"use client"

import React from "react"
import Image from "next/image"
import { UseFormReturn } from "react-hook-form"
import { useTranslations, useLocale } from "next-intl"
import { Users, Globe, Shield } from "lucide-react"

import { cn } from "@/lib/utils"
import { rtlLocales } from "@/i18n/routing"
import type { OnboardingFormData } from "@/lib/schemas/onboarding-schema"

// Fallback content for welcome panel (all 4 languages)
const FALLBACK_CONTENT = {
    welcomeTitle: {
        en: 'Welcome to Connecting Climate Minds',
        es: 'Bienvenido a Connecting Climate Minds',
        fr: 'Bienvenue à Connecting Climate Minds',
        ar: 'مرحبًا بك في Connecting Climate Minds'
    },
    welcomeDescription: {
        en: 'Join a global community of climate leaders, experts, and advocates working together to address the climate crisis.',
        es: 'Únete a una comunidad global de líderes climáticos, expertos y defensores que trabajan juntos para abordar la crisis climática.',
        fr: 'Rejoignez une communauté mondiale de leaders, d\'experts et de défenseurs du climat qui travaillent ensemble pour lutter contre la crise climatique.',
        ar: 'انضم إلى مجتمع عالمي من قادة المناخ والخبراء والمدافعين الذين يعملون معًا لمعالجة أزمة المناخ.'
    },
    welcomeFeatures: [
        {
            title: {
                en: 'Connect with Climate Leaders',
                es: 'Conéctate con Líderes Climáticos',
                fr: 'Connectez-vous avec des Leaders du Climat',
                ar: 'تواصل مع قادة المناخ'
            },
            description: {
                en: 'Network with professionals, researchers, and activists from around the world.',
                es: 'Conecta con profesionales, investigadores y activistas de todo el mundo.',
                fr: 'Réseautez avec des professionnels, chercheurs et activistes du monde entier.',
                ar: 'تواصل مع المهنيين والباحثين والناشطين من جميع أنحاء العالم.'
            }
        },
        {
            title: {
                en: 'Share Your Expertise',
                es: 'Comparte tu Experiencia',
                fr: 'Partagez Votre Expertise',
                ar: 'شارك خبرتك'
            },
            description: {
                en: 'Contribute your knowledge and learn from diverse perspectives on climate action.',
                es: 'Contribuye con tu conocimiento y aprende de diversas perspectivas sobre acción climática.',
                fr: 'Contribuez vos connaissances et apprenez de perspectives diverses sur l\'action climatique.',
                ar: 'ساهم بمعرفتك وتعلم من وجهات نظر متنوعة حول العمل المناخي.'
            }
        },
        {
            title: {
                en: 'Privacy & Security',
                es: 'Privacidad y Seguridad',
                fr: 'Confidentialité et Sécurité',
                ar: 'الخصوصية والأمان'
            },
            description: {
                en: 'Your data is protected. Control what you share and who can see your profile.',
                es: 'Tus datos están protegidos. Controla lo que compartes y quién puede ver tu perfil.',
                fr: 'Vos données sont protégées. Contrôlez ce que vous partagez et qui peut voir votre profil.',
                ar: 'بياناتك محمية. تحكم في ما تشاركه ومن يمكنه رؤية ملفك الشخصي.'
            }
        }
    ],
    gettingStartedTitle: {
        en: 'Let\'s get started!',
        es: '¡Comencemos!',
        fr: 'Commençons!',
        ar: 'لنبدأ!'
    },
    gettingStartedDescription: {
        en: 'Complete your profile to connect with the right people and opportunities in the climate movement.',
        es: 'Completa tu perfil para conectar con las personas y oportunidades adecuadas en el movimiento climático.',
        fr: 'Complétez votre profil pour vous connecter avec les bonnes personnes et opportunités dans le mouvement climatique.',
        ar: 'أكمل ملفك الشخصي للتواصل مع الأشخاص والفرص المناسبة في حركة المناخ.'
    }
}

function getLocalizedContent(field: any, locale: string): string {
    if (typeof field === 'string') return field
    return field?.[locale] || field?.en || ''
}

interface WelcomePanelProps {
  form: any
  content?: any
  isSubmitting?: boolean
}

export function WelcomePanel({ content }: WelcomePanelProps) {
  const t = useTranslations("onboarding.steps.welcome")
  const locale = useLocale()
  const isRTL = rtlLocales.includes(locale)

  // Use fallback content if Sanity content is missing
  const hasSanityContent = !!(content?.welcomeTitle && content?.welcomeDescription && content?.welcomeFeatures?.length > 0)
  const dataSource = hasSanityContent ? 'sanity' : 'fallback'

  console.log(`[WelcomePanel] Data source: ${dataSource}`, {
    hasContent: !!content,
    welcomeTitle: content?.welcomeTitle,
    welcomeFeaturesCount: content?.welcomeFeatures?.length || 0,
    language: content?.language || locale
  })

  const welcomeTitle = hasSanityContent
    ? content.welcomeTitle
    : getLocalizedContent(FALLBACK_CONTENT.welcomeTitle, locale)

  const welcomeDescription = hasSanityContent
    ? content.welcomeDescription
    : getLocalizedContent(FALLBACK_CONTENT.welcomeDescription, locale)

  const gettingStartedTitle = hasSanityContent
    ? content.gettingStartedTitle
    : getLocalizedContent(FALLBACK_CONTENT.gettingStartedTitle, locale)

  const gettingStartedDescription = hasSanityContent
    ? content.gettingStartedDescription
    : getLocalizedContent(FALLBACK_CONTENT.gettingStartedDescription, locale)

  const features = [
    {
      icon: Users,
      title: hasSanityContent
        ? content.welcomeFeatures[0]?.title
        : getLocalizedContent(FALLBACK_CONTENT.welcomeFeatures[0].title, locale),
      description: hasSanityContent
        ? content.welcomeFeatures[0]?.description
        : getLocalizedContent(FALLBACK_CONTENT.welcomeFeatures[0].description, locale),
    },
    {
      icon: Globe,
      title: hasSanityContent
        ? content.welcomeFeatures[1]?.title
        : getLocalizedContent(FALLBACK_CONTENT.welcomeFeatures[1].title, locale),
      description: hasSanityContent
        ? content.welcomeFeatures[1]?.description
        : getLocalizedContent(FALLBACK_CONTENT.welcomeFeatures[1].description, locale),
    },
    {
      icon: Shield,
      title: hasSanityContent
        ? content.welcomeFeatures[2]?.title
        : getLocalizedContent(FALLBACK_CONTENT.welcomeFeatures[2].title, locale),
      description: hasSanityContent
        ? content.welcomeFeatures[2]?.description
        : getLocalizedContent(FALLBACK_CONTENT.welcomeFeatures[2].description, locale),
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