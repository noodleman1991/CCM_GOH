/**
 * Geocoding utility using OpenStreetMap's Nominatim API
 * Free and open-source geocoding service
 */

import countriesLib from "i18n-iso-countries";
import { reportError } from "@/lib/errors/report";

/**
 * Every Nominatim call carries this timeout. Before it, none did (audit
 * finding M8), so a stalled upstream held the calling route — or the
 * case-study form's geocode button — until the platform killed it. 10 s is
 * generous for Nominatim's usual sub-second answer, and short enough that the
 * caller's existing "unavailable" path runs while the user is still there.
 */
const NOMINATIM_TIMEOUT_MS = 10_000;

export interface GeoPoint {
    lat: number;
    lng: number;
}

export interface GeocodeResult {
    success: boolean;
    location?: GeoPoint;
    displayName?: string;
    error?: string;
}

/**
 * Geocode a location (city + country) to coordinates using Nominatim API
 *
 * @param city - City or region name
 * @param country - Country name
 * @returns Geocode result with coordinates if found
 */
export async function geocodeLocation(
    city: string,
    country: string
): Promise<GeocodeResult> {
    try {
        if (!city || !country) {
            return {
                success: false,
                error: 'Both city and country are required'
            };
        }

        // Build the query URL
        const params = new URLSearchParams({
            city: city.trim(),
            country: country.trim(),
            format: 'json',
            limit: '1',
            addressdetails: '1'
        });

        const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;

        // Make the request with proper User-Agent header (required by Nominatim)
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'ConnectingClimateMinds/1.0 (case study submission)'
            },
            signal: AbortSignal.timeout(NOMINATIM_TIMEOUT_MS),
        });

        if (!response.ok) {
            return {
                success: false,
                error: `Geocoding service error: ${response.statusText}`
            };
        }

        const data = await response.json();

        if (!data || data.length === 0) {
            return {
                success: false,
                error: 'Location not found. Please check the spelling and try again.'
            };
        }

        const result = data[0];

        return {
            success: true,
            location: {
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon)
            },
            displayName: result.display_name
        };

    } catch (error) {
        // Network failure or the 10 s timeout above: same "unavailable" answer
        // either way, now reported rather than console-only.
        reportError(error, { route: 'geocoding', tags: { fn: 'geocodeLocation' } });
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown geocoding error'
        };
    }
}

/**
 * Reverse geocode coordinates to location name
 *
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Location name if found
 */
export async function reverseGeocode(
    lat: number,
    lng: number
): Promise<{ success: boolean; address?: string; error?: string }> {
    try {
        const params = new URLSearchParams({
            lat: lat.toString(),
            lon: lng.toString(),
            format: 'json',
            addressdetails: '1'
        });

        const url = `https://nominatim.openstreetmap.org/reverse?${params.toString()}`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'ConnectingClimateMinds/1.0 (case study submission)'
            },
            signal: AbortSignal.timeout(NOMINATIM_TIMEOUT_MS),
        });

        if (!response.ok) {
            return {
                success: false,
                error: `Reverse geocoding error: ${response.statusText}`
            };
        }

        const data = await response.json();

        if (!data || data.error) {
            return {
                success: false,
                error: 'Location not found'
            };
        }

        return {
            success: true,
            address: data.display_name
        };

    } catch (error) {
        reportError(error, { route: 'geocoding', tags: { fn: 'reverseGeocode' } });
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

export interface GeocodeSuggestion {
    label: string;
    lat: number;
    lng: number;
    /** ISO alpha-3, uppercased; null when Nominatim gives no country. */
    countryCode3: string | null;
    /** Nominatim result type: city / administrative / country / … */
    kind: string;
    country: string | null;
    city: string | null;
    /** How finely the map should show it, read from what was found. */
    precision: 'exact' | 'city' | 'country' | 'region';
}

export type NominatimRow = {
    display_name: string; lat: string; lon: string; type: string; addresstype?: string;
    address?: { country_code?: string; country?: string; city?: string; town?: string; village?: string; municipality?: string; county?: string };
};

const CITY_TYPES = new Set(['city', 'town', 'village', 'municipality', 'hamlet', 'suburb']);
const REGION_TYPES = new Set(['state', 'province', 'region', 'county', 'state_district']);

/** Pure: turns one Nominatim row into a suggestion, or null when it has no
 *  usable coordinates. Precision is read from the row's own type, not chosen
 *  by the caller. */
export function toSuggestion(r: NominatimRow): GeocodeSuggestion | null {
    const lat = Number(r.lat);
    const lng = Number(r.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    const a2 = r.address?.country_code?.toUpperCase();
    const kindOf = r.addresstype ?? r.type;
    const precision: GeocodeSuggestion['precision'] =
        kindOf === 'country' ? 'country' : REGION_TYPES.has(kindOf) ? 'region' : CITY_TYPES.has(kindOf) ? 'city' : 'exact';
    const a = r.address ?? {};
    const city = precision === 'country' || precision === 'region' ? null : (a.city ?? a.town ?? a.village ?? a.municipality ?? null);
    return {
        label: r.display_name,
        lat,
        lng,
        countryCode3: a2 ? (countriesLib.alpha2ToAlpha3(a2) ?? null) : null,
        kind: r.type,
        country: a.country ?? null,
        city,
        precision,
    };
}

/** Free-text place search (Nominatim), max 5 suggestions. */
export async function geocodeQuery(query: string): Promise<GeocodeSuggestion[]> {
    const q = query.trim();
    if (!q) return [];
    try {
        const params = new URLSearchParams({
            q,
            format: 'json',
            limit: '5',
            addressdetails: '1',
        });
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?${params.toString()}`,
            {
                headers: { 'User-Agent': 'ConnectingClimateMinds/1.0 (place picker)' },
                signal: AbortSignal.timeout(NOMINATIM_TIMEOUT_MS),
            }
        );
        if (!response.ok) return [];
        const rows = (await response.json()) as NominatimRow[];
        return rows.map(toSuggestion).filter((s): s is GeocodeSuggestion => s !== null);
    } catch (error) {
        // The picker degrades to "no suggestions" — but a dead or slow
        // Nominatim used to be invisible from here. Report, then degrade.
        reportError(error, { route: 'geocoding', tags: { fn: 'geocodeQuery' } });
        return [];
    }
}
