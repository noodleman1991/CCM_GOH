import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BackLink } from "@/components/ui/back-link";
import { TypedCard } from "@/components/cards/typed-card";
import type { TypedCardItem } from "@/lib/cards/type-style";
import { getResearchOutputs } from "@/lib/content/outputs";
import { getLocalizedValue } from "@/i18n/i18n-helpers";
import { imageUrl } from "@/lib/content/images"
import { FilterBar } from "@/components/filters/filter-bar";
import { applyFilters, buildOptions, isFiltering, type FilterTag } from "@/lib/filters/core";
import { parseFilterParams } from "@/lib/filters/params";
import { researchOutputToFilterable } from "@/lib/filters/adapters";
import { REGION_CODES, REGION_I18N_KEY, REGION_TO_RC_SLUG, type RegionCode } from "@/lib/maps/region-codes";
import { Link } from "@/i18n/navigation";

const COMMUNITY_SLUG_TO_REGION: Record<string, string> = Object.fromEntries(
  REGION_CODES.map((code) => [REGION_TO_RC_SLUG[code], code]),
);

/**
 * Research-outputs listing — the code route the Research & Action hub and the
 * sidebar link to (was 404ing into the Sanity catch-all before this existed).
 * Renders the approved outputs as TypedCards, newest first (query order).
 */

type OutputRow = {
  _id: string;
  title?: Record<string, string> | string | null;
  excerpt?: Record<string, string> | string | null;
  slug?: string | null;
  publishDate?: string | null;
  image?: { asset?: { url?: string | null } | null } | null;
  versions?: { _key: string; kind?: string | null; lang?: string | null; label?: string | null }[] | null;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "researchOutputs" });
  return { title: t("pageTitle"), description: t("pageDescription") };
}

export default async function ResearchOutputsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const [t, tFilters, tRegions, all] = await Promise.all([
    getTranslations({ locale, namespace: "researchOutputs" }),
    getTranslations({ locale, namespace: "filters" }),
    getTranslations({ locale, namespace: "navigation.regions" }),
    getResearchOutputs(),
  ]);
  const everything = all as unknown as OutputRow[];

  // The hub's shared filters (spec 2026-09-30): one list, one engine.
  const filterable = everything.map((o) => researchOutputToFilterable(o as never, locale));
  const knownTags: FilterTag[] = [...new Map(filterable.flatMap((i) => i.tags).map((tag) => [tag.slug, tag])).values()];
  const active = parseFilterParams(sp, { tags: knownTags, communitySlugToRegion: COMMUNITY_SLUG_TO_REGION });
  const options = buildOptions(filterable, active, { locale, regionLabel: (code) => tRegions(REGION_I18N_KEY[code as RegionCode]) });
  const visible = new Set(applyFilters(filterable, active).map((i) => i.id));
  const outputs = everything.filter((o) => visible.has(o._id));

  const items: TypedCardItem[] = outputs
    .filter((o) => o.slug)
    .map((o) => ({
      type: "researchOutput",
      id: o._id,
      title: getLocalizedValue(o.title, locale) ?? "",
      href: `/research-and-action/research-outputs/${o.slug}`,
      excerpt: getLocalizedValue(o.excerpt, locale) ?? null,
      image: imageUrl(o.image, { width: 800, height: 450, crop: true }) || null,
      date: o.publishDate ?? null,
      docs: (o.versions ?? [])
        .slice(0, 3)
        .map((v) => [v.label || v.kind, v.lang?.toUpperCase()].filter(Boolean).join(" · "))
        .filter(Boolean),
    }));

  return (
    <div className="container py-8 space-y-8">
      <BackLink href="/research-and-action" label={t("backToResearch")} />
      <div className="space-y-2">
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-ccm-midnight">
          {t("pageTitle")}
        </h1>
        <p className="text-muted-foreground max-w-2xl">{t("pageDescription")}</p>
      </div>

      <FilterBar options={options} active={active} />
      <p className="text-sm text-muted-foreground">{tFilters("results", { count: items.length })}</p>

      {items.length === 0 ? (
        <div className="space-y-2 py-8 text-center">
          <p className="text-sm text-muted-foreground">{isFiltering(active) ? tFilters("empty") : t("empty")}</p>
          {isFiltering(active) && (
            <Link href="/research-and-action/research-outputs" className="text-sm font-semibold text-ccm-sea hover:underline">
              {tFilters("clear")}
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <TypedCard key={item.id} item={item} variant="grid" />
          ))}
        </div>
      )}
    </div>
  );
}
