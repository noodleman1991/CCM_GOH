import "server-only";
import { prisma, safeQuery } from "@/lib/prisma";
import type { NotificationType } from "@/generated/prisma";

export type NotificationDTO = {
  id: string;
  type: NotificationType;
  actorName: string | null;
  actorImage: string | null;
  entityType: string | null;
  entityId: string | null;
  snippet: string | null;
  readAt: string | null;
  createdAt: string;
};

/** Create a notification — skips self-notifications (actor === recipient). */
export async function createNotification(params: {
  recipientId: string;
  type: NotificationType;
  actorId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  snippet?: string | null;
}): Promise<void> {
  if (params.actorId && params.actorId === params.recipientId) return;
  await safeQuery(() =>
    prisma.notification.create({
      data: {
        recipientId: params.recipientId,
        type: params.type,
        actorId: params.actorId ?? null,
        entityType: params.entityType ?? null,
        entityId: params.entityId ?? null,
        snippet: params.snippet?.slice(0, 280) ?? null,
      },
    })
  );
}

/** Cheap unread count for the bell (indexed on (recipientId, readAt)). */
export async function unreadCount(userId: string): Promise<number> {
  const r = await safeQuery(() =>
    prisma.notification.count({ where: { recipientId: userId, readAt: null } })
  );
  return r.success ? r.data : 0;
}

export async function listNotifications(userId: string, limit = 20): Promise<NotificationDTO[]> {
  const r = await safeQuery(() =>
    prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        actor: { select: { firstName: true, lastName: true, username: true, image: true } },
      },
    })
  );
  if (!r.success) return [];
  return r.data.map((n) => ({
    id: n.id,
    type: n.type,
    actorName: n.actor
      ? [n.actor.firstName, n.actor.lastName].filter(Boolean).join(" ") || n.actor.username || null
      : null,
    actorImage: n.actor?.image ?? null,
    entityType: n.entityType,
    entityId: n.entityId,
    snippet: n.snippet,
    readAt: n.readAt?.toISOString() ?? null,
    createdAt: n.createdAt.toISOString(),
  }));
}

export async function markAllRead(userId: string): Promise<void> {
  await safeQuery(() =>
    prisma.notification.updateMany({
      where: { recipientId: userId, readAt: null },
      data: { readAt: new Date() },
    })
  );
}
