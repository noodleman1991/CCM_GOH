/**
 * Server side of the atlas's Themes/Communities parameters: checks them
 * against the options content actually uses. The pure parsing lives in
 * ./tag-filter.ts so browser components can import it without server code.
 */
import { pickTagFilter, type AtlasTagFilter } from "./tag-filter";

export { pickTagFilter, tagQuery, type AtlasTagFilter } from "./tag-filter";

/** Server helper: read and check the atlas tag parameters against today's options. */
export async function readTagFilter(sp: URLSearchParams): Promise<AtlasTagFilter> {
  if (!sp.get("themes") && !sp.get("theme") && !sp.get("communities")) return { themes: [], communities: [] };
  const { getThemeOptions, getCommunityOptions } = await import("@/lib/content/regions");
  const [themes, communities] = await Promise.all([getThemeOptions(), getCommunityOptions()]);
  return pickTagFilter(sp, new Set(themes.map((t) => t.slug)), new Set(communities.map((t) => t.slug)));
}
