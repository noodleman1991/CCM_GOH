import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { DashboardClient } from './page-client'
import { prisma } from '@/lib/prisma'
import { executePredefinedQuery } from '@/lib/dynamic-queries'
import type { SupportedLocale } from '@/types/prisma'
import { calculateProfileCompleteness } from '@/lib/profile-completeness'

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
              We're preparing your dashboard. This usually takes just a few seconds.
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

  // Calculate profile completeness
  const profileCompleteness = calculateProfileCompleteness({
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    email: user.email,
    image: user.image,
    bio: user.bio,
    ageGroup: user.ageGroup,
    country: user.country,
    city: user.city,
    organization: user.organization,
    position: user.position,
    workBio: user.workBio,
    workTypes: user.workTypes,
    expertiseAreas: user.expertiseAreas,
    personalWebsite: user.personalWebsite,
    linkedinProfile: user.linkedinProfile,
    phoneNumber: user.phoneNumber
  })

  // Get user's regional community
  const regionalCommunity = user.communityMemberships.find(
    m => m.community.type === 'REGIONAL'
  )?.community

  // Fetch recent news from user's regional community (if they have one)
  let recentNews = null
  if (regionalCommunity?.regionalName) {
    recentNews = await executePredefinedQuery('recentNews', {
      communitySlug: regionalCommunity.regionalName,
      count: 3
    })
  }

  return (
    <DashboardClient
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
        slug: regionalCommunity.regionalName || regionalCommunity.name
      } : null}
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
