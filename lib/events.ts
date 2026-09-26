import "server-only";
import { getEvents, type ContentEvent } from "@/lib/content/discovery";

export type EventListItem = Pick<
  ContentEvent,
  | "_id"
  | "title"
  | "description"
  | "scope"
  | "startAt"
  | "endAt"
  | "mode"
  | "locationName"
  | "url"
  | "linkedProject"
  | "place"
  | "slug"
>;

/**
 * Approved events, soonest-first. Only `status == "approved"` is public (the
 * moderation gate, mirroring case studies / lived experiences).
 */
export async function fetchApprovedEvents(limit = 50): Promise<EventListItem[]> {
  return getEvents({ limit });
}

export type EventDetail = ContentEvent;

/** One approved event by slug — the public event page (X6). */
export async function fetchEventBySlug(slug: string): Promise<EventDetail | null> {
  const [event] = await getEvents({ slug });
  return event ?? null;
}

// The iCalendar builder lives in lib/ics.ts (shared with the client
// calendar block). Re-exported to keep this module the events facade.
export { buildEventIcs } from "@/lib/ics";
