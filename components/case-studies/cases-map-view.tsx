"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { useSearchParams } from "next/navigation";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { RegionChoropleth } from "@/components/maps/region-choropleth";
import { TypedCard } from "@/components/cards/typed-card";
import type { TypedCardItem } from "@/lib/cards/type-style";
import { RC_SLUG_TO_REGION, REGION_TO_RC_SLUG, type RegionCode } from "@/lib/maps/region-codes";
import type { RegionDatum } from "@/lib/maps/region-facets";
import type { PinCluster } from "@/lib/maps/cluster-pins";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export type CasesMapItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  communityName: string | null;
  image?: string | null;
  date?: string | null;
};

/** Map half of the §4.11 Gallery‖Map browse (mock §2): the illustration map
 *  full-width on top, a results panel of slim typed cards below — both driven
 *  by ONE filter state (the URL). Clicking a region writes
 *  ?communities=<slug> so the server refetches both views consistently. */
export function CasesMapView({
  data,
  items,
  regionLabels,
  emptyLabel,
  countLabel,
  galleryLabel,
}: {
  data: RegionDatum[];
  items: CasesMapItem[];
  regionLabels: Record<RegionCode, string>;
  emptyLabel: string;
  /** Pre-localized "N case studies in view" header. */
  countLabel: string;
  /** Pre-localized "Open as gallery" link text. */
  galleryLabel: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Geo pins (task #12: "pins throughout"): when exactly one region filter is
  // active, its geotagged case studies drop as pins — the same layer, colours
  // and clustering the Atlas uses. No region selected → the choropleth's
  // shading carries the story alone.
  const communitiesParam = (searchParams.get("communities") ?? "").split(",").map((v) => v.trim()).filter(Boolean);
  const activeRegion = communitiesParam.length === 1 ? RC_SLUG_TO_REGION[communitiesParam[0]] : undefined;
  const { data: pinsData } = useSWR<{ pins: PinCluster[] }>(
    activeRegion ? `/api/maps/region-pins?region=${activeRegion}&facets=caseStudyCount` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  const onSelect = useCallback(
    (code: RegionCode) => {
      const params = new URLSearchParams(searchParams.toString());
      const slug = REGION_TO_RC_SLUG[code];
      if (params.get("communities") === slug) params.delete("communities");
      else params.set("communities", slug);
      params.set("view", "map");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  // Same page minus the view param = the gallery (its default view).
  const galleryQS = (() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("view");
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  })();

  const toCardItem = (item: CasesMapItem): TypedCardItem => ({
    type: "caseStudy",
    id: item.id,
    title: item.title,
    href: `/research-and-action/case-studies/${item.slug}`,
    excerpt: item.excerpt || null,
    image: item.image ?? null,
    meta: item.communityName ?? undefined,
    date: item.date ?? null,
  });

  return (
    <div className="space-y-4">
      <RegionChoropleth
        data={data}
        selectedCode={activeRegion ?? null}
        pins={pinsData?.pins}
        onSelect={onSelect}
        labelFor={(code) => regionLabels[code] ?? code}
        className="w-full"
      />
      <section className="space-y-3 rounded-2xl border bg-card p-4 @content-sm/page:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 className="font-heading text-base font-bold text-ccm-midnight">{countLabel}</h2>
          <Link
            href={`/research-and-action/case-studies${galleryQS}`}
            className="font-heading text-sm font-semibold text-[var(--color-ccm-water)] hover:underline"
          >
            {galleryLabel} →
          </Link>
        </div>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 @content-md/page:grid-cols-3 @content-xl/page:grid-cols-4">
            {items.map((item) => (
              <TypedCard key={item.id} item={toCardItem(item)} variant="grid" className="h-full" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
