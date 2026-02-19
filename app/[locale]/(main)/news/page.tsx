export const revalidate = 60;

import type { Metadata } from "next"
import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import NewsFilters from '@/components/news/news-filters'
import NewsHeroSection from '@/components/news/news-hero-section'
import NewsPostCard from '@/components/ui/news-post-card'
import {
  fetchFeaturedNews,
  fetchRegularNews,
  fetchAllNews,
  fetchNewsTags,
  fetchRegionalCommunities,
} from '@/sanity/queries/news-queries'
import { hasActiveFilters } from '@/lib/news-utils'
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

async function NewsFiltersWrapper({
  locale,
  currentFilters,
}: {
  locale: string
  currentFilters: any
}) {
  const [tags, communities] = await Promise.all([
    fetchNewsTags(),
    fetchRegionalCommunities(),
  ])

  const filterObj: NewsFiltersType = {
    tag: typeof currentFilters.tag === 'string' ? currentFilters.tag : undefined,
    community: typeof currentFilters.community === 'string' ? currentFilters.community : undefined,
    dateFrom: typeof currentFilters.dateFrom === 'string' ? currentFilters.dateFrom : undefined,
    dateTo: typeof currentFilters.dateTo === 'string' ? currentFilters.dateTo : undefined,
    search: typeof currentFilters.search === 'string' ? currentFilters.search : undefined,
  }

  return (
    <NewsFilters
      currentFilters={filterObj}
      tags={tags}
      communities={communities}
    />
  )
}

async function NewsContent({
  locale,
  filters,
}: {
  locale: string
  filters: any
}) {
  const t = await getTranslations({ locale, namespace: 'news' })

  const filterObj: NewsFiltersType = {
    tag: typeof filters.tag === 'string' ? filters.tag : undefined,
    community: typeof filters.community === 'string' ? filters.community : undefined,
    dateFrom: typeof filters.dateFrom === 'string' ? filters.dateFrom : undefined,
    dateTo: typeof filters.dateTo === 'string' ? filters.dateTo : undefined,
    search: typeof filters.search === 'string' ? filters.search : undefined,
  }

  const hasFilters = hasActiveFilters(filterObj)

  // If filters are active, show all matching news (including featured)
  if (hasFilters) {
    const allNews = await fetchAllNews(filterObj)

    return (
      <div className="space-y-6">
        {/* Results Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{t('searchResults')}</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {allNews.length} {t('resultsFound')}
          </p>
        </div>

        {/* Results Grid */}
        {allNews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allNews.map((newsPost: any) => (
              <Link
                key={newsPost._id}
                href={`/${locale}/news/${newsPost.slug}`}
              >
                <NewsPostCard
                  title={newsPost.title}
                  subtitle={newsPost.subtitle}
                  excerpt={newsPost.excerpt}
                  image={newsPost.image}
                  tags={newsPost.tags}
                  author={newsPost.author}
                  organization={newsPost.organizations?.[0]}
                  location={newsPost.locationDetails}
                  publishedAt={newsPost.publishedAt}
                  locale={locale}
                  featured={newsPost.featured}
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
                <Link href={`/${locale}/news`}>
                  {t('clearFilters')}
                </Link>
              </Button>
            </div>
          </Card>
        )}
      </div>
    )
  }

  // No filters - show hero section + regular news grid
  const [featuredNews, regularNews] = await Promise.all([
    fetchFeaturedNews(3),
    fetchRegularNews({ limit: 50 }),
  ])

  return (
    <div className="space-y-12">
      {/* Hero Section - Featured News */}
      {featuredNews.length > 0 && (
        <NewsHeroSection
          featuredNews={featuredNews}
          locale={locale}
        />
      )}

      {/* Latest News Section */}
      {regularNews.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{t('latest')}</h2>
            <p className="text-muted-foreground">
              {regularNews.length} {t('resultsFound')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularNews.map((newsPost: any) => (
              <Link
                key={newsPost._id}
                href={`/${locale}/news/${newsPost.slug}`}
              >
                <NewsPostCard
                  title={newsPost.title}
                  subtitle={newsPost.subtitle}
                  excerpt={newsPost.excerpt}
                  image={newsPost.image}
                  tags={newsPost.tags}
                  author={newsPost.author}
                  organization={newsPost.organizations?.[0]}
                  location={newsPost.locationDetails}
                  publishedAt={newsPost.publishedAt}
                  locale={locale}
                  featured={false}
                />
              </Link>
            ))}
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
