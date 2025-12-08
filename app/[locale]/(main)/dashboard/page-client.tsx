'use client'

import { useTranslations } from 'next-intl'
import { isRTL } from '@/i18n/i18n-helpers'
import { cn } from '@/lib/utils'
import Link from 'next/link'
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
  FileText
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
  locale: SupportedLocale
}

export function DashboardClient({
  user,
  regionalCommunity,
  recentWork,
  recentNews,
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
              <Link href={`/${locale}/dashboard/profile/edit`}>
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
                      <div className="p-3 rounded-lg bg-blue-500/10 flex-shrink-0">
                        <User className="w-6 h-6 text-blue-500" />
                      </div>
                      <CardTitle>{t('manageProfile')}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <CardDescription className="mb-4 flex-1">
                      {t('manageProfileDescription')}
                    </CardDescription>
                    <Button asChild variant="outline" className="w-full mt-auto">
                      <Link href={`/${locale}/dashboard/profile/edit`} className={cn("flex items-center justify-center gap-2", rtl && "flex-row-reverse")}>
                        <span>{t('viewProfile')}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-lg transition-shadow min-h-[220px] flex flex-col">
                  <CardHeader>
                    <div className={cn("flex items-center gap-3", rtl && "flex-row-reverse")}>
                      <div className="p-3 rounded-lg bg-green-500/10 flex-shrink-0">
                        <Upload className="w-6 h-6 text-green-500" />
                      </div>
                      <CardTitle>{t('submitCaseStudy')}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <CardDescription className="mb-4 flex-1">
                      {t('submitCaseStudyDescription')}
                    </CardDescription>
                    <Button asChild variant="outline" className="w-full mt-auto">
                      <Link href={`/${locale}/research-and-action/case-studies/submit`} className={cn("flex items-center justify-center gap-2", rtl && "flex-row-reverse")}>
                        <span>{t('submit')}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-lg transition-shadow min-h-[220px] flex flex-col">
                  <CardHeader>
                    <div className={cn("flex items-center gap-3", rtl && "flex-row-reverse")}>
                      <div className="p-3 rounded-lg bg-purple-500/10 flex-shrink-0">
                        <Users className="w-6 h-6 text-purple-500" />
                      </div>
                      <CardTitle>{t('collaborate')}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <CardDescription className="mb-4 flex-1">
                      {t('collaborateDescription')}
                    </CardDescription>
                    <Button asChild variant="outline" className="w-full mt-auto">
                      <Link href={`/${locale}/collaborate`} className={cn("flex items-center justify-center gap-2", rtl && "flex-row-reverse")}>
                        <span>{t('findCollaborators')}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-lg transition-shadow min-h-[220px] flex flex-col">
                  <CardHeader>
                    <div className={cn("flex items-center gap-3", rtl && "flex-row-reverse")}>
                      <div className="p-3 rounded-lg bg-orange-500/10 flex-shrink-0">
                        <Settings className="w-6 h-6 text-orange-500" />
                      </div>
                      <CardTitle>{t('accountSettings')}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <CardDescription className="mb-4 flex-1">
                      {t('accountSettingsDescription')}
                    </CardDescription>
                    <Button asChild variant="outline" className="w-full mt-auto">
                      <Link href={`/${locale}/dashboard/account`} className={cn("flex items-center justify-center gap-2", rtl && "flex-row-reverse")}>
                        <span>{t('manageAccount')}</span>
                        <ArrowRight className="w-4 h-4" />
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
                    <Link href={`/${locale}/dashboard/profile/edit/work`}>
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
                            <span className="px-2 py-1 text-xs bg-green-500/10 text-green-700 dark:text-green-400 rounded-full">
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

          {/* Right Column - Community & News */}
          <div className="space-y-8">
            {/* Regional Community */}
            {regionalCommunity && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-blue-500/10">
                      <MapPin className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <CardTitle>{t('yourCommunity')}</CardTitle>
                      <CardDescription className="mt-1">
                        {regionalCommunity.name}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href={`/${locale}/communities/${regionalCommunity.slug}`}>
                      {t('visitCommunity')}
                      <ArrowRight className={cn("w-4 h-4", rtl ? "mr-2" : "ml-2")} />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
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
                      <Link href={`/${locale}/news/${news.slug.current}`}>
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
                    <Link href={`/${locale}/communities/${regionalCommunity.slug}`}>
                      {t('viewAllNews')}
                      <ArrowRight className={cn("w-4 h-4", rtl ? "mr-2" : "ml-2")} />
                    </Link>
                  </Button>
                )}
              </div>
            )}

            {/* Join Community CTA */}
            {!regionalCommunity && (
              <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-200 dark:border-blue-800">
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
                    <Link href={`/${locale}/communities`}>
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
