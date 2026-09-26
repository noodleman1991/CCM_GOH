import "server-only";
import { prisma, safeQuery } from "@/lib/prisma";
import { getOutputs } from "@/lib/collaboration/service";

/**
 * "What needs me?" — the workspace attention model (experience-plan X4).
 * One pull-side read over the same rows the notification spine writes, plus
 * the two states that ARE the work: my open tasks and the output pipeline.
 */

export type AttentionItem = {
  kind: "task" | "output" | "notification";
  /** Notification row id when kind=notification (for mark-read); task/output id otherwise. */
  id: string;
  title: string;
  detail: string | null;
  /** Where "open" should land, relative to the workspace (tab param). */
  tab: "plan" | "outputs" | "threads" | "overview";
};

export async function getWorkspaceAttention(
  collaborationId: string,
  userId: string | null
): Promise<AttentionItem[]> {
  if (!userId) return [];

  const [tasksR, outputs, threadIdsR] = await Promise.all([
    safeQuery(() =>
      prisma.task.findMany({
        where: { assigneeId: userId, status: { not: "DONE" }, stage: { plan: { collaborationId } } },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: { id: true, title: true, status: true },
      })
    ),
    getOutputs(collaborationId),
    safeQuery(() =>
      prisma.collaborationThread.findMany({
        where: { collaborationId },
        select: { id: true },
      })
    ),
  ]);

  const threadIds = threadIdsR.success ? threadIdsR.data.map((t) => t.id) : [];
  const unreadR = await safeQuery(() =>
    prisma.notification.findMany({
      where: {
        recipientId: userId,
        readAt: null,
        OR: [
          { entityType: "collaboration", entityId: collaborationId },
          ...(threadIds.length ? [{ entityType: "collaborationThread", entityId: { in: threadIds } }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, type: true, snippet: true },
    })
  );

  const items: AttentionItem[] = [];

  for (const output of outputs) {
    if (output.status === "revision") {
      items.push({ kind: "output", id: output.id, title: output.title, detail: "revision", tab: "outputs" });
    }
  }
  if (tasksR.success) {
    for (const task of tasksR.data) {
      items.push({ kind: "task", id: task.id, title: task.title, detail: task.status, tab: "plan" });
    }
  }
  if (unreadR.success) {
    for (const n of unreadR.data) {
      items.push({
        kind: "notification",
        id: n.id,
        title: n.snippet ?? "",
        detail: n.type,
        tab: n.type === "THREAD_REPLY" ? "threads" : "overview",
      });
    }
  }
  return items.slice(0, 8);
}
