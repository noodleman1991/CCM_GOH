"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Globe, Linkedin, Twitter, ExternalLink } from "lucide-react"
import { useTranslations } from 'next-intl'

interface SocialLinksBlockProps {
    personalWebsite?: string | null
    linkedinProfile?: string | null
    twitterHandle?: string | null
    className?: string
}

export default function SocialLinksBlock({
                                             personalWebsite,
                                             linkedinProfile,
                                             twitterHandle,
                                             className
                                         }: SocialLinksBlockProps) {
    const t = useTranslations('profile.social')

    const links = [
        {
            icon: Globe,
            label: t('website'),
            url: personalWebsite,
            formatUrl: (url: string) => url
        },
        {
            icon: Linkedin,
            label: t('linkedin'),
            url: linkedinProfile,
            formatUrl: (handle: string) =>
                handle.startsWith('http') ? handle : `https://linkedin.com/in/${handle}`
        },
        {
            icon: Twitter,
            label: t('twitter'),
            url: twitterHandle,
            formatUrl: (handle: string) =>
                handle.startsWith('http')
                    ? handle
                    : `https://twitter.com/${handle.replace('@', '')}`
        }
    ].filter(link => link.url)

    if (links.length === 0) return null

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>{t('title')}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {links.map(({ icon: Icon, label, url, formatUrl }) => (
                        <Button
                            key={label}
                            variant="outline"
                            className="w-full justify-start"
                            asChild
                        >
                            <a
                                href={formatUrl(url!)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3"
                            >
                                <Icon className="h-4 w-4" />
                                <span className="flex-1 text-left">{label}</span>
                                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                            </a>
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
