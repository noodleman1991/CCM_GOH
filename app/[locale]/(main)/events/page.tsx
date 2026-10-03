import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CalendarPlus, CalendarSearch } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { FilterBar, type FilterExtra } from "@/components/filters/filter-bar";
import { EventList } from "@/components/events/event-list";
import { getAllApprovedEvents, type ContentEvent } from "@/lib/content/discovery";
import { applyFilters, buildOptions, isFiltering, type FilterTag } from "@/lib/filters/core";
import { parseFilterParams } from "@/lib/filters/params";
import { eventToFilterable } from "@/lib/filters/adapters";
import { isUpcoming, toEventTile, type EventTileData } from "@/lib/events/listing";
import { REGION_CODES, REGION_I18N_KEY, REGION_TO_RC_SLUG, type RegionCode } from "@/lib/maps/region-codes";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "events.list" });
  return { title: t("title"), description: t("subtitle"), openGraph: { title: t("title"), description: t("subtitle"), type: "website" } };
}

const COMMUNITY_SLUG_TO_REGION: Record<string, string> = Object.fromEntries(REGION_CODES.map((code) => [REGION_TO_RC_SLUG[code], code]));
const MODES = ["online", "in_person", "hybrid"] as const;
const ORIGINS = ["ccm", "external"] as const;
const modeOf = (e: ContentEvent) => (e.mode === "in_person" || e.mode === "hybrid" ? e.mode : "online");
const originOf = (e: ContentEvent) => (e.origin === "external" ? "external" : "ccm");
const pick = <T extends string>(value: unknown, allowed: readonly T[]): T | null =>
  typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : null;

/** Every event in one place — CCM's own and other organisations' — by month, in the visitor's time zone (events spec §3.5). */
export default async function EventsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "events.list" });
  const tFilters = await getTranslations({ locale, namespace: "filters" });
  const tRegions = await getTranslations({ locale, namespace: "navigation.regions" });

  const all = await getAllApprovedEvents();
  const items = all.map((e) => eventToFilterable(e, locale));
  const knownTags: FilterTag[] = [...new Map(items.flatMap((i) => i.tags).map((tag) => [tag.slug, tag])).values()];
  const active = parseFilterParams(sp, { tags: knownTags, communitySlugToRegion: COMMUNITY_SLUG_TO_REGION });
  const mode = pick(sp.mode, MODES);
  const origin = pick(sp.origin, ORIGINS);

  // The shared engine decides region / communities / themes / when / search;
  // the page's own two rows (where, who runs it) narrow after it. Each row's
  // counts come from the list filtered by everything except that row.
  const now = new Date();
  const engineOk = new Set(applyFilters(items, active, { now }).map((i) => i.id));
  const byExtras = (e: ContentEvent, skip?: "mode" | "origin") =>
    (skip === "mode" || !mode || modeOf(e) === mode) && (skip === "origin" || !origin || originOf(e) === origin);
  const countBy = <T extends string>(values: readonly T[], of: (e: ContentEvent) => T, skip: "mode" | "origin", selected: T | null) =>
    values
      .map((value) => ({ value, count: all.filter((e) => engineOk.has(e._id) && byExtras(e, skip) && of(e) === value).length }))
      .filter((o) => o.count > 0 || o.value === selected);

  const extras: FilterExtra[] = [
    {
      param: "mode",
      label: t("whereFilter"),
      value: mode,
      options: countBy(MODES, modeOf, "mode", mode).map((o) => ({
        ...o,
        label: t(o.value === "online" ? "modeOnline" : o.value === "in_person" ? "modeInPerson" : "modeHybrid"),
      })),
    },
    {
      param: "origin",
      label: t("whoFilter"),
      value: origin,
      options: countBy(ORIGINS, originOf, "origin", origin).map((o) => ({ ...o, label: t(o.value === "ccm" ? "originCcm" : "originExternal") })),
    },
  ];
  const extrasOk = new Set(all.filter((e) => byExtras(e)).map((e) => e._id));
  const regionLabel = (code: string) => tRegions(REGION_I18N_KEY[code as RegionCode]);
  const options = buildOptions(items.filter((i) => extrasOk.has(i.id)), active, { locale, regionLabel, now });

  const tiles = all
    .filter((e) => engineOk.has(e._id) && extrasOk.has(e._id))
    .map(toEventTile)
    .filter((tile): tile is EventTileData => tile !== null);
  const upcoming = tiles.filter((e) => isUpcoming(e, now));
  const past = tiles.filter((e) => !isUpcoming(e, now)).reverse();
  const filtering = isFiltering(active) || Boolean(mode || origin);

  const suggest = (
    <Button asChild className="gap-2">
      <Link href="/events/suggest">
        <CalendarPlus className="size-4" aria-hidden />
        {t("suggest")}
      </Link>
    </Button>
  );

  return (
    <div className="container max-w-6xl space-y-8 py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-ccm-midnight lg:text-4xl">{t("title")}</h1>
          <p className="max-w-2xl text-lg text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="shrink-0">{suggest}</div>
      </header>

      <FilterBar options={options} active={active} whenOptions={["upcoming", "past"]} extras={extras} />

      {tiles.length === 0 ? (
        <div className="space-y-4 rounded-2xl border border-dashed border-ccm-midnight/15 bg-white p-10 text-center">
          <CalendarSearch className="mx-auto size-10 text-ccm-sea/60" aria-hidden />
          <p className="font-heading text-lg font-bold text-ccm-midnight">{filtering ? tFilters("empty") : t("emptyUpcoming")}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {filtering && (
              <Button variant="outline" asChild>
                <Link href="/events">{tFilters("clear")}</Link>
              </Button>
            )}
            {suggest}
          </div>
        </div>
      ) : (
        <>
          {upcoming.length === 0 && !active.when && (
            <p className="rounded-2xl bg-ccm-sky/15 px-4 py-3 text-sm text-ccm-midnight">
              {t("emptyUpcoming")}{" "}
              <Link href="/events/suggest" className="font-bold text-ccm-sea hover:underline">
                {t("suggest")}
              </Link>
            </p>
          )}
          <EventList upcoming={upcoming} past={past} locale={locale} />
        </>
      )}
    </div>
  );
}
