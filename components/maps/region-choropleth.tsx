'use client'
import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'

import { cn } from '@/lib/utils'
import geometry from './region-geometry.json'
import type { RegionDatum } from '@/lib/maps/region-facets'
import type { RegionCode } from '@/lib/maps/region-codes'
import { layerColorKeyFor, donutSegments, type PinCluster } from '@/lib/maps/cluster-pins'
import { COLOR, CCM } from '@/lib/ccm-colors'

/** `DonutSegment.type` → its stroke colour: known content types resolve through
 *  `COLOR.layer` (same swatch as the popover/legend); the synthetic "other"
 *  bucket (>3rd type, folded together) renders in neutral slate. */
const donutSegmentColor = (type: Parameters<typeof layerColorKeyFor>[0] | 'other') =>
  type === 'other' ? CCM.slate : COLOR.layer[layerColorKeyFor(type)]

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
  const t = useTranslations('common')
  const byCode = new Map(data.map((d) => [d.code, d]))
  const regions = geometry.regions as Record<string, { d: string }>

  // Pane-free region selection (Gate-2 §atlas): the map itself names regions —
  // hovering/focusing a region floats a name+count pill above it. Positioned
  // from the live path bbox so it tracks the fluid SVG scale.
  const pathRefs = useRef<Partial<Record<RegionCode, SVGPathElement | null>>>({})
  const [hoverLabel, setHoverLabel] = useState<{ code: RegionCode; x: number; y: number } | null>(null)
  const showLabel = (code: RegionCode) => {
    const el = pathRefs.current[code]
    if (!el) return
    const b = el.getBBox()
    setHoverLabel({ code, x: b.x + b.width / 2, y: Math.max(b.y - 6, 14) })
  }

  // Shade from a light sky tint (low) toward full sea (high). Keep a visible
  // floor so a zero-count region still reads as land, not background.
  const fillFor = (intensity: number) => {
    const pct = Math.round((0.12 + intensity * 0.88) * 100)
    return `color-mix(in srgb, var(--color-ccm-sea) ${pct}%, white)`
  }

  // Pins v2 (Gate-2 §atlas): every cluster is a WHITE core with the count in
  // midnight, ringed by layer-coloured segments with rounded caps and small
  // gaps; a soft same-hue halo blooms on hover/focus. Single items render as
  // a droplet in their layer colour. Amber stays reserved for selection.
  const dominantColor = (cluster: PinCluster) => COLOR.layer[layerColorKeyFor(cluster.types[0])]
  // Sized in viewBox units (960×500) so pins render ~40px at typical map
  // widths — prominent, per the approved mock.
  const DONUT_R = 16
  const DONUT_STROKE = 5
  const CORE_R = DONUT_R - DONUT_STROKE / 2 - 1
  const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_R
  const SEGMENT_GAP = DONUT_CIRCUMFERENCE * 0.045

  return (
    <svg
      viewBox={geometry.viewBox}
      className={cn('h-auto w-full select-none overflow-visible', className)}
      role="img"
      aria-label={t('regionalMap')}
    >
      {Object.entries(regions).map(([code, { d }]) => {
        const datum = byCode.get(code as RegionCode)
        const intensity = datum?.intensity ?? 0
        const isActive = activeCode === code
        return (
          <path
            key={code}
            ref={(el) => { pathRefs.current[code as RegionCode] = el }}
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
            onMouseEnter={() => { onHover?.(code as RegionCode); showLabel(code as RegionCode) }}
            onMouseLeave={() => { onHover?.(null); setHoverLabel(null) }}
            onFocus={() => { onHover?.(code as RegionCode); showLabel(code as RegionCode) }}
            onBlur={() => { onHover?.(null); setHoverLabel(null) }}
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
      {pins?.map((c, i) => {
        const isCluster = c.count > 1
        const segments = isCluster ? donutSegments(c.typeCounts, DONUT_CIRCUMFERENCE, SEGMENT_GAP) : []
        const color = dominantColor(c)
        return (
          <g
            key={`${c.x}-${c.y}-${i}`}
            role="button"
            tabIndex={0}
            aria-label={isCluster ? `${c.count} — ${c.items[0]?.title ?? ''}` : c.items[0]?.title ?? ''}
            className="group/pin cursor-pointer outline-none"
            onClick={(e) => { e.stopPropagation(); onPinClick?.(c) }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPinClick?.(c) }
            }}
          >
            {isCluster ? (
              <>
                {/* Same-hue halo blooms on hover/focus. */}
                <circle cx={c.x} cy={c.y} r={DONUT_R + 5} fill={color}
                  className="opacity-0 transition-opacity duration-200 group-hover/pin:opacity-15 group-focus-visible/pin:opacity-15 motion-reduce:transition-none" />
                {/* White core carries the count in midnight — legible on any
                    map shade beneath. */}
                <circle cx={c.x} cy={c.y} r={CORE_R} fill="white"
                  className="drop-shadow-[0_1.5px_3px_rgba(11,49,96,0.3)]" />
                {/* Rounded-cap segments with breathing gaps — the ring IS the
                    legend (exact layer colours). */}
                {segments.map((seg, si) => (
                  <circle
                    key={`${seg.type}-${si}`}
                    cx={c.x} cy={c.y} r={DONUT_R}
                    fill="none"
                    stroke={donutSegmentColor(seg.type)}
                    strokeWidth={DONUT_STROKE}
                    strokeLinecap="round"
                    strokeDasharray={seg.dashArray}
                    strokeDashoffset={seg.dashOffset}
                    transform={`rotate(-90 ${c.x} ${c.y})`}
                  />
                ))}
                <text x={c.x} y={c.y + 4.5} textAnchor="middle"
                  className="pointer-events-none font-heading text-[13px] font-bold tabular-nums"
                  fill={CCM.midnight}>
                  {c.count}
                </text>
              </>
            ) : (
              <>
                {/* Single item: droplet in its layer colour, tip on the exact
                    location, white inner dot. */}
                <circle cx={c.x} cy={c.y - 13} r={15} fill={color}
                  className="opacity-0 transition-opacity duration-200 group-hover/pin:opacity-15 group-focus-visible/pin:opacity-15 motion-reduce:transition-none" />
                <path
                  d="M0 0C0 0 6.5 -6 6.5 -10.5A6.5 6.5 0 1 0 -6.5 -10.5C-6.5 -6 0 0 0 0Z"
                  transform={`translate(${c.x} ${c.y}) scale(1.6)`}
                  fill={color}
                  stroke="white"
                  strokeWidth={1}
                  className="drop-shadow-[0_1.5px_3px_rgba(11,49,96,0.3)]"
                />
                <circle cx={c.x} cy={c.y - 16.8} r={3.6} fill="white" />
              </>
            )}
          </g>
        )
      })}
      {/* Floating region name+count pill (pane-free selection). */}
      {hoverLabel && (() => {
        const datum = byCode.get(hoverLabel.code)
        const text = `${labelFor(hoverLabel.code)} · ${datum?.value ?? 0}`
        const w = text.length * 6.8 + 22
        return (
          <g className="pointer-events-none" aria-hidden>
            <rect x={hoverLabel.x - w / 2} y={hoverLabel.y - 13} width={w} height={24} rx={12}
              fill="white" className="drop-shadow-[0_2px_5px_rgba(11,49,96,0.22)]" />
            <text x={hoverLabel.x} y={hoverLabel.y + 4} textAnchor="middle"
              className="font-heading text-[11.5px] font-bold" fill={CCM.midnight}>
              {text}
            </text>
          </g>
        )
      })()}
    </svg>
  )
}
