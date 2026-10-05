import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations } from 'next-intl/server'
import { auth } from "@clerk/nextjs/server"
import { BlurFade } from "@/components/magicui/blur-fade"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Link } from '@/i18n/navigation'
import { getUserProfile, checkProfileOwnership } from "@/lib/actions/profile"
import { cn } from "@/lib/utils"
import { heading } from "@/lib/design-tokens"
import { ProfileVisibilityNotice } from "@/components/profile/visibility-notice"
import { Briefcase, CalendarDays, Eye, Languages, MapPin, MessageCircle } from "lucide-react"
import { MessageUserButton } from "@/components/messaging/message-user-button"
import { FollowButton } from "@/components/follow/follow-button"
import { listPublicWorkspacesForUser } from "@/lib/collaboration/service"
import { regionLabel, specialCommunityLabel } from "@/lib/labels"
import { RegionSectionSpine } from "@/components/regions/region-section-spine"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"
import { JsonLd, personJsonLd } from "@/lib/seo/json-ld";
import { siteUrl } from '@/lib/seo/site-url'
import { areConnected } from "@/lib/collaborate/connection"
import { RevealEmail } from "@/components/profile/reveal-email"
import { getAnsweredPrompts } from "@/lib/community/profile-prompts"
import { getUserContributions } from "@/lib/community/region-data"
import { listEventsOrganisedBy } from "@/lib/content/discovery"
import { toEventTile, type EventTileData } from "@/lib/events/listing"
import { profileLinks, profileSections, type SectionId } from "@/lib/profile/sections"
import { AboutSection } from "@/components/profile/about-section"
import { WorkSection } from "@/components/profile/work-section"
import { OnTheHubSection } from "@/components/profile/on-the-hub-section"
import { OwnerAddLink, ProfileSection } from "@/components/profile/owner-add-link"

const BLUR_FADE_DELAY = 0.04

// The section menu's anchors (the page's ids) for each section.
const ANCHOR: Record<SectionId, string> = { about: 'about', work: 'work', onTheHub: 'on-the-hub', communities: 'communities' }

interface ProfilePageProps {
    params: Promise<{
        username: string
        locale: string
    }>
    searchParams: Promise<{ as?: string }>
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
    const { username, locale } = await params
    const user = await getUserProfile(username)
    const t = await getTranslations({ locale, namespace: 'profiles' })

    if (!user) return { title: t('metaNotFound') }

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ')
    const title = fullName || user.username || t('unnamed')

    return {
        title: t('metaProfileTitle', { name: title }),
        description: t('metaProfileDescription', { name: title })
    }
}

/** A language as its name in the reader's language ("es" → "Spanish"); free text stays as written. */
function languageName(value: string, locale: string): string {
    try {
        return /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(value)
            ? new Intl.DisplayNames([locale], { type: 'language' }).of(value) ?? value
            : value
    } catch {
        return value
    }
}

/**
 * A person's profile (profile spec D3): who they are first — a header with one
 * line of facts — then About in their own words, Work, what they've done On
 * the hub, and Communities, each once. The owner sees every section with an
 * "Add…" where one is empty, and can see the page as others do (`?as=visitor`).
 */
export default async function ProfilePage({ params, searchParams }: ProfilePageProps) {
    const { username, locale } = await params
    const { as } = await searchParams
    const t = await getTranslations('profile')
    const tNav = await getTranslations('navigation')
    const tRegions = await getTranslations('navigation.regions')
    const tSpecial = await getTranslations('navigation.specialCommunities')
    const tConnect = await getTranslations('collaborate.connect')

    const { userId: currentUserId } = await auth()

    const user = await getUserProfile(username)

    if (!user) {
        notFound()
    }
    const isOwnProfile = await checkProfileOwnership(user.id)
    // The owner can look at their page the way everyone else does.
    const asVisitor = isOwnProfile && as === 'visitor'
    const ownerView = isOwnProfile && !asVisitor

    const [prompts, contributions, organised, publicWorkspaces, connected] = await Promise.all([
        getAnsweredPrompts(user.id, locale),
        // Recent work has its own home in Work — only what they shared with the hub here.
        getUserContributions(user.id, locale).then((all) => all.filter((c) => c.kind !== 'recentWork')),
        listEventsOrganisedBy(user.id).catch(() => []),
        listPublicWorkspacesForUser(user.id),
        // How to reach them — only once the two of you are connected (spec C5).
        currentUserId && !isOwnProfile ? areConnected(currentUserId, user.id).catch(() => false) : Promise.resolve(false),
    ])
    const events = organised.map(toEventTile).filter((e): e is EventTileData => e !== null)
    const recentWork = (user.recentWork as (typeof user.recentWork[number] & { hidden?: boolean; pinned?: boolean })[])
        .filter((w) => ownerView || !w.hidden)
    const links = profileLinks(user)
    const regional = user.communities.filter((c) => c.type === 'REGIONAL')
    const special = user.communities.filter((c) => c.type === 'SPECIAL')

    const sections = profileSections(
        {
            bio: user.bio,
            motivation: user.motivation,
            lookingFor: user.lookingFor,
            focusTopics: user.focusTopics,
            collaborationInterests: user.collaborationInterests,
            promptCount: prompts.length,
            livedExperienceStatement: user.livedExperienceStatement,
            workBio: user.workBio,
            skillsCount: user.workTypes.length + user.expertiseAreas.length,
            recentWorkCount: recentWork.length,
            linkCount: links.length,
            contributionCount: contributions.length,
            organisedEventCount: events.length,
            workspaceCount: publicWorkspaces.length,
            communityCount: user.communities.length,
        },
        { isOwner: ownerView },
    )
    const addHref = (id: SectionId) => sections.find((s) => s.id === id)?.addHref ?? null

    // One line of facts: role · place · member since · languages — each only when they show it.
    const role = user.position && user.organization
        ? t('facts.roleAt', { position: user.position, organization: user.organization })
        : user.position || user.organization
    const facts = [
        { icon: Briefcase, text: role },
        { icon: MapPin, text: user.location },
        { icon: CalendarDays, text: t('facts.memberSince', { date: new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(user.createdAt)) }) },
        {
            icon: Languages,
            text: user.languages.length > 0
                ? t('facts.speaks', { languages: new Intl.ListFormat(locale, { type: 'conjunction' }).format(user.languages.map((l) => languageName(l, locale))) })
                : null,
        },
    ].filter((f): f is { icon: typeof Briefcase; text: string } => Boolean(f.text))

    return (
        <div className="container max-w-4xl py-8">
            <JsonLd
                data={personJsonLd({
                    name: user.displayName,
                    url: `${siteUrl()}/${locale}/profiles/${user.username}`,
                    image: user.image ?? null,
                    jobTitle: user.headline ?? null,
                    affiliation: user.organization ?? null,
                })}
            />
            <PageBreadcrumb
                className="mb-6"
                items={[
                    { href: "/collaborate", label: tNav('collaborate') },
                    { label: user.displayName },
                ]}
            />

            {asVisitor && (
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ccm-sky/20 px-4 py-3 text-sm text-ccm-midnight">
                    <span className="inline-flex items-center gap-2 font-semibold">
                        <Eye className="size-4 text-ccm-sea" aria-hidden />
                        {t('view.seeingAsOthers')}
                    </span>
                    <Link href={`/profiles/${user.username}`} className="inline-flex min-h-11 items-center font-bold text-ccm-sea hover:underline">
                        {t('view.back')}
                    </Link>
                </div>
            )}

            {/* Header — who they are, at a glance */}
            <header className="mb-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                    {/* When the person is open to talk, the avatar wears a CCM
                        ring + a chat-bubble badge as a quiet signal. */}
                    <BlurFade delay={BLUR_FADE_DELAY * 3}>
                        <div className="relative w-24 shrink-0 sm:w-28">
                            <Avatar className={cn(
                                "h-24 w-24 sm:h-28 sm:w-28",
                                user.openToCollaboration && "ring-2 ring-ccm-sea ring-offset-2 ring-offset-background"
                            )}>
                                <AvatarImage alt={user.displayName} src={user.image || undefined} />
                                <AvatarFallback className="text-2xl">{user.initials}</AvatarFallback>
                            </Avatar>
                            {user.openToCollaboration && (
                                <span
                                    className="absolute -bottom-1 -end-1 flex size-7 items-center justify-center rounded-full bg-ccm-sea text-white ring-2 ring-background"
                                    title={t('openToCollaboration')}
                                >
                                    <MessageCircle className="size-3.5" aria-hidden="true" />
                                    <span className="sr-only">{t('openToCollaboration')}</span>
                                </span>
                            )}
                        </div>
                    </BlurFade>

                    <div className="min-w-0 flex-1 space-y-3">
                        <BlurFade delay={BLUR_FADE_DELAY * 3}>
                            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                <h1 className={cn("font-bold tracking-tight text-balance text-ccm-midnight", heading('xl'))}>
                                    <bdi>{user.displayName}</bdi>
                                </h1>
                                {user.pronouns && (
                                    <span className="text-sm text-muted-foreground">(<bdi>{user.pronouns}</bdi>)</span>
                                )}
                            </div>
                            {user.username && <p className="text-muted-foreground">@{user.username}</p>}
                        </BlurFade>

                        {user.headline && (
                            <BlurFade delay={BLUR_FADE_DELAY * 4}>
                                <p className="text-base font-medium text-balance text-ccm-sea md:text-lg"><bdi>{user.headline}</bdi></p>
                            </BlurFade>
                        )}

                        <BlurFade delay={BLUR_FADE_DELAY * 4.5}>
                            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                {facts.map(({ icon: Icon, text }) => (
                                    <li key={text} className="inline-flex items-center gap-1.5">
                                        <Icon className="size-4 shrink-0 text-ccm-sea/70" aria-hidden />
                                        <bdi>{text}</bdi>
                                    </li>
                                ))}
                            </ul>
                        </BlurFade>

                        {(user.openToCollaboration || connected) && (
                            <BlurFade delay={BLUR_FADE_DELAY * 5}>
                                <div className="flex flex-wrap items-center gap-2">
                                    {user.openToCollaboration && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-ccm-sky/25 px-3 py-1 text-xs font-semibold text-ccm-sea">
                                            <span className="size-1.5 rounded-full bg-ccm-sea" aria-hidden="true" />
                                            {t('openToCollaboration')}
                                        </span>
                                    )}
                                    {connected && (
                                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900">{tConnect('connected')}</span>
                                    )}
                                </div>
                            </BlurFade>
                        )}

                        <BlurFade delay={BLUR_FADE_DELAY * 6}>
                            <div className="flex flex-wrap items-center gap-2">
                                {!isOwnProfile && <MessageUserButton targetUserId={user.id} />}
                                {/* Person-follow: powers the "For you" rail and the
                                    FOLLOWERS messaging tier. Signed-in only. */}
                                {!isOwnProfile && currentUserId && <FollowButton targetType="USER" targetId={user.id} />}
                                {/* The address stays out of the page: a click and a human check reveal it —
                                    for a connection, or when the member shows their email. */}
                                {!isOwnProfile && (connected || user.hasPublicEmail) && <RevealEmail profileUserId={user.id} />}
                                {ownerView && (
                                    <>
                                        <Button asChild>
                                            <Link href="/dashboard/profile/edit">{t('editProfile')}</Link>
                                        </Button>
                                        <Button variant="outline" asChild>
                                            <Link href={`/profiles/${user.username}?as=visitor`}>
                                                <Eye className="size-4" aria-hidden />
                                                {t('view.asOthers')}
                                            </Link>
                                        </Button>
                                    </>
                                )}
                            </div>
                        </BlurFade>
                    </div>
                </div>

                {/* Who can see this profile — only the owner */}
                {ownerView && (
                    <ProfileVisibilityNotice
                        visibility={user.profileVisibility}
                        searchable={user.isSearchable}
                        className="mt-6 max-w-2xl"
                    />
                )}
            </header>

            {/* The chapters — same scroll-spy menu as the regional pages. */}
            {sections.length > 1 && (
                <RegionSectionSpine
                    className="mb-8"
                    sections={sections.map((s) => ({ id: ANCHOR[s.id], label: t(`sections.${s.id}`) }))}
                />
            )}

            <div className="space-y-12">
                {sections.map((s) => {
                    switch (s.id) {
                        case 'about':
                            return <AboutSection key={s.id} user={user} prompts={prompts} addHref={s.addHref} />
                        case 'work':
                            return (
                                <WorkSection
                                    key={s.id}
                                    workBio={user.workBio}
                                    workTypes={user.workTypes}
                                    expertiseAreas={user.expertiseAreas}
                                    recentWork={recentWork}
                                    links={links}
                                    isOwner={ownerView}
                                    addHref={s.addHref}
                                />
                            )
                        case 'onTheHub':
                            return (
                                <OnTheHubSection
                                    key={s.id}
                                    contributions={contributions}
                                    events={events}
                                    workspaces={publicWorkspaces}
                                    locale={locale}
                                    addHref={s.addHref}
                                />
                            )
                        case 'communities':
                            return (
                                <ProfileSection key={s.id} id="communities" title={t('sections.communities')}>
                                    {addHref('communities') && (
                                        <OwnerAddLink href={addHref('communities')!}>{t('add.communities')}</OwnerAddLink>
                                    )}
                                    {(regional.length > 0 || special.length > 0) && (
                                        <div className="flex flex-wrap gap-2">
                                            {regional.map((c) => (
                                                <Badge key={c.id} variant="secondary" className="max-w-full whitespace-normal break-words text-start">
                                                    <bdi>{regionLabel(tRegions, c.regionalName) || c.name}</bdi>
                                                </Badge>
                                            ))}
                                            {special.map((c) => (
                                                <Badge key={c.id} variant="outline" className="max-w-full whitespace-normal break-words text-start">
                                                    <bdi>{specialCommunityLabel(tSpecial, c.specialName) || c.name}</bdi>
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </ProfileSection>
                            )
                    }
                })}
            </div>
        </div>
    )
}
