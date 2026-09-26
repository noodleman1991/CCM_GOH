import geometry from '@/components/maps/region-geometry-soft.json'
import { REGION_COLOR, type RegionCode } from '@/lib/maps/region-codes'
import { cn } from '@/lib/utils'

/**
 * Circle-clipped mini world map with one region in its brand colour — the
 * locked atlas embed's corner locator (spec 2026-08-03 amendment): the cropped
 * clipping shows only the region, so this situates it globally at a glance.
 * The viewBox trims only the emptiest margins (user 2026-08-04: zoomed out
 * from the earlier tight crop — most of the world shows, so the region reads
 * in true global context); `slice` keeps it edge-to-edge in the circle.
 */
export function RegionLocator({
  region,
  label,
  className,
}: {
  region: RegionCode
  label: string
  className?: string
}) {
  const regions = geometry.regions as Record<string, { d: string }>
  if (!regions[region]) return null
  return (
    <svg
      viewBox="70 25 820 450"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={label}
      className={cn(
        'rounded-full border-[3px] border-white shadow-md',
        className
      )}
      style={{ backgroundColor: 'color-mix(in srgb, var(--color-ccm-water) 20%, white)' }}
    >
      {Object.entries(regions).map(([code, { d }]) => (
        <path
          key={code}
          d={d}
          fill={
            code === region
              ? REGION_COLOR[region]
              : 'color-mix(in srgb, var(--color-ccm-water) 45%, white)'
          }
        />
      ))}
    </svg>
  )
}
