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

  if (!user) {
    // Webhook delayed - create user now to prevent infinite redirect loop
    console.log(`⏳ Dashboard: User ${userId} not in Prisma yet - creating from Clerk to prevent flickering`)

    try {
      const { clerkClient } = await import('@clerk/nextjs/server')
      const clerkUser = await (await clerkClient()).users.getUser(userId)

      await prisma.user.create({
        data: {
          id: userId,
          email: clerkUser.primaryEmailAddress?.emailAddress || null,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          username: clerkUser.username,
          image: clerkUser.imageUrl,
          emailVerified: clerkUser.primaryEmailAddress?.verification?.status === 'verified' ? new Date() : null,
          phoneNumber: clerkUser.primaryPhoneNumber?.phoneNumber || null,
          phoneVerified: clerkUser.primaryPhoneNumber?.verification?.status === 'verified' ? new Date() : null,
          workTypes: [],
          expertiseAreas: [],
          isSearchable: true,
          profileVisibility: 'PUBLIC',
          showEmail: false,
          showPhoneNumber: false,
          showWorkDetails: true,
          showSocialLinks: true,
          showLocation: true,
          onboardingCompleted: false
        }
      })

      console.log(`✅ Dashboard: Created user ${userId} successfully`)

      // Re-fetch with includes for the page
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
    } catch (createError: any) {
      // If unique constraint error, user was just created by webhook - refetch
      if (createError.code === 'P2002') {
        console.log(`⚠️ Dashboard: User ${userId} created by webhook during fetch - retrying`)

        // Check if email conflict specifically
        if (createError.meta?.target?.includes('email')) {
          console.log(`⚠️ Dashboard: Email conflict detected, finding user by email`)
          const existingUser = await prisma.user.findUnique({
            where: { email: clerkUser.primaryEmailAddress?.emailAddress || '' }
          })

          if (existingUser) {
            console.log(`✅ Dashboard: Found existing user by email: ${existingUser.id}`)
            // Use the existing user instead
            user = await prisma.user.findUnique({
              where: { id: existingUser.id },
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
          }
        } else {
          // Other P2002 error, try original user ID
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
        }
      } else {
        console.error(`❌ Dashboard: Failed to create user ${userId}:`, createError)
        throw createError
      }
    }
  }

  // At this point, user definitely exists
  if (!user) {
    // Should never happen, but safety check
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
