/**
 * The ONE iCalendar builder (RFC 5545). Pure and environment-agnostic — used
 * by the server .ics route (single event) and the client calendar block
 * (bulk subscribe). Replaces two divergent implementations that disagreed on
 * date normalization, DTSTAMP semantics, and escaping.
 */

export type IcsEvent = {
  id: string;
  title: string;
  description?: string | null;
  /** ISO datetime (any offset — normalized to UTC). */
  startAt: string;
  endAt?: string | null;
  location?: string | null;
  url?: string | null;
};

const p2 = (n: number) => String(n).padStart(2, "0");

/** UTC `YYYYMMDDTHHMMSSZ` — offset ISO inputs are normalized, not munged. */
export function icsDate(d: Date): string {
  return (
    `${d.getUTCFullYear()}${p2(d.getUTCMonth() + 1)}${p2(d.getUTCDate())}` +
    `T${p2(d.getUTCHours())}${p2(d.getUTCMinutes())}${p2(d.getUTCSeconds())}Z`
  );
}

/** Escape iCal TEXT per RFC 5545 (backslash first; \r\n and \n both fold). */
export function icsEscape(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function vevent(event: IcsEvent, stamp: string): string[] {
  const start = new Date(event.startAt);
  const end = event.endAt ? new Date(event.endAt) : null;
  return [
    "BEGIN:VEVENT",
    `UID:${event.id}@connectingclimateminds.org`,
    // DTSTAMP is the moment the object was created (RFC 5545), not the event start.
    `DTSTAMP:${stamp}`,
    `DTSTART:${icsDate(start)}`,
    ...(end ? [`DTEND:${icsDate(end)}`] : []),
    `SUMMARY:${icsEscape(event.title)}`,
    ...(event.description ? [`DESCRIPTION:${icsEscape(event.description)}`] : []),
    ...(event.location ? [`LOCATION:${icsEscape(event.location)}`] : []),
    ...(event.url ? [`URL:${icsEscape(event.url)}`] : []),
    "END:VEVENT",
  ];
}

/** Build a calendar for one or more events. `now` is injectable for tests. */
export function buildIcs(events: IcsEvent[], now: Date = new Date()): string {
  const stamp = icsDate(now);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Connecting Climate Minds//Events//EN",
    ...events.filter((e) => e.startAt).flatMap((e) => vevent(e, stamp)),
    "END:VCALENDAR",
  ].join("\r\n");
}

/** Single-event convenience (the /api/events/[slug]/ics route). */
export function buildEventIcs(event: IcsEvent, now: Date = new Date()): string {
  return buildIcs([event], now);
}
