"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/authz";
import { authorizeCollab } from "@/lib/collaboration/service";
import type { TaskStatus } from "@/generated/prisma";

type Result<T = {}> = ({ ok: true } & T) | { ok: false; error: string };

const STATUS_CYCLE: Record<TaskStatus, TaskStatus> = {
  TODO: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
  DONE: "TODO",
};

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
  await prisma.planStage.update({ where: { id: stageId }, data: { title: parsed.data } });
  return { ok: true };
}

export async function deleteStage(collaborationId: string, stageId: string): Promise<Result> {
  const auth = await canEdit(collaborationId);
  if (!auth.ok) return auth;
  await prisma.planStage.delete({ where: { id: stageId } }); // cascades tasks
  return { ok: true };
}

export async function addTask(collaborationId: string, stageId: string, title: string): Promise<Result<{ taskId: string }>> {
  const auth = await canEdit(collaborationId);
  if (!auth.ok) return auth;
  const parsed = titleSchema.safeParse(title);
  if (!parsed.success) return { ok: false, error: "Enter a task." };
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
  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { status: true } });
  if (!task) return { ok: false, error: "Task not found." };
  const next = STATUS_CYCLE[task.status];
  await prisma.task.update({ where: { id: taskId }, data: { status: next } });
  return { ok: true, status: next };
}

/** Move a task to another stage (kanban / plan-step move). */
export async function moveTask(collaborationId: string, taskId: string, toStageId: string): Promise<Result> {
  const auth = await canEdit(collaborationId);
  if (!auth.ok) return auth;
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
  await prisma.$transaction(
    taskIds.map((id, index) =>
      prisma.task.update({ where: { id }, data: { stageId, order: index } })
    )
  );
  return { ok: true };
}

/** Persist a drag-reorder of stages within a collaboration's plan. */
export async function reorderStages(collaborationId: string, stageIds: string[]): Promise<Result> {
  const auth = await canEdit(collaborationId);
  if (!auth.ok) return auth;
  await prisma.$transaction(
    stageIds.map((id, index) => prisma.planStage.update({ where: { id }, data: { order: index } }))
  );
  return { ok: true };
}

export async function deleteTask(collaborationId: string, taskId: string): Promise<Result> {
  const auth = await canEdit(collaborationId);
  if (!auth.ok) return auth;
  await prisma.task.delete({ where: { id: taskId } });
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
