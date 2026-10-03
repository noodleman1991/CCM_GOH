"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { EventTile } from "@/components/events/event-tile";
import { useBrowserTimeZone } from "@/components/events/local-when";
import { groupByMonth, type EventTileData } from "@/lib/events/listing";

const PAST_PAGE = 12;

/** "GMT+1" for the zone the tiles use — not the server's, so server and browser agree. */
function zoneName(timeZone: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: "short" }).formatToParts(new Date()).find((p) => p.type === "timeZoneName")?.value ?? timeZone;
}

/** Upcoming events by month in the visitor's time zone, then past ones newest first (events spec §3.5). */
export function EventList({ upcoming, past, locale }: { upcoming: EventTileData[]; past: EventTileData[]; locale: string }) {
  const t = useTranslations("events.list");
  const timeZone = useBrowserTimeZone();
  const [pastShown, setPastShown] = useState(PAST_PAGE);
  const months = groupByMonth(upcoming, locale, timeZone ?? "UTC");

  return (
    <div className="space-y-10">
      {upcoming.length > 0 && (
        <section aria-labelledby="events-upcoming" className="space-y-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id="events-upcoming" className="font-heading text-2xl font-bold text-ccm-midnight">
              {t("upcoming")}
            </h2>
            {timeZone && <p className="text-sm text-muted-foreground">{t("timesIn", { zone: zoneName(timeZone, locale) })}</p>}
          </div>
          {months.map((month) => (
            <div key={month.key} className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wide text-ccm-sea">{month.label}</h3>
              <ul className="grid grid-cols-1 gap-3 @content-md/page:grid-cols-2">
                {month.items.map((e) => (
                  <li key={e.id} className="flex [&>article]:flex-1">
                    <EventTile event={e} locale={locale} timeZone={timeZone} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {past.length > 0 && (
        <section aria-labelledby="events-past" className="space-y-4">
          <h2 id="events-past" className="font-heading text-2xl font-bold text-ccm-midnight">
            {t("past")}
          </h2>
          <ul className="grid grid-cols-1 gap-3 @content-md/page:grid-cols-2">
            {past.slice(0, pastShown).map((e) => (
              <li key={e.id} className="flex [&>article]:flex-1">
                <EventTile event={e} locale={locale} timeZone={timeZone} past />
              </li>
            ))}
          </ul>
          {past.length > pastShown && (
            <button
              type="button"
              onClick={() => setPastShown((n) => n + PAST_PAGE)}
              className="inline-flex min-h-11 items-center rounded-full border border-ccm-midnight/15 px-5 text-sm font-bold text-ccm-midnight hover:bg-ccm-sky/15"
            >
              {t("pastShowMore")}
            </button>
          )}
        </section>
      )}
    </div>
  );
}
