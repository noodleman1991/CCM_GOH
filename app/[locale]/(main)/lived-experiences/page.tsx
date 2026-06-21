export const revalidate = 60;

import type { Metadata } from "next"
import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { client } from '@/sanity/lib/client'
import { Skeleton } from '@/components/ui/skeleton'
import LivedExperiencesPageClient from './page-client'

// Fetch lived experience videos grouped by regional community
async function fetchLivedExperiences() {
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
      }
    },
    "regionalCommunities": *[_type == "regionalCommunity"] | order(order asc, name asc) {
      _id,
      name,
      "slug": slug.current
    },
    "allTags": *[_type == "tag" && count(*[_type == "livedExperience" && references(^._id)]) > 0]
      | order(label.en asc) { _id, label, value, color }
  }`

  return await client.fetch(query)
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
  const communityVideosMap: Record<string, any[]> = {}

  for (const community of data.regionalCommunities) {
    const communityName = typeof community.name === 'string' ? community.name : community.name.en
    const videosInCommunity = data.videos.filter((video: any) =>
      video.region?._id === community._id
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
