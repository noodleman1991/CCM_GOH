"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Briefcase, Building } from "lucide-react"
import { useTranslations } from 'next-intl'

interface WorkDetailsBlockProps {
    workTypes: string[]
    expertiseAreas: string[]
    organization?: string | null
    position?: string | null
    workBio?: string | null
    className?: string
}

export default function WorkDetailsBlock({
                                             workTypes,
                                             expertiseAreas,
                                             organization,
                                             position,
                                             workBio,
                                             className
                                         }: WorkDetailsBlockProps) {
    const t = useTranslations('profile.work')

    const workTypeLabels: Record<string, string> = {
        RESEARCH: t('types.research'),
        POLICY: t('types.policy'),
        LIVED_EXPERIENCE_EXPERT: t('types.livedExperience'),
        NGO: t('types.ngo'),
        COMMUNITY_ORGANIZATION: t('types.communityOrg'),
        EDUCATION_TEACHING: t('types.education')
    }

    const expertiseLabels: Record<string, string> = {
        CLIMATE_CHANGE: t('expertise.climate'),
        MENTAL_HEALTH: t('expertise.mentalHealth'),
        HEALTH: t('expertise.health')
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>{t('title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Organization & Position */}
                {(organization || position) && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{position}</span>
                            {organization && position && <span className="text-muted-foreground">at</span>}
                            <span className="font-medium">{organization}</span>
                        </div>
                    </div>
                )}

                {/* Work Bio */}
                {workBio && (
                    <div>
                        <h3 className="text-sm font-medium mb-2">{t('workBio')}</h3>
                        <p className="text-sm text-muted-foreground">{workBio}</p>
                    </div>
                )}

                {/* Work Types */}
                {workTypes.length > 0 && (
                    <div>
                        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            {t('workTypes')}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {workTypes.map((type) => (
                                <Badge key={type} variant="secondary">
                                    {workTypeLabels[type] || type}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Expertise Areas */}
                {expertiseAreas.length > 0 && (
                    <div>
                        <h3 className="text-sm font-medium mb-3">{t('expertiseAreas')}</h3>
                        <div className="flex flex-wrap gap-2">
                            {expertiseAreas.map((area) => (
                                <Badge key={area} variant="outline">
                                    {expertiseLabels[area] || area}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
