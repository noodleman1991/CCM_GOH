import type { Metadata } from "next"
import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Search } from 'lucide-react'
import { FilterBar } from '@/components/filters/filter-bar'
import NewsHeroSection from '@/components/news/news-hero-section'
import NewsPostCard from '@/components/ui/news-post-card'
import { SectionHeader } from '@/components/ui/section-header'
import {
  getFeaturedNews,
  getRegularNews,
  getAllNews,
  getApprovedExternalSources,
} from '@/lib/content/news'
import ExternalSourceCard from '@/components/ui/external-source-card'
import { mergeNewsFeed } from '@/lib/news-feed'
import { cn } from '@/lib/utils'
import { heading } from '@/lib/design-tokens'
import { applyFilters, buildOptions, isFiltering, type ActiveFilters, type FilterTag } from '@/lib/filters/core'
import { newsView } from '@/lib/news/view'
import { parseFilterParams } from '@/lib/filters/params'
import { externalToFilterable, newsToFilterable } from '@/lib/filters/adapters'
import { REGION_CODES, REGION_I18N_KEY, REGION_TO_RC_SLUG, type RegionCode } from '@/lib/maps/region-codes'
import { getHubIllustrations } from '@/lib/content/illustrations'

function LoadingSkeleton() {
  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 gap-6 @content-md/page:grid-cols-2 @min-[80rem]/page:grid-cols-3">
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

const COMMUNITY_SLUG_TO_REGION: Record<string, string> = Object.fromEntries(
  REGION_CODES.map((code) => [REGION_TO_RC_SLUG[code], code]),
)

type NewsList = Awaited<ReturnType<typeof getAllNews>>
type ExternalList = Awaited<ReturnType<typeof getApprovedExternalSources>>

export default async function NewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { locale } = await params
  const sp = await searchParams
  const [t, tRegions, allNews, externalSources] = await Promise.all([
    getTranslations({ locale, namespace: 'news' }),
    getTranslations({ locale, namespace: 'navigation.regions' }),
    getAllNews(),
    getApprovedExternalSources({ limit: 100 }),
  ])

  // One list, one engine: results and every option's count (spec 2026-09-30).
  const items = [
    ...allNews.map((n) => newsToFilterable(n as never, locale)),
    ...externalSources.map((e) => externalToFilterable(e as never, locale)),
  ]
  const knownTags: FilterTag[] = [...new Map(items.flatMap((i) => i.tags).map((tag) => [tag.slug, tag])).values()]
  const active = parseFilterParams(sp, { tags: knownTags, communitySlugToRegion: COMMUNITY_SLUG_TO_REGION })
  const options = buildOptions(items, active, { locale, regionLabel: (code) => tRegions(REGION_I18N_KEY[code as RegionCode]) })

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

      {/* The hub's one filter bar: Region · Communities · Themes · When · Search. */}
      <FilterBar options={options} active={active} />

      {/* Content */}
      <Suspense fallback={<LoadingSkeleton />}>
        <NewsContent locale={locale} active={active} allNews={allNews} externalSources={externalSources} />
      </Suspense>
    </div>
  )
}

async function NewsContent({
  locale,
  active,
  allNews,
  externalSources: allExternal,
}: {
  locale: string
  active: ActiveFilters
  allNews: NewsList
  externalSources: ExternalList
}) {
  const [t, tFilters, { newsFallback }] = await Promise.all([
    getTranslations({ locale, namespace: 'news' }),
    getTranslations({ locale, namespace: 'filters' }),
    getHubIllustrations(),
  ])

  // With filters: every matching news post (featured included) and external source.
  // No matches never leaves the page empty: a short note, then featured and the latest.
  if (isFiltering(active)) {
    const visible = new Set(
      applyFilters(
        [...allNews.map((n) => newsToFilterable(n as never, locale)), ...allExternal.map((e) => externalToFilterable(e as never, locale))],
        active,
      ).map((i) => i.id),
    )
    const resultsFeed = mergeNewsFeed(
      allNews.filter((n) => visible.has(n._id)),
      allExternal.filter((e) => visible.has((e as { _id: string })._id)),
    )
    const totalResults = resultsFeed.length

    if (newsView(active, totalResults) === 'noMatchesThenLatest') {
      return (
        <div className="space-y-10">
          <div className="flex items-start gap-3 rounded-2xl border border-dashed border-ccm-sea/30 bg-ccm-sea/5 p-5" role="status">
            <Search className="mt-0.5 size-5 shrink-0 text-ccm-sea" aria-hidden />
            <p className="text-ccm-midnight">
              <span className="font-semibold">{tFilters('empty')}</span> {tFilters('showingLatest')}
            </p>
          </div>
          <LatestNews locale={locale} latestLabel={t('latest')} countLabel={(count) => t('resultsCount', { count })} noNews={null} newsFallback={newsFallback} />
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Results Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className={cn("font-semibold text-ccm-midnight", heading('sm'))}>{t('searchResults')}</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('resultsCount', { count: totalResults })}
          </p>
        </div>

        {/* Unified results grid (site + external, date-sorted, badged) */}
        <div className="grid grid-cols-1 gap-6 @content-md/page:grid-cols-2 @min-[80rem]/page:grid-cols-3">
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
                    fallbackIllustration={newsFallback}
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

      </div>
    )
  }

  return (
    <LatestNews
      locale={locale}
      latestLabel={t('latest')}
      countLabel={(count) => t('resultsCount', { count })}
      noNews={{ title: t('noNews'), description: t('noNewsDescription') }}
      newsFallback={newsFallback}
    />
  )
}

/** Featured on top, then CCM news and external sources in one date-sorted grid. */
async function LatestNews({
  locale,
  latestLabel,
  countLabel,
  noNews,
  newsFallback,
}: {
  locale: string
  latestLabel: string
  countLabel: (count: number) => string
  noNews: { title: string; description: string } | null
  newsFallback: Parameters<typeof NewsPostCard>[0]['fallbackIllustration']
}) {
  // No filters - show hero section + a single merged feed (CCM + external)
  const [featuredNews, regularNews, externalSources] = await Promise.all([
    getFeaturedNews(3),
    getRegularNews({ limit: 50 }),
    getApprovedExternalSources({ limit: 12 }),
  ])
  // One lead story on top; the other featured stories join the date-sorted grid.
  const feed = mergeNewsFeed([...featuredNews.slice(1), ...regularNews], externalSources)

  return (
    <div className="space-y-12">
      {/* Hero Section - Featured News */}
      {featuredNews.length > 0 && (
        <NewsHeroSection
          featuredNews={featuredNews}
          locale={locale}
          fallbackIllustration={newsFallback}
        />
      )}

      {/* Unified feed — CCM news + external sources in one date-sorted grid,
          each card badged with its origin (site vs external). */}
      {feed.length > 0 && (
        <section className="space-y-6">
          <SectionHeader
            title={latestLabel}
            subtitle={countLabel(feed.length)}
          />

          <div className="grid grid-cols-1 gap-6 @content-md/page:grid-cols-2 @min-[80rem]/page:grid-cols-3">
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
                    fallbackIllustration={newsFallback}
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
      {noNews && featuredNews.length === 0 && regularNews.length === 0 && (
        <Card className="p-12 text-center">
          <div className="space-y-3">
            <Search className="w-12 h-12 mx-auto text-muted-foreground/50" />
            <h3 className="text-lg font-medium">{noNews.title}</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {noNews.description}
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
