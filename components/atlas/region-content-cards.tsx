"use client";

import useSWR from "swr";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { FACETS, facetForContentType, atlasDestination, type FacetId } from "@/lib/maps/region-facets";
import type { FacetContentType } from "@/lib/maps/cluster-pins";
import { REGION_COLOR, REGION_I18N_KEY, REGION_TO_RC_SLUG, isRegionCode } from "@/lib/maps/region-codes";
import { COLOR } from "@/lib/ccm-colors";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { TypedCard } from "@/components/cards/typed-card";
import { isTypedCardType, type TypedCardItem } from "@/lib/cards/type-style";

/** Atlas drill-in shows a PREVIEW of a region's content, capped per type; the
 *  full set lives on each type's listing page, reached via the view-all link
 *  (which carries the region as a `communities=`/`regions=` filter). */
const PER_TYPE_CAP = 6;

type Item = {
  id: string;
  type: string;
  title: string;
  slug: string;
  image: string | null;
  imageLqip?: string | null;
  place?: string | null;
  countryCode3?: string | null;
  date: string | null;
};
const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<{ items: Item[] }>);

// Map a content type + slug to its public detail route.
function hrefFor(type: string, slug: string): string {
  switch (type) {
    case "caseStudy": return `/research-and-action/case-studies/${slug}`;
    case "livedExperience": return `/lived-experiences/${slug}`;
    case "newsPost": return `/news/${slug}`;
    case "researchOutput": return `/research-and-action/research-outputs/${slug}`;
    default: return "#";
  }
}

// `region-items`'s `Item.type` is a Sanity `_type` string, which includes
// "researchOutput" — not itself a `FacetContentType` (that union only has
// "agenda"/"report", the legacy types region-items collapses into
// researchOutput, spec R2b). This local map covers every type region-items
// can actually emit, for the group header's dot colour + localized label.
const TYPE_TO_FACET: Record<string, FacetId> = {
  caseStudy: "caseStudyCount",
  livedExperience: "livedExpCount",
  newsPost: "newsCount",
  researchOutput: "researchOutputCount",
};

function labelKeyForType(type: string): string {
  // researchOutput isn't a FacetContentType (facetForContentType only
  // recognizes agenda/report) — fall back through TYPE_TO_FACET for it.
  const byContentType = facetForContentType(type as FacetContentType)?.id;
  const facetId = byContentType ?? TYPE_TO_FACET[type];
  return FACETS.find((f) => f.id === facetId)?.labelKey ?? "facetCaseStudies";
}

function layerColorKeyForType(type: string): keyof typeof COLOR.layer {
  switch (type) {
    case "caseStudy": return "cases";
    case "livedExperience": return "lived";
    default: return "projects";
  }
}

/**
 * Task 13: region-items rows adapt into the shared TypedCard (approved mock
 * v3) — the eyebrow colour here, the pin layer colour and the Show-chip
 * colour are one continuous system.
 */
function toTypedCardItem(item: Item): TypedCardItem {
  return {
    type: isTypedCardType(item.type) ? item.type : "caseStudy",
    id: item.id,
    title: item.title,
    href: hrefFor(item.type, item.slug),
    image: item.image,
    imageLqip: item.imageLqip,
    place: item.place ?? null,
    date: item.date,
    quote: item.type === "livedExperience",
  };
}

function ContentCard({ item }: { item: Item }) {
  return <TypedCard item={toTypedCardItem(item)} variant="grid" className="h-full" />;
}

/** Small group header for the multi-type card strip: a colour dot (matching
 *  the pin/legend colour for that type) + its localized label — so a mixed
 *  set of cards reads like the pin popover's mini-legend (spec E1). */
function GroupHeader({ type, t }: { type: string; t: (key: string) => string }) {
  return (
    <div className="col-span-full mb-0.5 flex items-center gap-1.5 first:mt-0">
      <span
        aria-hidden="true"
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: COLOR.layer[layerColorKeyForType(type)] }}
      />
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t(labelKeyForType(type))}
      </span>
    </div>
  );
}

const SKELETON_CLASS = "aspect-video shrink-0 basis-[70%] animate-pulse rounded-lg bg-muted sm:basis-[45%] lg:basis-auto";

function CardsSkeleton() {
  return (
    <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 lg:grid lg:grid-cols-4 lg:overflow-visible">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={cn(SKELETON_CLASS, "snap-start")} />
      ))}
    </div>
  );
}

/** The listing-page href for a content type, scoped to the given region so the
 *  full set opens pre-filtered (carries the region as its `communities=`/
 *  `regions=` param via the shared `atlasDestination` map). Returns null for a
 *  type with no public listing page or an unrecognized region. */
function listingHrefFor(type: string, region: string): string | null {
  if (!isRegionCode(region)) return null;
  const facetId = facetForContentType(type as FacetContentType)?.id ?? TYPE_TO_FACET[type];
  if (!facetId) return null;
  return atlasDestination(facetId, REGION_TO_RC_SLUG[region]);
}

/** "View all N {type}" link shown when a type's items exceed the preview cap —
 *  the drill-in is a preview, the listing page holds the rest. */
function ViewAllLink({ href, label, total }: { href: string; label: string; total: number }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-ccm-sea)] hover:underline"
    >
      {label}
      <span className="text-muted-foreground">({total})</span>
      <ArrowRight className="size-3.5 rtl:-scale-x-100" aria-hidden />
    </Link>
  );
}

/**
 * Track layout shared by both modes below: horizontal snap-scroll strip on
 * mobile (each card ~70% width so the next peeks in), 3–4 col grid from `sm`
 * up. Cards spanning multiple content types get small dot+label group headers
 * ahead of that type's run (spec E1) — skipped entirely for a single-type set.
 * Each type is capped at PER_TYPE_CAP as a preview; a "view all" link to the
 * region-scoped listing page appears when the full count exceeds the cap.
 */
function CardsTrack({
  items,
  t,
  region,
  viewAllLabel,
}: {
  items: Item[];
  t: (key: string) => string;
  region?: string;
  /** (type, region) → localized "View all case studies" label. */
  viewAllLabel?: (type: string) => string;
}) {
  const types = [...new Set(items.map((i) => i.type))];
  const grouped = types.length > 1;

  const cappedTrack = (type: string, groupItems: Item[]) => {
    const shown = groupItems.slice(0, PER_TYPE_CAP);
    const href = region ? listingHrefFor(type, region) : null;
    const showViewAll = href && groupItems.length > PER_TYPE_CAP;
    return (
      <>
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] lg:grid lg:grid-cols-4 lg:overflow-visible [&::-webkit-scrollbar]:hidden">
          {shown.map((item) => (
            <div key={item.id} className="w-[70%] shrink-0 snap-start sm:w-[45%] lg:w-auto">
              <ContentCard item={item} />
            </div>
          ))}
        </div>
        {showViewAll && (
          <div className="mt-2">
            <ViewAllLink
              href={href}
              label={viewAllLabel ? viewAllLabel(type) : t(labelKeyForType(type))}
              total={groupItems.length}
            />
          </div>
        )}
      </>
    );
  };

  if (!grouped) {
    return <div className="space-y-1.5">{cappedTrack(types[0], items)}</div>;
  }

  // Grouped mode: mobile keeps a single horizontal strip (headers interleave
  // inline, still snap-scrollable); desktop switches to a grid with each
  // group's header spanning the full row width above its own cards.
  return (
    <div className="space-y-3">
      {types.map((type) => {
        const groupItems = items.filter((i) => i.type === type);
        return (
          <div key={type} className="space-y-1.5">
            <GroupHeader type={type} t={t} />
            {cappedTrack(type, groupItems)}
          </div>
        );
      })}
    </div>
  );
}

/** Card labels draw from two namespaces: facet labels live under `map`
 *  (shared with the legend/chips), "untitled" lives under `atlas`. One
 *  translator function lets `CardsTrack`/`ContentCard` stay namespace-agnostic. */
function useCardLabels() {
  const tMap = useTranslations("map");
  const tAtlas = useTranslations("atlas");
  return (key: string) => (key === "untitled" ? tAtlas(key) : tMap(key));
}

/** "View all {type}" label builder, localized: `atlas.viewAllType` wrapping the
 *  type's own `map`-namespace facet label (e.g. "View all case studies"). */
function useViewAllLabel() {
  const tMap = useTranslations("map");
  const tAtlas = useTranslations("atlas");
  return (type: string) => tAtlas("viewAllType", { label: tMap(labelKeyForType(type)) });
}

/**
 * The selected region's actual content, as cards (Atlas D2/E1). Replaces the
 * count-only drill-in with the real items for the chosen region + facet.
 */
export function RegionContentCards({
  region,
  facet,
  theme,
  q,
  when,
}: {
  region: string;
  facet: string;
  theme?: string | null;
  q?: string;
  when?: string | null;
}) {
  const t = useCardLabels();
  const viewAllLabel = useViewAllLabel();
  // Theme/q/when ride along so the cards always show the same filtered set the
  // choropleth counts describe (count↔cards consistency).
  const filterQS = `${theme ? `&theme=${encodeURIComponent(theme)}` : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}${when ? `&when=${encodeURIComponent(when)}` : ""}`;
  const { data, isLoading } = useSWR(
    `/api/maps/region-items?region=${region}&facet=${facet}${filterQS}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );
  const items = data?.items ?? [];

  if (isLoading) return <CardsSkeleton />;
  if (items.length === 0) return null;

  return <CardsTrack items={items} t={t} region={region} viewAllLabel={viewAllLabel} />;
}

/**
 * "Around the regions" (mock v6 §1, homepage embed): ONE newest geotagged item
 * per region, each under a region eyebrow (colour dot + localized name that
 * links to the community page). Breadth is this strip's whole job — the
 * homepage's fresh-content block already owns recency.
 */
export function RegionHighlightsCards() {
  const t = useCardLabels();
  const tRegions = useTranslations("navigation.regions");
  const { data, isLoading } = useSWR(
    `/api/maps/region-items?mode=highlights`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );
  const items = (data?.items ?? []) as (Item & { region?: string })[];

  if (isLoading) return <CardsSkeleton />;
  if (items.length === 0) return null;

  return (
    <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] lg:grid lg:grid-cols-4 lg:overflow-visible [&::-webkit-scrollbar]:hidden">
      {items.map((item) => (
        <div key={item.id} className="w-[70%] shrink-0 snap-start sm:w-[45%] lg:w-auto">
          {item.region && isRegionCode(item.region) && (
            <Link
              href={`/communities/${REGION_TO_RC_SLUG[item.region]}`}
              className="mb-1.5 flex items-center gap-1.5 hover:underline"
            >
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: REGION_COLOR[item.region] }}
              />
              <span className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {tRegions(REGION_I18N_KEY[item.region])}
              </span>
            </Link>
          )}
          <ContentCard item={item} />
        </div>
      ))}
    </div>
  );
}

/**
 * No-selection invitation row (spec E1): the most recent geotagged items
 * across every region, so the atlas never opens on a stats-panel-shaped void.
 * Independent of `region`/`facet` — always the lightweight `region=all` mode.
 */
export function RecentEverywhereCards({ limit = 6 }: { limit?: number }) {
  const t = useCardLabels();
  const { data, isLoading } = useSWR(
    `/api/maps/region-items?region=all&limit=${limit}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );
  const items = data?.items ?? [];

  if (isLoading) return <CardsSkeleton />;
  if (items.length === 0) return null;

  return <CardsTrack items={items} t={t} />;
}
