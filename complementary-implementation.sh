#!/bin/bash

# Complementary Profile System Implementation Script
# This script implements the actual code content that was left out in the first script

echo "🔧 Implementing actual code content for Profile System..."

# 1. Implement the main profile page with complete code
echo "📄 Implementing main profile page code..."
cat > "app/[locale]/profiles/[username]/page.tsx" << 'EOF'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { getUserProfile, getProfileMetadata, checkProfileOwnership, formatProfileData } from '@/lib/actions/profile'
import BlurFade from "@/components/magicui/blur-fade"
import BlurFadeText from "@/components/magicui/blur-fade-text"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProfileStatistics } from "@/components/blocks/profile/profile-statistics"
import { ProfileNavigation } from "@/components/blocks/profile/profile-navigation"
import { Edit, Mail, MapPin, Calendar, Briefcase, Building, Globe, Linkedin, Twitter, ExternalLink } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import Markdown from "react-markdown"

const BLUR_FADE_DELAY = 0.04

interface ProfilePageProps {
    params: {
        locale: string
        username: string
    }
}

export async function generateMetadata({ params }: ProfilePageProps) {
    const { username } = params
    const metadata = await getProfileMetadata(username)

    if (!metadata) {
        return {
            title: 'Profile Not Found',
            description: 'The requested user profile could not be found.'
        }
    }

    return {
        title: metadata.title,
        description: metadata.description,
        openGraph: {
            title: metadata.title,
            description: metadata.description,
            images: metadata.image ? [{ url: metadata.image }] : [],
            type: 'profile'
        },
        twitter: {
            card: 'summary_large_image',
            title: metadata.title,
            description: metadata.description,
            images: metadata.image ? [metadata.image] : []
        }
    }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
    const { locale, username } = params
    const t = await getTranslations('profile')
    const tCommon = await getTranslations('common')

    const userData = await getUserProfile(username)

    if (!userData) {
        notFound()
    }

    const user = formatProfileData(userData)
    const isOwnProfile = await checkProfileOwnership(user.id)

    const workTypeLabels: Record<string, string> = {
        RESEARCH: t('work.types.research'),
        POLICY: t('work.types.policy'),
        LIVED_EXPERIENCE_EXPERT: t('work.types.livedExperience'),
        NGO: t('work.types.ngo'),
        COMMUNITY_ORGANIZATION: t('work.types.communityOrg'),
        EDUCATION_TEACHING: t('work.types.education')
    }

    const expertiseLabels: Record<string, string> = {
        CLIMATE_CHANGE: t('work.expertise.climate'),
        MENTAL_HEALTH: t('work.expertise.mentalHealth'),
        HEALTH: t('work.expertise.health')
    }

    const regionalLabels: Record<string, string> = {
        SUB_SAHARAN_AFRICA: t('communities.regional.subSaharanAfrica'),
        NORTHERN_AFRICA_AND_WESTERN_ASIA: t('communities.regional.northernAfricaWesternAsia'),
        CENTRAL_AND_SOUTHERN_ASIA: t('communities.regional.centralSouthernAsia'),
        EASTERN_AND_SOUTH_EASTERN_ASIA: t('communities.regional.easternSouthEasternAsia'),
        LATIN_AMERICA_AND_THE_CARIBBEAN: t('communities.regional.latinAmericaCaribbean'),
        OCEANIA: t('communities.regional.oceania'),
        EUROPE_AND_NORTH_AMERICA: t('communities.regional.europeNorthAmerica')
    }

    const specialLabels: Record<string, string> = {
        YOUTH: t('communities.special.youth'),
        INDIGENOUS: t('communities.special.indigenous'),
        FARMER_AND_FISHER: t('communities.special.farmerFisher')
    }

    // Determine visible sections for navigation
    const visibleSections = {
        about: !!user.bio,
        work: !!(user.work || user.workBio),
        skills: user.workTypes.length > 0 || user.expertiseAreas.length > 0,
        projects: user.recentWork.length > 0,
        communities: user.communities.length > 0,
        contact: !!(user.personalWebsite || user.linkedinProfile || user.twitterHandle)
    }

    return (
        <div className="min-h-screen bg-background relative">
            {/* Navigation Component */}
            <ProfileNavigation sections={visibleSections} />

            <main className="flex flex-col min-h-[100dvh] space-y-10">
                <div className="container py-8">
                    {/* Breadcrumbs */}
                    <BlurFade delay={BLUR_FADE_DELAY}>
                        <Breadcrumb className="mb-6">
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/">{tCommon('home')}</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/profiles">
                                        Community Members
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>
                                        {user.displayName}
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </BlurFade>

                    {/* Hero Section */}
                    <section id="hero">
                        <div className="mx-auto w-full max-w-2xl space-y-8">
                            <div className="gap-2 flex justify-between">
                                <div className="flex-col flex flex-1 space-y-1.5">
                                    <BlurFadeText
                                        delay={BLUR_FADE_DELAY}
                                        className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none"
                                        yOffset={8}
                                        text={user.displayName}
                                    />
                                    {user.username && (
                                        <BlurFadeText
                                            className="max-w-[600px] md:text-xl text-muted-foreground"
                                            delay={BLUR_FADE_DELAY}
                                            text={`@${user.username}`}
                                        />
                                    )}

                                    {/* Work and location info */}
                                    <div className="flex flex-col gap-2 pt-2">
                                        {user.work && (
                                            <BlurFade delay={BLUR_FADE_DELAY * 2}>
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Briefcase className="h-4 w-4" />
                                                    <span className="text-sm">{user.work}</span>
                                                </div>
                                            </BlurFade>
                                        )}

                                        {user.location && (
                                            <BlurFade delay={BLUR_FADE_DELAY * 3}>
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <MapPin className="h-4 w-4" />
                                                    <span className="text-sm">{user.location}</span>
                                                </div>
                                            </BlurFade>
                                        )}

                                        {user.ageGroup && (
                                            <BlurFade delay={BLUR_FADE_DELAY * 4}>
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Calendar className="h-4 w-4" />
                                                    <Badge variant="secondary" className="text-xs">
                                                        {user.ageGroup === 'UNDER_18' ? t('under18') : t('above18')}
                                                    </Badge>
                                                </div>
                                            </BlurFade>
                                        )}
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex gap-4 pt-4">
                                        {isOwnProfile ? (
                                            <BlurFade delay={BLUR_FADE_DELAY * 5}>
                                                <Button size="default" asChild>
                                                    <Link href="/profile/edit">
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        {t('editProfile')}
                                                    </Link>
                                                </Button>
                                            </BlurFade>
                                        ) : (
                                            user.email && (
                                                <BlurFade delay={BLUR_FADE_DELAY * 5}>
                                                    <Button size="default" asChild>
                                                        <a href={`mailto:${user.email}`}>
                                                            <Mail className="h-4 w-4 mr-2" />
                                                            {t('contact')}
                                                        </a>
                                                    </Button>
                                                </BlurFade>
                                            )
                                        )}
                                    </div>
                                </div>
                                <BlurFade delay={BLUR_FADE_DELAY}>
                                    <Avatar className="size-28 border">
                                        <AvatarImage alt={user.displayName} src={user.image || undefined} />
                                        <AvatarFallback>{user.initials}</AvatarFallback>
                                    </Avatar>
                                </BlurFade>
                            </div>
                        </div>
                    </section>

                    {/* Profile Statistics */}
                    <ProfileStatistics user={user} />

                    {/* About Section */}
                    {visibleSections.about && (
                        <section id="about">
                            <BlurFade delay={BLUR_FADE_DELAY * 6}>
                                <h2 className="text-xl font-bold">{t('basicInfo')}</h2>
                            </BlurFade>
                            <BlurFade delay={BLUR_FADE_DELAY * 7}>
                                <Markdown className="prose max-w-full text-pretty font-sans text-sm text-muted-foreground dark:prose-invert">
                                    {user.bio}
                                </Markdown>
                            </BlurFade>
                        </section>
                    )}

                    {/* Work Section */}
                    {visibleSections.work && (
                        <section id="work">
                            <div className="flex min-h-0 flex-col gap-y-3">
                                <BlurFade delay={BLUR_FADE_DELAY * 8}>
                                    <h2 className="text-xl font-bold">{t('work.title')}</h2>
                                </BlurFade>
                                <BlurFade delay={BLUR_FADE_DELAY * 9}>
                                    <Card className="border-none shadow-none bg-transparent">
                                        <CardHeader className="px-0">
                                            <div className="flex items-start gap-4">
                                                <Avatar className="border size-12 bg-muted-background dark:bg-foreground">
                                                    <AvatarFallback>
                                                        <Building className="h-6 w-6" />
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold leading-none">
                                                        {user.organization || t('work.title')}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {user.position}
                                                    </p>
                                                    {user.workBio && (
                                                        <span className="prose dark:prose-invert text-sm text-muted-foreground mt-2 block">
                                                            {user.workBio}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </CardHeader>
                                    </Card>
                                </BlurFade>
                            </div>
                        </section>
                    )}

                    {/* Skills Section */}
                    {visibleSections.skills && (
                        <section id="skills">
                            <div className="flex min-h-0 flex-col gap-y-3">
                                <BlurFade delay={BLUR_FADE_DELAY * 10}>
                                    <h2 className="text-xl font-bold">Skills</h2>
                                </BlurFade>
                                <div className="flex flex-wrap gap-1">
                                    {user.workTypes.map((type, id) => (
                                        <BlurFade key={type} delay={BLUR_FADE_DELAY * 11 + id * 0.05}>
                                            <Badge>{workTypeLabels[type] || type}</Badge>
                                        </BlurFade>
                                    ))}
                                    {user.expertiseAreas.map((area, id) => (
                                        <BlurFade key={area} delay={BLUR_FADE_DELAY * 11 + (user.workTypes.length + id) * 0.05}>
                                            <Badge variant="secondary">{expertiseLabels[area] || area}</Badge>
                                        </BlurFade>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Projects Section */}
                    {visibleSections.projects && (
                        <section id="projects">
                            <div className="space-y-12 w-full py-12">
                                <BlurFade delay={BLUR_FADE_DELAY * 12}>
                                    <div className="flex flex-col items-center justify-center space-y-4 text-center">
                                        <div className="space-y-2">
                                            <div className="inline-block rounded-lg bg-foreground text-background px-3 py-1 text-sm">
                                                {t('recentWork.title')}
                                            </div>
                                            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                                                Check out my latest work
                                            </h2>
                                            <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                                Here are some of my recent projects and contributions.
                                            </p>
                                        </div>
                                    </div>
                                </BlurFade>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 max-w-[800px] mx-auto">
                                    {user.recentWork.map((work, id) => (
                                        <BlurFade
                                            key={work.id}
                                            delay={BLUR_FADE_DELAY * 13 + id * 0.05}
                                        >
                                            <Card className="h-full hover:shadow-lg transition-shadow">
                                                <CardHeader>
                                                    <div className="space-y-1">
                                                        <CardTitle className="text-base">{work.title}</CardTitle>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <Calendar className="h-3 w-3" />
                                                            <span>
                                                                {format(work.startDate, 'MMM yyyy')} - {' '}
                                                                {work.isOngoing
                                                                    ? t('recentWork.present')
                                                                    : work.endDate
                                                                        ? format(work.endDate, 'MMM yyyy')
                                                                        : t('recentWork.present')
                                                                }
                                                            </span>
                                                            {work.isOngoing && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    {t('recentWork.ongoing')}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <Markdown className="prose max-w-full text-pretty font-sans text-xs text-muted-foreground dark:prose-invert">
                                                            {work.description}
                                                        </Markdown>
                                                    </div>
                                                </CardHeader>
                                                {work.link && (
                                                    <CardContent className="pt-0">
                                                        <div className="flex flex-row flex-wrap items-start gap-1">
                                                            <Link href={work.link} target="_blank">
                                                                <Badge className="flex gap-2 px-2 py-1 text-[10px]">
                                                                    <ExternalLink className="h-3 w-3" />
                                                                    View Project
                                                                </Badge>
                                                            </Link>
                                                        </div>
                                                    </CardContent>
                                                )}
                                            </Card>
                                        </BlurFade>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Communities Section */}
                    {visibleSections.communities && (
                        <section id="communities">
                            <BlurFade delay={BLUR_FADE_DELAY * 14}>
                                <h2 className="text-xl font-bold">{t('communities.title')}</h2>
                            </BlurFade>
                            <div className="space-y-6">
                                {user.communities.filter(c => c.type === 'REGIONAL').length > 0 && (
                                    <BlurFade delay={BLUR_FADE_DELAY * 15}>
                                        <div>
                                            <h3 className="text-sm font-medium mb-3">{t('communities.regionalCommunities')}</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {user.communities
                                                    .filter(c => c.type === 'REGIONAL')
                                                    .map((community) => (
                                                        <Badge key={community.id} variant="secondary">
                                                            {community.regionalName
                                                                ? regionalLabels[community.regionalName] || community.name
                                                                : community.name}
                                                        </Badge>
                                                    ))}
                                            </div>
                                        </div>
                                    </BlurFade>
                                )}

                                {user.communities.filter(c => c.type === 'SPECIAL').length > 0 && (
                                    <BlurFade delay={BLUR_FADE_DELAY * 16}>
                                        <div>
                                            <h3 className="text-sm font-medium mb-3">{t('communities.specialGroups')}</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {user.communities
                                                    .filter(c => c.type === 'SPECIAL')
                                                    .map((community) => (
                                                        <Badge key={community.id} variant="outline">
                                                            {community.specialName
                                                                ? specialLabels[community.specialName] || community.name
                                                                : community.name}
                                                        </Badge>
                                                    ))}
                                            </div>
                                        </div>
                                    </BlurFade>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Contact Section */}
                    {visibleSections.contact && (
                        <section id="contact">
                            <div className="grid items-center justify-center gap-4 px-4 text-center md:px-6 w-full py-12">
                                <BlurFade delay={BLUR_FADE_DELAY * 17}>
                                    <div className="space-y-3">
                                        <div className="inline-block rounded-lg bg-foreground text-background px-3 py-1 text-sm">
                                            {t('social.title')}
                                        </div>
                                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                                            Get in Touch
                                        </h2>
                                        <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                            Connect with me through these platforms.
                                        </p>
                                    </div>
                                </BlurFade>

                                <div className="flex justify-center gap-4 mt-6">
                                    {user.personalWebsite && (
                                        <BlurFade delay={BLUR_FADE_DELAY * 18}>
                                            <Button variant="outline" asChild>
                                                <a href={user.personalWebsite} target="_blank" rel="noopener noreferrer">
                                                    <Globe className="h-4 w-4 mr-2" />
                                                    {t('social.website')}
                                                </a>
                                            </Button>
                                        </BlurFade>
                                    )}
                                    {user.linkedinProfile && (
                                        <BlurFade delay={BLUR_FADE_DELAY * 19}>
                                            <Button variant="outline" asChild>
                                                <a
                                                    href={user.linkedinProfile.startsWith('http')
                                                        ? user.linkedinProfile
                                                        : `https://linkedin.com/in/${user.linkedinProfile}`
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Linkedin className="h-4 w-4 mr-2" />
                                                    {t('social.linkedin')}
                                                </a>
                                            </Button>
                                        </BlurFade>
                                    )}
                                    {user.twitterHandle && (
                                        <BlurFade delay={BLUR_FADE_DELAY * 20}>
                                            <Button variant="outline" asChild>
                                                <a
                                                    href={user.twitterHandle.startsWith('http')
                                                        ? user.twitterHandle
                                                        : `https://twitter.com/${user.twitterHandle.replace('@', '')}`
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Twitter className="h-4 w-4 mr-2" />
                                                    {t('social.twitter')}
                                                </a>
                                            </Button>
                                        </BlurFade>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </main>
        </div>
    )
}
EOF

# 2. Implement the loading page with complete code
echo "⏳ Implementing loading page code..."
cat > "app/[locale]/profiles/[username]/loading.tsx" << 'EOF'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList } from "@/components/ui/breadcrumb"

export default function Loading() {
    return (
        <main className="flex flex-col min-h-[100dvh] space-y-10">
            <div className="container py-8">
                {/* Breadcrumbs */}
                <Breadcrumb className="mb-6">
                    <BreadcrumbList>
                        <div className="flex items-center space-x-2">
                            <Skeleton className="h-4 w-12" />
                            <span>/</span>
                            <Skeleton className="h-4 w-20" />
                            <span>/</span>
                            <Skeleton className="h-4 w-16" />
                        </div>
                    </BreadcrumbList>
                </Breadcrumb>

                {/* Hero Section */}
                <section className="space-y-8">
                    <div className="mx-auto w-full max-w-2xl">
                        <div className="gap-2 flex justify-between">
                            <div className="flex-col flex flex-1 space-y-4">
                                <Skeleton className="h-12 w-80" />
                                <Skeleton className="h-6 w-48" />
                                <div className="flex flex-col gap-2">
                                    <Skeleton className="h-5 w-64" />
                                    <Skeleton className="h-5 w-48" />
                                    <Skeleton className="h-6 w-20" />
                                </div>
                                <Skeleton className="h-10 w-32" />
                            </div>
                            <Skeleton className="size-28 rounded-full" />
                        </div>
                    </div>
                </section>

                {/* Content Sections */}
                <div className="space-y-10">
                    <section>
                        <Skeleton className="h-6 w-32 mb-4" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                    </section>

                    <section>
                        <Skeleton className="h-6 w-24 mb-4" />
                        <Card className="border-none shadow-none bg-transparent">
                            <CardHeader className="px-0">
                                <div className="flex items-start gap-4">
                                    <Skeleton className="size-12 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-5 w-48" />
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-4 w-full" />
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    </section>

                    <section>
                        <Skeleton className="h-6 w-16 mb-4" />
                        <div className="flex flex-wrap gap-2">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <Skeleton key={i} className="h-6 w-24" />
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </main>
    )
}
EOF

# 3. Implement the not found page with complete code
echo "❌ Implementing not found page code..."
cat > "app/[locale]/profiles/[username]/not-found.tsx" << 'EOF'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserX, ArrowLeft } from 'lucide-react'

export default async function NotFound() {
    const t = await getTranslations('errors')
    const tCommon = await getTranslations('common')

    return (
        <div className="container py-16 max-w-2xl mx-auto">
            <Card className="text-center">
                <CardHeader className="pb-2">
                    <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <UserX className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-2xl">Profile Not Found</CardTitle>
                    <CardDescription className="text-base">
                        The user profile you're looking for doesn't exist or may have been removed.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button asChild variant="default">
                            <Link href="/profiles">
                                Browse Profiles
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                {tCommon('back')} to Home
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
EOF

# 4. Implement the enhanced server actions with complete code
echo "⚡ Implementing enhanced server actions code..."
mkdir -p "lib/actions"
cat > "lib/actions/profile.ts" << 'EOF'
"use server"

import { prisma } from "@/lib/prisma"
import { auth } from '@clerk/nextjs/server'
import { unstable_cache } from 'next/cache'

export interface ProfileData {
    id: string
    firstName?: string | null
    lastName?: string | null
    username?: string | null
    image?: string | null
    email?: string | null
    bio?: string | null
    ageGroup?: 'UNDER_18' | 'ABOVE_18' | null
    country?: string | null
    city?: string | null
    workTypes: string[]
    expertiseAreas: string[]
    organization?: string | null
    position?: string | null
    workBio?: string | null
    personalWebsite?: string | null
    linkedinProfile?: string | null
    twitterHandle?: string | null
    role: string
    createdAt: Date
    updatedAt: Date
    recentWork: Array<{
        id: string
        title: string
        description: string
        link?: string | null
        isOngoing: boolean
        startDate: Date
        endDate?: Date | null
    }>
    communities: Array<{
        id: string
        name: string
        type: 'REGIONAL' | 'SPECIAL'
        regionalName?: string | null
        specialName?: string | null
    }>
}

// Cache profile data for 5 minutes
const getCachedUserProfile = unstable_cache(
    async (username: string): Promise<ProfileData | null> => {
        const user = await prisma.user.findUnique({
            where: { username },
            include: {
                recentWork: {
                    orderBy: { startDate: 'desc' },
                    take: 5
                },
                communityMemberships: {
                    include: {
                        community: true
                    }
                }
            }
        })

        if (!user) {
            return null
        }

        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            image: user.image,
            email: user.email,
            bio: user.bio,
            ageGroup: user.ageGroup,
            country: user.country,
            city: user.city,
            workTypes: user.workTypes,
            expertiseAreas: user.expertiseAreas,
            organization: user.organization,
            position: user.position,
            workBio: user.workBio,
            personalWebsite: user.personalWebsite,
            linkedinProfile: user.linkedinProfile,
            twitterHandle: user.twitterHandle,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            recentWork: user.recentWork,
            communities: user.communityMemberships.map(membership => membership.community)
        }
    },
    ['profile'],
    {
        revalidate: 300, // 5 minutes
        tags: ['profile']
    }
)

export async function getUserProfile(username: string): Promise<ProfileData | null> {
    try {
        return await getCachedUserProfile(username)
    } catch (error) {
        console.error('Error fetching user profile:', error)
        return null
    }
}

export async function checkProfileOwnership(profileUserId: string): Promise<boolean> {
    try {
        const { userId } = auth()
        return userId === profileUserId
    } catch (error) {
        console.error('Error checking profile ownership:', error)
        return false
    }
}

export async function getProfileMetadata(username: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { username },
            select: {
                firstName: true,
                lastName: true,
                username: true,
                bio: true,
                image: true
            }
        })

        if (!user) {
            return null
        }

        const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ')
        const displayName = fullName || user.username || 'User Profile'
        const description = user.bio || `View ${displayName}'s profile and work.`

        return {
            title: displayName,
            description,
            image: user.image
        }
    } catch (error) {
        console.error('Error fetching profile metadata:', error)
        return null
    }
}

// Helper function to format profile data for display
export function formatProfileData(user: ProfileData) {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ')
    const location = [user.city, user.country].filter(Boolean).join(', ')
    const work = [user.position, user.organization].filter(Boolean).join(' at ')

    return {
        ...user,
        fullName: fullName || user.username,
        displayName: fullName || user.username || 'Unnamed User',
        location,
        work,
        initials: `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || user.username?.[0]?.toUpperCase() || '??'
    }
}
EOF

# 5. Implement the profile statistics component with complete code
echo "📊 Implementing profile statistics component code..."
mkdir -p "components/blocks/profile"
cat > "components/blocks/profile/profile-statistics.tsx" << 'EOF'
"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, Briefcase, Award, Clock } from "lucide-react"
import { useTranslations } from 'next-intl'
import { formatDistanceToNow } from 'date-fns'
import BlurFade from "@/components/magicui/blur-fade"

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
EOF

# 6. Implement the navigation component with complete code
echo "🧭 Implementing navigation component code..."
cat > "components/blocks/profile/profile-navigation.tsx" << 'EOF'
"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { User, Briefcase, Award, FolderOpen, Users, MessageCircle, ArrowUp } from "lucide-react"
import { useTranslations } from 'next-intl'

interface Section {
  id: string
  icon: React.ComponentType<any>
  label: string
  visible: boolean
}

interface ProfileNavigationProps {
  sections: {
    about: boolean
    work: boolean
    skills: boolean
    projects: boolean
    communities: boolean
    contact: boolean
  }
  className?: string
}

export function ProfileNavigation({ sections, className }: ProfileNavigationProps) {
  const t = useTranslations('profile')
  const [activeSection, setActiveSection] = useState<string>('hero')
  const [showScrollTop, setShowScrollTop] = useState(false)

  const sectionList: Section[] = [
    { id: 'hero', icon: User, label: 'Overview', visible: true },
    { id: 'about', icon: User, label: t('basicInfo'), visible: sections.about },
    { id: 'work', icon: Briefcase, label: 'Experience', visible: sections.work },
    { id: 'skills', icon: Award, label: 'Skills', visible: sections.skills },
    { id: 'projects', icon: FolderOpen, label: 'Projects', visible: sections.projects },
    { id: 'communities', icon: Users, label: 'Communities', visible: sections.communities },
    { id: 'contact', icon: MessageCircle, label: 'Contact', visible: sections.contact },
  ].filter(section => section.visible)

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY
      setShowScrollTop(scrolled > 300)

      // Update active section based on scroll position
      const sections = document.querySelectorAll('section[id]')
      let current = 'hero'

      sections.forEach((section) => {
        const sectionTop = (section as HTMLElement).offsetTop
        const sectionHeight = (section as HTMLElement).offsetHeight
        if (scrolled >= sectionTop - 200 && scrolled < sectionTop + sectionHeight - 200) {
          current = section.getAttribute('id') || 'hero'
        }
      })

      setActiveSection(current)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const yOffset = -80 // Account for sticky header
      const yPosition = element.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: yPosition, behavior: 'smooth' })
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden xl:block fixed left-8 top-1/2 -translate-y-1/2 z-40",
        className
      )}>
        <Card className="w-48">
          <CardContent className="p-3">
            <nav className="space-y-1">
              {sectionList.map((section) => {
                const Icon = section.icon
                return (
                  <Button
                    key={section.id}
                    variant={activeSection === section.id ? "secondary" : "ghost"}
                    className="w-full justify-start text-sm"
                    size="sm"
                    onClick={() => scrollToSection(section.id)}
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    {section.label}
                  </Button>
                )
              })}
            </nav>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Navigation Dots */}
      <div className="xl:hidden fixed right-4 top-1/2 -translate-y-1/2 z-40">
        <div className="flex flex-col space-y-2">
          {sectionList.map((section) => (
            <button
              key={section.id}
              className={cn(
                "w-3 h-3 rounded-full transition-all duration-200",
                activeSection === section.id
                  ? "bg-primary scale-125"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
              onClick={() => scrollToSection(section.id)}
              aria-label={`Go to ${section.label}`}
            />
          ))}
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          className="fixed bottom-8 right-8 z-50 rounded-full shadow-lg"
          size="icon"
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      )}
    </>
  )
}
EOF

# 7. Create Skeleton component if it doesn't exist
echo "🦴 Ensuring Skeleton component exists..."
if [ ! -f "components/ui/skeleton.tsx" ]; then
    cat > "components/ui/skeleton.tsx" << 'EOF'
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
EOF
    echo "✅ Created Skeleton component"
else
    echo "✅ Skeleton component already exists"
fi

# 8. Update profile components index
echo "📦 Updating profile components index..."
cat >> "components/blocks/profile/index.tsx" << 'EOF'

// New portfolio-style components
export { ProfileStatistics } from './profile-statistics'
export { ProfileNavigation } from './profile-navigation'
EOF

echo "✅ Profile components index updated"

# 9. Final verification
echo "🔍 Verifying implementation..."

# Check that all files have actual content (not just placeholders)
files_to_check=(
    "app/[locale]/profiles/[username]/page.tsx"
    "app/[locale]/profiles/[username]/loading.tsx"
    "app/[locale]/profiles/[username]/not-found.tsx"
    "lib/actions/profile.ts"
    "components/blocks/profile/profile-statistics.tsx"
    "components/blocks/profile/profile-navigation.tsx"
    "components/ui/skeleton.tsx"
)

echo "📋 Checking files contain actual implementation..."
for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        # Check if file has actual content (more than just comments)
        content_lines=$(grep -v "^//" "$file" | grep -v "^$" | wc -l)
        if [ $content_lines -gt 5 ]; then
            echo "✅ $file - Has implementation ($content_lines lines)"
        else
            echo "❌ $file - Missing implementation (only $content_lines lines)"
        fi
    else
        echo "❌ $file - File missing!"
    fi
done

echo ""
echo "🎉 Complementary Implementation Complete!"
echo ""
echo "✅ All code has been implemented with actual content:"
echo "   • Main profile page with portfolio layout"
echo "   • Loading page with proper skeletons"
echo "   • Not found page with error handling"
echo "   • Enhanced server actions with caching"
echo "   • Profile statistics component"
echo "   • Navigation component with smooth scrolling"
echo "   • Skeleton component (if missing)"
echo ""
echo "🚀 Ready to test your profile system at: /profiles/[username]"
EOF


echo "✅ Complementary implementation script created!"
echo "🚀 Run it with: ./complementary-implementation.sh"
echo ""
echo "This script fills in all the actual code content that was missing from the first script."
