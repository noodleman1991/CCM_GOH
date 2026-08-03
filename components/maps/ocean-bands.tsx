import geometry from './region-geometry-soft.json'
import { CCM } from '@/lib/ccm-colors'

/**
 * The illustration atlas's static backdrop (mock v6 §3): midnight ocean with
 * two broad nested contour bands hugging the landmass — build-time offset
 * geometry from region-geometry-soft.json, never a CSS blur. Renders INSIDE
 * the choropleth's <svg>; pure and data-free, so it costs one paint and
 * re-renders never.
 *
 * Flat fills ONLY — the brand region artwork has no texture, grain or
 * outlines, so neither does this (the earlier graticule dot grid is gone).
 */
export function OceanBands() {
  return (
    <g aria-hidden="true">
      {/* Overdraw the frame so the ocean bleeds to the rounded container edge. */}
      <rect x="-40" y="-40" width="1040" height="580" fill={CCM.midnight} />
      {/* Deepest contour rides UNDER the outer band as a fat rounded stroke —
          it reads as a third, broadest band with soft rounded lobes. */}
      <path
        d={geometry.bands.outer}
        fill="none"
        stroke="#16437B"
        strokeWidth={44}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d={geometry.bands.outer} fill={CCM.sea} />
      <path d={geometry.bands.inner} fill={CCM.water} />
    </g>
  )
}
