import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
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
  const user = await prisma.user.findUnique({
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

  if (!user) {
    redirect(`/${locale}/sign-in`)
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
