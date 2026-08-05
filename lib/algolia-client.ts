'use client'

import useSWR from 'swr'
import { useMemo } from 'react'
import { algoliasearch, type SearchClient } from 'algoliasearch'

interface SearchTokenResponse {
  appId: string
  apiKey: string
  validUntil: number
}

// Only used as a fallback (see below) — the primary path is the minted
// token from /api/search/token, which doesn't need these at all.
const ENV_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID
const ENV_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY

const tokenFetcher = async (url: string): Promise<SearchTokenResponse> => {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message || `Failed to fetch search token (${res.status})`)
  }
  return res.json()
}

/**
 * Client-side Algolia search client, built from the scoped, self-expiring
 * key minted server-side by app/api/search/token — the browser never needs
 * a standing NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY (which has been invalid
 * since June). Fetches the token once via SWR and refetches well before its
 * ~1h expiry so a long-open tab never gets a stale key.
 *
 * Falls back to constructing a client from the raw env key ONLY when the
 * token endpoint itself errors — so a locally-rotated
 * NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY still works with no code changes, but
 * the token mint stays the primary, preferred path.
 */
export function useAlgoliaSearchClient(): {
  client: SearchClient | null
  isLoading: boolean
  error: Error | null
} {
  const { data, error, isLoading } = useSWR<SearchTokenResponse>(
    '/api/search/token',
    tokenFetcher,
    {
      // Refetch well before the ~1h token expiry (see route: validUntil).
      refreshInterval: 25 * 60 * 1000,
      revalidateOnFocus: false,
      dedupingInterval: 5 * 60 * 1000,
    }
  )

  const client = useMemo<SearchClient | null>(() => {
    if (data?.appId && data?.apiKey) {
      return algoliasearch(data.appId, data.apiKey)
    }
    if (error && ENV_APP_ID && ENV_SEARCH_KEY) {
      return algoliasearch(ENV_APP_ID, ENV_SEARCH_KEY)
    }
    return null
  }, [data, error])

  return {
    client,
    isLoading: isLoading && !client,
    error: client ? null : (error ?? null),
  }
}
