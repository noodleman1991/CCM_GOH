"use client"

import { EnhancedAvatar } from "@/components/ui/enhanced-avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Edit, Mail } from "lucide-react"
import { useTranslations } from 'next-intl'
import Link from "next/link"

interface ProfileHeaderBlockProps {
    firstName?: string | null
    lastName?: string | null
    username?: string | null
    image?: string | null
    email?: string | null
    isOwnProfile?: boolean
    className?: string
}

export default function ProfileHeaderBlock({
                                               firstName,
                                               lastName,
                                               username,
                                               image,
                                               email,
                                               isOwnProfile = false,
                                               className
                                           }: ProfileHeaderBlockProps) {
    const t = useTranslations('profile')

    const fullName = [firstName, lastName].filter(Boolean).join(' ')
    const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()

    return (
        <Card className={className}>
            <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <EnhancedAvatar image={image || null || undefined}
                                    firstName={firstName || null || undefined}
                                    lastName={lastName || null || undefined}
                                    username={username || null || undefined}
                                    className="h-24 w-24 sm:h-32 sm:w-32">
                    </EnhancedAvatar>
                    <div className="flex-1 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                            <h1 className="text-2xl sm:text-3xl font-bold">
                                {fullName || t('noName')}
                            </h1>
                            {isOwnProfile && (
                                <Button size="sm" variant="outline" asChild>
                                    <Link href="/profile/edit">
                                        <Edit className="h-4 w-4 mr-2" />
                                        {t('editProfile')}
                                    </Link>
                                </Button>
                            )}
                        </div>

                        {username && (
                            <p className="text-muted-foreground mb-2">@{username}</p>
                        )}

                        {email && !isOwnProfile && (
                            <Button size="sm" variant="outline" asChild>
                                <a href={`mailto:${email}`}>
                                    <Mail className="h-4 w-4 mr-2" />
                                    {t('contact')}
                                </a>
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
