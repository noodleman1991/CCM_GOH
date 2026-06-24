"use client";

import useSWR from "swr";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";

type Item = { id: string; type: string; title: string; slug: string; image: string | null; date: string | null };
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

/**
 * The selected region's actual content, as cards (Atlas D2). Replaces the
 * count-only drill-in with the real items for the chosen region + facet.
 */
export function RegionContentCards({ region, facet }: { region: string; facet: string }) {
  const t = useTranslations("atlas");
  const { data, isLoading } = useSWR(
    `/api/maps/region-items?region=${region}&facet=${facet}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );
  const items = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }
  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <Link key={item.id} href={hrefFor(item.type, item.slug)} className="group block">
          <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
            <div className="relative aspect-video bg-ccm-sky/15">
              {item.image && (
                <Image src={item.image} alt="" fill className="object-cover" sizes="(min-width: 640px) 33vw, 50vw" />
              )}
            </div>
            <div className="p-2">
              <p className="line-clamp-2 text-xs font-medium text-ccm-midnight group-hover:text-ccm-sea">
                {item.title || t("untitled")}
              </p>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
