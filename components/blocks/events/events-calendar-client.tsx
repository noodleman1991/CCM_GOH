"use client";

import { useMemo, useState } from "react";
import { CalendarPlus, ChevronLeft, ChevronRight, Globe, MapPin, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { RsvpButton } from "@/components/events/rsvp-button";
import { buildMonthGrid, eventDayKeys, dayKey, upcomingEvents } from "@/lib/events/calendar";
import { isRTL } from "@/i18n/i18n-helpers";
import { cn } from "@/lib/utils";
import type { EventListItem } from "@/lib/events";

const MODE_ICON = { online: Globe, in_person: MapPin, hybrid: Users } as const;

/** Labels resolved server-side (this stays provider-free, matching event-card.tsx). */
export type EventsCalendarLabels = {
  community: string;
  project: string;
  modeOnline: string;
  modeInPerson: string;
  modeHybrid: string;
  upcomingHeading: string;
  subscribe: string;
  noUpcoming: string;
  prevMonth: string;
  nextMonth: string;
  today: string;
};

type Props = {
  events: EventListItem[];
  signedIn: boolean;
  labels: EventsCalendarLabels;
  title?: string | null;
  description?: string | null;
  upcomingLimit?: number | null;
  locale?: string;
};

/** Pad a number to 2 digits for the .ics timestamp. */
const p2 = (n: number) => String(n).padStart(2, "0");

/** UTC `YYYYMMDDTHHMMSSZ` for an iCal DTSTART/DTSTAMP. */
function icsDate(d: Date): string {
  return (
    `${d.getUTCFullYear()}${p2(d.getUTCMonth() + 1)}${p2(d.getUTCDate())}` +
    `T${p2(d.getUTCHours())}${p2(d.getUTCMinutes())}${p2(d.getUTCSeconds())}Z`
  );
}

/** Escape iCal text per RFC 5545 (commas, semicolons, newlines, backslashes). */
function icsEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

/** Build an .ics calendar string from the approved events (client-side, no network). */
function buildIcs(events: EventListItem[]): string {
  const now = icsDate(new Date());
  const vevents = events
    .filter((e) => e.startAt)
    .map((e) => {
      const start = new Date(e.startAt as string);
      const end = e.endAt ? new Date(e.endAt) : null;
      const lines = [
        "BEGIN:VEVENT",
        `UID:${e._id}@ccm-hub`,
        `DTSTAMP:${now}`,
        `DTSTART:${icsDate(start)}`,
        ...(end ? [`DTEND:${icsDate(end)}`] : []),
        `SUMMARY:${icsEscape(e.title || "Event")}`,
        ...(e.description ? [`DESCRIPTION:${icsEscape(e.description)}`] : []),
        ...(e.locationName ? [`LOCATION:${icsEscape(e.locationName)}`] : []),
        ...(e.url ? [`URL:${icsEscape(e.url)}`] : []),
        "END:VEVENT",
      ];
      return lines.join("\r\n");
    });
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//CCM Hub//Events//EN", ...vevents, "END:VCALENDAR"].join(
    "\r\n"
  );
}

/**
 * Events calendar block (client). A month grid (`grid-cols-7`, Monday-first) with
 * event days tinted, paged client-side over the already-fetched approved events;
 * an upcoming-events list with inline RSVP (reusing RsvpButton); and a Subscribe
 * (iCal) button that downloads an .ics built from the events. Mobile-first + RTL.
 */
export default function EventsCalendarClient({
  events,
  signedIn,
  labels,
  title,
  description,
  upcomingLimit,
  locale = "en",
}: Props) {
  const rtl = isRTL(locale);
  const today = useMemo(() => new Date(), []);
  const [view, setView] = useState({ year: today.getFullYear(), month0: today.getMonth() });

  const grid = useMemo(() => buildMonthGrid(view.year, view.month0), [view]);
  const eventDays = useMemo(() => eventDayKeys(events), [events]);
  const upcoming = useMemo(
    () => upcomingEvents(events, new Date(), upcomingLimit ?? 5),
    [events, upcomingLimit]
  );
  const todayKey = dayKey(today);

  const monthLabel = new Date(view.year, view.month0, 1).toLocaleString(locale, {
    month: "long",
    year: "numeric",
  });

  // Weekday header, Monday-first, localized + narrow. Jan 1 2024 is a Monday.
  const weekdays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        new Date(2024, 0, 1 + i).toLocaleString(locale, { weekday: "narrow" })
      ),
    [locale]
  );

  const step = (delta: number) =>
    setView((v) => {
      const next = new Date(v.year, v.month0 + delta, 1);
      return { year: next.getFullYear(), month0: next.getMonth() };
    });

  const onSubscribe = () => {
    const blob = new Blob([buildIcs(events)], { type: "text/calendar;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = "events.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
  };

  // In RTL the "previous" arrow points right; flip the chevrons logically.
  const PrevIcon = rtl ? ChevronRight : ChevronLeft;
  const NextIcon = rtl ? ChevronLeft : ChevronRight;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeader title={title || labels.upcomingHeading} subtitle={description || undefined} />
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={onSubscribe}>
          <CalendarPlus className="size-4" />
          {labels.subscribe}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        {/* Month grid */}
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => step(-1)}
              aria-label={labels.prevMonth}
            >
              <PrevIcon className="size-4" />
            </Button>
            <span className="font-heading text-sm font-semibold capitalize text-ccm-midnight">
              {monthLabel}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => step(1)}
              aria-label={labels.nextMonth}
            >
              <NextIcon className="size-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {weekdays.map((w, i) => (
              <div key={i} className="pb-1 text-[0.65rem] font-medium uppercase text-muted-foreground">
                {w}
              </div>
            ))}
            {grid.map((cell) => {
              const hasEvent = eventDays.has(cell.key);
              const isToday = cell.key === todayKey;
              return (
                <div
                  key={cell.key}
                  className={cn(
                    "relative flex aspect-square items-center justify-center rounded-md text-sm",
                    cell.inMonth ? "text-ccm-midnight" : "text-muted-foreground/40",
                    hasEvent && cell.inMonth && "bg-ccm-sky/30 font-semibold",
                    isToday && "ring-2 ring-ccm-water ring-offset-1"
                  )}
                  aria-current={isToday ? "date" : undefined}
                >
                  {cell.date.getDate()}
                  {hasEvent && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-1 size-1 rounded-full bg-ccm-water"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Upcoming list */}
        <div className="space-y-3">
          <h3 className="font-heading text-base font-semibold text-ccm-midnight">
            {labels.upcomingHeading}
          </h3>
          {upcoming.length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">{labels.noUpcoming}</Card>
          ) : (
            upcoming.map((e) => {
              const start = e.startAt ? new Date(e.startAt) : null;
              const Mode = e.mode ? MODE_ICON[e.mode] : null;
              const modeLabel =
                e.mode === "in_person"
                  ? labels.modeInPerson
                  : e.mode === "hybrid"
                    ? labels.modeHybrid
                    : labels.modeOnline;
              return (
                <Card key={e._id} className="flex gap-4 p-4">
                  <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-ccm-sky/15 py-2 text-ccm-midnight">
                    {start ? (
                      <>
                        <span className="text-xs font-medium uppercase">
                          {start.toLocaleString(locale, { month: "short" })}
                        </span>
                        <span className="text-xl font-bold leading-none">{start.getDate()}</span>
                      </>
                    ) : (
                      <span className="text-xs">—</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {e.scope === "project" ? labels.project : labels.community}
                      </Badge>
                      {Mode && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Mode className="size-3" />
                          {modeLabel}
                        </span>
                      )}
                    </div>
                    <h4 className="truncate font-heading font-semibold text-ccm-midnight">{e.title}</h4>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {start && start.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" })}
                      {e.locationName ? ` · ${e.locationName}` : ""}
                    </p>
                    {signedIn && (
                      <div className="mt-3">
                        <RsvpButton eventId={e._id} />
                      </div>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
