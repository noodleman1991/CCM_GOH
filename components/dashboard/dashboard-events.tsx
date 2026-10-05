"use client";

import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { EventTile } from "@/components/events/event-tile";
import { RsvpButton } from "@/components/events/rsvp-button";
import { useBrowserTimeZone } from "@/components/events/local-when";
import type { EventTileData } from "@/lib/events/listing";

/**
 * What's next in your community (or across the hub when you have none), with
 * RSVP right there (dashboard spec D2). Events you're already going to live in
 * Your week, so they're left out here — one home each.
 */
export function DashboardEvents({ going, community, hasCommunity, locale }: { going: EventTileData[]; community: EventTileData[]; hasCommunity: boolean; locale: string }) {
  const t = useTranslations("dashboard.events");
  const timeZone = useBrowserTimeZone();
  const goingIds = new Set(going.map((e) => e.id));
  const next = community.filter((e) => !goingIds.has(e.id)).slice(0, 3);
  if (next.length === 0) return null;

  return (
    <section aria-labelledby="dashboard-events" className="@container space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h2 id="dashboard-events" className="font-heading text-2xl font-bold text-ccm-midnight">
          {hasCommunity ? t("community") : t("hub")}
        </h2>
        <Link href="/events" className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-ccm-sea hover:underline">
          {t("allEvents")}
          <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden />
        </Link>
      </div>
      <ul className="grid gap-3 @2xl:grid-cols-2">
        {next.map((e) => (
          <li key={e.id} className="flex flex-col gap-2 [&>article]:flex-1">
            <EventTile event={e} locale={locale} timeZone={timeZone} />
            {/* Outside events sign people up on their own site. */}
            {!e.external && (
              <div className="self-start">
                <RsvpButton eventId={e.id} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
