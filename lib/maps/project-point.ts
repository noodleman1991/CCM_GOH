import "server-only";
import { geoNaturalEarth1 } from "d3-geo";
import countryGeometry from "@/components/maps/country-geometry.json";

const { scale, translate } = countryGeometry.projection;
const projection = geoNaturalEarth1().scale(scale).translate(translate as [number, number]);

/**
 * lat/lng → viewBox (960×500) coordinates using the SAME fitted projection the
 * build pipeline used, reconstructed from serialized constants. Server-side
 * only — d3-geo never ships to clients.
 */
export function projectPoint(lat: number, lng: number): { x: number; y: number } | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  const p = projection([lng, lat]);
  if (!p) return null;
  return { x: Math.round(p[0] * 10) / 10, y: Math.round(p[1] * 10) / 10 };
}
