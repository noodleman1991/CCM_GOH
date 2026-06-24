"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Globe, Users } from "lucide-react"
import { useTranslations } from 'next-intl'

interface Community {
    id: string
    name: string
    type: 'REGIONAL' | 'SPECIAL'
    regionalName?: string | null
    specialName?: string | null
}

interface CommunityHubBlockProps {
    communities: Community[]
    className?: string
}

export default function CommunityHubBlock({
                                              communities,
                                              className
                                          }: CommunityHubBlockProps) {
    const t = useTranslations('profile.communities')

    const regionalLabels: Record<string, string> = {
        ssa: t('regional.subSaharanAfrica'),
        nawa: t('regional.northernAfricaWesternAsia'),
        csa: t('regional.centralSouthernAsia'),
        esea: t('regional.easternSouthEasternAsia'),
        lac: t('regional.latinAmericaCaribbean'),
        oce: t('regional.oceania'),
        enam: t('regional.europeNorthAmerica')
    }

    const specialLabels: Record<string, string> = {
        YOUTH: t('special.youth'),
        INDIGENOUS: t('special.indigenous'),
        FARMER_AND_FISHER: t('special.farmerFisher')
    }

    const regionalCommunities = communities.filter(c => c.type === 'REGIONAL')
    const specialCommunities = communities.filter(c => c.type === 'SPECIAL')

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>{t('title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Regional Communities */}
                {regionalCommunities.length > 0 && (
                    <div>
                        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            {t('regionalCommunities')}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {regionalCommunities.map((community) => (
                                <Badge key={community.id} variant="secondary">
                                    {community.regionalName
                                        ? regionalLabels[community.regionalName] || community.name
                                        : community.name}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Special Communities */}
                {specialCommunities.length > 0 && (
                    <div>
                        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {t('specialGroups')}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {specialCommunities.map((community) => (
                                <Badge key={community.id} variant="outline">
                                    {community.specialName
                                        ? specialLabels[community.specialName] || community.name
                                        : community.name}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {communities.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        {t('noCommunities')}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
