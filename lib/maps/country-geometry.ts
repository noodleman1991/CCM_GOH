import "server-only";
import geometry from "@/components/maps/country-geometry.json";

type CountryEntry = { d: string; region: string | null };
const countries = geometry.countries as Record<string, CountryEntry>;

export const COUNTRY_VIEWBOX = geometry.viewBox as string;

export function getCountryPath(iso3: string): CountryEntry | null {
  return countries[iso3?.toUpperCase()] ?? null;
}

export function listCountryIsoCodes(): string[] {
  return Object.keys(countries);
}

export function allCountryEntries(): Array<[string, CountryEntry]> {
  return Object.entries(countries);
}
