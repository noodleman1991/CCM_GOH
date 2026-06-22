"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/authz";
import type { FollowTargetType } from "@/generated/prisma";

type Result<T = {}> = ({ ok: true } & T) | { ok: false; error: string };

const targetSchema = z.object({
  targetType: z.enum(["REGION", "THEME", "PROJECT"]),
  targetId: z.string().min(1).max(200),
});
type FollowTarget = z.infer<typeof targetSchema>;

/**
 * Follow a region / theme / project. One-click, no approval (per spec). The
 * unique (userId, targetType, targetId) makes this idempotent — re-following an
 * already-followed target is a no-op.
 */
export async function followTarget(input: FollowTarget): Promise<Result<{ following: true }>> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in to follow." };
  const parsed = targetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid target." };

  await prisma.follow.upsert({
    where: {
      userId_targetType_targetId: {
        userId: actor.id,
        targetType: parsed.data.targetType as FollowTargetType,
        targetId: parsed.data.targetId,
      },
    },
    create: {
      userId: actor.id,
      targetType: parsed.data.targetType as FollowTargetType,
      targetId: parsed.data.targetId,
    },
    update: {},
  });
  return { ok: true, following: true };
}

/** Stop following a target. No-op if not currently followed. */
export async function unfollowTarget(input: FollowTarget): Promise<Result<{ following: false }>> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in." };
  const parsed = targetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid target." };

  await prisma.follow.deleteMany({
    where: {
      userId: actor.id,
      targetType: parsed.data.targetType as FollowTargetType,
      targetId: parsed.data.targetId,
    },
  });
  return { ok: true, following: false };
}

/** Whether the current user follows a given target (false for anonymous). */
export async function isFollowing(input: FollowTarget): Promise<boolean> {
  const actor = await getActor();
  if (!actor) return false;
  const parsed = targetSchema.safeParse(input);
  if (!parsed.success) return false;

  const row = await prisma.follow.findUnique({
    where: {
      userId_targetType_targetId: {
        userId: actor.id,
        targetType: parsed.data.targetType as FollowTargetType,
        targetId: parsed.data.targetId,
      },
    },
    select: { id: true },
  });
  return !!row;
}
