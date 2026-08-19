'use client'

import { cn } from '@/lib/utils'
import { layerColorKeyForFacet, type FacetId, type RegionDatum } from '@/lib/maps/region-facets'
import type { RegionCode } from '@/lib/maps/region-codes'
import { COLOR } from '@/lib/ccm-colors'

/** The panel works against either the plain single-facet `RegionDatum` (the
 *  page-builder's `RegionMapBlock`, one facet at a time — no composition to
 *  show) or the Atlas's multi-layer `RegionDatumWithBreakdown` (`byFacet`
 *  present) — the composition bar only renders when `byFacet` is there. */
type PanelDatum = RegionDatum & { byFacet?: Partial<Record<FacetId, number>> }

/**
 * Per-region composition bar: a thin stacked segment strip proportional to
 * that region's `byFacet` shares, in each facet's `COLOR.layer` colour. With
 * only one active facet this degenerates harmlessly to a single-colour bar —
 * still useful as a relative-magnitude cue against the ranked list. An
 * sr-only sentence carries the same information as text, since colour is
 * never the only signal (a11y).
 */
function CompositionBar({
  byFacet,
  activeFacets,
  srSentence,
}: {
  byFacet: Partial<Record<FacetId, number>>
  activeFacets: FacetId[]
  srSentence: string
}) {
  const total = activeFacets.reduce((s, f) => s + (byFacet[f] ?? 0), 0)
  if (total <= 0) return null
  return (
    <div className="mt-1.5">
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
        {activeFacets.map((f) => {
          const value = byFacet[f] ?? 0
          if (value <= 0) return null
          return (
            <span
              key={f}
              style={{ width: `${(value / total) * 100}%`, backgroundColor: COLOR.layer[layerColorKeyForFacet(f)] }}
            />
          )
        })}
      </div>
      <span className="sr-only">{srSentence}</span>
    </div>
  )
}

/**
 * The panel beside (desktop) / below (mobile) the map. Shows the active region's
 * label + value, or a ranked list when nothing is hovered/focused. Uses logical
 * props so it mirrors correctly in RTL. Each row also renders a composition bar
 * (spec R2b) reading the region's `byFacet` breakdown across active layers.
 */
export function RegionDataPanel({
  data,
  activeCode,
  facetLabel,
  labelFor,
  labelForFacet,
  activeFacets,
  onSelect,
  className,
}: {
  data: PanelDatum[]
  activeCode?: RegionCode | null
  facetLabel: string
  labelFor: (code: RegionCode) => string
  /** Localized label for a single facet id (`map` namespace), used to build
   *  each row's sr-only composition sentence. Omit (with `activeFacets`) to
   *  skip the composition bar entirely — the single-facet `RegionMapBlock`
   *  has no `byFacet` breakdown to show. */
  labelForFacet?: (id: FacetId) => string
  /** Layers currently active — drives both the composition bar segments and
   *  the sr-only sentence's facet order (count desc, computed per row). */
  activeFacets?: FacetId[]
  onSelect?: (code: RegionCode) => void
  className?: string
}) {
  const ranked = [...data].sort((a, b) => b.value - a.value)
  const active = activeCode ? data.find((d) => d.code === activeCode) : null

  const srSentenceFor = (d: PanelDatum) =>
    (activeFacets ?? [])
      .map((f) => [f, d.byFacet?.[f] ?? 0] as const)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([f, count]) => `${count} ${labelForFacet?.(f) ?? f}`)
      .join(', ')

  // Plain render helper (not a component) so no component type is created
  // during render — same output, stable reconciliation.
  const renderRow = (d: PanelDatum) =>
    activeFacets && labelForFacet ? (
      <CompositionBar byFacet={d.byFacet ?? {}} activeFacets={activeFacets} srSentence={srSentenceFor(d)} />
    ) : null

  return (
    <div className={cn('rounded-xl border border-border bg-card p-4', className)}>
      <p className="text-xs font-semibold uppercase tracking-wider text-ccm-water">
        {facetLabel}
      </p>
      {active ? (
        <div className="mt-2">
          <p className="text-lg font-bold text-ccm-midnight">{labelFor(active.code)}</p>
          <p className="text-3xl font-bold text-[var(--color-ccm-sea)]">{active.value}</p>
          {renderRow(active)}
        </div>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {ranked.map((d) => (
            <li key={d.code}>
              <button
                type="button"
                onClick={() => onSelect?.(d.code)}
                className="flex w-full flex-col rounded-md px-2 py-1.5 text-start text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex w-full items-center justify-between gap-3">
                  <span className="truncate text-foreground/80">{labelFor(d.code)}</span>
                  <span className="shrink-0 font-semibold text-ccm-midnight">{d.value}</span>
                </span>
                {renderRow(d)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
