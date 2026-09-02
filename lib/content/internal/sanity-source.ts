/**
 * The single seam between the content layer and Sanity.
 *
 * This is the ONLY file under lib/content/ permitted to import from @/sanity
 * or @sanity/*; lib/__tests__/content-layer-boundary.test.ts enforces that.
 * Phase 3 adds payload-source.ts beside this file and switches the domain
 * modules over one at a time.
 */
import { cachedFetch } from "@/sanity/lib/cached-fetch";

/**
 * Run a GROQ query. Callers pass a plain string rather than a `defineQuery`
 * literal: the generated result types are deliberately not used here, because
 * lib/content/ types its own returns and must not depend on sanity.types.ts.
 */
export async function query<T>(
  groq: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  const { data } = await cachedFetch({
    query: groq as never,
    params,
    perspective: "published",
    stega: false,
  });
  return data as T;
}
