"use client";

import { useState } from "react";
import useSWR from "swr";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { REGION_CODES, REGION_I18N_KEY, type RegionCode } from "@/lib/maps/region-codes";
import { Card } from "@/components/ui/card";
import { FilterChip } from "@/components/ui/filter-chip";
import { cn } from "@/lib/utils";

type Person = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  headline: string | null;
  role: string;
  lookingFor: string[];
};
const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<{ people: Person[] }>);

/**
 * People widget (WIREFRAMES §4.1) — a live cut of public members in a region,
 * with their role + what they're seeking. Region chips let the visitor switch;
 * defaults to the first region (a logged-in viewer's own region can be passed in).
 */
export default function PeopleWidget(props: {
  title?: string;
  description?: string;
  limit?: number;
  region?: RegionCode;
  locale?: string;
}) {
  const t = useTranslations("home");
  const tRegions = useTranslations("navigation.regions");
  const [region, setRegion] = useState<RegionCode>(props.region || REGION_CODES[0]);

  const { data, isLoading } = useSWR(
    `/api/home/people?region=${region}&limit=${props.limit || 6}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );
  const people = data?.people ?? [];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-heading text-2xl font-bold text-ccm-midnight">
          {props.title || t("peopleTitle")}
        </h2>
        {props.description && <p className="mt-1 text-muted-foreground">{props.description}</p>}
      </div>

      {/* Region switcher */}
      <div className="flex flex-wrap gap-2">
        {REGION_CODES.map((code) => (
          <FilterChip
            key={code}
            label={tRegions(REGION_I18N_KEY[code])}
            active={region === code}
            onClick={() => setRegion(code)}
          />
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : people.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("peopleEmpty")}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {people.map((p) => (
            <Card key={p.id} className="flex items-start gap-3 p-3">
              <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-ccm-sky/20">
                {p.image && <Image src={p.image} alt="" fill className="object-cover" sizes="40px" />}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ccm-midnight">{p.name || p.username || t("aMember")}</p>
                {p.headline && <p className="truncate text-xs text-muted-foreground">{p.headline}</p>}
                {p.lookingFor.length > 0 && (
                  <p className={cn("mt-1 truncate text-xs text-ccm-sea")}>
                    {t("seeking")}: {p.lookingFor.join(", ")}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
