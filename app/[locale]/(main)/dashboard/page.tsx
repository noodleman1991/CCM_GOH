import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { DashboardClient } from './page-client'
import { prisma } from '@/lib/prisma'
import { executePredefinedQuery } from '@/lib/dynamic-queries'
import type { SupportedLocale } from '@/types/prisma'
import { calculateProfileCompleteness } from '@/lib/profile-completeness'
import { REGION_TO_RC_SLUG, isRegionCode } from '@/lib/maps/region-codes'
import { getRegionMembers } from '@/lib/community/region-data'
import { listMyContributions } from '@/lib/content/contributions'
import { countByStatus } from '@/lib/contributions/model'
import { getActor } from '@/lib/authz'
import { getCollaborationAccessFor } from '@/lib/collaboration/access-server'
import { getDashboardEvents } from '@/lib/dashboard/data'
import { buildYourWeek } from '@/lib/dashboard/your-week'
import { nextProfileStep } from '@/lib/profile/next-step'
import { myTasks } from '@/lib/actions/plans'
import { getForYou, forYouHref } from '@/lib/follows/for-you'
import { forYouCards } from '@/lib/dashboard/for-you-cards'
import { ensureUserRow } from "@/lib/user-bootstrap";

/**
 * Dashboard Page - Server Component
 * Main hub for user membership features
 * Protected route - requires authentication
 */

interface DashboardPageProps {
  params: Promise<{
    locale: SupportedLocale
  }>
}

export async function generateMetadata({ params }: DashboardPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'dashboard' })

  return {
    title: t('pageTitle'),
    description: t('pageDescription')
  }
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params

  // Require authentication
  const { userId } = await auth()

  if (!userId) {
    redirect({ href: "/sign-in?redirect=/dashboard", locale })
  }

  // Fetch user with all relevant data
  let user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      communityMemberships: {
        include: {
          community: true
        }
      },
      recentWork: {
        orderBy: {
          startDate: 'desc'
        },
        take: 3
      }
    }
  })

  // If user doesn't exist, webhook is still processing - wait and retry once
  if (!user) {
    console.log(`Dashboard: User ${userId} not in Prisma yet - bootstrapping from Clerk`)

    // Create the row from Clerk instead of sleeping (lib/user-bootstrap.ts).
    await ensureUserRow(userId)

    // Retry fetch
    user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        communityMemberships: {
          include: {
            community: true
          }
        },
        recentWork: {
          orderBy: {
            startDate: 'desc'
          },
          take: 3
        }
      }
    })

    // If still not found after retry, show setup message
    if (!user) {
      console.log(`⚠️ Dashboard: User ${userId} still not found after retry - webhook may be delayed`)
      const tSetup = await getTranslations({ locale, namespace: 'dashboard.setup' })
      return (
        <div className="container mx-auto py-16 px-4">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="animate-pulse">
              <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 className="text-2xl font-bold">{tSetup('title')}</h2>
            <p className="text-gray-600">
              {tSetup('description')}
            </p>
            <Link
              href={`/dashboard`}
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {tSetup('refreshPage')}
            </Link>
            <p className="text-sm text-gray-500">
              {tSetup('support')}
            </p>
          </div>
        </div>
      )
    }

    console.log(`✅ Dashboard: Found user ${userId} after retry`)
  }

  // If Prisma has no image but Clerk does, sync it (self-healing backfill)
  if (!user.image) {
    try {
      const clerkClientInstance = await clerkClient()
      const clerkUser = await clerkClientInstance.users.getUser(userId)
      const clerkImage = clerkUser.imageUrl
      if (clerkImage && !clerkImage.includes('gravatar')) {
        await prisma.user.update({
          where: { id: userId },
          data: { image: clerkImage }
        })
        user.image = clerkImage
      }
    } catch {
      // Non-critical — image will sync eventually via webhook
    }
  }

  // Calculate profile completeness
  const profileCompleteness = calculateProfileCompleteness(user)

  // Get user's regional community
  const regionalCommunity = user.communityMemberships.find(
    m => m.community.type === 'REGIONAL'
  )?.community

  // The community-page URL slug (e.g. "sub-saharan-africa") differs from the
  // RegionalCommunityName enum (e.g. "ssa"). Map it so the
  // "visit community" link points at the real page.
  const regionSlug =
    regionalCommunity?.regionalName && isRegionCode(regionalCommunity.regionalName)
      ? REGION_TO_RC_SLUG[regionalCommunity.regionalName]
      : null

  // Fetch recent news from user's regional community (if they have one)
  let recentNews = null
  let regionMemberCount = 0
  if (regionalCommunity?.regionalName) {
    recentNews = await executePredefinedQuery('recentNews', {
      communitySlug: regionalCommunity.regionalName,
      count: 3
    })
    if (regionSlug) {
      const members = await getRegionMembers(regionSlug)
      regionMemberCount = members.length
    }
  }

  // My contributions (my-contributions spec M4): the counts that matter and
  // anything sent back for changes — unless the team has hidden the page.
  const showContributions = (await getCollaborationAccessFor(await getActor())).contributions
  const mine = showContributions ? await listMyContributions(userId, locale) : []

  // Open tasks feed Your week; unread notifications live behind the bell, not here (no repeats).
  const [tasks, forYouItems] = await Promise.all([myTasks(), getForYou(userId)])
  const forYou = forYouItems.map((item) => ({ ...item, href: forYouHref(item) }))

  // Your week + events (dashboard spec D2): RSVPs, your community's next
  // events, what was sent back to you and your open tasks — one timeline.
  const dashboardEvents = await getDashboardEvents(userId, regionSlug)
  const yourWeek = buildYourWeek({ going: dashboardEvents.going, community: dashboardEvents.community, tasks, changes: mine, now: new Date() })
  const regionalCount = user.communityMemberships.filter((m) => m.community.type === 'REGIONAL').length
  const profileStep = nextProfileStep({ ...user, communityCount: regionalCount })
  return (
    <DashboardClient
      forYouCards={forYouCards(forYou, (recentNews ?? []) as never)}
      yourWeek={yourWeek}
      dashboardEvents={{ ...dashboardEvents, hasCommunity: Boolean(regionSlug) }}
      profileStep={profileStep}
      user={{
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email || '',
        image: user.image,
        bio: user.bio,
        profileCompleteness,
        openToCollaboration: user.openToCollaboration
      }}
      regionalCommunity={regionalCommunity ? {
        id: regionalCommunity.id,
        name: regionalCommunity.name,
        slug: regionSlug || regionalCommunity.name,
        memberCount: regionMemberCount
      } : null}
      contributionsCard={showContributions ? { counts: countByStatus(mine) } : null}
      locale={locale}
    />
  )
}
