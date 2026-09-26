"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/authz";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";
import type { FollowTargetType } from "@/generated/prisma";

type Result<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

const targetSchema = z.object({
  targetType: z.enum(["REGION", "THEME", "PROJECT", "USER"]),
  targetId: z.string().min(1).max(200),
});
type FollowTarget = z.infer<typeof targetSchema>;

/**
 * Follow and unfollow share one budget per user: each call is a DB write, and
 * a follow/unfollow loop is the cheapest way to hammer the table (and, for
 * USER targets, an extra existence lookup). 60 per 10 minutes is far above a
 * human browsing regions and members, far below a script.
 */
async function limitFollowWrites(userId: string): Promise<{ ok: false; error: string } | null> {
  try {
    await assertRateLimit(userId, "follow:write", { limit: 60, windowSeconds: 600 });
    return null;
  } catch (e) {
    if (e instanceof RateLimitError) return { ok: false, error: "Too many requests — please slow down." };
    throw e;
  }
}

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
  const limited = await limitFollowWrites(actor.id);
  if (limited) return limited;
  if (parsed.data.targetType === "USER") {
    if (parsed.data.targetId === actor.id) return { ok: false, error: "You can't follow yourself." };
    const exists = await prisma.user.findUnique({ where: { id: parsed.data.targetId }, select: { id: true } });
    if (!exists) return { ok: false, error: "Invalid target." };
  }

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
  const limited = await limitFollowWrites(actor.id);
  if (limited) return limited;

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
