import "server-only";
import { prisma, safeQuery } from "@/lib/prisma";

export type QueueTab = "pending" | "flagged" | "reported";

export type QueueItem = {
  id: string;
  targetType: string;
  targetId: string;
  authorName: string | null;
  authorId: string | null;
  body: string;
  createdAt: string;
  reason: string | null;
  reportCount: number;
};

/**
 * Fetch the moderation queue for a tab:
 *  - pending  : anonymous/held comments awaiting approval (status PENDING, no author)
 *  - flagged  : wordlist-flagged comments awaiting review (status PENDING, has author)
 *  - reported : VISIBLE comments with at least one OPEN report
 */
export async function getQueue(tab: QueueTab): Promise<QueueItem[]> {
  const result = await safeQuery(async () => {
    if (tab === "reported") {
      const rows = await prisma.comment.findMany({
        where: { reports: { some: { status: "OPEN" } } },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { _count: { select: { reports: true } } },
      });
      return rows.map((c) => ({
        id: c.id,
        targetType: c.targetType,
        targetId: c.targetId,
        authorName: c.authorName,
        authorId: c.authorId,
        body: c.body,
        createdAt: c.createdAt.toISOString(),
        reason: "reported",
        reportCount: c._count.reports,
      }));
    }

    const rows = await prisma.comment.findMany({
      where: {
        status: "PENDING",
        ...(tab === "pending" ? { authorId: null } : { authorId: { not: null } }),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { flags: { take: 1, orderBy: { createdAt: "desc" } } },
    });
    return rows.map((c) => ({
      id: c.id,
      targetType: c.targetType,
      targetId: c.targetId,
      authorName: c.authorName,
      authorId: c.authorId,
      body: c.body,
      createdAt: c.createdAt.toISOString(),
      reason: c.flags[0]?.reason ?? (tab === "pending" ? "held-anon" : null),
      reportCount: 0,
    }));
  });
  return result.success ? result.data : [];
}

export async function getQueueCounts(): Promise<Record<QueueTab, number>> {
  const result = await safeQuery(async () => {
    const [pending, flagged, reported] = await Promise.all([
      prisma.comment.count({ where: { status: "PENDING", authorId: null } }),
      prisma.comment.count({ where: { status: "PENDING", authorId: { not: null } } }),
      prisma.comment.count({ where: { reports: { some: { status: "OPEN" } } } }),
    ]);
    return { pending, flagged, reported };
  });
  return result.success ? result.data : { pending: 0, flagged: 0, reported: 0 };
}
