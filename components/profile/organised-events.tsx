"use client";

import { EventTile } from "@/components/events/event-tile";
import { useBrowserTimeZone } from "@/components/events/local-when";
import type { EventTileData } from "@/lib/events/listing";

/** Events a member organises, in the visitor's own zone; past ones look past. */
export function OrganisedEvents({ events, locale, now }: { events: EventTileData[]; locale: string; now: string }) {
  const timeZone = useBrowserTimeZone();
  return (
    <ul className="grid gap-3 @2xl:grid-cols-2">
      {events.map((e) => (
        <li key={e.id} className="flex [&>article]:flex-1">
          <EventTile event={e} locale={locale} timeZone={timeZone} past={(e.endAt ?? e.startAt) < now} />
        </li>
      ))}
    </ul>
  );
}
