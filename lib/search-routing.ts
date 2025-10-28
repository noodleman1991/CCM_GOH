/**
 * Search routing configuration for Algolia InstantSearch
 * Provides clean URL routing with ?q= parameter format
 */

import type { UiState } from 'instantsearch.js'

interface RouteState {
  q?: string
  refinementList?: Record<string, string[]>
  page?: number
  [key: string]: any
}

interface SearchRoutingConfig {
  stateMapping: {
    stateToRoute: (uiState: UiState) => RouteState
    routeToState: (routeState: RouteState) => UiState
  }
}

/**
 * Creates a routing configuration for InstantSearch
 * Converts between Algolia's internal state and clean URL parameters
 *
 * @param indexName - The Algolia index name (e.g., 'users', 'reports', 'case_studies')
 * @returns Routing configuration object for InstantSearchNext
 */
export function createSearchRouting(indexName: string): SearchRoutingConfig {
  return {
    stateMapping: {
      /**
       * Convert InstantSearch UI state to URL parameters
       * Maps from internal state → clean URL format
       */
      stateToRoute(uiState: UiState): RouteState {
        const indexUiState = uiState[indexName] || {}

        const routeState: RouteState = {}

        // Map query to 'q' parameter
        if (indexUiState.query) {
          routeState.q = indexUiState.query
        }

        // Preserve refinement list filters
        if (indexUiState.refinementList) {
          routeState.refinementList = indexUiState.refinementList
        }

        // Preserve pagination (only if not page 1)
        if (indexUiState.page && indexUiState.page > 1) {
          routeState.page = indexUiState.page
        }

        // Preserve range filters (for date ranges, etc.)
        if (indexUiState.range) {
          routeState.range = indexUiState.range
        }

        return routeState
      },

      /**
       * Convert URL parameters to InstantSearch UI state
       * Maps from clean URL format → internal state
       */
      routeToState(routeState: RouteState): UiState {
        const indexState: any = {}

        // Map 'q' parameter to query
        if (routeState.q) {
          indexState.query = routeState.q
        }

        // Restore refinement list filters
        if (routeState.refinementList) {
          indexState.refinementList = routeState.refinementList
        }

        // Restore pagination
        if (routeState.page) {
          indexState.page = routeState.page
        }

        // Restore range filters
        if (routeState.range) {
          indexState.range = routeState.range
        }

        return {
          [indexName]: indexState
        }
      }
    }
  }
}
