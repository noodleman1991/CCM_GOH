"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar } from "lucide-react"
import { useTranslations } from 'next-intl'

interface BasicInfoBlockProps {
    ageGroup?: 'UNDER_18' | 'ABOVE_18' | null
    country?: string | null
    city?: string | null
    bio?: string | null
    className?: string
}

export default function BasicInfoBlock({
                                           ageGroup,
                                           country,
                                           city,
                                           bio,
                                           className
                                       }: BasicInfoBlockProps) {
    const t = useTranslations('profile')

    const location = [city, country].filter(Boolean).join(', ')

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>{t('basicInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {bio && (
                    <div>
                        <h3 className="text-sm font-medium mb-2">{t('bio')}</h3>
                        <p className="text-sm text-muted-foreground">{bio}</p>
                    </div>
                )}

                <div className="flex flex-wrap gap-4">
                    {ageGroup && (
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <Badge variant="secondary">
                                {ageGroup === 'UNDER_18' ? t('under18') : t('above18')}
                            </Badge>
                        </div>
                    )}

                    {location && (
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{location}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
