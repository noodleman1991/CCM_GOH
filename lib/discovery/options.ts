import "server-only";
import type { DiscoveryConfig } from "./registry";
import type { PillOption } from "@/components/ui/pill-filter-group";
import type { DiscoveryOptions } from "@/components/discovery/discovery-bar";
import { client } from "@/sanity/lib/client";
import { getLocalizedValue } from "@/i18n/i18n-helpers";

/**
 * Resolve each facet's options to LOCALIZED labels (never raw slugs/enums), so
 * the DiscoveryBar shows "Sub-Saharan Africa" not ssa and
 * "Climate Grief" not climate-grief. Server-only; pass the result to the bar.
 *
 * Static facets (language, source, openToTalk) have fixed option sets resolved
 * from i18n at the call site; taxonomy/enum facets resolve from Sanity/enum
 * data here. Algolia facets (the user index) are resolved by the collaborate
 * page from its own facet counts.
 */

const LANGUAGE_OPTIONS: PillOption[] = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "ar", label: "العربية" },
];

async function fetchRegionOptions(locale: string): Promise<PillOption[]> {
  try {
    const rows = await client.fetch<{ slug: string; name: unknown }[]>(
      `*[_type == "regionalCommunity" && defined(slug.current)] | order(name asc){ "slug": slug.current, name }`
    );
    return rows
      .map((r) => ({ value: r.slug, label: getLocalizedValue(r.name as any, locale) || r.slug }))
      .filter((o) => o.label);
  } catch {
    return [];
  }
}

async function fetchTagOptions(locale: string): Promise<PillOption[]> {
  try {
    const rows = await client.fetch<{ value: string; label: unknown }[]>(
      `*[_type == "tag" && defined(value)] | order(value asc){ value, label }`
    );
    return rows
      .map((r) => ({ value: r.value, label: getLocalizedValue(r.label as any, locale) || r.value }))
      .filter((o) => o.label);
  } catch {
    return [];
  }
}

export async function resolveDiscoveryOptions(
  config: DiscoveryConfig,
  locale: string
): Promise<DiscoveryOptions> {
  const out: DiscoveryOptions = {};

  for (const facet of config.facets) {
    if (facet.id === "language") {
      out[facet.id] = LANGUAGE_OPTIONS;
    } else if (facet.id === "region" && facet.source === "taxonomy") {
      out[facet.id] = await fetchRegionOptions(locale);
    } else if (facet.id === "tags") {
      out[facet.id] = await fetchTagOptions(locale);
    } else {
      // enum/static/algolia facets are resolved by the consuming page (it has
      // the enum label maps / Algolia facet counts). Default to empty so the
      // group hides until provided.
      out[facet.id] = [];
    }
  }
  return out;
}
