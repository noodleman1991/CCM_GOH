import type { Metadata } from "next"
import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import GridCaseStudyComponent from '@/components/blocks/grid/grid-case-study'
import CaseStudiesFilters from '@/components/case-studies/case-studies-filters'
import { CasesMapView, type CasesMapItem } from '@/components/case-studies/cases-map-view'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Search, LayoutGrid, Map as MapIcon } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { getLocalizedText } from '@/lib/localization-utils'
import {
  getCaseStudyFilterTags,
  getCaseStudyFilterCommunities,
  getFilteredCaseStudies,
  type CaseStudyListFilters,
} from '@/lib/content/case-studies'
import { LEGACY_TOPIC_TO_TAG } from '@/lib/case-studies/topic-tag-map'
import { assignGalleryVariant, spanForVariant } from '@/lib/case-studies/gallery-layout'
import { REGION_CODES, REGION_I18N_KEY, slugToShortCode, type RegionCode } from '@/lib/maps/region-codes'
import type { RegionDatum } from '@/lib/maps/region-facets'
import { cn } from '@/lib/utils'
import { imageUrl } from '@/lib/content/images'

type Filters = CaseStudyListFilters

// Wrapper component to fetch filter data
async function CaseStudiesFiltersWrapper({
  currentFilters
}: {
  currentFilters: Filters
}) {
  const [tags, communities] = await Promise.all([
    getCaseStudyFilterTags(),
    getCaseStudyFilterCommunities()
  ])

  return (
    <CaseStudiesFilters
      currentFilters={currentFilters}
      tags={tags as never}
      communities={communities as never}
    />
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, j) => (
          <Skeleton key={j} className="h-96" />
        ))}
      </div>
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

export default async function CaseStudiesPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { locale } = await params
  const { topics, tags, communities, search, view } = await searchParams
  const t = await getTranslations({ locale, namespace: 'caseStudies' })

  // Convert a (possibly comma-separated) multi-value param into an array.
  const toArray = (param: string | string[] | undefined): string[] | undefined => {
    if (!param) return undefined
    const raw = Array.isArray(param) ? param : param.split(',')
    const cleaned = raw.map((s) => s.trim()).filter(Boolean)
    return cleaned.length ? cleaned : undefined
  }

  // The retired fixed Topic list has no facet of its own any more — an old
  // `?topics=` link is mapped to its theme-tag replacement (once Task 16 fills
  // in LEGACY_TOPIC_TO_TAG) and folded into `tags`. An unmapped/unknown topic
  // value is dropped rather than erroring.
  const legacyTagIds = (toArray(topics) ?? [])
    .map((value) => LEGACY_TOPIC_TO_TAG[value])
    .filter((id): id is string => Boolean(id))
  const tagIds = Array.from(new Set([...(toArray(tags) ?? []), ...legacyTagIds]))

  const parsed: Filters = {
    tags: tagIds.length ? tagIds : undefined,
    communities: toArray(communities),
    search: typeof search === 'string' ? search : undefined,
  }
  // Map is the DEFAULT view (approved mock, B3): the atlas is how the hub
  // presents case studies; the gallery is the ?view=gallery opt-in.
  const activeView = view === 'gallery' ? 'gallery' : 'map'

  // Raw single-string params, used to build chip-toggle hrefs.
  const rawParams: Record<string, string | undefined> = {
    topics: typeof topics === 'string' ? topics : undefined,
    tags: typeof tags === 'string' ? tags : Array.isArray(tags) ? tags.join(',') : undefined,
    communities:
      typeof communities === 'string' ? communities : Array.isArray(communities) ? communities.join(',') : undefined,
    search: typeof search === 'string' ? search : undefined,
    view: activeView === 'gallery' ? 'gallery' : undefined,
  }

  const viewHref = (v: 'gallery' | 'map') => {
    const p = new URLSearchParams()
    for (const [k, val] of Object.entries(rawParams)) {
      if (k !== 'view' && val) p.set(k, val)
    }
    if (v === 'gallery') p.set('view', 'gallery')
    const qs = p.toString()
    return `/research-and-action/case-studies${qs ? `?${qs}` : ''}`
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
            <Link href={`/research-and-action/case-studies/submit`}>
              <Plus className="w-4 h-4" />
              {t('submitButton')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Map | Gallery toggle — map leads, matching the default (B3). */}
      <div className="space-y-4">
        <div className="inline-flex rounded-full border bg-muted/40 p-1" role="group" aria-label={t('viewToggle')}>
          <Button
            asChild
            size="sm"
            variant={activeView === 'map' ? 'default' : 'ghost'}
            className="min-h-[44px] gap-1.5 rounded-full"
          >
            <Link href={viewHref('map')}>
              <MapIcon className="size-4" aria-hidden />
              {t('mapView')}
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant={activeView === 'gallery' ? 'default' : 'ghost'}
            className="min-h-[44px] gap-1.5 rounded-full"
          >
            <Link href={viewHref('gallery')}>
              <LayoutGrid className="size-4" aria-hidden />
              {t('galleryView')}
            </Link>
          </Button>
        </div>

      </div>

      {/* ONE filter control (punch-list de-bulk): the collapsed Region ·
          Topic · Tags groups + search below. The always-expanded 7-region
          and theme pill rows that used to sit here duplicated those groups
          and dominated the page. */}
      <Suspense fallback={<Skeleton className="h-16 w-full" />}>
        <CaseStudiesFiltersWrapper currentFilters={parsed} />
      </Suspense>

      {/* Content — one gallery (or map), driven by the shared filter state */}
      <Suspense fallback={<LoadingSkeleton />}>
        <CaseStudiesContent locale={locale} filters={parsed} view={activeView} />
      </Suspense>
    </div>
  )
}

async function CaseStudiesContent({
  locale,
  filters,
  view
}: {
  locale: string
  filters: Filters
  view: 'gallery' | 'map'
}) {
  const t = await getTranslations({ locale, namespace: 'caseStudies' })
  const tRegions = await getTranslations({ locale, namespace: 'navigation.regions' })

  const caseStudies = await getFilteredCaseStudies(filters)

  const hasFilters = Boolean(
    filters.tags?.length || filters.communities?.length || filters.search
  )

  const emptyState = (
    <Card className="p-12 text-center">
      <div className="space-y-3">
        <Search className="w-12 h-12 mx-auto text-muted-foreground/50" />
        <h3 className="text-lg font-medium">{t('noResults')}</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {t('noResultsDescription')}
        </p>
        {hasFilters && (
          <Button variant="outline" asChild className="mt-4">
            <Link href={`/research-and-action/case-studies`}>
              {t('clearFilters')}
            </Link>
          </Button>
        )}
      </div>
    </Card>
  )

  if (view === 'map') {
    // The choropleth keeps the full distribution (all filters EXCEPT region)
    // so the map stays readable while a region chip narrows the list.
    const mapWide = filters.communities?.length
      ? await getFilteredCaseStudies({ ...filters, communities: undefined })
      : caseStudies

    const counts: Partial<Record<RegionCode, number>> = {}
    for (const cs of mapWide as Array<{ communitySlug?: string | null }>) {
      const code = cs.communitySlug ? slugToShortCode(cs.communitySlug) : null
      if (code) counts[code] = (counts[code] ?? 0) + 1
    }
    const max = Math.max(1, ...Object.values(counts).map((n) => n ?? 0))
    const data: RegionDatum[] = REGION_CODES.map((code) => ({
      code,
      i18nKey: REGION_I18N_KEY[code],
      value: counts[code] ?? 0,
      intensity: (counts[code] ?? 0) / max,
    }))

    const items: CasesMapItem[] = (caseStudies as unknown as Array<Record<string, unknown>>).map((cs) => ({
      id: cs._id as string,
      slug: cs.slug as string,
      title: getLocalizedText(cs.title as Record<string, string>, locale, ''),
      excerpt: getLocalizedText(cs.excerpt as Record<string, string>, locale, ''),
      communityName: cs.relatedCommunity
        ? getLocalizedText(cs.relatedCommunity as Record<string, string>, locale, '')
        : null,
      image: imageUrl(cs.image, { width: 800, height: 450, crop: true }) || null,
      date: (cs.publishedAt as string | null) ?? null,
    }))

    const regionLabels = Object.fromEntries(
      REGION_CODES.map((code) => [code, tRegions(REGION_I18N_KEY[code])])
    ) as Record<RegionCode, string>

    return (
      <CasesMapView
        data={data}
        items={items}
        regionLabels={regionLabels}
        emptyLabel={t('noResults')}
        countLabel={t('resultsCount', { count: caseStudies.length })}
        galleryLabel={t('openAsGallery')}
      />
    )
  }

  if (caseStudies.length === 0) return emptyState

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {t('resultsCount', { count: caseStudies.length })}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
        {(caseStudies as unknown as Array<Record<string, unknown>>).map((caseStudy, index) => {
          const variant = assignGalleryVariant(index, caseStudies.length)
          return (
            <Link
              key={caseStudy._id as string}
              href={`/research-and-action/case-studies/${caseStudy.slug as string}`}
              className={cn('block', spanForVariant(variant))}
            >
              <GridCaseStudyComponent
                _type="grid-case-study"
                _key={caseStudy._id as string}
                caseStudy={caseStudy}
                showTags={true}
                showAuthors={true}
                showMetadata={true}
                locale={locale}
                cardVariant={variant}
                disableModal={true}
              />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
