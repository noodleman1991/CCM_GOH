"use client";

import useSWR from "swr";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import { FACETS, facetForContentType, type FacetId } from "@/lib/maps/region-facets";
import type { FacetContentType } from "@/lib/maps/cluster-pins";
import { COLOR, CCM } from "@/lib/ccm-colors";
import { cn } from "@/lib/utils";

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
  researchOutput: "reportCount",
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
 * One content card: thumbnail-led (spec E1). Falls back to a region-tinted
 * placeholder — carrying the place text/country code when there's no image —
 * so a card is never a blank box. (`LocaleMap` itself is a server component,
 * built on `server-only` geometry libs, and can't render inside this client
 * card grid; the tinted placeholder is the client-safe equivalent the spec
 * names as the fallback's second option.)
 */
function ContentCard({ item, tMap }: { item: Item; tMap: (key: string) => string }) {
  const def = facetForContentType(item.type as FacetContentType);
  const typeLabel = def ? tMap(def.labelKey) : undefined;

  return (
    <Link href={hrefFor(item.type, item.slug)} className="group block h-full">
      <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-video shrink-0 bg-ccm-sky/15">
          {item.image ? (
            <Image
              src={item.image}
              alt=""
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 60vw"
              placeholder={item.imageLqip ? "blur" : undefined}
              blurDataURL={item.imageLqip ?? undefined}
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center px-2"
              style={{ backgroundColor: CCM.sky, opacity: 0.35 }}
            >
              {item.countryCode3 && (
                <span className="truncate text-xs font-semibold text-ccm-midnight/70">
                  {item.countryCode3}
                </span>
              )}
            </div>
          )}
          {typeLabel && (
            <span className="absolute start-2 top-2 rounded-full bg-card/90 px-2 py-0.5 text-[11px] font-semibold text-ccm-midnight shadow-sm">
              {typeLabel}
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1 p-2.5">
          <p className="line-clamp-2 text-xs font-medium text-ccm-midnight group-hover:text-ccm-sea">
            <bdi>{item.title || tMap("untitled")}</bdi>
          </p>
          {item.place && (
            <p className="truncate text-[11px] text-muted-foreground">
              <bdi>{item.place}</bdi>
            </p>
          )}
        </div>
      </Card>
    </Link>
  );
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

/**
 * Track layout shared by both modes below: horizontal snap-scroll strip on
 * mobile (each card ~70% width so the next peeks in), 3–4 col grid from `sm`
 * up. Cards spanning multiple content types get small dot+label group headers
 * ahead of that type's run (spec E1) — skipped entirely for a single-type set.
 */
function CardsTrack({ items, t }: { items: Item[]; t: (key: string) => string }) {
  const types = [...new Set(items.map((i) => i.type))];
  const grouped = types.length > 1;

  if (!grouped) {
    return (
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] lg:grid lg:grid-cols-4 lg:overflow-visible [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <div key={item.id} className="w-[70%] shrink-0 snap-start sm:w-[45%] lg:w-auto">
            <ContentCard item={item} tMap={t} />
          </div>
        ))}
      </div>
    );
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
            <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] lg:grid lg:grid-cols-4 lg:overflow-visible [&::-webkit-scrollbar]:hidden">
              {groupItems.map((item) => (
                <div key={item.id} className="w-[70%] shrink-0 snap-start sm:w-[45%] lg:w-auto">
                  <ContentCard item={item} tMap={t} />
                </div>
              ))}
            </div>
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

/**
 * The selected region's actual content, as cards (Atlas D2/E1). Replaces the
 * count-only drill-in with the real items for the chosen region + facet.
 */
export function RegionContentCards({
  region,
  facet,
  theme,
  q,
}: {
  region: string;
  facet: string;
  theme?: string | null;
  q?: string;
}) {
  const t = useCardLabels();
  // Theme/q ride along so the cards always show the same filtered set the
  // choropleth counts describe (count↔cards consistency).
  const filterQS = `${theme ? `&theme=${encodeURIComponent(theme)}` : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
  const { data, isLoading } = useSWR(
    `/api/maps/region-items?region=${region}&facet=${facet}${filterQS}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );
  const items = data?.items ?? [];

  if (isLoading) return <CardsSkeleton />;
  if (items.length === 0) return null;

  return <CardsTrack items={items} t={t} />;
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
