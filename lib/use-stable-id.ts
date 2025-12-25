import { useId } from 'react'

/**
 * Generates a stable, deterministic ID for SSR/client consistency
 * Falls back to useId() but allows overrides for explicit ID control
 *
 * @param prefix - Optional prefix for the generated ID
 * @param providedId - Optional explicit ID to use instead of auto-generation
 * @returns A stable ID string
 */
export function useStableId(prefix?: string, providedId?: string): string {
  const autoId = useId()
  if (providedId) return providedId
  return prefix ? `${prefix}-${autoId}` : autoId
}
