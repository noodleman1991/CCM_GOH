/**
 * Wrap a content read so an upstream failure degrades to an empty state
 * instead of taking the page down.
 *
 * The 2026-07-28 quota outage (Sanity returning 402 plan_limit_reached) took
 * out every content page at once because reads threw. Reads degrade; writes
 * do not — a submission that silently fails is worse than one that errors.
 */
export async function safe<T>(
  label: string,
  fallback: T,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error(`[content:${label}]`, error);
    return fallback;
  }
}
