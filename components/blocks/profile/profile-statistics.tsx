"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Users, Briefcase, Award, Clock } from "lucide-react"
import { useTranslations, useLocale } from 'next-intl'
import { formatDistanceToNow, type Locale } from 'date-fns'
import { es as esLocale, fr as frLocale, ar as arLocale } from 'date-fns/locale'
import { BlurFade } from "@/components/magicui/blur-fade"

const DATE_LOCALES: Record<string, Locale> = { es: esLocale, fr: frLocale, ar: arLocale }

const BLUR_FADE_DELAY = 0.04

interface ProfileStatisticsProps {
    user: {
        createdAt: Date
        recentWork: Array<{ id: string }>
        communities: Array<{ id: string }>
        workTypes: string[]
        expertiseAreas: string[]
        country?: string | null
        city?: string | null
    }
    className?: string
}

export function ProfileStatistics({ user, className }: ProfileStatisticsProps) {
    const t = useTranslations('profile.statistics')
    const locale = useLocale()

    const memberSince = formatDistanceToNow(user.createdAt, {
        addSuffix: false,
        locale: DATE_LOCALES[locale],
    })
    const location = [user.city, user.country].filter(Boolean).join(', ')

    const stats = [
        {
            icon: Clock,
            label: t('memberSince'),
            value: memberSince,
            isText: true,
            visible: true
        },
        {
            icon: MapPin,
            label: t('location'),
            value: location,
            isText: true,
            visible: !!location
        },
        {
            icon: Briefcase,
            label: t('projects'),
            value: user.recentWork.length.toString(),
            isText: false,
            visible: user.recentWork.length > 0
        },
        {
            icon: Users,
            label: t('communities'),
            value: user.communities.length.toString(),
            isText: false,
            visible: user.communities.length > 0
        },
        {
            icon: Award,
            label: t('skills'),
            value: (user.workTypes.length + user.expertiseAreas.length).toString(),
            isText: false,
            visible: (user.workTypes.length + user.expertiseAreas.length) > 0
        }
    ].filter(stat => stat.visible)

    if (stats.length === 0) return null

    return (
        <BlurFade delay={BLUR_FADE_DELAY * 3} className={className}>
            <Card>
                <CardContent className="p-6">
                    <div className="grid grid-cols-2 @content-sm/page:grid-cols-3 @content-xl/page:grid-cols-5 gap-4">
                        {stats.map((stat, index) => {
                            const Icon = stat.icon
                            return (
                                <BlurFade key={stat.label} delay={BLUR_FADE_DELAY * 4 + index * 0.1}>
                                    <div className="text-center space-y-2">
                                        <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Icon className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className={stat.isText ? "text-base font-semibold text-foreground break-words" : "text-2xl font-bold text-foreground"}>
                                                {stat.isText ? <bdi>{stat.value}</bdi> : stat.value}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{stat.label}</p>
                                        </div>
                                    </div>
                                </BlurFade>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
        </BlurFade>
    )
}
