export const revalidate = 60;

import type { Metadata } from "next"
import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { client } from '@/sanity/lib/client'
import GridCaseStudyComponent from '@/components/blocks/grid/grid-case-study'
import CaseStudiesFilters from '@/components/case-studies/case-studies-filters'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Search, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { getLocalizedText } from '@/lib/localization-utils'
import { fetchCaseStudyTags, fetchCaseStudyCommunities } from '@/sanity/queries/case-study-queries'

// Fetch approved case studies by regional community
async function fetchCaseStudiesByRegion() {
  return await client.fetch(`
    {
      "regionalCommunities": *[_type == "regionalCommunity"] | order(order asc, name asc) {
        _id,
        name,
        "slug": slug.current,
        "caseStudies": *[_type == "caseStudy" && status == "approved" && references(^._id)] | order(featured desc, publishedAt desc) {
          _id,
          topic,
          "slug": slug.current,
          title,
          excerpt,
          image{
            asset->{
              _id,
              url
            },
            alt
          },
          publishedAt,
          featured,
          tags[]-> {
            _id,
            label,
            value,
            color
          },
          authors,
          organizations[]->{
            _id,
            name
          },
          "relatedCommunity": relatedCommunity->name
        }
      }
    }
  `)
}

// Fetch filtered case studies
async function fetchFilteredCaseStudies(filters: {
  topic?: string
  tags?: string[]
  communities?: string[]
  search?: string
}) {
  const conditions: string[] = ['_type == "caseStudy"', 'status == "approved"']

  if (filters.topic) {
    conditions.push(`topic == "${filters.topic}"`)
  }

  if (filters.tags && filters.tags.length > 0) {
    const tagConditions = filters.tags.map(tag => `"${tag}" in tags[]->value.current`)
    conditions.push(`(${tagConditions.join(' || ')})`)
  }

  if (filters.communities && filters.communities.length > 0) {
    const communityConditions = filters.communities.map(slug => `relatedCommunity->slug.current == "${slug}"`)
    conditions.push(`(${communityConditions.join(' || ')})`)
  }

  if (filters.search) {
    const searchTerm = filters.search.toLowerCase()
    conditions.push(`(
      lower(title.en) match "*${searchTerm}*" ||
      lower(title.es) match "*${searchTerm}*" ||
      lower(title.fr) match "*${searchTerm}*" ||
      lower(title.ar) match "*${searchTerm}*" ||
      lower(excerpt.en) match "*${searchTerm}*" ||
      lower(excerpt.es) match "*${searchTerm}*" ||
      lower(excerpt.fr) match "*${searchTerm}*" ||
      lower(excerpt.ar) match "*${searchTerm}*"
    )`)
  }

  const query = `*[${conditions.join(' && ')}] | order(featured desc, publishedAt desc)[0...50] {
    _id,
    topic,
    "slug": slug.current,
    title,
    excerpt,
    image{
      asset->{
        _id,
        url
      },
      alt
    },
    publishedAt,
    featured,
    tags[]-> {
      _id,
      label,
      value,
      color
    },
    authors,
    organizations[]->{
      _id,
      name
    },
    "relatedCommunity": relatedCommunity->name
  }`

  return await client.fetch(query)
}

// Wrapper component to fetch filter data
async function CaseStudiesFiltersWrapper({
  locale,
  currentFilters
}: {
  locale: string
  currentFilters: {
    topic?: string
    tags?: string[]
    communities?: string[]
    search?: string
  }
}) {
  const [tags, communities] = await Promise.all([
    fetchCaseStudyTags(),
    fetchCaseStudyCommunities()
  ])

  return (
    <CaseStudiesFilters
      currentFilters={currentFilters}
      tags={tags}
      communities={communities}
    />
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-12">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, j) => (
              <Skeleton key={j} className="h-96" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
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

export default async function RegionalCaseStudiesPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { locale } = await params
  const { topic, tags, communities, search } = await searchParams
  const t = await getTranslations({ locale, namespace: 'caseStudies' })

  // Helper to convert param to array
  const toArray = (param: string | string[] | undefined): string[] | undefined => {
    if (!param) return undefined
    if (Array.isArray(param)) return param
    return [param]
  }

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
          <Button asChild className="flex items-center gap-2">
            <Link href={`/${locale}/research-and-action/case-studies/submit`}>
              <Plus className="w-4 h-4" />
              {t('submitButton')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Suspense fallback={<Skeleton className="h-16 w-full" />}>
        <CaseStudiesFiltersWrapper
          locale={locale}
          currentFilters={{
            topic: typeof topic === 'string' ? topic : undefined,
            tags: toArray(tags),
            communities: toArray(communities),
            search: typeof search === 'string' ? search : undefined
          }}
        />
      </Suspense>

      {/* Content */}
      <Suspense fallback={<LoadingSkeleton />}>
        <RegionalCaseStudiesContent
          locale={locale}
          filters={{
            topic: typeof topic === 'string' ? topic : undefined,
            tags: toArray(tags),
            communities: toArray(communities),
            search: typeof search === 'string' ? search : undefined
          }}
        />
      </Suspense>
    </div>
  )
}

async function RegionalCaseStudiesContent({
  locale,
  filters
}: {
  locale: string
  filters: {
    topic?: string
    tags?: string[]
    communities?: string[]
    search?: string
  }
}) {
  const t = await getTranslations({ locale, namespace: 'caseStudies' })

  // If filters are applied, show filtered results
  if (filters.topic || (filters.tags && filters.tags.length > 0) || (filters.communities && filters.communities.length > 0) || filters.search) {
    const filteredCaseStudies = await fetchFilteredCaseStudies(filters)

    const getFilterSummary = () => {
      const parts: string[] = []
      if (filters.search) parts.push(`"${filters.search}"`)
      if (filters.topic) parts.push(filters.topic)
      if (filters.tags && filters.tags.length > 0) parts.push(`Tag: ${filters.tags[0]}`)
      if (filters.communities && filters.communities.length > 0) parts.push(filters.communities[0])
      return parts.join(' • ')
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{t('searchResults')}</h2>
            {getFilterSummary() && (
              <p className="text-sm text-muted-foreground mt-1">
                {getFilterSummary()}
              </p>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {filteredCaseStudies.length} {t('resultsFound')}
          </p>
        </div>

        {filteredCaseStudies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCaseStudies.map((caseStudy: any) => (
              <Link
                key={caseStudy._id}
                href={`/${locale}/research-and-action/case-studies/${caseStudy.slug}`}
              >
                <GridCaseStudyComponent
                  _type="grid-case-study"
                  _key={caseStudy._id}
                  caseStudy={caseStudy}
                  showTags={true}
                  showAuthors={true}
                  showMetadata={true}
                  showStudyPeriod={false}
                  showLocation={false}
                  customLayout="default"
                  locale={locale}
                  cardVariant="classic"
                  disableModal={true}
                />
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="space-y-3">
              <Search className="w-12 h-12 mx-auto text-muted-foreground/50" />
              <h3 className="text-lg font-medium">{t('noResults')}</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {t('noResultsDescription')}
              </p>
              <Button variant="outline" asChild className="mt-4">
                <Link href={`/${locale}/research-and-action/case-studies`}>
                  {t('clearFilters')}
                </Link>
              </Button>
            </div>
          </Card>
        )}
      </div>
    )
  }

  // No filters - show regional community grids
  const data = await fetchCaseStudiesByRegion()

  // Filter out communities with no case studies
  const communitiesWithCaseStudies = data.regionalCommunities.filter(
    (rc: any) => rc.caseStudies && rc.caseStudies.length > 0
  )

  if (communitiesWithCaseStudies.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="space-y-3">
          <Search className="w-12 h-12 mx-auto text-muted-foreground/50" />
          <h3 className="text-lg font-medium">{t('noResults')}</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            No case studies have been published yet. Check back soon!
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-16">
      {communitiesWithCaseStudies.map((community: any) => (
        <section key={community._id} className="space-y-6">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {typeof community.name === 'string' ? community.name : getLocalizedText(community.name, locale, community.name)}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {community.caseStudies.length} case {community.caseStudies.length === 1 ? 'study' : 'studies'}
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link
                href={`/${locale}/communities/${community.slug}`}
                className="flex items-center gap-1"
              >
                View community
                <ChevronRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          {/* Grid of Case Studies */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {community.caseStudies.map((caseStudy: any) => (
              <Link
                key={caseStudy._id}
                href={`/${locale}/research-and-action/case-studies/${caseStudy.slug}`}
              >
                <GridCaseStudyComponent
                  _type="grid-case-study"
                  _key={caseStudy._id}
                  caseStudy={caseStudy}
                  showTags={true}
                  showAuthors={true}
                  showMetadata={true}
                  showStudyPeriod={false}
                  showLocation={false}
                  customLayout="default"
                  locale={locale}
                  cardVariant="classic"
                  disableModal={true}
                />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
