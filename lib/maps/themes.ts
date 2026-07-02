import { client } from "@/sanity/lib/client";
import { FALLBACK_THEMES, type ThemeOption } from "./region-facets";

interface RawThemeTagRow {
  slug: string | null;
  label: Partial<Record<"en" | "es" | "fr" | "ar", string>> | null;
}

/**
 * Server-side fetch of the CMS-driven Atlas theme facet: any `tag` document
 * flagged `useAsTheme` becomes a selectable theme, ordered by the tag's
 * orderRank. Falls back to `FALLBACK_THEMES` (see region-facets.ts) when the
 * CMS has none flagged, or when the fetch itself fails — the Atlas theme
 * facet should never hard-fail the page.
 */
export async function getThemeOptions(): Promise<ThemeOption[]> {
  let rows: RawThemeTagRow[] = [];
  try {
    rows = await client.fetch<RawThemeTagRow[]>(
      `*[_type == "tag" && useAsTheme == true] | order(orderRank) {
        "slug": value.current,
        label
      }`
    );
  } catch (e) {
    console.error("[themes] getThemeOptions fetch failed:", e);
    return FALLBACK_THEMES;
  }

  const options: ThemeOption[] = rows
    .filter(
      (r): r is { slug: string; label: Partial<Record<"en" | "es" | "fr" | "ar", string>> } =>
        typeof r?.slug === "string" && r.slug.length > 0 && r.label != null && typeof r.label === "object"
    )
    .map((r) => ({
      slug: r.slug,
      label: {
        en: r.label.en,
        es: r.label.es,
        fr: r.label.fr,
        ar: r.label.ar,
      },
    }));

  return options.length > 0 ? options : FALLBACK_THEMES;
}
