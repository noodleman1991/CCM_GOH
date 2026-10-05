/** Which events the dashboard shows (dashboard spec D2). Pure. */
import type { ContentEvent } from "@/lib/content/discovery";
import { isUpcoming, toEventTile, type EventTileData } from "@/lib/events/listing";

function upcomingTiles(events: ContentEvent[], now: Date): EventTileData[] {
  return events
    .map(toEventTile)
    .filter((t): t is EventTileData => t !== null && isUpcoming(t, now))
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
}

export function pickCommunityEvents(events: ContentEvent[], communitySlug: string | null, now: Date, limit = 3): EventTileData[] {
  const inRegion = communitySlug ? events.filter((e) => e.relatedCommunity?.slug === communitySlug) : events;
  return upcomingTiles(inRegion, now).slice(0, limit);
}

export function pickGoingEvents(events: ContentEvent[], goingIds: Set<string>, now: Date): EventTileData[] {
  return upcomingTiles(events.filter((e) => goingIds.has(e._id)), now);
}
