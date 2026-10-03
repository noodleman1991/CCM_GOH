import type { Metadata } from "next"
import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import GridCaseStudyComponent from '@/components/blocks/grid/grid-case-study'
import { FilterBar } from '@/components/filters/filter-bar'
import { CasesMapView, type CasesMapItem } from '@/components/case-studies/cases-map-view'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Search, LayoutGrid, Map as MapIcon } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { getLocalizedText } from '@/lib/localization-utils'
import { getFilteredCaseStudies, type CaseStudyListItem } from '@/lib/content/case-studies'
import { applyFilters, buildOptions, isFiltering, type ActiveFilters, type FilterTag } from '@/lib/filters/core'
import { parseFilterParams, toSearchParams } from '@/lib/filters/params'
import { caseStudyToFilterable } from '@/lib/filters/adapters'
import { legacyTopicsToTagSlugs } from '@/lib/case-studies/topic-tag-map'
import { assignGalleryVariant, spanForVariant } from '@/lib/case-studies/gallery-layout'
import { REGION_CODES, REGION_I18N_KEY, REGION_TO_RC_SLUG, type RegionCode } from '@/lib/maps/region-codes'
import type { RegionDatum } from '@/lib/maps/region-facets'
import { cn } from '@/lib/utils'
import { imageUrl } from '@/lib/content/images'


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

const COMMUNITY_SLUG_TO_REGION: Record<string, string> = Object.fromEntries(
  REGION_CODES.map((code) => [REGION_TO_RC_SLUG[code], code]),
)

export default async function CaseStudiesPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { locale } = await params
  const sp = await searchParams
  const t = await getTranslations({ locale, namespace: 'caseStudies' })
  const tRegions = await getTranslations({ locale, namespace: 'navigation.regions' })

  // Every approved case study, once — the shared filter engine decides both
  // what shows and every option's count from this one list (spec 2026-09-30).
  const all = await getFilteredCaseStudies({})
  const items = all.map((cs) => caseStudyToFilterable(cs, locale))
  const knownTags: FilterTag[] = [...new Map(items.flatMap((i) => i.tags).map((tag) => [tag.slug, tag])).values()]
  // The retired fixed Topic list: an old `?topics=` link maps to its theme tag.
  const legacyTopics = legacyTopicsToTagSlugs(
    (Array.isArray(sp.topics) ? sp.topics.join(',') : sp.topics ?? '').split(',').map((x) => x.trim()).filter(Boolean),
  )
  const active = parseFilterParams(
    legacyTopics.length ? { ...sp, themes: [sp.themes, legacyTopics.join(',')].flat().filter(Boolean).join(',') } : sp,
    { tags: knownTags, communitySlugToRegion: COMMUNITY_SLUG_TO_REGION },
  )
  const regionLabel = (code: string) => tRegions(REGION_I18N_KEY[code as RegionCode])
  const options = buildOptions(items, active, { locale, regionLabel })

  // Map is the DEFAULT view (approved mock, B3): the atlas is how the hub
  // presents case studies; the gallery is the ?view=gallery opt-in.
  const activeView = sp.view === 'gallery' ? 'gallery' : 'map'
  const viewHref = (v: 'gallery' | 'map') => {
    const p = toSearchParams(active)
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

      {/* The hub's one filter bar: Region · Communities · Themes · When · Search. */}
      <FilterBar options={options} active={active} />

      <Suspense fallback={<LoadingSkeleton />}>
        <CaseStudiesContent locale={locale} all={all} active={active} view={activeView} />
      </Suspense>
    </div>
  )
}

async function CaseStudiesContent({
  locale,
  all,
  active,
  view
}: {
  locale: string
  all: CaseStudyListItem[]
  active: ActiveFilters
  view: 'gallery' | 'map'
}) {
  const t = await getTranslations({ locale, namespace: 'caseStudies' })
  const tRegions = await getTranslations({ locale, namespace: 'navigation.regions' })
  const tFilters = await getTranslations({ locale, namespace: 'filters' })

  const items = all.map((cs) => caseStudyToFilterable(cs, locale))
  const visibleIds = new Set(applyFilters(items, active).map((i) => i.id))
  const caseStudies = all.filter((cs) => visibleIds.has(cs._id))
  const hasFilters = isFiltering(active)

  const emptyState = (
    <Card className="p-12 text-center">
      <div className="space-y-3">
        <Search className="w-12 h-12 mx-auto text-muted-foreground/50" />
        <h3 className="text-lg font-medium">{hasFilters ? tFilters('empty') : t('noResults')}</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {t('noResultsDescription')}
        </p>
        {hasFilters && (
          <Button variant="outline" asChild className="mt-4">
            <Link href={`/research-and-action/case-studies`}>
              {tFilters('clear')}
            </Link>
          </Button>
        )}
      </div>
    </Card>
  )

  if (view === 'map') {
    // The choropleth keeps the full distribution (every filter except Region)
    // so the map stays readable while a region narrows the list. Regions come
    // from the case study's own code or its community (9 of 25 have only a code).
    const mapWide = applyFilters(items, { ...active, regions: [] })
    const counts: Partial<Record<RegionCode, number>> = {}
    for (const item of mapWide) {
      for (const code of item.regions) counts[code as RegionCode] = (counts[code as RegionCode] ?? 0) + 1
    }
    const max = Math.max(1, ...Object.values(counts).map((n) => n ?? 0))
    const data: RegionDatum[] = REGION_CODES.map((code) => ({
      code,
      i18nKey: REGION_I18N_KEY[code],
      value: counts[code] ?? 0,
      intensity: (counts[code] ?? 0) / max,
    }))

    const mapItems: CasesMapItem[] = (caseStudies as unknown as Array<Record<string, unknown>>).map((cs) => ({
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
        items={mapItems}
        regionLabels={regionLabels}
        emptyLabel={hasFilters ? tFilters('empty') : t('noResults')}
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
      <div className="grid grid-cols-1 gap-6 @content-md/page:grid-cols-2">
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
