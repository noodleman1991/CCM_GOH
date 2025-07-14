"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Calendar, Plus } from "lucide-react"
import { useTranslations } from 'next-intl'
import Link from "next/link"
import { format } from "date-fns"

interface RecentWorkItem {
    id: string
    title: string
    description: string
    link?: string | null
    isOngoing: boolean
    startDate: Date
    endDate?: Date | null
}

interface RecentWorkBlockProps {
    works: RecentWorkItem[]
    isOwnProfile?: boolean
    className?: string
}

export default function RecentWorkBlock({
                                            works,
                                            isOwnProfile = false,
                                            className
                                        }: RecentWorkBlockProps) {
    const t = useTranslations('profile.recentWork')

    return (
        <Card className={className}>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t('title')}</CardTitle>
                {isOwnProfile && works.length < 5 && (
                    <Button size="sm" variant="outline" asChild>
                        <Link href="/profile/work/add">
                            <Plus className="h-4 w-4 mr-2" />
                            {t('addWork')}
                        </Link>
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {works.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        {t('noWorks')}
                    </p>
                ) : (
                    <div className="space-y-4">
                        {works.map((work) => (
                            <div
                                key={work.id}
                                className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <h3 className="font-medium flex items-center gap-2">
                                            {work.title}
                                            {work.isOngoing && (
                                                <Badge variant="secondary" className="text-xs">
                                                    {t('ongoing')}
                                                </Badge>
                                            )}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {work.description}
                                        </p>
                                    </div>
                                    {work.link && (
                                        <Button size="sm" variant="ghost" asChild>
                                            <a
                                                href={work.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="shrink-0"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    <span>
                    {format(new Date(work.startDate), 'MMM yyyy')}
                                        {' - '}
                                        {work.isOngoing
                                            ? t('present')
                                            : work.endDate
                                                ? format(new Date(work.endDate), 'MMM yyyy')
                                                : t('present')}
                  </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
