/**
 * Geocoding utility using OpenStreetMap's Nominatim API
 * Free and open-source geocoding service
 */

import countriesLib from "i18n-iso-countries";

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
            }
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
        console.error('Geocoding error:', error);
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
            }
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
        console.error('Reverse geocoding error:', error);
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
            { headers: { 'User-Agent': 'ConnectingClimateMinds/1.0 (place picker)' } }
        );
        if (!response.ok) return [];
        const rows = (await response.json()) as Array<{
            display_name: string; lat: string; lon: string; type: string;
            address?: { country_code?: string };
        }>;
        return rows.map((r) => {
            const a2 = r.address?.country_code?.toUpperCase();
            const a3 = a2 ? (countriesLib.alpha2ToAlpha3(a2) ?? null) : null;
            return {
                label: r.display_name,
                lat: Number(r.lat),
                lng: Number(r.lon),
                countryCode3: a3,
                kind: r.type,
            };
        }).filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng));
    } catch {
        return [];
    }
}
