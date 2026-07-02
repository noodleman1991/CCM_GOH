import { cn } from "@/lib/utils";
import { CCM } from "@/lib/ccm-colors";
import {
  allRegionEntries,
  getCountryPath,
  getRegionPath,
  COUNTRY_VIEWBOX,
} from "@/lib/maps/country-geometry";
import { projectPoint } from "@/lib/maps/project-point";
import type { RegionCode } from "@/lib/maps/region-codes";

type LocaleMapProps = {
  /** ISO alpha-3 of the country to highlight (exact/city/country precision). */
  iso?: string | null;
  /** Region code to highlight instead (precision: "region"). */
  region?: RegionCode | null;
  point?: { lat: number; lng: number } | null;
  label?: string | null;
  variant?: "mini" | "panel";
  className?: string;
};

/**
 * "Where this is from" — the blue world with the place highlighted in amber
 * (spec A3). Server component; pure inline SVG, zero client JS. Precision-aware:
 * pass `region` (no iso/point) for region-precision content.
 */
export function LocaleMap({ iso, region, point, label, variant = "mini", className }: LocaleMapProps) {
  const highlight = iso ? getCountryPath(iso) : null;
  const regionPath = region ? getRegionPath(region) : null;
  const pin = variant === "panel" && point ? projectPoint(point.lat, point.lng) : null;
  const size = variant === "mini" ? "w-20" : "w-full max-w-[280px]";

  if (!highlight && !regionPath) return null;

  return (
    <figure className={cn("m-0", size, className)}>
      <svg viewBox={COUNTRY_VIEWBOX} role="img" aria-label={label ?? undefined} className="h-auto w-full">
        {/* Backdrop trade-off: draw the 7 region blobs (not per-country geometry)
            to keep this component light enough to sit on cards — per-country
            data (~116KB) is used only for the highlighted-country path below. */}
        {allRegionEntries().map(([code, { d }]) => (
          <path key={code} d={d} fill={CCM.sky} fillOpacity={0.45} stroke="white" strokeWidth={0.4} />
        ))}
        {regionPath && (
          <path d={regionPath.d} fill={CCM.amber} fillOpacity={0.9} stroke="white" strokeWidth={0.8} />
        )}
        {highlight && (
          <path d={highlight.d} fill={CCM.amber} stroke="white" strokeWidth={0.8} />
        )}
        {pin && (
          <circle cx={pin.x} cy={pin.y} r={6} fill={CCM.sea} stroke="white" strokeWidth={2} />
        )}
      </svg>
      {variant === "panel" && label && (
        <figcaption className="mt-1.5 text-xs text-muted-foreground">
          <bdi>{label}</bdi>
        </figcaption>
      )}
    </figure>
  );
}
