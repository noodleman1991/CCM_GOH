import "server-only";
import { prisma, safeQuery } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications/service";
import { structuredSnippet } from "@/lib/notifications/structured";

const DAY = 24 * 60 * 60 * 1000;

/** The sender hears, in the hub, what happened to what they sent (alongside any email). */
export async function notifyOutcomeInHub(input: { kind: "caseStudy" | "livedExperience" | "researchOutput" | "event"; submittedBy: string | null; title: string; status: string }): Promise<void> {
  if (!input.submittedBy || !["approved", "revision", "rejected"].includes(input.status)) return;
  await createNotification({
    recipientId: input.submittedBy,
    type: "OUTPUT_STATUS",
    entityType: "contribution",
    entityId: input.kind,
    snippet: structuredSnippet("outcome", { title: input.title, status: input.status }),
  });
}

/** A new event in a region someone follows — at most one such note per person, region and day. */
export async function notifyRegionFollowers(input: { communitySlug: string | null; eventSlug: string; eventTitle: string; now?: Date }): Promise<number> {
  if (!input.communitySlug) return 0;
  const now = input.now ?? new Date();
  const follows = await safeQuery(() => prisma.follow.findMany({ where: { targetType: "REGION", targetId: input.communitySlug! }, select: { userId: true } }));
  if (!follows.success || follows.data.length === 0) return 0;
  const ids = [...new Set(follows.data.map((f) => f.userId))];
  const recent = await safeQuery(() =>
    prisma.notification.findMany({
      where: { recipientId: { in: ids }, type: "FOLLOWED_PUBLISH", entityType: "event", createdAt: { gte: new Date(now.getTime() - DAY) }, snippet: { contains: `"region":"${input.communitySlug}"` } },
      select: { recipientId: true },
    }),
  );
  const already = new Set(recent.success ? recent.data.map((n) => n.recipientId) : []);
  const to = ids.filter((id) => !already.has(id));
  await Promise.all(
    to.map((recipientId) =>
      createNotification({ recipientId, type: "FOLLOWED_PUBLISH", entityType: "event", entityId: input.eventSlug, snippet: structuredSnippet("newEventInRegion", { title: input.eventTitle, region: input.communitySlug! }) }),
    ),
  );
  return to.length;
}
