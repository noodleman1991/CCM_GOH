'use client'

import { cn } from '@/lib/utils'
import geometry from './region-geometry.json'
import type { RegionDatum } from '@/lib/maps/region-facets'
import type { RegionCode } from '@/lib/maps/region-codes'
import type { PinCluster } from '@/lib/maps/cluster-pins'

/**
 * Presentational choropleth: renders the 7 region paths from the build-time
 * geometry, shaded by each datum's `intensity` using the CCM palette (white →
 * sea). Data-agnostic — the parent supplies data + labels + handlers. Mobile-
 * first: the SVG scales fluidly to its container and regions are large tap
 * targets. Geometry orientation is fixed (no RTL flip); interaction labels are
 * locale-driven by the parent.
 */
export function RegionChoropleth({
  data,
  activeCode,
  onHover,
  onSelect,
  labelFor,
  className,
  pins,
  onPinClick,
}: {
  data: RegionDatum[]
  activeCode?: RegionCode | null
  onHover?: (code: RegionCode | null) => void
  onSelect?: (code: RegionCode) => void
  labelFor: (code: RegionCode) => string
  className?: string
  pins?: PinCluster[]
  onPinClick?: (cluster: PinCluster) => void
}) {
  const byCode = new Map(data.map((d) => [d.code, d]))
  const regions = geometry.regions as Record<string, { d: string }>

  // Shade from a light sky tint (low) toward full sea (high). Keep a visible
  // floor so a zero-count region still reads as land, not background.
  const fillFor = (intensity: number) => {
    const pct = Math.round((0.12 + intensity * 0.88) * 100)
    return `color-mix(in srgb, var(--color-ccm-sea) ${pct}%, white)`
  }

  return (
    <svg
      viewBox={geometry.viewBox}
      className={cn('h-auto w-full select-none overflow-visible', className)}
      role="img"
      aria-label="Regional map"
    >
      {Object.entries(regions).map(([code, { d }]) => {
        const datum = byCode.get(code as RegionCode)
        const intensity = datum?.intensity ?? 0
        const isActive = activeCode === code
        return (
          <path
            key={code}
            d={d}
            tabIndex={0}
            role="button"
            aria-label={`${labelFor(code as RegionCode)}: ${datum?.value ?? 0}`}
            fill={fillFor(intensity)}
            stroke="white"
            strokeWidth={isActive ? 1.75 : 0.75}
            strokeLinejoin="round"
            className={cn(
              'cursor-pointer outline-none transition-[fill,opacity,stroke-width] duration-200',
              'hover:opacity-90 focus-visible:opacity-90',
              activeCode && !isActive && 'opacity-60'
            )}
            onMouseEnter={() => onHover?.(code as RegionCode)}
            onMouseLeave={() => onHover?.(null)}
            onFocus={() => onHover?.(code as RegionCode)}
            onBlur={() => onHover?.(null)}
            onClick={() => onSelect?.(code as RegionCode)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect?.(code as RegionCode)
              }
            }}
          />
        )
      })}
      {pins?.map((c, i) => (
        <g
          key={`${c.x}-${c.y}-${i}`}
          role="button"
          tabIndex={0}
          aria-label={`${c.count} ${c.items[0]?.title ?? ''}`}
          className="cursor-pointer outline-none"
          onClick={(e) => { e.stopPropagation(); onPinClick?.(c) }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPinClick?.(c) }
          }}
        >
          <circle cx={c.x} cy={c.y} r={c.count > 1 ? 11 : 7}
            fill="var(--color-ccm-amber)" stroke="white" strokeWidth={2} />
          {c.count > 1 && (
            <text x={c.x} y={c.y + 3.5} textAnchor="middle"
              className="fill-white font-heading text-[10px] font-bold">
              {c.count}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}
