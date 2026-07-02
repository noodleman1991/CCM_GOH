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
};

/**
 * Approved events, soonest-first. Only `status == "approved"` is public (the
 * moderation gate, mirroring case studies / lived experiences).
 */
export async function fetchApprovedEvents(limit = 50): Promise<EventListItem[]> {
  return client.fetch<EventListItem[]>(
    `*[_type == "event" && status == "approved"] | order(startAt asc)[0...$limit]{
      _id, title, description, scope, startAt, endAt, mode, locationName, url, linkedProject
    }`,
    { limit }
  );
}
