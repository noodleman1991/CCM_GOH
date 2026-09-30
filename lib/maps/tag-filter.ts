/**
 * The atlas's Themes and Communities in its URLs (spec 2026-09-30): `themes`
 * and `communities` as comma lists, plus the old single `theme`. Values are
 * checked against the options content actually uses; unknown ones are dropped,
 * never an error — the same as the list pages.
 */
export interface AtlasTagFilter {
  themes: string[];
  communities: string[];
}

const list = (v: string | null) => (v ?? "").split(",").map((s) => s.trim()).filter(Boolean);

export function pickTagFilter(sp: URLSearchParams, themeSlugs: Set<string>, communitySlugs: Set<string>): AtlasTagFilter {
  const asked = [...list(sp.get("themes")), ...list(sp.get("theme"))];
  const askedCommunities = list(sp.get("communities"));
  return {
    themes: [...new Set(asked.filter((s) => themeSlugs.has(s)))],
    communities: [...new Set([...askedCommunities, ...asked].filter((s) => communitySlugs.has(s)))],
  };
}


/** The `&themes=…&communities=…` fragment for the atlas's own requests ("" when nothing is chosen). */
export function tagQuery(f: AtlasTagFilter): string {
  return `${f.themes.length ? `&themes=${encodeURIComponent(f.themes.join(","))}` : ""}${f.communities.length ? `&communities=${encodeURIComponent(f.communities.join(","))}` : ""}`;
}
