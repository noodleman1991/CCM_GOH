import type { Metadata } from "next"
import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import NewsFilters from '@/components/news/news-filters'
import NewsHeroSection from '@/components/news/news-hero-section'
import NewsPostCard from '@/components/ui/news-post-card'
import { SectionHeader } from '@/components/ui/section-header'
import {
  fetchFeaturedNews,
  fetchRegularNews,
  fetchAllNews,
  fetchNewsTags,
  fetchRegionalCommunities,
  fetchApprovedExternalSources,
} from '@/sanity/queries/news-queries'
import ExternalSourceCard from '@/components/ui/external-source-card'
import { FollowButton } from '@/components/follow/follow-button'
import { hasActiveFilters, GLOBAL_REGION } from '@/lib/news-utils'
import { mergeNewsFeed } from '@/lib/news-feed'
import { cn } from '@/lib/utils'
import { heading } from '@/lib/design-tokens'
import { getLocalizedValue } from '@/i18n/i18n-helpers'
import type { NewsFilters as NewsFiltersType } from '@/lib/news-utils'

function LoadingSkeleton() {
  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, j) => (
            <Skeleton key={j} className="h-96" />
          ))}
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'news' })

  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
    openGraph: {
      title: t('pageTitle'),
      description: t('pageDescription'),
      type: 'website',
    },
  }
}

export default async function NewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { locale } = await params
  const filters = await searchParams
  const t = await getTranslations({ locale, namespace: 'news' })

  return (
    <div className="container max-w-7xl py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
          {t('title')}
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          {t('description')}
        </p>
      </div>

      {/* Filters */}
      <Suspense fallback={<Skeleton className="h-24 w-full" />}>
        <NewsFiltersWrapper locale={locale} currentFilters={filters} />
      </Suspense>

      {/* Content */}
      <Suspense fallback={<LoadingSkeleton />}>
        <NewsContent locale={locale} filters={filters} />
      </Suspense>
    </div>
  )
}

// Parse a comma-separated multi-value URL param (e.g. ?tags=a,b) into an array.
function toArr(param: string | string[] | undefined): string[] {
  if (!param) return []
  const raw = Array.isArray(param) ? param : param.split(',')
  return raw.map((s) => s.trim()).filter(Boolean)
}

// The raw (already-awaited) searchParams object for this page.
type NewsSearchParams = { [key: string]: string | string[] | undefined }

function parseNewsFilters(p: NewsSearchParams): NewsFiltersType {
  return {
    tags: toArr(p.tags),
    communities: toArr(p.communities),
    dateFrom: typeof p.dateFrom === 'string' ? p.dateFrom : undefined,
    dateTo: typeof p.dateTo === 'string' ? p.dateTo : undefined,
    search: typeof p.search === 'string' ? p.search : undefined,
  }
}

async function NewsFiltersWrapper({
  locale,
  currentFilters,
}: {
  locale: string
  currentFilters: NewsSearchParams
}) {
  const [tags, communities] = await Promise.all([
    fetchNewsTags(),
    fetchRegionalCommunities(),
  ])

  return (
    <NewsFilters
      currentFilters={parseNewsFilters(currentFilters)}
      tags={tags}
      communities={communities}
    />
  )
}

/**
 * Empty state for filtered results. When the selection includes a specific
 * region with no news, use the STATES §2 region-empty copy ("No updates in
 * {region} yet") with a "Follow this region" CTA (existing Follow infra,
 * REGION target keyed by the community slug — same as the community page).
 * Otherwise fall back to the generic no-results card.
 */
async function NewsEmptyState({
  locale,
  filters,
}: {
  locale: string
  filters: NewsFiltersType
}) {
  const t = await getTranslations({ locale, namespace: 'news' })

  const regionSlugs = (filters.communities || []).filter((c) => c !== GLOBAL_REGION)
  const regionSlug = regionSlugs[0]
  const region = regionSlug
    ? (await fetchRegionalCommunities()).find(
        (c: { slug: string }) => c.slug === regionSlug
      )
    : undefined

  if (region) {
    const regionName = getLocalizedValue(region.name, locale)
    return (
      <Card className="p-12 text-center">
        <div className="space-y-3">
          <Search className="w-12 h-12 mx-auto text-muted-foreground/50" />
          <h3 className="font-heading text-lg font-medium text-ccm-midnight">
            {t('regionEmpty.title', { region: regionName })}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {t('regionEmpty.description')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <FollowButton
              targetType="REGION"
              targetId={region.slug}
              size="default"
              className="min-h-11"
              followLabel={t('regionEmpty.cta')}
            />
            <Button variant="ghost" className="min-h-11" asChild>
              <Link href={`/news`}>{t('clearFilters')}</Link>
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-12 text-center">
      <div className="space-y-3">
        <Search className="w-12 h-12 mx-auto text-muted-foreground/50" />
        <h3 className="text-lg font-medium">{t('noResults')}</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {t('noResultsDescription')}
        </p>
        <Button variant="outline" asChild className="mt-4">
          <Link href={`/news`}>
            {t('clearFilters')}
          </Link>
        </Button>
      </div>
    </Card>
  )
}

async function NewsContent({
  locale,
  filters,
}: {
  locale: string
  filters: NewsSearchParams
}) {
  const t = await getTranslations({ locale, namespace: 'news' })

  const filterObj: NewsFiltersType = parseNewsFilters(filters)

  const hasFilters = hasActiveFilters(filterObj)

  // If filters are active, show all matching news (including featured) + external sources
  if (hasFilters) {
    const [allNews, externalSources] = await Promise.all([
      fetchAllNews(filterObj),
      fetchApprovedExternalSources({
        tags: filterObj.tags,
        communities: filterObj.communities,
        search: filterObj.search,
      }),
    ])

    const resultsFeed = mergeNewsFeed(allNews, externalSources)
    const totalResults = resultsFeed.length

    return (
      <div className="space-y-6">
        {/* Results Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className={cn("font-semibold text-ccm-midnight", heading('sm'))}>{t('searchResults')}</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {totalResults} {t('resultsFound')}
          </p>
        </div>

        {/* Unified results grid (site + external, date-sorted, badged) */}
        {resultsFeed.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resultsFeed.map((item) =>
              item.kind === 'site' ? (
                <Link key={item.id} href={`/news/${item.data.slug}`}>
                  <NewsPostCard
                    title={item.data.title}
                    subtitle={item.data.subtitle}
                    excerpt={item.data.excerpt}
                    image={item.data.image}
                    tags={item.data.tags}
                    author={item.data.author}
                    organization={item.data.organizations?.[0]}
                    location={item.data.locationDetails}
                    publishedAt={item.data.publishedAt}
                    locale={locale}
                    featured={item.data.featured}
                  />
                </Link>
              ) : (
                <ExternalSourceCard
                  key={item.id}
                  title={item.data.title}
                  excerpt={item.data.excerpt}
                  image={item.data.image}
                  sourceUrl={item.data.sourceUrl}
                  publisher={item.data.publisher}
                  publishedAt={item.data.publishedAt}
                  tags={item.data.tags}
                  organization={item.data.organizations?.[0]}
                  language={item.data.language}
                  locale={locale}
                />
              )
            )}
          </div>
        )}

        {/* Empty State */}
        {totalResults === 0 && (
          <NewsEmptyState locale={locale} filters={filterObj} />
        )}
      </div>
    )
  }

  // No filters - show hero section + a single merged feed (CCM + external)
  const [featuredNews, regularNews, externalSources] = await Promise.all([
    fetchFeaturedNews(3),
    fetchRegularNews({ limit: 50 }),
    fetchApprovedExternalSources({ limit: 12 }),
  ])
  const feed = mergeNewsFeed(regularNews, externalSources)

  return (
    <div className="space-y-12">
      {/* Hero Section - Featured News */}
      {featuredNews.length > 0 && (
        <NewsHeroSection
          featuredNews={featuredNews}
          locale={locale}
        />
      )}

      {/* Unified feed — CCM news + external sources in one date-sorted grid,
          each card badged with its origin (site vs external). */}
      {feed.length > 0 && (
        <section className="space-y-6">
          <SectionHeader
            title={t('latest')}
            subtitle={`${feed.length} ${t('resultsFound')}`}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {feed.map((item) =>
              item.kind === 'site' ? (
                <Link key={item.id} href={`/news/${item.data.slug}`}>
                  <NewsPostCard
                    title={item.data.title}
                    subtitle={item.data.subtitle}
                    excerpt={item.data.excerpt}
                    image={item.data.image}
                    tags={item.data.tags}
                    author={item.data.author}
                    organization={item.data.organizations?.[0]}
                    location={item.data.locationDetails}
                    publishedAt={item.data.publishedAt}
                    locale={locale}
                  />
                </Link>
              ) : (
                <ExternalSourceCard
                  key={item.id}
                  title={item.data.title}
                  excerpt={item.data.excerpt}
                  image={item.data.image}
                  sourceUrl={item.data.sourceUrl}
                  publisher={item.data.publisher}
                  publishedAt={item.data.publishedAt}
                  tags={item.data.tags}
                  organization={item.data.organizations?.[0]}
                  language={item.data.language}
                  locale={locale}
                />
              )
            )}
          </div>
        </section>
      )}

      {/* Empty State - No News */}
      {featuredNews.length === 0 && regularNews.length === 0 && (
        <Card className="p-12 text-center">
          <div className="space-y-3">
            <Search className="w-12 h-12 mx-auto text-muted-foreground/50" />
            <h3 className="text-lg font-medium">{t('noNews')}</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {t('noNewsDescription')}
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
