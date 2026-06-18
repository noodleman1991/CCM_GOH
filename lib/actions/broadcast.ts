"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActor, isStaff } from "@/lib/authz";
import { createNotification } from "@/lib/notifications/service";

type Result<T = {}> = ({ ok: true } & T) | { ok: false; error: string };

const schema = z.object({
  message: z.string().trim().min(1).max(280),
  target: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("all") }),
    z.object({ kind: z.literal("user"), userId: z.string() }),
    z.object({ kind: z.literal("community"), communityId: z.string() }),
    z.object({ kind: z.literal("region"), regionalName: z.string() }),
  ]),
});

/**
 * Editor broadcast: send an in-app notification (+ email per prefs, via the
 * notification fan-out) to a single user, a community, a region, or all users.
 * Role-gated (team_editor | admin). Returns how many recipients were notified.
 */
export async function broadcastNotification(input: z.infer<typeof schema>): Promise<Result<{ count: number }>> {
  const actor = await getActor();
  if (!isStaff(actor)) return { ok: false, error: "Not permitted." };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { message, target } = parsed.data;

  // Resolve recipient ids by target.
  let recipientIds: string[] = [];
  if (target.kind === "all") {
    const users = await prisma.user.findMany({ select: { id: true } });
    recipientIds = users.map((u) => u.id);
  } else if (target.kind === "user") {
    const u = await prisma.user.findUnique({ where: { id: target.userId }, select: { id: true } });
    recipientIds = u ? [u.id] : [];
  } else if (target.kind === "community") {
    const members = await prisma.userCommunity.findMany({
      where: { communityId: target.communityId },
      select: { userId: true },
    });
    recipientIds = members.map((m) => m.userId);
  } else {
    // region: communities of type REGIONAL with this regionalName.
    const members = await prisma.userCommunity.findMany({
      where: { community: { type: "REGIONAL", regionalName: target.regionalName as any } },
      select: { userId: true },
    });
    recipientIds = [...new Set(members.map((m) => m.userId))];
  }

  if (recipientIds.length === 0) return { ok: false, error: "No recipients for that target." };

  // Fan out (best-effort each; createNotification skips self + sends email per prefs).
  for (const recipientId of recipientIds) {
    await createNotification({
      recipientId,
      type: "COLLAB_ACTIVITY", // generic "from the team" activity bucket
      actorId: actor!.id,
      entityType: "broadcast",
      snippet: message,
    }).catch(() => {});
  }

  return { ok: true, count: recipientIds.length };
}
