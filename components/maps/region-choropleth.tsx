'use client'
import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'

import { cn } from '@/lib/utils'
import geometry from './region-geometry-soft.json'
import { OceanBands } from './ocean-bands'
import type { RegionDatum } from '@/lib/maps/region-facets'
import type { RegionCode } from '@/lib/maps/region-codes'
import { regionCrop } from '@/lib/maps/region-crop'
import type { PinCluster } from '@/lib/maps/cluster-pins'
import { CCM } from '@/lib/ccm-colors'

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

  // Sized in viewBox units (960×500) so pins render ~40px at typical map
  // widths — prominent, per the approved mock.
  const crop = focus ? regionCrop(focus) : null
  // Under a crop, glyph sizes must be MEASURED, not derived from the zoom
  // factor alone: `crop.w / 960` assumed the cropped map renders at the same
  // pixel width as the full map, but the locked embed ALSO shrinks the map to
  // a ~44% column, so the two effects stacked and pins rendered half-size
  // (bug report 2026-08-04, spotted on the ar community page). Instead,
  // observe the svg's rendered width and scale glyphs so their on-screen size
  // matches the unlocked map's reference density (960 units across ~1120px).
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [pxPerUnit, setPxPerUnit] = useState<number | null>(null)
  useEffect(() => {
    if (!crop) return
    const el = svgRef.current
    if (!el) return
    const measure = () => {
      const w = el.clientWidth
      if (w > 0) setPxPerUnit(w / crop.w)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [crop])
  const REF_PX_PER_UNIT = 1120 / 960
  const s = crop ? (pxPerUnit ? REF_PX_PER_UNIT / pxPerUnit : crop.w / 960) : 1

  // Pane-free region selection (Gate-2 §atlas): the map itself names regions —
  // hovering/focusing a region floats a name+count pill above it. Positioned
  // from the live path bbox so it tracks the fluid SVG scale.
  const pathRefs = useRef<Partial<Record<RegionCode, SVGPathElement | null>>>({})
  const [hoverLabel, setHoverLabel] = useState<{ code: RegionCode; x: number; y: number } | null>(null)
  const showLabel = (code: RegionCode) => {
    const el = pathRefs.current[code]
    if (!el) return
    const b = el.getBBox()
    // Clamp to the ACTIVE viewport's top, not the world's — under a focus
    // crop (community-page embeds), the world top is off-screen, so a sliced
    // neighbour region's pill must clamp against the crop's own top edge or
    // it renders above the visible, overflow-hidden area.
    setHoverLabel({ code, x: b.x + b.width / 2, y: Math.max(b.y - 6 * s, (crop?.y ?? 0) + 14 * s) })
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


  return (
    <svg
      ref={svgRef}
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
                // Warm gold-tinted lift previewing selection. NOT a CSS var
                // mix: the old `--color-ccm-secondary` was never defined in
                // globals.css, so color-mix() collapsed and hover rendered
                // BLACK (user bug report 2026-08-05).
                ? `color-mix(in srgb, ${CCM.gold} 35%, var(--color-ccm-sky))`
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
      {/* Committed selection — matches the brand region artworks exactly
          (user 2026-08-05, sampled from the welcome-hero illustrations):
          flat #FFBF05 gold fill with a DASHED gold fringe just outside the
          boundary. The fringe trick: a wide dashed stroke painted UNDER the
          fill, so only its outer half shows — reading like the artwork's
          offset dashed outline. The old thick white halo is gone.
          Pointer-events off — the base path underneath keeps handling
          interaction, so keyboard/AT behaviour is unchanged. */}
      {selectedCode && regions[selectedCode] && (
        <g className="pointer-events-none animate-in fade-in duration-300 motion-reduce:animate-none" aria-hidden="true">
          <path
            d={regions[selectedCode].d}
            fill="none"
            stroke={CCM.gold}
            strokeWidth={9 * s}
            strokeDasharray={`${6 * s} ${6 * s}`}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={0.85}
          />
          <path d={regions[selectedCode].d} fill={CCM.gold} />
        </g>
      )}
      {pins?.map((c, i) => {
        const isCluster = c.count > 1
        // Pins are ARTWORK GOLD like the illustrations (user 2026-08-05) —
        // type colours moved entirely to the popover's mini-legend. White
        // stroke separates a gold pin from the gold selected region beneath.
        const color = CCM.gold
        // Unified flat droplet language (user 2026-08-05): ONE shape for
        // every pin. Exact = solid gold droplet; clusters set their count
        // flat in the droplet head (midnight for contrast on gold);
        // country-level approximate = the same droplet hollow (white fill,
        // gold outline). The popover carries the per-type breakdown.
        const k = (isCluster ? 2.7 : 1.6) * s
        const headCY = c.y - 10.5 * k
        const baseLabel = isCluster ? `${c.count} — ${c.items[0]?.title ?? ''}` : c.items[0]?.title ?? ''
        return (
          <g
            key={`${c.x}-${c.y}-${i}`}
            role="button"
            tabIndex={0}
            aria-label={c.approx ? `${baseLabel} · ${t('approxLocation')}` : baseLabel}
            className="group/pin cursor-pointer outline-none"
            onClick={(e) => { e.stopPropagation(); onPinClick?.(c) }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPinClick?.(c) }
            }}
          >
            {/* Same-hue halo blooms on hover/focus, centred on the head. */}
            <circle cx={c.x} cy={headCY} r={9 * k} fill={color}
              className="opacity-0 transition-opacity duration-200 group-hover/pin:opacity-15 group-focus-visible/pin:opacity-15 motion-reduce:transition-none" />
            <path
              d="M0 0C0 0 6.5 -6 6.5 -10.5A6.5 6.5 0 1 0 -6.5 -10.5C-6.5 -6 0 0 0 0Z"
              transform={`translate(${c.x} ${c.y}) scale(${k})`}
              fill={c.approx ? 'white' : color}
              stroke={c.approx ? color : 'white'}
              /* strokeWidth is in pre-transform units — divide by the scale
                 factor so the rendered stroke stays constant across sizes. */
              strokeWidth={(c.approx ? 2 : 1.5) / (isCluster ? 2.7 : 1.6)}
              className="drop-shadow-[0_1.5px_3px_rgba(11,49,96,0.3)]"
            />
            {isCluster && (
              <text x={c.x} y={headCY + 4.5 * s} textAnchor="middle"
                fontSize={13 * s}
                className="pointer-events-none font-heading font-bold tabular-nums"
                fill={CCM.midnight}>
                {c.count}
              </text>
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
        // 8.2/char tracks the 13px heading font's real advance closer than
        // the old 7.6 — long names (Northern Africa and Western Asia) were
        // underestimated, so their pills still touched the frame even after
        // clamping (user 2026-08-05).
        const w = (text.length * 8.2 + 34) * s
        // Clamp the pill inside the ACTIVE viewport horizontally (the y clamp
        // happens in showLabel) — near a map edge the pill slides inward
        // instead of being cut by overflow-hidden.
        const vbX = crop?.x ?? 0
        const vbW = crop?.w ?? 960
        const pad = 10 * s
        const cx = Math.min(Math.max(hoverLabel.x, vbX + w / 2 + pad), vbX + vbW - w / 2 - pad)
        return (
          <g className="pointer-events-none" aria-hidden>
            <rect x={cx - w / 2} y={hoverLabel.y - 15 * s} width={w} height={30 * s} rx={15 * s}
              fill="white" className="drop-shadow-[0_3px_8px_rgba(11,49,96,0.3)]" />
            <text x={cx} y={hoverLabel.y + 4.5 * s} textAnchor="middle"
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
