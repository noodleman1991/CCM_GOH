"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { useSearchParams } from "next/navigation";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import { RegionChoropleth } from "@/components/maps/region-choropleth";
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
};

/** Map half of the §4.11 Gallery‖Map browse: compact result list + the CCM
 *  choropleth sharing ONE filter state (the URL). Clicking a region writes
 *  ?communities=<slug> so the server refetches both views consistently. */
export function CasesMapView({
  data,
  items,
  regionLabels,
  emptyLabel,
}: {
  data: RegionDatum[];
  items: CasesMapItem[];
  regionLabels: Record<RegionCode, string>;
  emptyLabel: string;
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

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <div className="order-2 space-y-3 lg:order-1">
        {items.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">{emptyLabel}</Card>
        ) : (
          items.map((item) => (
            <Link
              key={item.id}
              href={`/research-and-action/case-studies/${item.slug}`}
              className="block"
            >
              <Card className="space-y-1 p-4 transition-all hover:-translate-y-0.5 hover:border-ccm-sea/40 hover:shadow-md">
                <h3 className="font-heading font-semibold leading-snug text-ccm-midnight">
                  <bdi>{item.title}</bdi>
                </h3>
                {item.excerpt && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    <bdi>{item.excerpt}</bdi>
                  </p>
                )}
                {item.communityName && (
                  <p className="text-xs font-medium text-ccm-sea">{item.communityName}</p>
                )}
              </Card>
            </Link>
          ))
        )}
      </div>
      <div className="order-1 lg:order-2">
        <RegionChoropleth
          data={data}
          activeCode={activeRegion ?? null}
          pins={pinsData?.pins}
          onSelect={onSelect}
          labelFor={(code) => regionLabels[code] ?? code}
          className="w-full"
        />
      </div>
    </div>
  );
}
