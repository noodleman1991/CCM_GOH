'use client'

import { useTranslations } from 'next-intl'
import { isRTL } from '@/i18n/i18n-helpers'
import { cn } from '@/lib/utils'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfileCompletenessIndicator } from '@/components/ui/profile-completeness-indicator'
import {
  User,
  Settings,
  Upload,
  Users,
  MapPin,
  Calendar,
  Newspaper,
  ArrowRight,
  Edit,
  FileText,
  FolderKanban,
  MessageSquare
} from 'lucide-react'
import type { SupportedLocale } from '@/types/prisma'

interface DashboardUser {
  id: string
  firstName: string | null
  lastName: string | null
  username: string | null
  email: string
  image: string | null
  bio: string | null
  profileCompleteness: number
}

interface RegionalCommunity {
  id: string
  name: string
  slug: string
  memberCount?: number
}

interface Contribution {
  id: string
  kind: 'caseStudy' | 'content' | 'recentWork'
  title: string
  href: string | null
  date: string | null
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

interface DashboardClientProps {
  user: DashboardUser
  regionalCommunity: RegionalCommunity | null
  recentWork: RecentWork[]
  recentNews: NewsItem[]
  contributions?: Contribution[]
  locale: SupportedLocale
}

export function DashboardClient({
  user,
  regionalCommunity,
  recentWork,
  recentNews,
  contributions = [],
  locale
}: DashboardClientProps) {
  const t = useTranslations('dashboard')
  const rtl = isRTL(locale)

  const displayName = user.firstName && user.lastName
    ? rtl
      ? `${user.lastName} ${user.firstName}`
      : `${user.firstName} ${user.lastName}`
    : user.firstName || user.username || t('anonymousUser')

  return (
    <main className="min-h-screen" dir={rtl ? 'rtl' : 'ltr'}>
      {/* Hero Section */}
      <section className="border-b bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              {user.image ? (
                <div className="relative w-20 h-20 rounded-full overflow-hidden ring-4 ring-background shadow-lg">
                  <Image
                    src={user.image}
                    alt={displayName}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-background shadow-lg">
                  <User className="w-10 h-10 text-primary" />
                </div>
              )}
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">
                  {t('welcome', { name: displayName })}
                </h1>
              </div>
            </div>
            <Button asChild size="lg">
              <Link href={`/dashboard/profile/edit`}>
                <Edit className={cn("w-4 h-4", rtl ? "ml-2" : "mr-2")} />
                {t('editProfile')}
              </Link>
            </Button>
          </div>

          {/* Profile Completeness */}
          <div className="mt-8 w-full max-w-3xl">
            <ProfileCompletenessIndicator
              percentage={user.profileCompleteness}
              size="lg"
            />
            {user.profileCompleteness < 100 && (
              <p className="text-sm text-muted-foreground mt-2">
                {t('completeProfileMessage')}
              </p>
            )}
          </div>
        </div>
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
            {/* Quick Actions */}
            <div>
              <h2 className="text-2xl font-bold mb-6">{t('quickActions')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="group hover:shadow-lg transition-shadow min-h-[220px] flex flex-col">
                  <CardHeader>
                    <div className={cn("flex items-center gap-3", rtl && "flex-row-reverse")}>
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
                    <div className={cn("flex items-center gap-3", rtl && "flex-row-reverse")}>
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
                    <div className={cn("flex items-center gap-3", rtl && "flex-row-reverse")}>
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
                      <Link href={`/collaborate`} className={cn("flex items-center justify-center gap-2", rtl && "flex-row-reverse")}>
                        <span>{t('findCollaborators')}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-lg transition-shadow min-h-[220px] flex flex-col">
                  <CardHeader>
                    <div className={cn("flex items-center gap-3", rtl && "flex-row-reverse")}>
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
                      <Link href={`/dashboard/account`} className={cn("flex items-center justify-center gap-2", rtl && "flex-row-reverse")}>
                        <span>{t('manageAccount')}</span>
                        <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-lg transition-shadow min-h-[220px] flex flex-col">
                  <CardHeader>
                    <div className={cn("flex items-center gap-3", rtl && "flex-row-reverse")}>
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

                <Card className="group hover:shadow-lg transition-shadow min-h-[220px] flex flex-col">
                  <CardHeader>
                    <div className={cn("flex items-center gap-3", rtl && "flex-row-reverse")}>
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
              </div>
            </div>

            {/* Recent Work */}
            {recentWork.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">{t('recentWork')}</h2>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/dashboard/profile/edit/work`}>
                      {t('viewAll')}
                      <ArrowRight className={cn("w-4 h-4", rtl ? "mr-2" : "ml-2")} />
                    </Link>
                  </Button>
                </div>
                <div className="space-y-4">
                  {recentWork.map((work) => (
                    <Card key={work.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{work.title}</CardTitle>
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
            {/* Recent submissions — the user's own contributions */}
            {contributions.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[var(--color-ccm-sea)]" />
                    {t('recentSubmissions')}
                  </h2>
                </div>
                <Card>
                  <CardContent className="p-0 divide-y">
                    {contributions.map((c) => {
                      const inner = (
                        <div className="flex items-start gap-3 p-4">
                          <div className="p-2 rounded-md bg-[var(--color-ccm-sky)]/25 shrink-0">
                            <FileText className="w-4 h-4 text-[var(--color-ccm-sea)]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium line-clamp-2">{c.title}</p>
                            {c.date && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {new Date(c.date).toLocaleDateString(locale)}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                      return c.href ? (
                        <Link key={c.id} href={c.href} className="block hover:bg-muted/50 transition-colors">
                          {inner}
                        </Link>
                      ) : (
                        <div key={c.id}>{inner}</div>
                      )
                    })}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Recent Community News */}
            {recentNews && recentNews.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Newspaper className="w-5 h-5" />
                    {t('recentNews')}
                  </h2>
                </div>
                <div className="space-y-4">
                  {recentNews.map((news) => (
                    <Card key={news._id} className="group hover:shadow-md transition-shadow">
                      <Link href={`/news/${news.slug.current}`}>
                        {news.image?.asset?.url && (
                          <div className="relative w-full aspect-video overflow-hidden rounded-t-lg">
                            <Image
                              src={news.image.asset.url}
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
                      <ArrowRight className={cn("w-4 h-4", rtl ? "mr-2" : "ml-2")} />
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
                      <ArrowRight className={cn("w-4 h-4", rtl ? "mr-2" : "ml-2")} />
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
