'use client'

import { useCallback, useMemo, useState } from 'react'
import useSWR from 'swr'
import { useTranslations, useLocale } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { FilterChip } from '@/components/ui/filter-chip'
import { Input } from '@/components/ui/input'
import { RegionChoropleth } from '@/components/maps/region-choropleth'
import { RegionContentCards, RecentEverywhereCards } from '@/components/atlas/region-content-cards'
import { SectionHeader } from '@/components/ui/section-header'
import { Button } from '@/components/ui/button'
import {
  FACETS, atlasDestination, parseLayers, facetForContentType, layerColorKeyForFacet,
  type FacetId, type RegionDatumWithBreakdown, type ThemeOption,
} from '@/lib/maps/region-facets'
import type { PinCluster, PinItem } from '@/lib/maps/cluster-pins'
import { parseWhen, type WhenBucket } from '@/lib/maps/date-filter'
import { REGION_CODES, REGION_I18N_KEY, REGION_TO_RC_SLUG, isRegionCode, type RegionCode } from '@/lib/maps/region-codes'
import { useRouter, usePathname, Link } from '@/i18n/navigation'
import { COLOR } from '@/lib/ccm-colors'
import { cn } from '@/lib/utils'
import { ArrowRight, Search, X } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const CARD_FACETS: ReadonlySet<FacetId> = new Set([
  'caseStudyCount', 'livedExpCount', 'newsCount', 'researchOutputCount',
])

// "When" date facet buckets, in chip order (labels via `atlas.when_<bucket>`).
const WHEN_BUCKETS: readonly WhenBucket[] = ['y1', 'y3', 'older']

/** Group a pin popover's (capped) items by content type, ordered by the
 *  cluster's FULL per-type counts desc (`typeCounts`) — so ordering reflects
 *  the true composition even though `items` only carries the first 5. Each
 *  group's `count` is that full count (may exceed, or exist without, any
 *  titled `items` — `items` is capped repo-wide at 5 per cluster, so a type
 *  can be present in `typeCounts` with zero representatives among them; that
 *  group still renders its dot + label + count, just with no title list, so
 *  the popover's mini-legend never disagrees with the pin's own donut). */
function groupClusterItems(cluster: PinCluster) {
  const byType = new Map<PinItem['type'], PinItem[]>()
  for (const item of cluster.items) {
    const bucket = byType.get(item.type) ?? []
    bucket.push(item)
    byType.set(item.type, bucket)
  }
  return (Object.entries(cluster.typeCounts) as Array<[PinItem['type'], number]>)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => {
      const def = facetForContentType(type)
      return {
        type,
        facetId: (def?.id ?? 'caseStudyCount') as FacetId,
        labelKey: def?.labelKey ?? 'facetCaseStudies',
        count,
        items: byType.get(type) ?? [],
      }
    })
}

/**
 * Atlas & Explore — shared URL state (layer · theme · region · q, spec A1):
 * every view is linkable and back-button-safe. Selecting a region loads its
 * geotagged pins; the legend chips under the map narrate the current result
 * set (count per active layer) instead of a separate caption bar.
 * `lockedRegion` renders the region-scoped embed variant (spec A4).
 */
export function AtlasExplorer({
  lockedRegion,
  themes,
  showBreakdown = true,
}: {
  lockedRegion?: RegionCode
  themes: ThemeOption[]
  /** Show the locked-mode country breakdown list (spec A4). Default true;
   *  an embed can opt out when it wants the map without that list. */
  showBreakdown?: boolean
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
  // `when` date facet — validated against the known buckets; an unknown value
  // is dropped (no filter) rather than 400ing the page. Rides along in every
  // data fetch below so counts, cards and pins describe the same dated set.
  const when = parseWhen(searchParams.get('when'))
  const whenQS = when ? `&when=${when}` : ''

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
  const dataKey = `/api/maps/region-data?facets=${facetsQS}${theme ? `&theme=${theme}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}${whenQS}`
  const { data } = useSWR<{ facets: FacetId[]; data: RegionDatumWithBreakdown[] }>(dataKey, fetcher, {
    revalidateOnFocus: false, dedupingInterval: 60000,
  })
  const regionData = data?.data ?? []

  // Chip totals (task #12): every "Show" chip carries its live count, so the
  // facet row is informative before anything is clicked. One counts-only fetch
  // across ALL facets, theme/q-aware so the numbers always match the filters.
  const allFacetsQS = FACETS.map((f) => f.id).join(',')
  const totalsKey = `/api/maps/region-data?facets=${allFacetsQS}${theme ? `&theme=${theme}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}${whenQS}`
  const { data: totalsData } = useSWR<{ data: RegionDatumWithBreakdown[] }>(totalsKey, fetcher, {
    revalidateOnFocus: false, dedupingInterval: 120000,
  })
  const facetTotals = useMemo(() => {
    const totals: Partial<Record<FacetId, number>> = {}
    for (const datum of totalsData?.data ?? []) {
      for (const [facetId, count] of Object.entries(datum.byFacet ?? {})) {
        totals[facetId as FacetId] = (totals[facetId as FacetId] ?? 0) + (count ?? 0)
      }
    }
    return totals
  }, [totalsData])

  // Pins only exist for content facets (member counts have no geo data); if
  // none of the active layers are pin-capable, skip the pins fetch entirely.
  const pinFacets = layers.filter((l) => CARD_FACETS.has(l))
  const pinsKey = effectiveRegion && pinFacets.length > 0
    ? `/api/maps/region-pins?region=${effectiveRegion}&facets=${pinFacets.join(',')}${theme ? `&theme=${theme}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}${whenQS}`
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
  const labelForFacet = useCallback((id: FacetId) => {
    const def = FACETS.find((f) => f.id === id)
    return def ? t(def.labelKey) : id
  }, [t])
  const activeFacetDefs = useMemo(() => FACETS.filter((f) => layerSet.has(f.id)), [layerSet])
  // Multiple active layers: join their labels ("Case studies + Lived experiences").
  const facetLabel = activeFacetDefs.map((f) => t(f.labelKey)).join(' + ')
  const SUPPORTED_LOCALES = ['en', 'es', 'fr', 'ar'] as const
  const localeKey = (SUPPORTED_LOCALES as readonly string[]).includes(locale)
    ? (locale as (typeof SUPPORTED_LOCALES)[number])
    : 'en'
  const labelForTheme = (opt: ThemeOption) => opt.label[localeKey] ?? opt.label.en ?? opt.slug

  // Legend/result chips (spec R2b): one per ACTIVE layer, with its total count
  // summed across all regions from `byFacet` — this doubles as the live result
  // summary that used to live in the deleted caption bar.
  const legendTotals = useMemo(() => {
    const totals: Partial<Record<FacetId, number>> = {}
    for (const f of layers) {
      totals[f] = regionData.reduce((s, d) => s + (d.byFacet[f] ?? 0), 0)
    }
    return totals
  }, [layers, regionData])

  // Hover tooltip data (spec E1): only while a region is actually hovered/
  // focused (not merely selected) — `active` is `onHover`'s state, distinct
  // from the click-driven `selected`. Composition line lists each active
  // facet with a nonzero count for that region, count desc, e.g.
  // "6 case studies · 2 lived experiences" — mirrors the pin popover's and
  // panel's own composition ordering.
  const hoverDatum = useMemo(
    () => (active ? regionData.find((d) => d.code === active) : null),
    [active, regionData]
  )
  const hoverComposition = useMemo(() => {
    if (!hoverDatum) return ''
    return layers
      .map((f) => [f, hoverDatum.byFacet[f] ?? 0] as const)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([f, count]) => `${count} ${labelForFacet(f)}`)
      .join(' · ')
  }, [hoverDatum, layers, labelForFacet])

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
  // content facet) is active — with multiple, per-layer chips replace it. The
  // same gate controls the drill-in's "Open in {label} →" deep link (spec R3).
  const singleCardFacet: FacetId | null =
    pinFacets.length === 1 && layers.length === 1 ? pinFacets[0] : null
  // Multi-layer card strip (spec E1 point 4): when >1 CARD_FACET is active,
  // the drill-in still shows cards — grouped by type — instead of falling
  // back to count-only chips. Comma-joined to match region-items' `facet=`
  // multi-value support.
  const cardFacetsQS = pinFacets.length > 0 ? pinFacets.join(',') : null

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
          {tAtlas('show')}
        </span>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 snap-x [&>*]:snap-start [&>*]:flex-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
          {FACETS.map((f) => {
            const isActive = layerSet.has(f.id)
            const isLastActive = isActive && layerSet.size === 1
            return (
              <FilterChip
                key={f.id}
                label={
                  facetTotals[f.id] !== undefined ? `${t(f.labelKey)} · ${facetTotals[f.id]}` : t(f.labelKey)
                }
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
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 snap-x [&>*]:snap-start [&>*]:flex-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
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

      {/* Region facet — a chip row mirroring map selection, so region is
          filterable without hunting on the map (and works on touch/screen
          readers). Single-select, driven by the same `region` URL param as
          the map's onSelect. Hidden in locked/embed mode (that variant is
          already region-scoped, so a region switcher would be contradictory). */}
      {!lockedRegion && (
        <div className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {tAtlas('region')}
          </span>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 snap-x [&>*]:snap-start [&>*]:flex-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
            <FilterChip
              label={tAtlas('allRegions')}
              active={!selected}
              onClick={() => setParams({ region: null })}
            />
            {REGION_CODES.map((code) => (
              <FilterChip
                key={code}
                label={labelFor(code)}
                active={selected === code}
                onClick={() => setParams({ region: selected === code ? null : code })}
              />
            ))}
          </div>
        </div>
      )}

      {/* When facet — coarse date buckets (single-select). Applies to dated
          content only; member counts are unaffected (they have no publish
          date). Rides in the URL like the other facets so it's shareable. */}
      <div className="space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {tAtlas('when')}
        </span>
        <div className="flex flex-wrap gap-2">
          {WHEN_BUCKETS.map((bucket) => (
            <FilterChip
              key={bucket}
              label={tAtlas(`when_${bucket}`)}
              active={when === bucket}
              onClick={() => setParams({ when: when === bucket ? null : bucket })}
            />
          ))}
        </div>
      </div>

      {/* Map — full-width (spec E1 drops the stats panel from this column;
          legend chips below narrate the result set instead). */}
      <div className="relative min-w-0">
        {/* Hover tooltip (spec E1): a fixed-position strip pinned to the top
            of the map container rather than tracking the cursor — avoids
            jank and has no meaningful touch equivalent (a tap selects the
            region instead, so `hoverDatum` never becomes non-null from a
            touch interaction — `onHover` is only wired to mouse/focus
            events in RegionChoropleth). The `pointer:coarse` class is
            defense-in-depth for hybrid devices (e.g. touch + mouse). */}
        {hoverDatum && (
          <div
            className="pointer-coarse:hidden pointer-events-none absolute inset-x-3 top-3 z-10 rounded-lg border bg-card/95 px-3 py-2 shadow-md backdrop-blur-sm"
            role="status"
          >
            <p className="truncate text-sm font-bold text-ccm-midnight">
              <bdi>{labelFor(hoverDatum.code)}</bdi> · {hoverDatum.value}
            </p>
            {hoverComposition && (
              <p className="truncate text-xs text-muted-foreground">{hoverComposition}</p>
            )}
          </div>
        )}
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
            {/* Popover groups by type (spec R2b point 4): a header row per
                type (dot + localized label + count), types ordered by count
                desc, so a mixed cluster reads like a mini-legend before its
                items. */}
            <div className="space-y-2">
              {groupClusterItems(openCluster).map((group) => (
                <div key={group.type}>
                  <div className="mb-0.5 flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: COLOR.layer[layerColorKeyForFacet(group.facetId)] }}
                    />
                    <span className="text-xs font-semibold text-ccm-midnight">
                      {t(group.labelKey)} · {group.count}
                    </span>
                  </div>
                  {group.items.length > 0 && (
                    <ul className="space-y-1 ps-3.5">
                      {group.items.map((item) => (
                        <li key={item.id} className="truncate text-sm">
                          <bdi className="truncate">{item.title}</bdi>
                        </li>
                      ))}
                      {group.items.length < group.count && (
                        <li className="text-xs text-muted-foreground">
                          +{group.count - group.items.length}
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Legend/result chips (spec R2b point 1) — one per active layer: dot +
          localized label + its total count, replacing the deleted caption
          bar's "live result summary" job. Clicking a chip when >1 layer is
          active behaves like toggling that layer off (kept consistent with
          the switcher above); with exactly one layer active the chip is
          purely informational (toggling it off would violate "at least one
          layer stays selected", same as the switcher's disabled state). */}
      <div className="flex flex-wrap gap-2">
        {activeFacetDefs.map((f) => {
          const isOnlyLayer = layerSet.size === 1
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => toggleLayer(f.id)}
              disabled={isOnlyLayer}
              aria-disabled={isOnlyLayer || undefined}
              title={isOnlyLayer ? tAtlas('lastLayer') : undefined}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm font-medium text-ccm-midnight shadow-sm transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isOnlyLayer ? 'cursor-not-allowed opacity-80' : 'hover:border-[var(--color-ccm-sea)]/40 hover:bg-muted'
              )}
            >
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: COLOR.layer[layerColorKeyForFacet(f.id)] }}
              />
              <span>{t(f.labelKey)}</span>
              <span className="font-semibold text-[var(--color-ccm-sea)]">{legendTotals[f.id] ?? 0}</span>
            </button>
          )
        })}
      </div>

      {/* Country breakdown (locked/embed mode only, spec A4) — country names
          are resolved server-side by the pins route, so no i18n-iso-countries
          import lands in this client bundle. */}
      {showBreakdown && lockedRegion && pinsData && 'countries' in pinsData && pinsData.countries?.length ? (
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

      {/* Selected-region drill-in — the map + card strip below it are now the
          engagement core (spec E1; the stats panel is gone). Single active
          layer: cards + "explore" deep link, plus an "Open in {label} →" deep
          link in the header (only when exactly one card-facet is active,
          spec R3). Multiple active layers: cards grouped by type (spec E1
          point 4) when any are pin-capable, PLUS each layer's own count chip
          linking to its listing (spec R2) — summed totals live in the legend
          chips above. */}
      {selected && selectedDatum && (
        <section className="rounded-2xl border bg-ccm-sky/10 p-6">
          <SectionHeader
            title={labelFor(selected)}
            subtitle={`${selectedDatum.value} · ${facetLabel}`}
            action={
              singleCardFacet && destinationHref
                ? { label: `${tAtlas('openIn', { label: facetLabel })} →`, href: destinationHref }
                : undefined
            }
          />
          <div className="mt-4 space-y-4">
            {singleFacet && destinationHref ? (
              selectedDatum.value > 0 ? (
                <>
                  {singleCardFacet && <RegionContentCards region={selected} facet={singleCardFacet} theme={theme} q={q} when={when} />}
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
              <>
                {cardFacetsQS && <RegionContentCards region={selected} facet={cardFacetsQS} theme={theme} q={q} when={when} />}
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
              </>
            )}
          </div>
        </section>
      )}

      {/* No-selection invitation (spec E1) — replaces the old stats-panel
          emptiness with a hint + the most recent geotagged items across every
          region, so the atlas always has something to look at. Suppressed in
          locked/embed mode (that variant is always region-scoped) and once a
          region is actually selected. */}
      {!lockedRegion && !selected && (
        <section className="space-y-4">
          <p className="text-sm text-muted-foreground">{tAtlas('tapHint')}</p>
          <div>
            <h2 className="mb-3 font-heading text-lg font-semibold text-ccm-midnight">
              {tAtlas('latestEverywhere')}
            </h2>
            <RecentEverywhereCards limit={6} />
          </div>
        </section>
      )}
    </div>
  )
}

export default AtlasExplorer
