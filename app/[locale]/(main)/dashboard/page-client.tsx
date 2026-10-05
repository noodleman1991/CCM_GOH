'use client'

import { useTranslations } from 'next-intl'
import { isRTL } from '@/i18n/i18n-helpers'
import { cn } from '@/lib/utils'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  User,
  Settings,
  Upload,
  Users,
  MapPin,
  Calendar,
  ArrowRight,
  FolderKanban,
  MessageSquare
} from 'lucide-react'
import { SectionHeader } from '@/components/ui/section-header'
import { useCollaboration } from '@/hooks/use-collaboration'
import { OpenToCollaborateCard } from '@/components/collaborate/open-to-collaborate-card'
import { DashboardGreeting } from '@/components/dashboard/greeting'
import { YourWeek } from '@/components/dashboard/your-week'
import { DashboardEvents } from '@/components/dashboard/dashboard-events'
import type { WeekItem } from '@/lib/dashboard/your-week'
import type { EventTileData } from '@/lib/events/listing'
import type { ProfileStep } from '@/lib/profile/next-step'
import { ContributionsCard } from '@/components/contributions/contributions-card'
import type { ContributionStatus } from '@/lib/contributions/model'
import type { SupportedLocale } from '@/types/prisma'
import { imageUrl } from '@/lib/content/images'

interface DashboardUser {
  id: string
  firstName: string | null
  lastName: string | null
  username: string | null
  email: string
  image: string | null
  bio: string | null
  profileCompleteness: number
  openToCollaboration: boolean
}

interface RegionalCommunity {
  id: string
  name: string
  slug: string
  memberCount?: number
}

interface RecentWork {
  id: string
  title: string
  description: string | null
  startDate: string
  endDate: string | null
  isOngoing: boolean
}

interface NewsItem {
  _id: string
  title: string
  slug: { current: string }
  excerpt?: string
  publishedAt: string
  image?: {
    asset?: {
      url: string
      metadata?: {
        lqip?: string
      }
    }
    alt?: string
  }
}

type ForYouRow = { id: string; type: string; title: string; href: string; match: "region" | "theme" }

interface DashboardClientProps {
  forYou?: ForYouRow[]
  user: DashboardUser
  regionalCommunity: RegionalCommunity | null
  recentWork: RecentWork[]
  recentNews: NewsItem[]
  yourWeek?: WeekItem[]
  dashboardEvents?: { going: EventTileData[]; community: EventTileData[]; hasCommunity: boolean }
  profileStep?: ProfileStep
  /** My contributions summary; null when the team has hidden the page. */
  contributionsCard?: { counts: Record<ContributionStatus, number> } | null
  locale: SupportedLocale
}

export function DashboardClient({
  forYou = [],
  user,
  regionalCommunity,
  recentWork,
  recentNews,
  contributionsCard = null,
  yourWeek = [],
  dashboardEvents = { going: [], community: [], hasCommunity: false },
  profileStep = null,
  locale
}: DashboardClientProps) {
  const t = useTranslations('dashboard')
  const access = useCollaboration()
  const rtl = isRTL(locale)

  const displayName = user.firstName && user.lastName
    ? rtl
      ? `${user.lastName} ${user.firstName}`
      : `${user.firstName} ${user.lastName}`
    : user.firstName || user.username || t('anonymousUser')

  return (
    <main className="min-h-screen" dir={rtl ? 'rtl' : 'ltr'}>
      {/* Greeting + the one next step for your profile (dashboard spec D2) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <DashboardGreeting
          name={user.firstName || displayName}
          image={user.image}
          percent={user.profileCompleteness}
          step={profileStep}
          profileHref={user.username ? `/profiles/${user.username}` : null}
        />
      </section>

      {/* Your Community — full-width band directly under the header (most
          personal, engagement-driving element; near the top on mobile too) */}
      {regionalCommunity && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <Card>
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-3 rounded-lg bg-[var(--color-ccm-sea)]/10 flex-shrink-0">
                  <MapPin className="w-6 h-6 text-[var(--color-ccm-sea)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ccm-sea">{t('yourCommunity')}</p>
                  <p className="font-heading font-semibold text-ccm-midnight truncate">
                    <bdi>{regionalCommunity.name}</bdi>
                  </p>
                  {regionalCommunity.memberCount ? (
                    <p className="text-sm text-muted-foreground">
                      {t('memberCount', { count: regionalCommunity.memberCount })}
                    </p>
                  ) : null}
                </div>
              </div>
              <Button asChild className="w-full sm:w-auto flex-shrink-0">
                <Link href={`/communities/${regionalCommunity.slug}`} className="flex items-center justify-center gap-2">
                  <span>{t('visitCommunity')}</span>
                  <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Main Dashboard Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Actions */}
          <div className="lg:col-span-2 space-y-8">
            {/* Your week (dashboard spec D2) — what needs you and what's coming, one timeline */}
            <YourWeek items={yourWeek} locale={locale} />
            <DashboardEvents
              going={dashboardEvents.going}
              community={dashboardEvents.community}
              hasCommunity={dashboardEvents.hasCommunity}
              locale={locale}
            />

            {/* Open to collaborate? (opening-collaboration spec C4) — hides itself when off, answered or dismissed */}
            <OpenToCollaborateCard initiallyOpen={user.openToCollaboration} />

            {/* X5 "For you" — content matching the regions/themes you follow */}
            {forYou.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">{t('forYouTitle')}</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  {forYou.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="rounded-xl border border-border bg-card p-3 text-sm transition-colors hover:border-[var(--color-ccm-sea)]/40 hover:shadow-sm"
                    >
                      <span className="block truncate font-medium text-foreground"><bdi>{item.title}</bdi></span>
                      <span className="text-xs text-muted-foreground">{t(item.match === 'region' ? 'forYouRegion' : 'forYouTheme')}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div>
              <h2 className="text-2xl font-bold mb-6">{t('quickActions')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="group hover:shadow-lg transition-shadow min-h-[220px] flex flex-col">
                  <CardHeader>
                    <div className={cn("flex items-center gap-3")}>
                      <div className="p-3 rounded-lg bg-[var(--color-ccm-sea)]/10 flex-shrink-0">
                        <User className="w-6 h-6 text-[var(--color-ccm-sea)]" />
                      </div>
                      <CardTitle>{t('manageProfile')}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <CardDescription className="mb-4 flex-1">
                      {t('manageProfileDescription')}
                    </CardDescription>
                    <Button asChild variant="outline" className="w-full mt-auto">
                      <Link href={user.username ? `/profiles/${user.username}` : `/dashboard/profile/edit`} className="flex items-center justify-center gap-2">
                        <span>{t('viewPublicProfile')}</span>
                        <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-lg transition-shadow min-h-[220px] flex flex-col">
                  <CardHeader>
                    <div className={cn("flex items-center gap-3")}>
                      <div className="p-3 rounded-lg bg-[var(--color-ccm-water)]/10 flex-shrink-0">
                        <Upload className="w-6 h-6 text-[var(--color-ccm-water)]" />
                      </div>
                      <CardTitle>{t('submitCaseStudy')}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <CardDescription className="mb-4 flex-1">
                      {t('submitCaseStudyDescription')}
                    </CardDescription>
                    <Button asChild variant="outline" className="w-full mt-auto">
                      <Link href={`/research-and-action/case-studies/submit`} className="flex items-center justify-center gap-2">
                        <span>{t('submitCaseStudyAction')}</span>
                        <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-lg transition-shadow min-h-[220px] flex flex-col">
                  <CardHeader>
                    <div className={cn("flex items-center gap-3")}>
                      <div className="p-3 rounded-lg bg-[var(--color-ccm-sky)]/25 flex-shrink-0">
                        <Users className="w-6 h-6 text-[var(--color-ccm-sea)]" />
                      </div>
                      <CardTitle>{t('collaborate')}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <CardDescription className="mb-4 flex-1">
                      {t('collaborateDescription')}
                    </CardDescription>
                    <Button asChild variant="outline" className="w-full mt-auto">
                      <Link href={`/collaborate`} className={cn("flex items-center justify-center gap-2")}>
                        <span>{t('findCollaborators')}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-lg transition-shadow min-h-[220px] flex flex-col">
                  <CardHeader>
                    <div className={cn("flex items-center gap-3")}>
                      <div className="p-3 rounded-lg bg-[var(--color-ccm-midnight)]/10 flex-shrink-0">
                        <Settings className="w-6 h-6 text-[var(--color-ccm-midnight)]" />
                      </div>
                      <CardTitle>{t('accountSettings')}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <CardDescription className="mb-4 flex-1">
                      {t('accountSettingsDescription')}
                    </CardDescription>
                    <Button asChild variant="outline" className="w-full mt-auto">
                      <Link href={`/dashboard/account`} className={cn("flex items-center justify-center gap-2")}>
                        <span>{t('manageAccount')}</span>
                        <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-lg transition-shadow min-h-[220px] flex flex-col">
                  <CardHeader>
                    <div className={cn("flex items-center gap-3")}>
                      <div className="p-3 rounded-lg bg-[var(--color-ccm-sea)]/10 flex-shrink-0">
                        <FolderKanban className="w-6 h-6 text-[var(--color-ccm-sea)]" />
                      </div>
                      <CardTitle>{t('workspaces')}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <CardDescription className="mb-4 flex-1">
                      {t('workspacesDescription')}
                    </CardDescription>
                    <Button asChild variant="outline" className="w-full mt-auto">
                      <Link href={`/collaborations`} className="flex items-center justify-center gap-2">
                        <span>{t('openWorkspaces')}</span>
                        <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                {/* The Messages page opens with messages or notifications (Settings → Collaboration). */}
                {(access.messages || access.notifications) && (
                <Card className="group hover:shadow-lg transition-shadow min-h-[220px] flex flex-col">
                  <CardHeader>
                    <div className={cn("flex items-center gap-3")}>
                      <div className="p-3 rounded-lg bg-[var(--color-ccm-water)]/10 flex-shrink-0">
                        <MessageSquare className="w-6 h-6 text-[var(--color-ccm-water)]" />
                      </div>
                      <CardTitle>{t('messages')}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <CardDescription className="mb-4 flex-1">
                      {t('messagesDescription')}
                    </CardDescription>
                    <Button asChild variant="outline" className="w-full mt-auto">
                      <Link href={`/messages`} className="flex items-center justify-center gap-2">
                        <span>{t('openMessages')}</span>
                        <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
                )}
              </div>
            </div>

            {/* Recent Work */}
            {recentWork.length > 0 && (
              <div>
                <div className="mb-6">
                  <SectionHeader
                    title={t('recentWork')}
                    action={{ label: t('viewAll'), href: '/dashboard/profile/edit?tab=recentWork' }}
                  />
                </div>
                <div className="space-y-4">
                  {recentWork.map((work) => (
                    <Card key={work.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <CardTitle className="break-words text-lg">{work.title}</CardTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {new Date(work.startDate).toLocaleDateString(locale)} - {' '}
                                {work.isOngoing ? t('ongoing') : work.endDate ? new Date(work.endDate).toLocaleDateString(locale) : ''}
                              </span>
                            </div>
                          </div>
                          {work.isOngoing && (
                            <span className="px-2 py-1 text-xs bg-[var(--color-ccm-sky)]/25 text-[var(--color-ccm-sea)] rounded-full">
                              {t('ongoing')}
                            </span>
                          )}
                        </div>
                      </CardHeader>
                      {work.description && (
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {work.description}
                          </p>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - News & contributions */}
          <div className="space-y-8">
            {/* Your contributions (my-contributions spec M4) */}
            {contributionsCard && <ContributionsCard {...contributionsCard} />}

            {/* Recent Community News */}
            {recentNews && recentNews.length > 0 && (
              <div>
                <div className="mb-4">
                  <SectionHeader title={t('recentNews')} />
                </div>
                <div className="space-y-4">
                  {recentNews.map((news) => (
                    <Card key={news._id} className="group hover:shadow-md transition-shadow">
                      <Link href={`/news/${news.slug.current}`}>
                        {news.image?.asset?.url && (
                          <div className="relative w-full aspect-video overflow-hidden rounded-t-lg">
                            <Image
                              src={imageUrl(news.image, { width: 800 })}
                              alt={news.image.alt || news.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              placeholder={news.image.asset.metadata?.lqip ? 'blur' : undefined}
                              blurDataURL={news.image.asset.metadata?.lqip}
                            />
                          </div>
                        )}
                        <CardHeader className="space-y-2">
                          <CardTitle className="text-base line-clamp-2 group-hover:text-primary transition-colors">
                            {news.title}
                          </CardTitle>
                          {news.excerpt && (
                            <CardDescription className="line-clamp-2 text-sm">
                              {news.excerpt}
                            </CardDescription>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {new Date(news.publishedAt).toLocaleDateString(locale, {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </CardHeader>
                      </Link>
                    </Card>
                  ))}
                </div>
                {regionalCommunity && (
                  <Button asChild variant="outline" className="w-full mt-4">
                    <Link href={`/communities/${regionalCommunity.slug}`}>
                      {t('viewAllNews')}
                    </Link>
                  </Button>
                )}
              </div>
            )}

            {/* Join Community CTA */}
            {!regionalCommunity && (
              <Card className="bg-gradient-to-br from-[var(--color-ccm-sky)]/20 to-[var(--color-ccm-water)]/10 border-[var(--color-ccm-sky)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    {t('joinCommunityTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription>
                    {t('joinCommunityDescription')}
                  </CardDescription>
                  <Button asChild className="w-full">
                    <Link href={`/communities`}>
                      {t('exploreCommunities')}
                      <ArrowRight className={"w-4 h-4 ms-2"} />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
