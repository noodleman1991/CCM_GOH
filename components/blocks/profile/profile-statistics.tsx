"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, Briefcase, Award, Clock } from "lucide-react"
import { useTranslations } from 'next-intl'
import { formatDistanceToNow } from 'date-fns'
import { BlurFade } from "@/components/magicui/blur-fade"

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
    const t = useTranslations('profile')

    const memberSince = formatDistanceToNow(user.createdAt, { addSuffix: false })
    const location = [user.city, user.country].filter(Boolean).join(', ')

    const stats = [
        {
            icon: Clock,
            label: 'Member Since',
            value: memberSince,
            visible: true
        },
        {
            icon: MapPin,
            label: 'Location',
            value: location,
            visible: !!location
        },
        {
            icon: Briefcase,
            label: 'Projects',
            value: user.recentWork.length.toString(),
            visible: user.recentWork.length > 0
        },
        {
            icon: Users,
            label: 'Communities',
            value: user.communities.length.toString(),
            visible: user.communities.length > 0
        },
        {
            icon: Award,
            label: 'Skills',
            value: (user.workTypes.length + user.expertiseAreas.length).toString(),
            visible: (user.workTypes.length + user.expertiseAreas.length) > 0
        }
    ].filter(stat => stat.visible)

    if (stats.length === 0) return null

    return (
        <BlurFade delay={BLUR_FADE_DELAY * 3} className={className}>
            <Card>
                <CardContent className="p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        {stats.map((stat, index) => {
                            const Icon = stat.icon
                            return (
                                <BlurFade key={stat.label} delay={BLUR_FADE_DELAY * 4 + index * 0.1}>
                                    <div className="text-center space-y-2">
                                        <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Icon className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
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
