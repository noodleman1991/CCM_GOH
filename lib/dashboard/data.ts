import "server-only";
import { prisma, safeQuery } from "@/lib/prisma";
import { getAllApprovedEvents } from "@/lib/content/discovery";
import { pickCommunityEvents, pickGoingEvents } from "@/lib/dashboard/community-events";
import type { EventTileData } from "@/lib/events/listing";

/** Your RSVPs (GOING, still coming) and your community's next events — one events read for both. */
export async function getDashboardEvents(userId: string, communitySlug: string | null): Promise<{ going: EventTileData[]; community: EventTileData[] }> {
  const [events, rsvps] = await Promise.all([
    getAllApprovedEvents().catch(() => []),
    safeQuery(() => prisma.rsvp.findMany({ where: { userId, status: "GOING" }, select: { eventId: true } })),
  ]);
  const now = new Date();
  const goingIds = new Set(rsvps.success ? rsvps.data.map((r) => r.eventId) : []);
  return { going: pickGoingEvents(events, goingIds, now), community: pickCommunityEvents(events, communitySlug, now, 3) };
}
