import { Metadata } from 'next'
import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { CollaboratePageClient } from './page-client'
import { UserService } from '@/lib/services/user.service'
import { prisma } from '@/lib/prisma'
import type { SupportedLocale } from '@/types/prisma'

/**
 * Collaborate Page - Server Component
 * Fetches initial data server-side for better performance and SEO
 * Protected route - requires authentication
 */

interface CollaboratePageProps {
  params: Promise<{
    locale: SupportedLocale
  }>
  searchParams: Promise<{
    search?: string
    workTypes?: string
    expertiseAreas?: string
    communities?: string
  }>
}

export async function generateMetadata({ params }: CollaboratePageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'collaborate' })

  return {
    title: t('pageTitle'),
    description: t('pageDescription')
  }
}

export default async function CollaboratePage({ params, searchParams }: CollaboratePageProps) {
  const { locale } = await params
  const { search, workTypes, expertiseAreas, communities: communitiesParam } = await searchParams

  // Require authentication — redirect to sign-in if not logged in
  let userId: string | null = null
  try {
    const authResult = await auth()
    userId = authResult.userId
  } catch (error) {
    console.error('Collaborate page auth error:', error)
    redirect(`/${locale}/sign-in?redirect=/collaborate`)
  }

  if (!userId) {
    redirect(`/${locale}/sign-in?redirect=/collaborate`)
  }

  try {
    // Parse filter params (comma-separated strings to arrays)
    const workTypesFilter = workTypes ? workTypes.split(',').filter(Boolean) : []
    const expertiseFilter = expertiseAreas ? expertiseAreas.split(',').filter(Boolean) : []
    const communitiesFilter = communitiesParam ? communitiesParam.split(',').filter(Boolean) : []

    // Fetch user to get their communities for prioritization
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        communityMemberships: {
          include: {
            community: true
          }
        }
      }
    })

    // Get user's regional community IDs
    const userCommunityIds = currentUser?.communityMemberships
      .filter(m => m.community.type === 'REGIONAL')
      .map(m => m.community.id) || []

    // Fetch all regional communities
    const allCommunities = await prisma.community.findMany({
      where: { type: 'REGIONAL' },
      orderBy: { name: 'asc' }
    })

    // Sort communities: user's communities first
    const sortedCommunities = [
      ...allCommunities.filter(c => userCommunityIds.includes(c.id)),
      ...allCommunities.filter(c => !userCommunityIds.includes(c.id))
    ]

    // Optimized: Fetch ALL users with filters in a single query (not N+1)
    // Then group them by community on the server side
    const communityUsersMap: Record<string, any[]> = {}

    // Build single query with OR logic for filters
    const result = await UserService.getUsersForCollaborate(
      {
        searchQuery: search,
        workTypes: workTypesFilter.length > 0 ? workTypesFilter : undefined,
        expertiseAreas: expertiseFilter.length > 0 ? expertiseFilter : undefined,
        communityIds: communitiesFilter.length > 0 ? communitiesFilter : undefined
      },
      1,
      200, // Fetch more users since we're grouping them
      {
        locale,
        isAuthenticated: true
      }
    )

    // Group users by their communities (users can appear in multiple carousels)
    if (result.success && result.data.data.length > 0) {
      const allUsers = result.data.data

      // Group users by their regional communities
      for (const community of sortedCommunities) {
        const communityName = community.regionalName || community.name
        const usersInCommunity = allUsers.filter(user => {
          // Type assertion: transformToLocalizedUser includes relations via spread
          const userWithRelations = user as any
          return userWithRelations.communityMemberships?.some((m: any) => m.communityId === community.id)
        })

        if (usersInCommunity.length > 0) {
          communityUsersMap[communityName] = usersInCommunity.slice(0, 20) // Limit to 20 per carousel
        }
      }
    }

    // Fetch users without regional communities (No Community carousel)
    // Use same filtering logic for consistency
    // Only fetch if no communities filter OR if communities filter exists but doesn't restrict regional communities
    const shouldFetchNoCommunity = communitiesFilter.length === 0 ||
      !allCommunities.every(c => communitiesFilter.includes(c.id))

    let noCommunityResult
    if (shouldFetchNoCommunity) {
      noCommunityResult = await UserService.getUsersForCollaborate(
        {
          searchQuery: search,
          workTypes: workTypesFilter.length > 0 ? workTypesFilter : undefined,
          expertiseAreas: expertiseFilter.length > 0 ? expertiseFilter : undefined,
          excludeRegionalCommunities: true // Special flag for "no community" users
        },
        1,
        20,
        {
          locale,
          isAuthenticated: true
        }
      )
    }

    if (noCommunityResult?.success && noCommunityResult.data.data.length > 0) {
      communityUsersMap['No Regional Community'] = noCommunityResult.data.data
    }

    return (
      <Suspense fallback={<CollaborateSkeleton />}>
        <CollaboratePageClient
          initialCommunityUsers={communityUsersMap}
          communities={sortedCommunities}
          userCommunityIds={userCommunityIds}
          locale={locale}
          initialSearch={search}
          initialFilters={{
            workTypes: workTypesFilter,
            expertiseAreas: expertiseFilter,
            communities: communitiesFilter
          }}
        />
      </Suspense>
    )
  } catch (error) {
    console.error('Collaborate page data fetch error:', error)
    // Return a minimal page with empty data so the client can still render
    return (
      <Suspense fallback={<CollaborateSkeleton />}>
        <CollaboratePageClient
          initialCommunityUsers={{}}
          communities={[]}
          userCommunityIds={[]}
          locale={locale}
          initialSearch={search}
          initialFilters={{
            workTypes: [],
            expertiseAreas: [],
            communities: []
          }}
        />
      </Suspense>
    )
  }
}

function CollaborateSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-4 w-72 bg-muted animate-pulse rounded mt-2" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <div className="h-64 bg-muted animate-pulse rounded" />
        </aside>
        <main className="lg:col-span-3">
          <div className="h-10 bg-muted animate-pulse rounded mb-6" />
          <div className="space-y-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-4">
                <div className="h-6 w-40 bg-muted animate-pulse rounded" />
                <div className="flex gap-4">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="h-48 w-80 bg-muted animate-pulse rounded flex-shrink-0" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
