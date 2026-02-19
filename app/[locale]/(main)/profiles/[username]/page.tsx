import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations } from 'next-intl/server'
import { auth } from "@clerk/nextjs/server"
import { BlurFade } from "@/components/magicui/blur-fade"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Markdown from "react-markdown"
import Link from "next/link"
import { getUserProfile, checkProfileOwnership } from "@/lib/actions/profile"
import { ProfileStatistics } from "@/components/blocks/profile/profile-statistics"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"

const BLUR_FADE_DELAY = 0.04

interface ProfilePageProps {
    params: Promise<{
        username: string
        locale: string
    }>
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
    const { username } = await params
    const user = await getUserProfile(username)

    if (!user) return { title: 'Profile Not Found' }

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ')
    const title = fullName || user.username || 'Profile'

    return {
        title: `${title} - Profile`,
        description: `View ${title}'s profile`
    }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
    const { username, locale } = await params
    const t = await getTranslations('profile')

    const { userId: currentUserId } = await auth()

    const user = await getUserProfile(username)

    if (!user) {
        notFound()
    }
    const isOwnProfile = await checkProfileOwnership(user.id)

    // Calculate profile completeness
    const profileSections = {
        about: !!user.bio,
        work: !!(user.work || user.workBio),
        skills: user.workTypes.length > 0 || user.expertiseAreas.length > 0,
        projects: user.recentWork.length > 0,
        communities: user.communities.length > 0,
        contact: !!(user.personalWebsite || user.linkedinProfile || user.otherSocialLinks.length > 0)
    }

    return (
        <div className="container max-w-6xl py-8">
            {/* Breadcrumbs */}
            <Breadcrumb className="mb-6">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/">Home</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/profiles">Profiles</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>
                            {user.displayName}
                        </BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            {/* Profile Header */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <BlurFade delay={BLUR_FADE_DELAY * 3} className="mb-2">
                            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                {user.displayName}
                            </h1>
                        </BlurFade>
                        {user.username && (
                            <BlurFade delay={BLUR_FADE_DELAY * 4} className="mb-4">
                                <p className="text-lg text-muted-foreground">@{user.username}</p>
                            </BlurFade>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        {user.work && (
                            <BlurFade delay={BLUR_FADE_DELAY * 5}>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">{user.work}</span>
                                </div>
                            </BlurFade>
                        )}
                        {user.location && (
                            <BlurFade delay={BLUR_FADE_DELAY * 6}>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">{user.location}</span>
                                </div>
                            </BlurFade>
                        )}
                        {user.ageGroup && (
                            <BlurFade delay={BLUR_FADE_DELAY * 7}>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">
                                        {user.ageGroup === 'UNDER_18' ? t('under18') : t('above18')}
                                    </span>
                                </div>
                            </BlurFade>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-4 mb-6">
                    {isOwnProfile && (
                        <BlurFade delay={BLUR_FADE_DELAY * 8}>
                            <Button asChild>
                                <Link href="/dashboard/profile/edit">Edit Profile</Link>
                            </Button>
                        </BlurFade>
                    )}
                    {user.email && (
                        <BlurFade delay={BLUR_FADE_DELAY * 9}>
                            <Button variant="outline" asChild>
                                <a href={`mailto:${user.email}`}>
                                    Contact
                                </a>
                            </Button>
                        </BlurFade>
                    )}
                </div>

                {/* Avatar */}
                <BlurFade delay={BLUR_FADE_DELAY * 10}>
                    <div className="flex items-center gap-6">
                        <Avatar className="h-24 w-24 sm:h-32 sm:w-32">
                            <AvatarImage alt={user.displayName} src={user.image || undefined} />
                            <AvatarFallback>{user.initials}</AvatarFallback>
                        </Avatar>
                    </div>
                </BlurFade>
            </div>

            {/* Profile Statistics */}
            <ProfileStatistics user={user} />

            <div className="grid gap-8 lg:grid-cols-3 mt-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* About Section */}
                    {profileSections.about && (
                        <BlurFade delay={BLUR_FADE_DELAY * 11}>
                            <Card>
                                <CardContent className="pt-6">
                                    <h2 className="text-xl font-semibold mb-4">{t('about')}</h2>
                                    <div className="prose max-w-full text-pretty font-sans text-sm text-muted-foreground dark:prose-invert">
                                        <Markdown>
                                            {user.bio}
                                        </Markdown>
                                    </div>
                                </CardContent>
                            </Card>
                        </BlurFade>
                    )}

                    {/* Work Section */}
                    {profileSections.work && (
                        <BlurFade delay={BLUR_FADE_DELAY * 12}>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="mb-4">
                                        <h2 className="text-xl font-semibold">
                                            {user.organization || t('work.title')}
                                        </h2>
                                        <p className="text-muted-foreground">
                                            {user.position}
                                        </p>
                                    </div>
                                    {user.workBio && (
                                        <div className="prose max-w-full text-pretty font-sans text-sm text-muted-foreground dark:prose-invert">
                                            <Markdown>
                                                {user.workBio}
                                            </Markdown>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </BlurFade>
                    )}

                    {/* Skills Section */}
                    {profileSections.skills && (
                        <BlurFade delay={BLUR_FADE_DELAY * 13}>
                            <Card>
                                <CardContent className="pt-6">
                                    <h2 className="text-xl font-semibold mb-4">{t('skills')}</h2>
                                    <div className="space-y-4">
                                        <div className="flex flex-wrap gap-2">
                                            {user.workTypes.map((type, id) => (
                                                <BlurFade key={type} delay={BLUR_FADE_DELAY * 11 + id * 0.05}>
                                                    <Badge variant="secondary">
                                                        {type.replace(/_/g, ' ')}
                                                    </Badge>
                                                </BlurFade>
                                            ))}
                                            {user.expertiseAreas.map((area, id) => (
                                                <BlurFade key={area} delay={BLUR_FADE_DELAY * 11 + (user.workTypes.length + id) * 0.05}>
                                                    <Badge variant="outline">
                                                        {area.replace(/_/g, ' ')}
                                                    </Badge>
                                                </BlurFade>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </BlurFade>
                    )}

                    {/* Recent Work Section */}
                    {profileSections.projects && (
                        <BlurFade delay={BLUR_FADE_DELAY * 14}>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-semibold">{t('recentWork.title')}</h2>
                                        {isOwnProfile && (
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href="/profile/work/add">{t('recentWork.addWork')}</Link>
                                            </Button>
                                        )}
                                    </div>
                                    <div className="space-y-4">
                                        {user.recentWork.map((work, id) => (
                                            <BlurFade key={work.id} delay={BLUR_FADE_DELAY * 15 + id * 0.05}>
                                                <div className="border-l-2 border-muted pl-4">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <h3 className="font-medium">{work.title}</h3>
                                                            <div className="prose max-w-full text-pretty font-sans text-xs text-muted-foreground dark:prose-invert">
                                                                <Markdown>
                                                                    {work.description}
                                                                </Markdown>
                                                            </div>
                                                            {work.link && (
                                                                <a
                                                                    href={work.link}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-sm text-primary hover:underline"
                                                                >
                                                                    View Project
                                                                </a>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {work.isOngoing ? 'Ongoing' : new Date(work.endDate || work.startDate).getFullYear()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </BlurFade>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </BlurFade>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Communities */}
                    {user.communities.filter(c => c.type === 'REGIONAL').length > 0 && (
                        <BlurFade delay={BLUR_FADE_DELAY * 16}>
                            <Card>
                                <CardContent className="pt-6">
                                    <h3 className="font-semibold mb-3">{t('regionalCommunities')}</h3>
                                    <div className="space-y-2">
                                        {user.communities
                                            .filter(c => c.type === 'REGIONAL')
                                            .map((community) => (
                                                <div key={community.id} className="flex items-center gap-2">
                                                    <Badge variant="secondary">
                                                        {community.regionalName?.replace(/_/g, ' ') || community.name}
                                                    </Badge>
                                                </div>
                                            ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </BlurFade>
                    )}

                    {user.communities.filter(c => c.type === 'SPECIAL').length > 0 && (
                        <BlurFade delay={BLUR_FADE_DELAY * 17}>
                            <Card>
                                <CardContent className="pt-6">
                                    <h3 className="font-semibold mb-3">{t('specialCommunities')}</h3>
                                    <div className="space-y-2">
                                        {user.communities
                                            .filter(c => c.type === 'SPECIAL')
                                            .map((community) => (
                                                <div key={community.id} className="flex items-center gap-2">
                                                    <Badge variant="outline">
                                                        {community.specialName?.replace(/_/g, ' ') || community.name}
                                                    </Badge>
                                                </div>
                                            ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </BlurFade>
                    )}

                    {/* Contact Links */}
                    {profileSections.contact && (
                        <BlurFade delay={BLUR_FADE_DELAY * 18}>
                            <Card>
                                <CardContent className="pt-6">
                                    <h3 className="font-semibold mb-3">{t('contact')}</h3>
                                    <div className="space-y-2">
                                        {user.personalWebsite && (
                                            <div className="flex items-center gap-2">
                                                <a href={user.personalWebsite} target="_blank" rel="noopener noreferrer">
                                                    <Badge variant="outline">Website</Badge>
                                                </a>
                                            </div>
                                        )}
                                        {user.linkedinProfile && (
                                            <div className="flex items-center gap-2">
                                                <a
                                                    href={user.linkedinProfile.startsWith('http')
                                                        ? user.linkedinProfile
                                                        : `https://linkedin.com/in/${user.linkedinProfile}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Badge variant="outline">LinkedIn</Badge>
                                                </a>
                                            </div>
                                        )}
                                        {user.otherSocialLinks.map((link, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <a
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Badge variant="outline">{link.platform}</Badge>
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </BlurFade>
                    )}
                </div>
            </div>
        </div>
    )
}
