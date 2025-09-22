import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { client } from '@/sanity/lib/client'
import CaseStudiesListing from '@/components/case-studies/case-studies-listing'
import CaseStudiesFilters from '@/components/case-studies/case-studies-filters'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Search } from 'lucide-react'
import Link from 'next/link'

// Fetch case studies grouped by topic
async function fetchCaseStudiesByTopic() {
  return await client.fetch(`
    {
      "topics": *[_type == "caseStudy" && status == "approved"] | order(publishedAt desc) {
        _id,
        topic,
        "slug": slug.current,
        title,
        excerpt,
        "image": image.asset->url,
        "imageAlt": image.alt,
        publishedAt,
        featured,
        tags[]-> {
          _id,
          title,
          "value": value.current
        },
        authors,
        "relatedCommunity": relatedCommunity->name
      } | group(topic),

      "featuredCaseStudies": *[_type == "caseStudy" && status == "approved" && featured == true] | order(publishedAt desc)[0...6] {
        _id,
        topic,
        "slug": slug.current,
        title,
        excerpt,
        "image": image.asset->url,
        "imageAlt": image.alt,
        publishedAt,
        featured,
        tags[]-> {
          _id,
          title,
          "value": value.current
        },
        authors,
        "relatedCommunity": relatedCommunity->name
      },

      "recentCaseStudies": *[_type == "caseStudy" && status == "approved"] | order(publishedAt desc)[0...12] {
        _id,
        topic,
        "slug": slug.current,
        title,
        excerpt,
        "image": image.asset->url,
        "imageAlt": image.alt,
        publishedAt,
        featured,
        tags[]-> {
          _id,
          title,
          "value": value.current
        },
        authors,
        "relatedCommunity": relatedCommunity->name
      },

      "availableTags": *[_type == "tag"] | order(title.en asc) {
        _id,
        title,
        "value": value.current
      },

      "availableTopics": array::unique(*[_type == "caseStudy" && status == "approved"].topic),

      "availableCommunities": *[_type == "regionalCommunity"] | order(name asc) {
        _id,
        name
      }
    }
  `)
}

// Topic display names mapping
const topicLabels: Record<string, string> = {
  'climate-environment': 'Climate Change & Environment',
  'mental-health': 'Mental Health & Wellbeing',
  'community-health': 'Community Health & Social Care',
  'youth-education': 'Youth Engagement & Education',
  'policy-governance': 'Policy Research & Governance',
  'technology-innovation': 'Technology & Innovation',
  'economic-development': 'Economic Development',
  'cultural-arts': 'Cultural Heritage & Arts',
  'food-agriculture': 'Food Security & Agriculture',
  'urban-planning': 'Urban Planning & Infrastructure',
  'human-rights': 'Human Rights & Social Justice',
  'migration': 'Migration & Displacement',
  'gender-equality': 'Gender Equality',
  'disaster-resilience': 'Disaster Risk & Resilience',
  'digital-inclusion': 'Digital Inclusion',
  'other': 'Other'
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Featured section skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-48 w-full mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'caseStudies' })

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

export default async function CaseStudiesPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { locale } = await params
  const { topic, tag, community, search } = await searchParams

  const t = await getTranslations({ locale, namespace: 'caseStudies' })

  return (
    <div className="container max-w-7xl py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
            {t('title')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            {t('description')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            {t('searchButton')}
          </Button>
          <Button asChild className="flex items-center gap-2">
            <Link href={`/${locale}/case-studies/submit`}>
              <Plus className="w-4 h-4" />
              {t('submitButton')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Suspense fallback={<Skeleton className="h-16 w-full" />}>
        <CaseStudiesFilters
          currentFilters={{
            topic: typeof topic === 'string' ? topic : undefined,
            tag: typeof tag === 'string' ? tag : undefined,
            community: typeof community === 'string' ? community : undefined,
            search: typeof search === 'string' ? search : undefined
          }}
        />
      </Suspense>

      {/* Content */}
      <Suspense fallback={<LoadingSkeleton />}>
        <CaseStudiesContent
          filters={{
            topic: typeof topic === 'string' ? topic : undefined,
            tag: typeof tag === 'string' ? tag : undefined,
            community: typeof community === 'string' ? community : undefined,
            search: typeof search === 'string' ? search : undefined
          }}
          locale={locale}
        />
      </Suspense>
    </div>
  )
}

async function CaseStudiesContent({
  filters,
  locale
}: {
  filters: {
    topic?: string
    tag?: string
    community?: string
    search?: string
  }
  locale: string
}) {
  const data = await fetchCaseStudiesByTopic()
  const t = await getTranslations({ locale, namespace: 'caseStudies' })

  // If no filters are applied, show the Netflix-style layout
  if (!filters.topic && !filters.tag && !filters.community && !filters.search) {
    return (
      <div className="space-y-12">
        {/* Featured Case Studies */}
        {data.featuredCaseStudies.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{t('featured')}</h2>
              <Button variant="ghost" size="sm">
                {t('viewAll')}
              </Button>
            </div>
            <CaseStudiesListing
              caseStudies={data.featuredCaseStudies}
              layout="grid"
              showFeaturedBadge={true}
            />
          </section>
        )}

        {/* Recent Case Studies */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{t('recent')}</h2>
            <Button variant="ghost" size="sm">
              {t('viewAll')}
            </Button>
          </div>
          <CaseStudiesListing
            caseStudies={data.recentCaseStudies}
            layout="grid"
          />
        </section>

        {/* By Topic (Netflix-style rows) */}
        {data.topics.map((topicGroup: any) => {
          const topicKey = topicGroup.key
          const topicLabel = topicLabels[topicKey] || topicKey
          const caseStudies = topicGroup.value

          if (caseStudies.length === 0) return null

          return (
            <section key={topicKey} className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{topicLabel}</h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/${locale}/case-studies?topic=${topicKey}`}>
                    {t('viewAll')}
                  </Link>
                </Button>
              </div>
              <CaseStudiesListing
                caseStudies={caseStudies.slice(0, 6)}
                layout="horizontal-scroll"
              />
            </section>
          )
        })}
      </div>
    )
  }

  // Filtered view - show all results in a grid
  // This would need to be implemented with proper filtering logic
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {t('searchResults')}
          {/* Add filter breadcrumbs here */}
        </h2>
        <p className="text-sm text-muted-foreground">
          {data.recentCaseStudies.length} {t('resultsFound')}
        </p>
      </div>

      <CaseStudiesListing
        caseStudies={data.recentCaseStudies} // This should be filtered data
        layout="grid"
      />
    </div>
  )
}