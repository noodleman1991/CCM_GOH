import "server-only";
import { client } from "@/sanity/lib/client";
import type { SanityPlace } from "@/types/case-study";

export type EventListItem = {
  _id: string;
  title: string | null;
  description: string | null;
  scope: "community" | "project" | null;
  startAt: string | null;
  endAt: string | null;
  mode: "online" | "in_person" | "hybrid" | null;
  locationName: string | null;
  url: string | null;
  linkedProject: string | null;
  place?: SanityPlace | null;
  slug?: string | null;
};

/**
 * Approved events, soonest-first. Only `status == "approved"` is public (the
 * moderation gate, mirroring case studies / lived experiences).
 */
export async function fetchApprovedEvents(limit = 50): Promise<EventListItem[]> {
  return client.fetch<EventListItem[]>(
    `*[_type == "event" && status == "approved"] | order(startAt asc)[0...$limit]{
      _id, title, description, scope, startAt, endAt, mode, locationName, url, linkedProject,
      "slug": slug.current
    }`,
    { limit }
  );
}

export type EventDetail = EventListItem & {
  slug: string | null;
  recordingUrl: string | null;
  relatedCollaboration: string | null;
  coverImage: { asset?: { url?: string | null } | null } | null;
  body: unknown[] | null;
};

/** One approved event by slug — the public event page (X6). */
export async function fetchEventBySlug(slug: string): Promise<EventDetail | null> {
  return client.fetch<EventDetail | null>(
    `*[_type == "event" && status == "approved" && slug.current == $slug][0]{
      _id, title, description, scope, startAt, endAt, mode, locationName, url,
      "linkedProject": linkedProject, place,
      "slug": slug.current,
      recordingUrl,
      relatedCollaboration,
      coverImage{ asset->{ url } },
      body
    }`,
    { slug }
  );
}

/** Minimal RFC-5545 escape for iCalendar TEXT values. */
function icsEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Build a single-event .ics file (X6 add-to-calendar). Pure — unit-testable. */
export function buildEventIcs(event: {
  id: string;
  title: string;
  description?: string | null;
  startAt: string;
  endAt?: string | null;
  location?: string | null;
  url?: string | null;
}): string {
  const dt = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Connecting Climate Minds//Events//EN",
    "BEGIN:VEVENT",
    `UID:${event.id}@connectingclimateminds.org`,
    `DTSTAMP:${dt(event.startAt)}`,
    `DTSTART:${dt(event.startAt)}`,
    ...(event.endAt ? [`DTEND:${dt(event.endAt)}`] : []),
    `SUMMARY:${icsEscape(event.title)}`,
    ...(event.description ? [`DESCRIPTION:${icsEscape(event.description)}`] : []),
    ...(event.location ? [`LOCATION:${icsEscape(event.location)}`] : []),
    ...(event.url ? [`URL:${event.url}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}
