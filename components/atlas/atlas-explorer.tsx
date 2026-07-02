'use client'

import { useCallback, useMemo, useState } from 'react'
import useSWR from 'swr'
import { useTranslations, useLocale } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { FilterChip } from '@/components/ui/filter-chip'
import { Input } from '@/components/ui/input'
import { RegionChoropleth } from '@/components/maps/region-choropleth'
import { RegionDataPanel } from '@/components/maps/region-data-panel'
import { RegionContentCards } from '@/components/atlas/region-content-cards'
import { SectionHeader } from '@/components/ui/section-header'
import { Button } from '@/components/ui/button'
import {
  FACETS, atlasDestination,
  type FacetId, type RegionDatum, type ThemeOption,
} from '@/lib/maps/region-facets'
import type { PinCluster } from '@/lib/maps/cluster-pins'
import { REGION_I18N_KEY, REGION_TO_RC_SLUG, isRegionCode, type RegionCode } from '@/lib/maps/region-codes'
import { useRouter, usePathname, Link } from '@/i18n/navigation'
import { ArrowRight, Search, X } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const CARD_FACETS: ReadonlySet<FacetId> = new Set([
  'caseStudyCount', 'livedExpCount', 'newsCount', 'agendaCount', 'reportCount',
])

const isFacetId = (v: string): v is FacetId => FACETS.some((f) => f.id === v)

/**
 * Atlas & Explore — shared URL state (layer · theme · region · q, spec A1):
 * every view is linkable and back-button-safe. Selecting a region loads its
 * geotagged pins; a persistent caption bar narrates the current result set.
 * `lockedRegion` renders the region-scoped embed variant (spec A4).
 */
export function AtlasExplorer({
  lockedRegion,
  themes,
}: {
  lockedRegion?: RegionCode
  themes: ThemeOption[]
} = { themes: [] }) {
  const t = useTranslations('map')
  const tAtlas = useTranslations('atlas')
  const tRegions = useTranslations('navigation.regions')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // ── URL state (locked mode ignores the URL's region) ──────────────────────
  const rawLayer = searchParams.get('layer') ?? 'caseStudyCount'
  const facet: FacetId = isFacetId(rawLayer) ? rawLayer : 'caseStudyCount'
  // `theme` URL param holds a tag SLUG (CMS-driven); validated against the
  // passed `themes` list — an unrecognized slug is ignored rather than 400ing
  // the whole page.
  const rawTheme = searchParams.get('theme') ?? ''
  const theme: string | null = themes.some((th) => th.slug === rawTheme) ? rawTheme : null
  const rawRegion = lockedRegion ?? searchParams.get('region') ?? ''
  const selected: RegionCode | null = isRegionCode(rawRegion) ? rawRegion : null
  const q = (searchParams.get('q') ?? '').slice(0, 100)

  // Locked mode (Task 9's embed) has no URL region state — pins must key off
  // the locked region directly rather than the URL-derived `selected`.
  const effectiveRegion = lockedRegion ?? selected

  const [active, setActive] = useState<RegionCode | null>(null)
  const [openCluster, setOpenCluster] = useState<PinCluster | null>(null)

  const setParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString())
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === '') next.delete(k)
        else next.set(k, v)
      }
      router.replace(`${pathname}?${next.toString()}`, { scroll: false })
      setOpenCluster(null)
    },
    [router, pathname, searchParams]
  )

  // ── Data ───────────────────────────────────────────────────────────────────
  const dataKey = `/api/maps/region-data?facet=${facet}${theme ? `&theme=${theme}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}`
  const { data } = useSWR<{ facet: FacetId; data: RegionDatum[] }>(dataKey, fetcher, {
    revalidateOnFocus: false, dedupingInterval: 60000,
  })
  const regionData = data?.data ?? []

  const pinsKey = effectiveRegion && CARD_FACETS.has(facet)
    ? `/api/maps/region-pins?region=${effectiveRegion}&facet=${facet}${theme ? `&theme=${theme}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}`
    : null
  const { data: pinsData } = useSWR<{
    pins: PinCluster[]
    countries?: Array<{ countryCode3: string; count: number; name?: string }>
  }>(pinsKey, fetcher, {
    revalidateOnFocus: false, dedupingInterval: 60000,
  })

  const labelFor = (code: RegionCode) => {
    const key = REGION_I18N_KEY[code]
    return key ? tRegions(key) : String(code)
  }
  const activeFacetDef = FACETS.find((f) => f.id === facet)
  const facetLabel = activeFacetDef ? t(activeFacetDef.labelKey) : ''
  const SUPPORTED_LOCALES = ['en', 'es', 'fr', 'ar'] as const
  const localeKey = (SUPPORTED_LOCALES as readonly string[]).includes(locale)
    ? (locale as (typeof SUPPORTED_LOCALES)[number])
    : 'en'
  const labelForTheme = (opt: ThemeOption) => opt.label[localeKey] ?? opt.label.en ?? opt.slug
  const themeLabel = theme ? labelForTheme(themes.find((th) => th.slug === theme)!) : null

  const onSelect = (code: RegionCode) => {
    if (lockedRegion) return
    setParams({ region: selected === code ? null : code })
  }

  const selectedDatum = useMemo(
    () => (selected ? regionData.find((d) => d.code === selected) : null),
    [selected, regionData]
  )
  const destinationHref = selected ? atlasDestination(facet, REGION_TO_RC_SLUG[selected]) : null

  // The caption sentence: "14 case studies · Livelihoods · "drought" · SSA"
  const captionParts = [
    selectedDatum ? `${selectedDatum.value} · ${facetLabel}` : facetLabel,
    themeLabel,
    q ? `"${q}"` : null,
    selected ? labelFor(selected) : null,
  ].filter(Boolean)

  return (
    <div className="space-y-8">
      {!lockedRegion && (
        <div>
          <h1 className="font-heading text-3xl font-bold text-balance text-ccm-midnight lg:text-4xl">
            {tAtlas('title')}
          </h1>
          <p className="mt-2 max-w-2xl text-lg text-muted-foreground">{tAtlas('description')}</p>
        </div>
      )}

      {/* Search q — part of the shared state */}
      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          defaultValue={q}
          key={q} /* re-sync on back/forward */
          onKeyDown={(e) => {
            if (e.key === 'Enter') setParams({ q: (e.target as HTMLInputElement).value })
          }}
          placeholder={tAtlas('searchPlaceholder')}
          className="ps-9 pe-9"
          aria-label={tAtlas('searchPlaceholder')}
        />
        {q && (
          <button
            type="button"
            onClick={() => setParams({ q: null })}
            className="absolute end-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
            aria-label={tAtlas('clearSearch')}
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Data-layer switcher */}
      <div className="space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {tAtlas('dataLayer')}
        </span>
        <div className="flex flex-wrap gap-2">
          {FACETS.map((f) => (
            <FilterChip
              key={f.id}
              label={t(f.labelKey)}
              active={facet === f.id}
              onClick={() => setParams({ layer: f.id === 'caseStudyCount' ? null : f.id })}
            />
          ))}
        </div>
      </div>

      {/* Theme facet (spec A1) — CMS-driven (tag.useAsTheme); labels localized
          with `en` fallback for locales missing a translation. */}
      {themes.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {tAtlas('theme')}
          </span>
          <div className="flex flex-wrap gap-2">
            {themes.map((th) => (
              <FilterChip
                key={th.slug}
                label={labelForTheme(th)}
                active={theme === th.slug}
                onClick={() => setParams({ theme: theme === th.slug ? null : th.slug })}
              />
            ))}
          </div>
        </div>
      )}

      {/* Map + panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
        <div className="relative min-w-0">
          <RegionChoropleth
            data={regionData}
            activeCode={active ?? selected}
            onHover={setActive}
            onSelect={onSelect}
            labelFor={labelFor}
            pins={pinsData?.pins}
            onPinClick={setOpenCluster}
          />
          {openCluster && (
            <div className="absolute inset-x-4 bottom-4 rounded-lg border bg-card p-3 shadow-lg">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  {tAtlas('pinItems', { count: openCluster.count })}
                </span>
                <button type="button" onClick={() => setOpenCluster(null)} aria-label={tAtlas('close')} className="rounded p-1 hover:bg-muted">
                  <X className="size-3.5" />
                </button>
              </div>
              <ul className="space-y-1">
                {openCluster.items.map((item) => (
                  <li key={item.id} className="truncate text-sm">
                    <bdi>{item.title}</bdi>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <RegionDataPanel
          data={regionData}
          activeCode={active ?? selected}
          facetLabel={facetLabel}
          labelFor={labelFor}
          onSelect={onSelect}
        />
      </div>

      {/* Country breakdown (locked/embed mode only, spec A4) — country names
          are resolved server-side by the pins route, so no i18n-iso-countries
          import lands in this client bundle. */}
      {lockedRegion && pinsData && 'countries' in pinsData && pinsData.countries?.length ? (
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {tAtlas('countryBreakdown')}
          </span>
          <ul className="flex flex-wrap gap-2">
            {pinsData.countries.slice(0, 8).map((c) => (
              <li key={c.countryCode3} className="rounded-full border bg-card px-3 py-1 text-sm">
                {c.name ?? c.countryCode3} · {c.count}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Caption bar (spec A1) — the live result sentence + deep link */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border bg-card px-4 py-3 text-sm shadow-sm">
        <span className="font-heading font-semibold text-ccm-midnight">{captionParts.join(' · ')}</span>
        {destinationHref && selected && (
          <Link href={destinationHref} className="ms-auto inline-flex min-h-11 items-center gap-1 font-heading text-sm font-semibold text-primary">
            {tAtlas('openIn', { label: facetLabel })}
            <ArrowRight className="size-4 rtl:-scale-x-100" />
          </Link>
        )}
      </div>

      {/* Selected-region drill-in */}
      {selected && selectedDatum && destinationHref && (
        <section className="rounded-2xl border bg-ccm-sky/10 p-6">
          <SectionHeader title={labelFor(selected)} subtitle={`${selectedDatum.value} · ${facetLabel}`} />
          <div className="mt-4 space-y-4">
            {selectedDatum.value > 0 ? (
              <>
                {CARD_FACETS.has(facet) && <RegionContentCards region={selected} facet={facet} />}
                <Button asChild size="sm">
                  <Link href={destinationHref}>
                    {tAtlas('explore', { region: labelFor(selected) })}
                    <ArrowRight className="size-4 rtl:-scale-x-100" />
                  </Link>
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{tAtlas('empty', { layer: facetLabel })}</p>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

export default AtlasExplorer
