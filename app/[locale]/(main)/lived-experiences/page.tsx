import type { Metadata } from "next"
import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { getLivedExperienceIndex } from "@/lib/content/lived-experiences";
import type { LivedExperience, LivedExperienceIndex } from "@/lib/content/lived-experiences";
import { REGION_TO_RC_SLUG, isRegionCode } from '@/lib/maps/region-codes'
import { Skeleton } from '@/components/ui/skeleton'
import LivedExperiencesPageClient from './page-client'

/**
 * Does this video belong to `community`?
 *
 * Accepts both shapes: a resolved `region` reference, and the legacy bare
 * region code ("ssa") that a backfill wrote into the field instead of a
 * reference. `region->` yields null for the legacy shape, so without this the
 * videos silently disappear from every group — which is what emptied the page.
 */
function belongsToCommunity(
  video: { region?: { id?: string } | null; rawRegion?: unknown },
  community: { id: string; slug?: string }
): boolean {
  if (video.region?.id) return video.region.id === community.id
  const raw = video.rawRegion
  if (typeof raw !== 'string' || !isRegionCode(raw)) return false
  return REGION_TO_RC_SLUG[raw] === community.slug
}

function LoadingSkeleton() {
  return (
    <div className="space-y-12">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      ))}
    </div>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'livedExperiences' })

  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
    openGraph: {
      title: t('pageTitle'),
      description: t('pageDescription'),
      type: 'website'
    }
  }
}

export default async function LivedExperiencesPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { locale } = await params
  const { regions, tags, search } = await searchParams

  // Parse filter params
  const regionsFilter = typeof regions === 'string' ? regions.split(',').filter(Boolean) : []
  const tagsFilter = typeof tags === 'string' ? tags.split(',').filter(Boolean) : []
  const searchQuery = typeof search === 'string' ? search : ''

  // Fetch data
  const data: LivedExperienceIndex = await getLivedExperienceIndex()

  // Group videos by regional community
  const communityVideosMap: Record<string, LivedExperience[]> = {}

  for (const community of data.regionalCommunities) {
    const communityName = typeof community.name === 'string' ? community.name : (community.name.en as string)
    const videosInCommunity = data.videos.filter((video) =>
      belongsToCommunity(video, community)
    )

    if (videosInCommunity.length > 0) {
      communityVideosMap[communityName] = videosInCommunity
    }
  }

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <LivedExperiencesPageClient
        initialCommunityVideos={communityVideosMap}
        communities={data.regionalCommunities}
        allTags={data.allTags}
        locale={locale}
        initialSearch={searchQuery}
        initialFilters={{
          regions: regionsFilter,
          tags: tagsFilter
        }}
      />
    </Suspense>
  )
}
