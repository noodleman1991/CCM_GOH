import useSWR from 'swr'

interface SearchCounts {
  users: number
  agendas: number
  news: number
  caseStudies: number
  posts: number
}

interface SearchCountsResponse {
  success: boolean
  counts: SearchCounts
  authenticated: boolean
}

const defaultCounts: SearchCounts = {
  users: 0,
  agendas: 0,
  news: 0,
  caseStudies: 0,
  posts: 0
}

const fetcher = async (url: string): Promise<SearchCountsResponse> => {
  const response = await fetch(url)

  // Check if response is JSON (API might return HTML 404)
  const contentType = response.headers.get('content-type')
  if (!contentType?.includes('application/json')) {
    // Return default counts instead of throwing
    return {
      success: false,
      counts: defaultCounts,
      authenticated: false
    }
  }

  const data = await response.json()

  // API always returns counts even on error now
  return {
    success: data.success ?? false,
    counts: data.counts ?? defaultCounts,
    authenticated: data.authenticated ?? false
  }
}

/**
 * Custom hook to fetch search result counts across all indices
 * Uses SWR for caching and automatic revalidation
 * Counts are authentication-aware (user counts depend on login status)
 */
export function useSearchCounts() {
  const { data, error, isLoading, mutate } = useSWR<SearchCountsResponse>(
    '/api/search/counts',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
      refreshInterval: 300000, // Refresh every 5 minutes
      fallbackData: {
        success: false,
        counts: defaultCounts,
        authenticated: false
      },
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        // Don't retry on 404 or if we've retried 3 times
        if (error?.status === 404 || retryCount >= 3) return
        // Retry after 5 seconds
        setTimeout(() => revalidate({ retryCount }), 5000)
      }
    }
  )

  return {
    counts: data?.counts ?? defaultCounts,
    isAuthenticated: data?.authenticated ?? false,
    isLoading,
    isError: !!error || (data?.success === false),
    mutate // Expose mutate for manual revalidation if needed
  }
}
