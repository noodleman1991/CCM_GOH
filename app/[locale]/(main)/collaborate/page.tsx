import { Metadata } from 'next'
import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { CollaboratePageClient } from './page-client'
import { CollabTabs } from '@/components/collaborate/collab-tabs'
import { ProjectCard } from '@/components/collaborate/project-card'
import { getPublicProjects } from '@/lib/collaboration/public-list'
import { fetchApprovedEvents } from '@/lib/events'
import { EventCard } from '@/components/events/event-card'
import { CreateCollaborationButton } from '@/components/collaboration/create-collaboration-button'
import { PageContainer } from '@/components/ui/page-container'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { Plus } from 'lucide-react'
import { FEATURES } from '@/lib/features'
import { UserService } from '@/lib/services/user.service'
import { prisma } from '@/lib/prisma'
import { decodeFilterParam } from '@/lib/collaborate-filters'
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
    tab?: string
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
    if (typeof error === 'object' && error !== null && 'digest' in error) throw error
    console.error('Collaborate page auth error:', error)
    redirect(`/${locale}/sign-in?redirect=/collaborate`)
  }

  if (!userId) {
    redirect(`/${locale}/sign-in?redirect=/collaborate`)
  }

  // §4.6 collab space: Projects and Events panels (People keeps its own
  // data path below). Both degrade to empty lists on fetch failure.
  const [tCollab, tEvents, projects, events] = await Promise.all([
    getTranslations({ locale, namespace: 'collabSpace' }),
    getTranslations({ locale, namespace: 'events' }),
    getPublicProjects().catch(() => []),
    FEATURES.engagement ? fetchApprovedEvents(12).catch(() => []) : Promise.resolve([]),
  ])

  const eventLabels = {
    community: tEvents('scopeCommunity'),
    project: tEvents('scopeProject'),
    modeOnline: tEvents('modeOnline'),
    modeInPerson: tEvents('modeInPerson'),
    modeHybrid: tEvents('modeHybrid'),
  }

  const projectsPanel = (
    <div className="space-y-6">
      {projects.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">{tCollab('noProjects')}</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )

  const eventsPanel = (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button asChild variant="outline" className="gap-2">
          <Link href="/collaborate/events/new">
            <Plus className="size-4" />
            {tEvents('submit')}
          </Link>
        </Button>
      </div>
      {events.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">{tEvents('empty')}</Card>
      ) : (
        events.map((e) => <EventCard key={e._id} event={e} signedIn={!!userId} labels={eventLabels} />)
      )}
    </div>
  )

  const shell = (peoplePanel: React.ReactNode) => (
    <PageContainer>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-balance text-ccm-midnight md:text-4xl">
            {tCollab('header')}
          </h1>
        </div>
        <CreateCollaborationButton />
      </div>
      <CollabTabs projects={projectsPanel} people={peoplePanel} events={eventsPanel} />
    </PageContainer>
  )

  try {
    // Parse filter params via the shared codec (INCLUSION model):
    // []   = no filter for that category (show everyone)
    // [..] = filter to that subset
    const workTypesFilter = decodeFilterParam(workTypes)
    const expertiseFilter = decodeFilterParam(expertiseAreas)
    const communitiesFilter = decodeFilterParam(communitiesParam)

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

    // Build single query with the decoded filters (empty array = no filter).
    const result = await UserService.getUsersForCollaborate(
      {
        searchQuery: search,
        useFuzzySearch: Boolean(search),
        workTypes: workTypesFilter.length ? workTypesFilter : undefined,
        expertiseAreas: expertiseFilter.length ? expertiseFilter : undefined,
        communityIds: communitiesFilter.length ? communitiesFilter : undefined
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

    // Fetch users without regional communities (No Community carousel).
    // Only when NO community filter is active — filtering to a subset of
    // communities must not leak the "No Regional Community" group.
    const shouldFetchNoCommunity = communitiesFilter.length === 0

    let noCommunityResult
    if (shouldFetchNoCommunity) {
      noCommunityResult = await UserService.getUsersForCollaborate(
        {
          searchQuery: search,
          useFuzzySearch: Boolean(search),
          workTypes: workTypesFilter.length ? workTypesFilter : undefined,
          expertiseAreas: expertiseFilter.length ? expertiseFilter : undefined,
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

    return shell(
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
          embedded
        />
      </Suspense>
    )
  } catch (error) {
    console.error('Collaborate page data fetch error:', error)
    // Return a minimal page with empty data so the client can still render
    return shell(
      <Suspense fallback={<CollaborateSkeleton />}>
        <CollaboratePageClient
          initialCommunityUsers={{}}
          communities={[]}
          userCommunityIds={[]}
          locale={locale}
          initialSearch={search}
          initialFilters={{
            workTypes: null,
            expertiseAreas: null,
            communities: null
          }}
          embedded
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
