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
import { Link } from '@/i18n/navigation'
import { getUserProfile, checkProfileOwnership } from "@/lib/actions/profile"
import { cn } from "@/lib/utils"
import { heading } from "@/lib/design-tokens"
import { MessageCircle } from "lucide-react"
import { regionLabel, specialCommunityLabel } from "@/lib/labels"
import { ProfileCompletenessIndicator } from "@/components/ui/profile-completeness-indicator"
import { ProfileStatistics } from "@/components/blocks/profile/profile-statistics"
import { ContributionsBlock } from "@/components/blocks/profile/contributions-block"
import { PromptsBlock } from "@/components/blocks/profile/prompts-block"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"
import { Suspense } from "react"

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

// Map the stored enum values to the camelCase translation keys.
const WORK_TYPE_KEY: Record<string, string> = {
    RESEARCH: 'research',
    POLICY: 'policy',
    LIVED_EXPERIENCE_EXPERT: 'livedExperience',
    NGO: 'ngo',
    COMMUNITY_ORGANIZATION: 'communityOrg',
    EDUCATION_TEACHING: 'education',
}
const EXPERTISE_KEY: Record<string, string> = {
    CLIMATE_CHANGE: 'climate',
    MENTAL_HEALTH: 'mentalHealth',
    HEALTH: 'health',
    EDUCATION: 'education',
    SOCIAL_JUSTICE: 'socialJustice',
}

export default async function ProfilePage({ params }: ProfilePageProps) {
    const { username, locale } = await params
    const t = await getTranslations('profile')
    const tNav = await getTranslations('navigation')
    const tRegions = await getTranslations('navigation.regions')
    const tSpecial = await getTranslations('navigation.specialCommunities')
    const tTypesRaw = await getTranslations('profile.work.types')
    const tExpertiseRaw = await getTranslations('profile.work.expertise')
    // Translate an enum value, falling back to a humanized form if unmapped.
    const tWorkTypes = (v: string) => {
        const k = WORK_TYPE_KEY[v]
        return k ? tTypesRaw(k) : v.replace(/_/g, ' ')
    }
    const tExpertise = (v: string) => {
        const k = EXPERTISE_KEY[v]
        return k ? tExpertiseRaw(k) : v.replace(/_/g, ' ')
    }

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
            <PageBreadcrumb
                className="mb-6"
                items={[
                    { href: "/collaborate", label: tNav('collaborate') },
                    { label: user.displayName },
                ]}
            />

            {/* Profile Header */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-start gap-6 mb-6">
                    {/* Avatar beside the identity, like a standard profile.
                        When the person is open to talk, the avatar wears a CCM
                        ring + a chat-bubble badge as a quiet signal. */}
                    <BlurFade delay={BLUR_FADE_DELAY * 3}>
                        <div className="relative shrink-0 w-24 sm:w-28">
                            <Avatar className={cn(
                                "h-24 w-24 sm:h-28 sm:w-28",
                                user.openToCollaboration && "ring-2 ring-[var(--color-ccm-sea)] ring-offset-2 ring-offset-background"
                            )}>
                                <AvatarImage alt={user.displayName} src={user.image || undefined} />
                                <AvatarFallback className="text-2xl">{user.initials}</AvatarFallback>
                            </Avatar>
                            {user.openToCollaboration && (
                                <span
                                    className="absolute -bottom-1 -end-1 flex size-7 items-center justify-center rounded-full bg-[var(--color-ccm-sea)] text-white ring-2 ring-background"
                                    title={t('openToCollaboration')}
                                >
                                    <MessageCircle className="size-3.5" aria-hidden="true" />
                                    <span className="sr-only">{t('openToCollaboration')}</span>
                                </span>
                            )}
                        </div>
                    </BlurFade>

                    <div className="flex-1 min-w-0">
                        <BlurFade delay={BLUR_FADE_DELAY * 3} className="mb-1">
                            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                <h1 className={cn("font-bold tracking-tight text-balance text-ccm-midnight", heading('xl'))}>
                                    <bdi>{user.displayName}</bdi>
                                </h1>
                                {user.pronouns && (
                                    <span className="text-sm text-muted-foreground">({user.pronouns})</span>
                                )}
                            </div>
                        </BlurFade>
                        {user.username && (
                            <BlurFade delay={BLUR_FADE_DELAY * 4} className="mb-2">
                                <p className="text-lg text-muted-foreground">@{user.username}</p>
                            </BlurFade>
                        )}
                        {user.headline && (
                            <BlurFade delay={BLUR_FADE_DELAY * 4.5} className="mb-3">
                                <p className="text-base md:text-lg font-medium text-ccm-sea text-balance">
                                    {user.headline}
                                </p>
                            </BlurFade>
                        )}
                        {user.openToCollaboration && (
                            <BlurFade delay={BLUR_FADE_DELAY * 4.8} className="mb-3">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-ccm-sky)]/25 px-3 py-1 text-xs font-semibold text-[var(--color-ccm-sea)]">
                                    <span className="size-1.5 rounded-full bg-[var(--color-ccm-sea)]" aria-hidden="true" />
                                    {t('openToCollaboration')}
                                </span>
                            </BlurFade>
                        )}

                        {/* Role / location — the at-a-glance "who you'd collaborate with" line */}
                        <BlurFade delay={BLUR_FADE_DELAY * 5}>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                {user.work && <span>{user.work}</span>}
                                {user.location && <span>{user.location}</span>}
                                {user.ageGroup && (
                                    <span>{user.ageGroup === 'UNDER_18' ? t('under18') : t('above18')}</span>
                                )}
                            </div>
                        </BlurFade>

                        {/* Expertise tags up top — the collaboration-relevant signal */}
                        {(user.workTypes.length > 0 || user.expertiseAreas.length > 0) && (
                            <BlurFade delay={BLUR_FADE_DELAY * 6}>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {user.workTypes.map((type) => (
                                        <Badge key={type} variant="secondary">
                                            {tWorkTypes(type)}
                                        </Badge>
                                    ))}
                                    {user.expertiseAreas.map((area) => (
                                        <Badge key={area} variant="outline">
                                            {tExpertise(area)}
                                        </Badge>
                                    ))}
                                </div>
                            </BlurFade>
                        )}

                        {/* Action Buttons */}
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            {isOwnProfile && (
                                <BlurFade delay={BLUR_FADE_DELAY * 8}>
                                    <Button asChild>
                                        <Link href="/dashboard/profile/edit">{t('editProfile')}</Link>
                                    </Button>
                                </BlurFade>
                            )}
                            {user.email && (
                                <BlurFade delay={BLUR_FADE_DELAY * 9}>
                                    <Button variant="outline" asChild>
                                        <a href={`mailto:${user.email}`}>{t('contact')}</a>
                                    </Button>
                                </BlurFade>
                            )}
                        </div>
                    </div>
                </div>

                {/* Profile Completeness - visible only to the profile owner */}
                {isOwnProfile && (
                    <BlurFade delay={BLUR_FADE_DELAY * 9} className="mb-2">
                        <ProfileCompletenessIndicator
                            percentage={user.profileCompleteness}
                            size="md"
                            className="max-w-sm"
                        />
                    </BlurFade>
                )}
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
                                    <h2 className={cn("font-semibold mb-4 text-ccm-midnight", heading('sm'))}>{t('about')}</h2>
                                    <div className="prose max-w-full text-pretty font-sans text-sm text-muted-foreground dark:prose-invert">
                                        <Markdown>
                                            {user.bio}
                                        </Markdown>
                                    </div>
                                </CardContent>
                            </Card>
                        </BlurFade>
                    )}

                    {/* Answered prompts — the most human part of the profile */}
                    <Suspense fallback={null}>
                        <PromptsBlock userId={user.id} locale={locale} />
                    </Suspense>

                    {/* Motivation — "what brought me here" */}
                    {user.motivation && (
                        <BlurFade delay={BLUR_FADE_DELAY * 11.5}>
                            <Card className="border-[var(--color-ccm-sky)] bg-[var(--color-ccm-sky)]/10">
                                <CardContent className="pt-6">
                                    <h2 className={cn("font-semibold mb-3 text-ccm-midnight", heading('sm'))}>{t('motivation')}</h2>
                                    <p className="text-pretty text-sm text-foreground/80 whitespace-pre-line">{user.motivation}</p>
                                </CardContent>
                            </Card>
                        </BlurFade>
                    )}

                    {/* Collaboration */}
                    {(user.openToCollaboration || user.collaborationInterests || user.focusTopics.length > 0 || user.lookingFor.length > 0) && (
                        <BlurFade delay={BLUR_FADE_DELAY * 12}>
                            <Card>
                                <CardContent className="pt-6 space-y-4">
                                    <h2 className={cn("font-semibold text-ccm-midnight", heading('sm'))}>{t('collaboration')}</h2>
                                    {user.collaborationInterests && (
                                        <p className="text-pretty text-sm text-muted-foreground whitespace-pre-line">{user.collaborationInterests}</p>
                                    )}
                                    {user.focusTopics.length > 0 && (
                                        <div>
                                            <h3 className="text-xs font-semibold uppercase tracking-wider text-ccm-sea mb-2">{t('focusTopics')}</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {user.focusTopics.map((topic) => (
                                                    <Badge key={topic} variant="secondary" className="bg-[var(--color-ccm-sky)]/25 text-[var(--color-ccm-sea)]">{topic}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {user.lookingFor.length > 0 && (
                                        <div>
                                            <h3 className="text-xs font-semibold uppercase tracking-wider text-ccm-sea mb-2">{t('lookingFor')}</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {user.lookingFor.map((item) => (
                                                    <Badge key={item} variant="outline">{item}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </BlurFade>
                    )}

                    {/* Lived experience — already redacted server-side unless opted in */}
                    {user.livedExperienceStatement && (
                        <BlurFade delay={BLUR_FADE_DELAY * 12.5}>
                            <Card className="border-l-4 border-l-[var(--color-ccm-water)]">
                                <CardContent className="pt-6">
                                    <h2 className={cn("font-semibold mb-3 text-ccm-midnight", heading('sm'))}>{t('livedExperience')}</h2>
                                    <p className="text-pretty text-sm text-foreground/80 whitespace-pre-line">{user.livedExperienceStatement}</p>
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
                                                        {tWorkTypes(type)}
                                                    </Badge>
                                                </BlurFade>
                                            ))}
                                            {user.expertiseAreas.map((area, id) => (
                                                <BlurFade key={area} delay={BLUR_FADE_DELAY * 11 + (user.workTypes.length + id) * 0.05}>
                                                    <Badge variant="outline">
                                                        {tExpertise(area)}
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
                                                <Link href="/dashboard/profile/edit/work/add">{t('recentWork.addWork')}</Link>
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

                    {/* Contributions (community-graph: their case studies / content / work) */}
                    <BlurFade delay={BLUR_FADE_DELAY * 14.5}>
                        <Suspense fallback={null}>
                            <ContributionsBlock userId={user.id} locale={locale} />
                        </Suspense>
                    </BlurFade>
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
                                                    <Badge variant="secondary" className="max-w-full whitespace-normal break-words text-start">
                                                        <bdi>{regionLabel(tRegions, community.regionalName) || community.name}</bdi>
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
                                                    <Badge variant="outline" className="max-w-full whitespace-normal break-words text-start">
                                                        <bdi>{specialCommunityLabel(tSpecial, community.specialName) || community.name}</bdi>
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
