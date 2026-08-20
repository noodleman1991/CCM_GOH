"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/authz";
import { emitLifecycle } from "@/lib/notifications/emit";
import { createNotification } from "@/lib/notifications/service";
import { parseMentions } from "@/lib/comments/mentions";
import { authorizeCollab } from "@/lib/collaboration/service";
import type { TaskStatus } from "@/generated/prisma";

type Result<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

const STATUS_CYCLE: Record<TaskStatus, TaskStatus> = {
  TODO: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
  DONE: "TODO",
};

/**
 * Scope filters. Authorizing the caller against `collaborationId` is only half
 * the check: every child mutation must also prove the stage/task it targets
 * BELONGS to that collaboration. Without this, an EDITOR of any workspace
 * (including one they created) could mutate stages and tasks in any other
 * workspace whose child ids they knew.
 */
const stageScope = (collaborationId: string, stageId: string) => ({
  id: stageId,
  plan: { collaborationId },
});
const taskScope = (collaborationId: string, taskId: string) => ({
  id: taskId,
  stage: { plan: { collaborationId } },
});
const OUT_OF_SCOPE = { ok: false as const, error: "Not found in this workspace." };

/** Authorize a plan edit for a collaboration; returns a typed failure if not. */
async function canEdit(collaborationId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await authorizeCollab(collaborationId, "collab:editPlan");
    return { ok: true };
  } catch {
    return { ok: false, error: "Not permitted." };
  }
}

/** Get-or-create the plan for a collaboration. Edit-gated. */
export async function ensurePlan(collaborationId: string): Promise<Result<{ planId: string }>> {
  const auth = await canEdit(collaborationId);
  if (!auth.ok) return auth;
  const plan = await prisma.plan.upsert({
    where: { collaborationId },
    create: { collaborationId },
    update: {},
    select: { id: true },
  });
  return { ok: true, planId: plan.id };
}

const titleSchema = z.string().trim().min(1).max(200);

export async function addStage(collaborationId: string, title: string): Promise<Result<{ stageId: string }>> {
  const auth = await canEdit(collaborationId);
  if (!auth.ok) return auth;
  const parsed = titleSchema.safeParse(title);
  if (!parsed.success) return { ok: false, error: "Enter a stage title." };

  const plan = await prisma.plan.upsert({
    where: { collaborationId },
    create: { collaborationId },
    update: {},
    select: { id: true, _count: { select: { stages: true } } },
  });
  const stage = await prisma.planStage.create({
    data: { planId: plan.id, title: parsed.data, order: plan._count.stages },
    select: { id: true },
  });
  return { ok: true, stageId: stage.id };
}

export async function renameStage(collaborationId: string, stageId: string, title: string): Promise<Result> {
  const auth = await canEdit(collaborationId);
  if (!auth.ok) return auth;
  const parsed = titleSchema.safeParse(title);
  if (!parsed.success) return { ok: false, error: "Enter a stage title." };
  const r = await prisma.planStage.updateMany({
    where: stageScope(collaborationId, stageId),
    data: { title: parsed.data },
  });
  if (r.count === 0) return OUT_OF_SCOPE;
  return { ok: true };
}

export async function deleteStage(collaborationId: string, stageId: string): Promise<Result> {
  const auth = await canEdit(collaborationId);
  if (!auth.ok) return auth;
  const r = await prisma.planStage.deleteMany({ where: stageScope(collaborationId, stageId) }); // cascades tasks
  if (r.count === 0) return OUT_OF_SCOPE;
  return { ok: true };
}

export async function addTask(collaborationId: string, stageId: string, title: string): Promise<Result<{ taskId: string }>> {
  const auth = await canEdit(collaborationId);
  if (!auth.ok) return auth;
  const parsed = titleSchema.safeParse(title);
  if (!parsed.success) return { ok: false, error: "Enter a task." };
  const stage = await prisma.planStage.findFirst({ where: stageScope(collaborationId, stageId), select: { id: true } });
  if (!stage) return OUT_OF_SCOPE;
  const count = await prisma.task.count({ where: { stageId } });
  const task = await prisma.task.create({
    data: { stageId, title: parsed.data, order: count },
    select: { id: true },
  });
  return { ok: true, taskId: task.id };
}

/** Cycle a task TODO → IN_PROGRESS → DONE → TODO. */
export async function cycleTaskStatus(collaborationId: string, taskId: string): Promise<Result<{ status: TaskStatus }>> {
  const auth = await canEdit(collaborationId);
  if (!auth.ok) return auth;
  const task = await prisma.task.findFirst({ where: taskScope(collaborationId, taskId), select: { status: true } });
  if (!task) return OUT_OF_SCOPE;
  const next = STATUS_CYCLE[task.status];
  await prisma.task.update({ where: { id: taskId }, data: { status: next } });
  return { ok: true, status: next };
}

/** Move a task to another stage (kanban / plan-step move). */
export async function moveTask(collaborationId: string, taskId: string, toStageId: string): Promise<Result> {
  const auth = await canEdit(collaborationId);
  if (!auth.ok) return auth;
  const [task, stage] = await Promise.all([
    prisma.task.findFirst({ where: taskScope(collaborationId, taskId), select: { id: true } }),
    prisma.planStage.findFirst({ where: stageScope(collaborationId, toStageId), select: { id: true } }),
  ]);
  if (!task || !stage) return OUT_OF_SCOPE;
  const count = await prisma.task.count({ where: { stageId: toStageId } });
  await prisma.task.update({ where: { id: taskId }, data: { stageId: toStageId, order: count } });
  return { ok: true };
}

/**
 * Persist a drag-reorder of tasks within a stage. `taskIds` is the full new
 * order for that stage; we rewrite each task's `order` (and re-home any that
 * were dragged in from another stage) in one transaction.
 */
export async function reorderTasks(
  collaborationId: string,
  stageId: string,
  taskIds: string[]
): Promise<Result> {
  const auth = await canEdit(collaborationId);
  if (!auth.ok) return auth;
  const stage = await prisma.planStage.findFirst({ where: stageScope(collaborationId, stageId), select: { id: true } });
  if (!stage) return OUT_OF_SCOPE;
  // updateMany with the scope filter: a task id from another workspace matches
  // nothing and is skipped rather than re-homed into this plan.
  await prisma.$transaction(
    taskIds.map((id, index) =>
      prisma.task.updateMany({ where: taskScope(collaborationId, id), data: { stageId, order: index } })
    )
  );
  return { ok: true };
}

/** Persist a drag-reorder of stages within a collaboration's plan. */
export async function reorderStages(collaborationId: string, stageIds: string[]): Promise<Result> {
  const auth = await canEdit(collaborationId);
  if (!auth.ok) return auth;
  await prisma.$transaction(
    stageIds.map((id, index) =>
      prisma.planStage.updateMany({ where: stageScope(collaborationId, id), data: { order: index } })
    )
  );
  return { ok: true };
}

export async function renameTask(
  collaborationId: string,
  taskId: string,
  title: string
): Promise<Result> {
  const auth = await canEdit(collaborationId);
  if (!auth.ok) return auth;
  const parsed = z.string().trim().min(1).max(300).safeParse(title);
  if (!parsed.success) return { ok: false, error: "Task title can't be empty." };
  const r = await prisma.task.updateMany({
    where: taskScope(collaborationId, taskId),
    data: { title: parsed.data },
  });
  if (r.count === 0) return OUT_OF_SCOPE;
  return { ok: true };
}

export async function setTaskDescription(
  collaborationId: string,
  taskId: string,
  description: string
): Promise<Result> {
  const auth = await canEdit(collaborationId);
  if (!auth.ok) return auth;
  const parsed = z.string().max(2000).safeParse(description);
  if (!parsed.success) return { ok: false, error: "Description too long." };
  const scoped = await prisma.task.findFirst({ where: taskScope(collaborationId, taskId), select: { id: true } });
  if (!scoped) return OUT_OF_SCOPE;
  const task = await prisma.task.update({
    where: { id: taskId },
    data: { description: parsed.data.trim() || null },
    select: { title: true },
  });

  // @username mentions in the notes notify the mentioned members (MENTION —
  // the same contract as comment mentions).
  const usernames = parseMentions(parsed.data);
  if (usernames.length > 0) {
    const actor = await getActor();
    const users = await prisma.user.findMany({
      where: { username: { in: usernames } },
      select: { id: true },
    });
    await Promise.all(
      users
        .filter((u) => u.id !== actor?.id)
        .map((u) =>
          createNotification({
            recipientId: u.id,
            type: "MENTION",
            actorId: actor?.id ?? null,
            entityType: "collaboration",
            entityId: collaborationId,
            snippet: `${task.title}: ${parsed.data.slice(0, 200)}`,
          })
        )
    );
  }
  return { ok: true };
}

export async function deleteTask(collaborationId: string, taskId: string): Promise<Result> {
  const auth = await canEdit(collaborationId);
  if (!auth.ok) return auth;
  const r = await prisma.task.deleteMany({ where: taskScope(collaborationId, taskId) });
  if (r.count === 0) return OUT_OF_SCOPE;
  return { ok: true };
}

/** Assign a workspace member to a task (or clear with null). EDITOR+. */
export async function assignTask(
  collaborationId: string,
  taskId: string,
  assigneeId: string | null
): Promise<Result> {
  const auth = await canEdit(collaborationId);
  if (!auth.ok) return auth;
  const scoped = await prisma.task.findFirst({ where: taskScope(collaborationId, taskId), select: { id: true } });
  if (!scoped) return OUT_OF_SCOPE;
  // Only actual members can be assigned — otherwise any user id could be
  // attached to a task (and would receive the notification).
  if (assigneeId) {
    const member = await prisma.collaborationMember.findUnique({
      where: { collaborationId_userId: { collaborationId, userId: assigneeId } },
      select: { userId: true },
    });
    if (!member) return { ok: false, error: "That person isn't a member of this workspace." };
  }
  const task = await prisma.task.update({
    where: { id: taskId },
    data: { assigneeId },
    select: { title: true },
  });
  if (assigneeId) {
    const actor = await getActor();
    await emitLifecycle({
      kind: "task_assigned",
      assigneeId,
      actorId: actor?.id ?? "",
      collaborationId,
      taskTitle: task.title,
    });
  }
  return { ok: true };
}

/** The current user's open tasks across all workspaces (Dashboard "My tasks"). */
export async function myTasks(): Promise<
  Array<{ id: string; title: string; status: TaskStatus; collaborationId: string; collaborationTitle: string }>
> {
  const actor = await getActor();
  if (!actor) return [];
  const tasks = await prisma.task.findMany({
    where: { assigneeId: actor.id, status: { not: "DONE" } },
    orderBy: { updatedAt: "desc" },
    take: 20,
    select: {
      id: true,
      title: true,
      status: true,
      stage: { select: { plan: { select: { collaboration: { select: { id: true, title: true } } } } } },
    },
  });
  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    collaborationId: t.stage.plan.collaboration.id,
    collaborationTitle: t.stage.plan.collaboration.title,
  }));
}
