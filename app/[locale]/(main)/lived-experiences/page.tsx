export const revalidate = 60;

import type { Metadata } from "next"
import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { client } from '@/sanity/lib/client'
import { REGION_TO_RC_SLUG, isRegionCode } from '@/lib/maps/region-codes'
import { Skeleton } from '@/components/ui/skeleton'
import LivedExperiencesPageClient from './page-client'

/** The fields the GROQ projection below returns for a video. */
interface LivedExperienceVideo {
  _id: string
  title?: Record<string, string> | string
  format?: 'video' | 'audio' | 'written'
  videoUrl?: string
  thumbnailUrl?: string
  tags?: Array<{ _id: string; label?: Record<string, string> | string; value?: string; color?: string }>
  region?: { _id?: string; name?: Record<string, string> | string; slug?: string } | null
  rawRegion?: unknown
}

interface LivedExperienceData {
  videos: LivedExperienceVideo[]
  regionalCommunities: Array<{ _id: string; name: Record<string, string> | string; slug: string }>
  allTags: Array<{ _id: string; label?: Record<string, string> | string; value?: string; color?: string }>
}

// Fetch lived experience videos grouped by regional community
async function fetchLivedExperiences(): Promise<LivedExperienceData> {
  const query = `{
    "videos": *[_type == "livedExperience" && (status == "approved" || !defined(status))] | order(_createdAt desc) {
      _id,
      title,
      format,
      videoUrl,
      // Dereference tag refs into the standard CMS tag shape (localized label +
      // value + on-brand colour), same as case studies / news.
      tags[]->{ _id, label, value, color },
      "thumbnailUrl": thumbnail.asset->url,
      "region": region->{
        _id,
        name,
        "slug": slug.current
      },
      // Raw field alongside the dereferenced one: legacy docs stored region as
      // a bare short code ("ssa") rather than a reference, so region-> is null
      // for them and they vanish from the grouping below.
      "rawRegion": region
    },
    "regionalCommunities": *[_type == "regionalCommunity"] | order(order asc, name asc) {
      _id,
      name,
      "slug": slug.current
    },
    "allTags": *[_type == "tag" && count(*[_type == "livedExperience" && references(^._id)]) > 0]
      | order(label.en asc) { _id, label, value, color }
  }`

  try {
    return await client.fetch(query)
  } catch (error) {
    // Degrade to the empty state instead of crashing the whole page — e.g.
    // when the Sanity API is unavailable or over quota.
    console.error('[lived-experiences] Sanity fetch failed:', error)
    return { videos: [], regionalCommunities: [], allTags: [] }
  }
}

/**
 * Does this video belong to `community`?
 *
 * Accepts both shapes: a resolved `region` reference, and the legacy bare
 * region code ("ssa") that a backfill wrote into the field instead of a
 * reference. `region->` yields null for the legacy shape, so without this the
 * videos silently disappear from every group — which is what emptied the page.
 */
function belongsToCommunity(
  video: { region?: { _id?: string } | null; rawRegion?: unknown },
  community: { _id: string; slug?: string }
): boolean {
  if (video.region?._id) return video.region._id === community._id
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
  const data = await fetchLivedExperiences()

  // Group videos by regional community
  const communityVideosMap: Record<string, LivedExperienceVideo[]> = {}

  for (const community of data.regionalCommunities) {
    const communityName = typeof community.name === 'string' ? community.name : community.name.en
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
