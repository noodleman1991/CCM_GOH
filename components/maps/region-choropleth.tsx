'use client'
import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'

import { cn } from '@/lib/utils'
import geometry from './region-geometry-soft.json'
import { OceanBands } from './ocean-bands'
import type { RegionDatum } from '@/lib/maps/region-facets'
import type { RegionCode } from '@/lib/maps/region-codes'
import { regionCrop } from '@/lib/maps/region-crop'
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
  selectedCode,
  onHover,
  onSelect,
  labelFor,
  className,
  pins,
  onPinClick,
  focus,
}: {
  data: RegionDatum[]
  activeCode?: RegionCode | null
  /** The COMMITTED selection (URL region) — painted artwork gold on a white
   *  halo while the other regions dim (mock v6 §3). `activeCode` stays the
   *  transient hover/focus state. */
  selectedCode?: RegionCode | null
  onHover?: (code: RegionCode | null) => void
  onSelect?: (code: RegionCode) => void
  labelFor: (code: RegionCode) => string
  className?: string
  pins?: PinCluster[]
  onPinClick?: (cluster: PinCluster) => void
  /** Focus-clipping mode (community-page embeds): crop the viewport to this
   *  region and scale glyphs so they keep their on-screen size. Unknown code
   *  → null crop → full-world rendering (identical to omitting the prop). */
  focus?: RegionCode | null
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
    setHoverLabel({ code, x: b.x + b.width / 2, y: Math.max(b.y - 6 * s, 14 * s) })
  }

  // Illustration ramp (mock v6 §3): flat sky → water tints over the midnight
  // ocean. 12% floor keeps a zero-count region reading as land; the ceiling
  // stays LOW (48%) so even the busiest region still reads as sky-family LAND
  // against the water-coloured inner band — without outlines (artwork = flat
  // fills only), land/ocean separation is carried entirely by this contrast.
  // Hover lifts the whole region to full sky.
  const fillFor = (intensity: number) => {
    const pct = Math.round((0.12 + intensity * 0.36) * 100)
    return `color-mix(in srgb, var(--color-ccm-water) ${pct}%, var(--color-ccm-sky))`
  }

  // Pins v2 (Gate-2 §atlas): every cluster is a WHITE core with the count in
  // midnight, ringed by layer-coloured segments with rounded caps and small
  // gaps; a soft same-hue halo blooms on hover/focus. Single items render as
  // a droplet in their layer colour. Amber stays reserved for selection.
  const dominantColor = (cluster: PinCluster) => COLOR.layer[layerColorKeyFor(cluster.types[0])]
  // Sized in viewBox units (960×500) so pins render ~40px at typical map
  // widths — prominent, per the approved mock.
  const crop = focus ? regionCrop(focus) : null
  // Glyphs are authored in viewBox units against the 960-wide world; under a
  // crop the same units render crop-factor× larger, so every authored size is
  // multiplied by `s` to hold its on-screen size.
  const s = crop ? crop.w / 960 : 1
  const DONUT_R = 16 * s
  const DONUT_STROKE = 5 * s
  const CORE_R = DONUT_R - DONUT_STROKE / 2 - 1 * s
  const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_R
  const SEGMENT_GAP = DONUT_CIRCUMFERENCE * 0.045

  return (
    <svg
      viewBox={crop ? `${crop.x} ${crop.y} ${crop.w} ${crop.h}` : geometry.viewBox}
      className={cn('h-auto w-full select-none overflow-hidden rounded-2xl', className)}
      role="img"
      aria-label={t('regionalMap')}
    >
      <OceanBands />
      {Object.entries(regions).map(([code, { d }]) => {
        const datum = byCode.get(code as RegionCode)
        const intensity = datum?.intensity ?? 0
        const isActive = activeCode === code
        const isSelected = selectedCode === code
        return (
          <path
            key={code}
            ref={(el) => { pathRefs.current[code as RegionCode] = el }}
            d={d}
            tabIndex={0}
            role="button"
            aria-label={`${labelFor(code as RegionCode)}: ${datum?.value ?? 0}`}
            // Hover/focus is UNMISSABLE: the region jumps to a bright
            // secondary-leaning cyan (clearly outside the resting sky→water
            // ramp) with a soft white glow. The committed selection is
            // painted by the gold overlay below, so its base path just stays
            // put underneath. No strokes at all (the earlier dotted borders
            // are gone): the artwork is flat fills only.
            fill={
              isActive && !isSelected
                ? 'color-mix(in srgb, var(--color-ccm-secondary) 45%, var(--color-ccm-sky))'
                : fillFor(intensity)
            }
            className={cn(
              'cursor-pointer outline-none transition-[fill,opacity] duration-200 motion-reduce:transition-none',
              isActive && !isSelected && 'drop-shadow-[0_0_10px_rgba(255,255,255,0.45)]',
              selectedCode && !isSelected && 'opacity-55'
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
      {/* Committed selection: artwork gold on a thick white rounded halo
          (mock v6 §3). Pointer-events off — the base path underneath keeps
          handling interaction, so keyboard/AT behaviour is unchanged. */}
      {selectedCode && regions[selectedCode] && (
        <g className="pointer-events-none animate-in fade-in duration-300 motion-reduce:animate-none" aria-hidden="true">
          <path
            d={regions[selectedCode].d}
            fill="white"
            stroke="white"
            strokeWidth={14 * s}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path d={regions[selectedCode].d} fill={CCM.gold} />
        </g>
      )}
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
                <circle cx={c.x} cy={c.y} r={DONUT_R + 5 * s} fill={color}
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
                <text x={c.x} y={c.y + 4.5 * s} textAnchor="middle"
                  fontSize={13 * s}
                  className="pointer-events-none font-heading font-bold tabular-nums"
                  fill={CCM.midnight}>
                  {c.count}
                </text>
              </>
            ) : (
              <>
                {/* Single item: droplet in its layer colour, tip on the exact
                    location, white inner dot. */}
                <circle cx={c.x} cy={c.y - 13 * s} r={15 * s} fill={color}
                  className="opacity-0 transition-opacity duration-200 group-hover/pin:opacity-15 group-focus-visible/pin:opacity-15 motion-reduce:transition-none" />
                <path
                  d="M0 0C0 0 6.5 -6 6.5 -10.5A6.5 6.5 0 1 0 -6.5 -10.5C-6.5 -6 0 0 0 0Z"
                  transform={`translate(${c.x} ${c.y}) scale(${1.6 * s})`}
                  fill={color}
                  stroke="white"
                  strokeWidth={1.5 * s}
                  className="drop-shadow-[0_1.5px_3px_rgba(11,49,96,0.3)]"
                />
                <circle cx={c.x} cy={c.y - 16.8 * s} r={3.6 * s} fill="white" />
              </>
            )}
          </g>
        )
      })}
      {/* Floating region name+count pill (pane-free selection) — sized UP so
          the hover response reads instantly, count in sea for contrast. */}
      {hoverLabel && (() => {
        const datum = byCode.get(hoverLabel.code)
        const name = labelFor(hoverLabel.code)
        const text = `${name} · ${datum?.value ?? 0}`
        const w = (text.length * 7.6 + 30) * s
        return (
          <g className="pointer-events-none" aria-hidden>
            <rect x={hoverLabel.x - w / 2} y={hoverLabel.y - 15 * s} width={w} height={30 * s} rx={15 * s}
              fill="white" className="drop-shadow-[0_3px_8px_rgba(11,49,96,0.3)]" />
            <text x={hoverLabel.x} y={hoverLabel.y + 4.5 * s} textAnchor="middle"
              fontSize={13 * s}
              className="font-heading font-bold" fill={CCM.midnight}>
              {name} <tspan fill={CCM.sea}>· {datum?.value ?? 0}</tspan>
            </text>
          </g>
        )
      })()}
    </svg>
  )
}
