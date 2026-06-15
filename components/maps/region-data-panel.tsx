'use client'

import { cn } from '@/lib/utils'
import type { RegionDatum } from '@/lib/maps/region-facets'
import type { RegionCode } from '@/lib/maps/region-codes'

/**
 * The panel beside (desktop) / below (mobile) the map. Shows the active region's
 * label + value, or a ranked list when nothing is hovered/focused. Uses logical
 * props so it mirrors correctly in RTL.
 */
export function RegionDataPanel({
  data,
  activeCode,
  facetLabel,
  labelFor,
  onSelect,
  className,
}: {
  data: RegionDatum[]
  activeCode?: RegionCode | null
  facetLabel: string
  labelFor: (code: RegionCode) => string
  onSelect?: (code: RegionCode) => void
  className?: string
}) {
  const ranked = [...data].sort((a, b) => b.value - a.value)
  const active = activeCode ? data.find((d) => d.code === activeCode) : null

  return (
    <div className={cn('rounded-xl border border-border bg-card p-4', className)}>
      <p className="text-xs font-semibold uppercase tracking-wider text-ccm-water">
        {facetLabel}
      </p>
      {active ? (
        <div className="mt-2">
          <p className="text-lg font-bold text-ccm-midnight">{labelFor(active.code)}</p>
          <p className="text-3xl font-bold text-[var(--color-ccm-sea)]">{active.value}</p>
        </div>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {ranked.map((d) => (
            <li key={d.code}>
              <button
                type="button"
                onClick={() => onSelect?.(d.code)}
                className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-start text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="truncate text-foreground/80">{labelFor(d.code)}</span>
                <span className="shrink-0 font-semibold text-ccm-midnight">{d.value}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
