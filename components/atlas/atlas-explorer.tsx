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
  FACETS, atlasDestination, parseLayers, facetForContentType,
  type FacetId, type RegionDatumWithBreakdown, type ThemeOption,
} from '@/lib/maps/region-facets'
import type { PinCluster } from '@/lib/maps/cluster-pins'
import { REGION_I18N_KEY, REGION_TO_RC_SLUG, isRegionCode, type RegionCode } from '@/lib/maps/region-codes'
import { useRouter, usePathname, Link } from '@/i18n/navigation'
import { ArrowRight, Search, X } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const CARD_FACETS: ReadonlySet<FacetId> = new Set([
  'caseStudyCount', 'livedExpCount', 'newsCount', 'agendaCount', 'reportCount',
])

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
  // `layers=` is the current param; the legacy singular `layer=` is still read
  // as a one-item fallback so pre-existing bookmarked/shared links keep
  // working. `parseLayers` validates/dedupes/never-empty.
  const layers = useMemo(
    () => parseLayers(searchParams.get('layers') ?? searchParams.get('layer')),
    [searchParams]
  )
  const layerSet = useMemo(() => new Set(layers), [layers])
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

  const toggleLayer = (id: FacetId) => {
    if (layerSet.has(id) && layerSet.size === 1) return // last active layer — no-op
    const next = layerSet.has(id) ? layers.filter((l) => l !== id) : [...layers, id]
    const isDefault = next.length === 1 && next[0] === 'caseStudyCount'
    // Drop the legacy `layer` param too so it can't linger and conflict.
    setParams({ layers: isDefault ? null : next.join(','), layer: null })
  }

  // ── Data ───────────────────────────────────────────────────────────────────
  const facetsQS = layers.join(',')
  const dataKey = `/api/maps/region-data?facets=${facetsQS}${theme ? `&theme=${theme}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}`
  const { data } = useSWR<{ facets: FacetId[]; data: RegionDatumWithBreakdown[] }>(dataKey, fetcher, {
    revalidateOnFocus: false, dedupingInterval: 60000,
  })
  const regionData = data?.data ?? []

  // Pins only exist for content facets (member counts have no geo data); if
  // none of the active layers are pin-capable, skip the pins fetch entirely.
  const pinFacets = layers.filter((l) => CARD_FACETS.has(l))
  const pinsKey = effectiveRegion && pinFacets.length > 0
    ? `/api/maps/region-pins?region=${effectiveRegion}&facets=${pinFacets.join(',')}${theme ? `&theme=${theme}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}`
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
  const activeFacetDefs = useMemo(() => FACETS.filter((f) => layerSet.has(f.id)), [layerSet])
  // Multiple active layers: join their labels ("Case studies + Lived experiences").
  const facetLabel = activeFacetDefs.map((f) => t(f.labelKey)).join(' + ')
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
  // Single active layer → one deep link; multiple → the per-layer chips below
  // carry their own links instead, so there's no one destination to caption.
  const singleFacet: FacetId | null = layers.length === 1 ? layers[0] : null
  const destinationHref = selected && singleFacet ? atlasDestination(singleFacet, REGION_TO_RC_SLUG[selected]) : null
  // Content-card drill-in only applies when exactly one CARD_FACET (pin-capable
  // content facet) is active — with multiple, per-layer chips replace it.
  const singleCardFacet: FacetId | null =
    pinFacets.length === 1 && layers.length === 1 ? pinFacets[0] : null

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

      {/* Data-layer switcher — multi-select; toggling the last active layer is
          a no-op (aria-disabled + tooltip) so at least one stays selected. */}
      <div className="space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {tAtlas('dataLayer')}
        </span>
        <div className="flex flex-wrap gap-2">
          {FACETS.map((f) => {
            const isActive = layerSet.has(f.id)
            const isLastActive = isActive && layerSet.size === 1
            return (
              <FilterChip
                key={f.id}
                label={t(f.labelKey)}
                active={isActive}
                disabled={isLastActive}
                title={isLastActive ? tAtlas('lastLayer') : undefined}
                onClick={() => toggleLayer(f.id)}
              />
            )
          })}
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
                {openCluster.items.map((item) => {
                  // Colour is never the only signal for an item's type: every
                  // popover row pairs it with a small text label (a11y).
                  const itemFacet = facetForContentType(item.type)
                  const itemTypeLabel = itemFacet ? t(itemFacet.labelKey) : null
                  return (
                    <li key={item.id} className="flex items-center gap-1.5 truncate text-sm">
                      <bdi className="truncate">{item.title}</bdi>
                      {itemTypeLabel && (
                        <span className="shrink-0 text-xs text-muted-foreground">· {itemTypeLabel}</span>
                      )}
                    </li>
                  )
                })}
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

      {/* Selected-region drill-in. Single active layer: the original cards +
          "explore" deep link. Multiple active layers: no single destination to
          drill into, so each layer gets its own count chip linking to its
          listing (spec R2) — summed totals live in the caption/panel above. */}
      {selected && selectedDatum && (
        <section className="rounded-2xl border bg-ccm-sky/10 p-6">
          <SectionHeader title={labelFor(selected)} subtitle={`${selectedDatum.value} · ${facetLabel}`} />
          <div className="mt-4 space-y-4">
            {singleFacet && destinationHref ? (
              selectedDatum.value > 0 ? (
                <>
                  {singleCardFacet && <RegionContentCards region={selected} facet={singleCardFacet} />}
                  <Button asChild size="sm">
                    <Link href={destinationHref}>
                      {tAtlas('explore', { region: labelFor(selected) })}
                      <ArrowRight className="size-4 rtl:-scale-x-100" />
                    </Link>
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{tAtlas('empty', { layer: facetLabel })}</p>
              )
            ) : (
              <ul className="flex flex-wrap gap-2">
                {layers.map((layerId) => {
                  const def = FACETS.find((f) => f.id === layerId)
                  const count = selectedDatum.byFacet[layerId] ?? 0
                  const href = atlasDestination(layerId, REGION_TO_RC_SLUG[selected])
                  return (
                    <li key={layerId}>
                      <Link
                        href={href}
                        className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm font-medium text-ccm-midnight transition-colors hover:border-[var(--color-ccm-sea)]/40 hover:bg-muted"
                      >
                        <span>{def ? t(def.labelKey) : layerId}</span>
                        <span className="font-semibold text-[var(--color-ccm-sea)]">{count}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

export default AtlasExplorer
