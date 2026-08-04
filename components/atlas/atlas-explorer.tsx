'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import { useTranslations, useLocale } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { FilterChip } from '@/components/ui/filter-chip'
import { FilterRow, FilterRowGroup } from '@/components/atlas/atlas-filters'
import { Input } from '@/components/ui/input'
import { RegionChoropleth } from '@/components/maps/region-choropleth'
import { RecentEverywhereCards, RegionHighlightsCards } from '@/components/atlas/region-content-cards'
import { RegionSpotlight } from '@/components/atlas/region-spotlight'
import { RegionLocator } from '@/components/atlas/region-locator'
import { regionCrop } from '@/lib/maps/region-crop'
import type { RegionArt } from '@/lib/maps/region-art'
import {
  FACETS, atlasDestination, parseLayers, facetForContentType, layerColorKeyForFacet,
  type FacetId, type RegionDatumWithBreakdown, type ThemeOption,
} from '@/lib/maps/region-facets'
import type { PinCluster, PinItem } from '@/lib/maps/cluster-pins'
import { parseWhen, type WhenBucket } from '@/lib/maps/date-filter'
import { REGION_I18N_KEY, REGION_TO_RC_SLUG, isRegionCode, type RegionCode } from '@/lib/maps/region-codes'
import { useRouter, usePathname } from '@/i18n/navigation'
import { COLOR } from '@/lib/ccm-colors'
import { cn } from '@/lib/utils'
import { Search, X } from 'lucide-react'

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
  recentVariant = 'everywhere',
  showHeader = true,
  regionArt,
  showBreakdown = true,
}: {
  lockedRegion?: RegionCode
  themes: ThemeOption[]
  /** Regional-spotlight banner art per region (server-fetched community
   *  welcome-hero images) — regions absent from the map use the gradient +
   *  silhouette fallback. */
  regionArt?: Partial<Record<RegionCode, RegionArt>>
  /** Show the locked-mode country breakdown list (spec A4). Default true;
   *  an embed can opt out when it wants the map without that list. */
  showBreakdown?: boolean
  /** No-selection card strip variant. `everywhere` (default, /atlas) = the
   *  newest geotagged items across all regions; `highlights` (homepage embed)
   *  = one newest item PER region — breadth instead of the recency the
   *  homepage's fresh-content block already provides; `none` hides the strip. */
  recentVariant?: 'everywhere' | 'highlights' | 'none'
  /** Show the explorer's own "Atlas" h1 + intro. Embeds whose CMS block
   *  already renders a title (homepage "Explore by region") turn this off so
   *  the page doesn't stack two headings over one map. */
  showHeader?: boolean
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

  // Selecting a region reveals its spotlight DIRECTLY under the map — scroll
  // it into view (minimally, so the map stays on screen) so the connection
  // between the click and the panel is unmistakable. Skipped in locked mode
  // (the region never changes there) and on the initial deep-link render.
  const spotlightRef = useRef<HTMLDivElement | null>(null)
  const prevSelectedRef = useRef<RegionCode | null>(selected)
  useEffect(() => {
    if (!lockedRegion && selected && selected !== prevSelectedRef.current) {
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      spotlightRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' })
    }
    prevSelectedRef.current = selected
  }, [selected, lockedRegion])

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
    // With a region in view (locked embed OR /atlas selection), every chip
    // count scopes to THAT region — a global sum reads as a promise ("News 1")
    // that toggling the chip then breaks when the region has none (bug report
    // 2026-08-04). No region in view → global sums, as before.
    const source = effectiveRegion
      ? (totalsData?.data ?? []).filter((d) => d.code === effectiveRegion)
      : totalsData?.data ?? []
    for (const datum of source) {
      for (const [facetId, count] of Object.entries(datum.byFacet ?? {})) {
        totals[facetId as FacetId] = (totals[facetId as FacetId] ?? 0) + (count ?? 0)
      }
    }
    return totals
  }, [totalsData, effectiveRegion])

  // Pins only exist for content facets (member counts have no geo data); if
  // none of the active layers are pin-capable, skip the pins fetch entirely.
  // No region selected → `region=all`: the global view drops every region's
  // geotagged clusters on the map (the mock always showed pins — a pin-less
  // world map read as an empty atlas).
  const pinFacets = layers.filter((l) => CARD_FACETS.has(l))
  const pinsKey = pinFacets.length > 0
    ? `/api/maps/region-pins?region=${effectiveRegion ?? 'all'}&facets=${pinFacets.join(',')}${theme ? `&theme=${theme}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}${whenQS}`
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

  // Legend/result chips (spec R2b): one per ACTIVE layer, with its total count
  // summed across all regions from `byFacet` — this doubles as the live result
  // summary that used to live in the deleted caption bar.
  const legendTotals = useMemo(() => {
    const totals: Partial<Record<FacetId, number>> = {}
    // Same region-scoping as facetTotals: with a region in view the legend
    // must describe that region, not the world.
    const source = effectiveRegion ? regionData.filter((d) => d.code === effectiveRegion) : regionData
    for (const f of layers) {
      totals[f] = source.reduce((s, d) => s + (d.byFacet[f] ?? 0), 0)
    }
    return totals
  }, [layers, regionData, effectiveRegion])

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
      {!lockedRegion && showHeader && (
        <div>
          <h1 className="font-heading text-3xl font-bold text-balance text-ccm-midnight lg:text-4xl">
            {tAtlas('title')}
          </h1>
          <p className="mt-2 max-w-2xl text-lg text-muted-foreground">{tAtlas('description')}</p>
        </div>
      )}

      {/* Locked embeds (community pages): filters and the demoted map share a
          two-column row at lg — the map stays (pins + locator) but no longer
          dominates the section, and results follow immediately below.
          Unlocked keeps the classic full-width stack. */}
      <div className={cn(lockedRegion ? 'grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,44%)] lg:items-start' : 'space-y-8')}>
      <div className={cn(lockedRegion ? 'space-y-4' : 'space-y-8')}>
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

      {/* Labelled filter rows (punch-list revision of §filter-bar): Show ·
          Theme · When each get their OWN row with an aligned label column —
          one cramped bar wrapped badly on mobile. The region chip row is
          still GONE — the map itself carries region selection (paths are
          focusable buttons with name+count hover/focus labels), which stays
          the keyboard/screen-reader path. Region still rides the same
          `region` URL param, so deep links keep working. */}
      <FilterRowGroup>
        <FilterRow label={tAtlas('show')}>
          {FACETS.map((f) => {
            const isActive = layerSet.has(f.id)
            const isLastActive = isActive && layerSet.size === 1
            return (
              <FilterChip
                key={f.id}
                label={t(f.labelKey)}
                count={facetTotals[f.id]}
                active={isActive}
                disabled={isLastActive}
                title={isLastActive ? tAtlas('lastLayer') : undefined}
                onClick={() => toggleLayer(f.id)}
              />
            )
          })}
        </FilterRow>
        {themes.length > 0 && (
          <FilterRow label={tAtlas('theme')}>
            {themes.map((th) => (
              <FilterChip
                key={th.slug}
                label={labelForTheme(th)}
                active={theme === th.slug}
                onClick={() => setParams({ theme: theme === th.slug ? null : th.slug })}
              />
            ))}
          </FilterRow>
        )}
        <FilterRow label={tAtlas('when')}>
          {WHEN_BUCKETS.map((bucket) => (
            <FilterChip
              key={bucket}
              label={tAtlas(`when_${bucket}`)}
              active={when === bucket}
              onClick={() => setParams({ when: when === bucket ? null : bucket })}
            />
          ))}
        </FilterRow>
      </FilterRowGroup>
      </div>

      {/* Map — full-width when unlocked; the 44% column when locked (see the
          wrapper above). The old top hover strip is GONE (the floating
          name+count pill ON the map is the hover affordance now); the legend
          chips overlay the map's bottom-start corner so map + legend read as
          one unit and the spotlight can sit directly beneath the map. */}
      <div className="relative min-w-0">
        <RegionChoropleth
          data={regionData}
          activeCode={active}
          selectedCode={effectiveRegion ?? null}
          onHover={setActive}
          onSelect={onSelect}
          labelFor={labelFor}
          pins={pinsData?.pins}
          onPinClick={setOpenCluster}
          focus={lockedRegion ?? null}
        />
        {/* Corner locator (spec 2026-08-03 amendment — replaces the edge
            fade): circle-clipped mini world, this region in its brand colour,
            situating the cropped clipping globally. pointer-events-none keeps
            map interaction beneath untouched; end-3 is RTL-safe. */}
        {lockedRegion && (
          <RegionLocator
            region={lockedRegion}
            label={tAtlas('locator', { region: labelFor(lockedRegion) })}
            className="pointer-events-none absolute end-3 top-3 size-14 sm:size-16"
          />
        )}
        {/* Legend/result chips (spec R2b point 1) — one per active layer:
            dot + localized label + total count. Overlaid on the map itself
            (bottom-start, map-UI convention) so the panel below the map is
            unambiguously the selected region's spotlight. Clicking a chip
            when >1 layer is active toggles that layer off; the last layer
            is informational-only ("at least one layer stays selected"). */}
        <div className="pointer-events-none absolute bottom-3 start-3 z-10 flex max-w-[75%] flex-wrap gap-1.5">
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
                  'pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ccm-midnight shadow-sm backdrop-blur-sm transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isOnlyLayer ? 'cursor-default' : 'hover:bg-white'
                )}
              >
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: COLOR.layer[layerColorKeyForFacet(f.id)] }}
                />
                <span>{t(f.labelKey)}</span>
                <span className="tabular-nums text-[var(--color-ccm-sea)]">{legendTotals[f.id] ?? 0}</span>
              </button>
            )
          })}
        </div>
        {openCluster && (() => {
          // Anchor the popover AT the clicked pin, clamped away from the map
          // edges, above or below depending on where the pin sits (user
          // 2026-08-05: "proper placing close to the edges" — the old
          // full-width bottom sheet covered half of a small locked map and
          // ignored the pin entirely). Coordinates are viewBox-relative
          // percentages, so the same math serves the crop and the full world,
          // and RTL needs no special casing (map coords never mirror).
          const vb = (lockedRegion ? regionCrop(lockedRegion) : null) ?? { x: 0, y: 0, w: 960, h: 500 }
          const px = ((openCluster.x - vb.x) / vb.w) * 100
          const py = ((openCluster.y - vb.y) / vb.h) * 100
          const clampedX = Math.min(Math.max(px, 18), 82)
          const below = py < 45
          return (
          <div
            className="absolute z-20 w-72 max-w-[85%] rounded-lg border bg-card p-3 shadow-lg"
            style={{
              left: `${clampedX}%`,
              transform: 'translateX(-50%)',
              ...(below ? { top: `${Math.min(py + 5, 92)}%` } : { bottom: `${Math.min(100 - py + 8, 92)}%` }),
            }}
          >
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
          )
        })()}
      </div>
      </div>

      {/* Regional spotlight (Slice 4, mock v6 §3): selecting a region opens
          its artwork banner + composition bar + country chips + cards + CTA
          row — the whole drill-in in one component, sitting DIRECTLY under
          the map (the legend moved onto the map) and scrolled into view on
          selection so the connection is unmissable. Locked embeds render it
          compact: the community page already carries the region's hero. */}
      {selected && selectedDatum && (
        <div
          key={selected}
          ref={spotlightRef}
          className="-mt-3 animate-in fade-in slide-in-from-top-2 duration-300 motion-reduce:animate-none"
        >
        <RegionSpotlight
          compact={Boolean(lockedRegion)}
          region={selected}
          label={labelFor(selected)}
          total={selectedDatum.value}
          byFacet={selectedDatum.byFacet}
          layers={layers}
          art={regionArt?.[selected] ?? null}
          countries={pinsData && 'countries' in pinsData ? pinsData.countries : undefined}
          showCountries={showBreakdown}
          facetLabel={facetLabel}
          destinationHref={destinationHref}
          singleFacet={Boolean(singleFacet && destinationHref)}
          singleCardFacet={singleCardFacet}
          cardFacetsQS={cardFacetsQS}
          theme={theme}
          q={q}
          when={when}
          facetLabelFor={(id) => {
            const def = FACETS.find((f) => f.id === id)
            return def ? t(def.labelKey) : id
          }}
        />
        </div>
      )}

      {/* No-selection invitation (spec E1) — replaces the old stats-panel
          emptiness with a hint + the most recent geotagged items across every
          region, so the atlas always has something to look at. Suppressed in
          locked/embed mode (that variant is always region-scoped) and once a
          region is actually selected. */}
      {!lockedRegion && !selected && (
        <section className="space-y-4">
          <p className="text-sm text-muted-foreground">{tAtlas('tapHint')}</p>
          {recentVariant !== 'none' && (
            <div>
              <h2 className="mb-3 font-heading text-lg font-semibold text-ccm-midnight">
                {recentVariant === 'highlights' ? tAtlas('aroundTheRegions') : tAtlas('latestEverywhere')}
              </h2>
              {recentVariant === 'highlights' ? <RegionHighlightsCards /> : <RecentEverywhereCards limit={6} />}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export default AtlasExplorer
