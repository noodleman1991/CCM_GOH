import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { DashboardClient } from './page-client'
import { prisma } from '@/lib/prisma'
import { executePredefinedQuery } from '@/lib/dynamic-queries'
import type { SupportedLocale } from '@/types/prisma'
import { calculateProfileCompleteness } from '@/lib/profile-completeness'
import { REGION_TO_RC_SLUG, isRegionCode } from '@/lib/maps/region-codes'
import { getUserContributions, getRegionMembers } from '@/lib/community/region-data'
import { myTasks } from '@/lib/actions/plans'
import { getForYou, forYouHref } from '@/lib/follows/for-you'
import { safeQuery } from '@/lib/prisma'

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
    redirect(`/${locale}/sign-in?redirect=/dashboard`)
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
    console.log(`⏳ Dashboard: User ${userId} not in Prisma yet - waiting for webhook...`)

    // Wait 1 second for webhook to complete
    await new Promise(resolve => setTimeout(resolve, 1000))

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
      return (
        <div className="container mx-auto py-16 px-4">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="animate-pulse">
              <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 className="text-2xl font-bold">Setting up your account...</h2>
            <p className="text-gray-600">
              We&apos;re preparing your dashboard. This usually takes just a few seconds.
            </p>
            <Link
              href={`/dashboard`}
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </Link>
            <p className="text-sm text-gray-500">
              If this message persists, please contact support.
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

  // The user's own contributions (case studies, content, recent work) — the
  // unified feed that also powers the public profile's Contributions block.
  const contributions = (await getUserContributions(user.id, locale)).slice(0, 5)

  // X4 "What needs me": my open tasks across workspaces + unread lifecycle
  // notifications, one list — the dashboard's pull side of the spine.
  const [tasks, unreadR, forYouItems] = await Promise.all([
    myTasks(),
    safeQuery(() =>
      prisma.notification.findMany({
        where: {
          recipientId: userId,
          readAt: null,
          type: { in: ["TASK_ASSIGNED", "TASK_DUE", "OUTPUT_STATUS", "THREAD_REPLY", "MEMBER_JOINED", "FOLLOWED_PUBLISH", "EVENT_REMINDER"] },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, type: true, snippet: true },
      })
    ),
    getForYou(userId),
  ])
  const forYou = forYouItems.map((item) => ({ ...item, href: forYouHref(item) }))
  const dashboardAttention = [
    ...tasks.slice(0, 5).map((task) => ({
      kind: "task" as const,
      id: task.id,
      title: task.title,
      detail: task.collaborationTitle,
      href: `/collaborations/${task.collaborationId}?tab=plan`,
    })),
    ...(unreadR.success
      ? unreadR.data.map((n) => ({
          kind: "notification" as const,
          id: n.id,
          title: n.snippet ?? "",
          detail: n.type,
          href: "/messages?tab=notifications",
        }))
      : []),
  ].slice(0, 8)

  return (
    <DashboardClient
      attention={dashboardAttention}
      forYou={forYou}
      user={{
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email || '',
        image: user.image,
        bio: user.bio,
        profileCompleteness
      }}
      regionalCommunity={regionalCommunity ? {
        id: regionalCommunity.id,
        name: regionalCommunity.name,
        slug: regionSlug || regionalCommunity.name,
        memberCount: regionMemberCount
      } : null}
      contributions={contributions.map(c => ({
        id: c.id,
        kind: c.kind,
        title: c.title,
        href: c.href,
        date: c.date
      }))}
      recentWork={user.recentWork.map(w => ({
        id: w.id,
        title: w.title,
        description: w.description,
        startDate: w.startDate.toISOString(),
        endDate: w.endDate?.toISOString() || null,
        isOngoing: w.isOngoing
      }))}
      recentNews={recentNews || []}
      locale={locale}
    />
  )
}
