import geometry from "@/components/maps/region-geometry-soft.json";
import { CCM } from "@/lib/ccm-colors";
import { regionCropViewBox } from "@/lib/maps/region-crop";
import type { RegionCode } from "@/lib/maps/region-codes";
import { cn } from "@/lib/utils";

/**
 * A region's card artwork: the map zoomed to that region, the region in the
 * atlas's selection gold and its neighbours in soft blue — the same look as
 * the atlas and the former community cards. Decorative.
 */
export function RegionArtwork({ region, className }: { region: RegionCode; className?: string }) {
  const regions = geometry.regions as Record<string, { d: string }>;
  const viewBox = regionCropViewBox(region);
  if (!regions[region] || !viewBox) return null;
  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      className={cn("block w-full", className)}
      style={{ backgroundColor: CCM.sea }}
    >
      {Object.entries(regions).map(([code, { d }]) =>
        code === region ? null : <path key={code} d={d} fill={CCM.sky} fillOpacity={0.55} />,
      )}
      <path d={regions[region].d} fill={CCM.gold} stroke="#fff" strokeWidth={3} strokeLinejoin="round" paintOrder="stroke" />
    </svg>
  );
}
