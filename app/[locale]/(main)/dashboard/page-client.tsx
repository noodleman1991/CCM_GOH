'use client'

import { useTranslations } from 'next-intl'
import { isRTL } from '@/i18n/i18n-helpers'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, ArrowRight } from 'lucide-react'
import { OpenToCollaborateCard } from '@/components/collaborate/open-to-collaborate-card'
import { DashboardGreeting } from '@/components/dashboard/greeting'
import { YourWeek } from '@/components/dashboard/your-week'
import { DashboardEvents } from '@/components/dashboard/dashboard-events'
import { TypedCard } from '@/components/cards/typed-card'
import type { TypedCardItem } from '@/lib/cards/type-style'
import type { WeekItem } from '@/lib/dashboard/your-week'
import type { EventTileData } from '@/lib/events/listing'
import type { ProfileStep } from '@/lib/profile/next-step'
import { ContributionsCard } from '@/components/contributions/contributions-card'
import type { ContributionStatus } from '@/lib/contributions/model'
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
  openToCollaboration: boolean
}

interface RegionalCommunity {
  id: string
  name: string
  slug: string
  memberCount?: number
}

interface DashboardClientProps {
  /** What you follow + your region's news, as cards. */
  forYouCards?: TypedCardItem[]
  user: DashboardUser
  regionalCommunity: RegionalCommunity | null
  yourWeek?: WeekItem[]
  dashboardEvents?: { going: EventTileData[]; community: EventTileData[]; hasCommunity: boolean }
  profileStep?: ProfileStep
  /** My contributions summary; null when the team has hidden the page. */
  contributionsCard?: { counts: Record<ContributionStatus, number> } | null
  locale: SupportedLocale
}

export function DashboardClient({
  forYouCards = [],
  user,
  regionalCommunity,
  contributionsCard = null,
  yourWeek = [],
  dashboardEvents = { going: [], community: [], hasCommunity: false },
  profileStep = null,
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
          personal, engagement-driving element; near the top on mobile too).
          No community yet: the same spot invites you to join one. */}
      {!regionalCommunity && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="flex flex-col gap-3 rounded-2xl border border-ccm-sky bg-gradient-to-br from-ccm-sky/20 to-ccm-water/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-5 shrink-0 text-ccm-sea" aria-hidden />
              <div>
                <p className="font-heading font-semibold text-ccm-midnight">{t('joinCommunityTitle')}</p>
                <p className="text-sm text-muted-foreground">{t('joinCommunityDescription')}</p>
              </div>
            </div>
            <Button asChild className="w-full shrink-0 sm:w-auto">
              <Link href="/communities" className="flex items-center justify-center gap-2">
                {t('exploreCommunities')}
                <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden />
              </Link>
            </Button>
          </div>
        </section>
      )}
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

            {/* For you — what you follow, plus your region's news, as cards (dashboard spec D2) */}
            {forYouCards.length > 0 && (
              <section aria-labelledby="for-you" className="@container space-y-3">
                <h2 id="for-you" className="font-heading text-2xl font-bold text-ccm-midnight">{t('forYouTitle')}</h2>
                <div className="grid gap-3 @md:grid-cols-2 @3xl:grid-cols-3">
                  {forYouCards.map((card) => (
                    <TypedCard key={card.href} item={card} variant="mini" className="h-full" />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column - your contributions */}
          <div className="space-y-8">
            {/* Your contributions (my-contributions spec M4) */}
            {contributionsCard && <ContributionsCard {...contributionsCard} />}

          </div>
        </div>
      </section>
    </main>
  )
}
