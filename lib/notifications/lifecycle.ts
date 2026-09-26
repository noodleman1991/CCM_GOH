import type { NotificationType } from "@/generated/prisma";

/**
 * Pure payload builders for the lifecycle notification spine (X3).
 * Kept free of prisma/server imports so they are trivially unit-testable;
 * lib/notifications/emit.ts is the side-effectful wrapper.
 */

export type NotificationRow = {
  recipientId: string;
  type: NotificationType;
  actorId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  snippet?: string | null;
};

export type LifecycleEvent =
  | {
      kind: "task_assigned";
      assigneeId: string;
      actorId: string;
      collaborationId: string;
      taskTitle: string;
    }
  | {
      kind: "output_status";
      memberIds: string[];
      actorId?: string | null;
      collaborationId: string;
      outputTitle: string;
      status: string;
      sanityId: string;
    }
  | {
      kind: "thread_reply";
      participantIds: string[];
      actorId: string;
      collaborationId: string;
      threadId: string;
      threadTitle: string;
    }
  | {
      kind: "member_joined";
      memberIds: string[];
      newMemberId: string;
      collaborationId: string;
      memberName: string;
    }
  | {
      kind: "followed_publish";
      followerIds: string[];
      actorId?: string | null;
      entityType: string;
      entityId: string;
      title: string;
    }
  | {
      kind: "event_reminder";
      attendeeIds: string[];
      eventId: string;
      eventTitle: string;
    };

/** One row per recipient; self-notifications are filtered by createNotification
 *  (actorId === recipientId) but audiences are deduped here regardless. */
export function buildNotifications(event: LifecycleEvent): NotificationRow[] {
  switch (event.kind) {
    case "task_assigned":
      return [
        {
          recipientId: event.assigneeId,
          type: "TASK_ASSIGNED",
          actorId: event.actorId,
          entityType: "collaboration",
          entityId: event.collaborationId,
          snippet: event.taskTitle,
        },
      ];
    case "output_status":
      return dedupe(event.memberIds).map((recipientId) => ({
        recipientId,
        type: "OUTPUT_STATUS",
        actorId: event.actorId ?? null,
        entityType: "collaboration",
        entityId: event.collaborationId,
        snippet: `${event.outputTitle} — ${event.status}`,
      }));
    case "thread_reply":
      return dedupe(event.participantIds).map((recipientId) => ({
        recipientId,
        type: "THREAD_REPLY",
        actorId: event.actorId,
        entityType: "collaborationThread",
        entityId: event.threadId,
        snippet: event.threadTitle,
      }));
    case "member_joined":
      return dedupe(event.memberIds).map((recipientId) => ({
        recipientId,
        type: "MEMBER_JOINED",
        actorId: event.newMemberId,
        entityType: "collaboration",
        entityId: event.collaborationId,
        snippet: event.memberName,
      }));
    case "followed_publish":
      return dedupe(event.followerIds).map((recipientId) => ({
        recipientId,
        type: "FOLLOWED_PUBLISH",
        actorId: event.actorId ?? null,
        entityType: event.entityType,
        entityId: event.entityId,
        snippet: event.title,
      }));
    case "event_reminder":
      return dedupe(event.attendeeIds).map((recipientId) => ({
        recipientId,
        type: "EVENT_REMINDER",
        entityType: "event",
        entityId: event.eventId,
        snippet: event.eventTitle,
      }));
  }
}

function dedupe(ids: string[]): string[] {
  return [...new Set(ids.filter(Boolean))];
}
