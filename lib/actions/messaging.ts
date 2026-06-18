"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/authz";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notifications/service";

type Result<T = {}> = ({ ok: true } & T) | { ok: false; error: string };

/**
 * Get or create a 1:1 conversation with another user. Returns the id so the UI
 * can open the thread.
 */
export async function startConversation(otherUserId: string): Promise<Result<{ id: string }>> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in." };
  if (otherUserId === actor.id) return { ok: false, error: "You can't message yourself." };

  const other = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: { id: true, allowMessagesFrom: true },
  });
  if (!other) return { ok: false, error: "User not found." };

  // Respect the recipient's inbox privacy + block list.
  if (other.allowMessagesFrom === "NOBODY") {
    return { ok: false, error: "This member isn't accepting messages." };
  }
  const blocked = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: otherUserId, blockedId: actor.id },
        { blockerId: actor.id, blockedId: otherUserId },
      ],
    },
    select: { blockerId: true },
  });
  if (blocked) return { ok: false, error: "You can't message this member." };

  // Find an existing 1:1 conversation between exactly these two.
  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: actor.id } } },
        { participants: { some: { userId: otherUserId } } },
      ],
    },
    select: { id: true, _count: { select: { participants: true } } },
  });
  if (existing && existing._count.participants === 2) return { ok: true, id: existing.id };

  const convo = await prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId: actor.id }, { userId: otherUserId }],
      },
    },
    select: { id: true },
  });
  return { ok: true, id: convo.id };
}

const sendSchema = z.object({
  conversationId: z.string().cuid(),
  body: z.string().trim().min(1).max(4000),
});

export async function sendMessage(input: z.infer<typeof sendSchema>): Promise<Result<{ id: string }>> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in." };
  const parsed = sendSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid message." };

  try {
    await assertRateLimit(actor.id, "message:send", { limit: 30, windowSeconds: 60 });
  } catch (e) {
    if (e instanceof RateLimitError) return { ok: false, error: "Slow down a moment." };
    throw e;
  }

  // Must be a participant.
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: parsed.data.conversationId, userId: actor.id } },
    select: { conversationId: true },
  });
  if (!participant) return { ok: false, error: "Not permitted." };

  // Stop messaging if either side has blocked the other.
  const others = await prisma.conversationParticipant.findMany({
    where: { conversationId: parsed.data.conversationId, userId: { not: actor.id } },
    select: { userId: true },
  });
  const otherIds = others.map((o) => o.userId);
  if (otherIds.length > 0) {
    const block = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: actor.id, blockedId: { in: otherIds } },
          { blockerId: { in: otherIds }, blockedId: actor.id },
        ],
      },
      select: { blockerId: true },
    });
    if (block) return { ok: false, error: "Messaging is unavailable in this conversation." };
  }

  const message = await prisma.message.create({
    data: { conversationId: parsed.data.conversationId, senderId: actor.id, body: parsed.data.body },
    select: { id: true },
  });
  await prisma.conversation.update({
    where: { id: parsed.data.conversationId },
    data: { lastMessageAt: new Date() },
  });

  // Notify the other participant(s) (reuse otherIds from the block check).
  for (const recipientId of otherIds) {
    await createNotification({
      recipientId,
      type: "MESSAGE",
      actorId: actor.id,
      entityType: "conversation",
      entityId: parsed.data.conversationId,
      snippet: parsed.data.body.slice(0, 280),
    }).catch(() => {});
  }

  return { ok: true, id: message.id };
}

export async function markConversationRead(conversationId: string): Promise<{ ok: boolean }> {
  const actor = await getActor();
  if (!actor) return { ok: false };
  await prisma.conversationParticipant.updateMany({
    where: { conversationId, userId: actor.id },
    data: { lastReadAt: new Date() },
  });
  return { ok: true };
}

/** Delete a message — sender only; soft-delete (tombstone) so the thread stays coherent. */
export async function deleteMessage(messageId: string): Promise<Result> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in." };
  const msg = await prisma.message.findUnique({ where: { id: messageId }, select: { senderId: true } });
  if (!msg || msg.senderId !== actor.id) return { ok: false, error: "Not permitted." };
  await prisma.message.update({ where: { id: messageId }, data: { body: "", deletedAt: new Date() } });
  return { ok: true };
}

/** Report a message to moderators (reuses the comment report surface). */
export async function reportMessage(messageId: string, reason: string): Promise<Result> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in." };
  const msg = await prisma.message.findUnique({
    where: { id: messageId },
    select: { id: true, conversationId: true, senderId: true },
  });
  if (!msg) return { ok: false, error: "Not found." };
  // Must be a participant of the conversation to report.
  const isParticipant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: msg.conversationId, userId: actor.id } },
    select: { conversationId: true },
  });
  if (!isParticipant) return { ok: false, error: "Not permitted." };
  await prisma.messageReport.create({
    data: { messageId, reporterId: actor.id, reason: reason.slice(0, 500) },
  }).catch(() => {});
  return { ok: true };
}

/** Block a user (and stop any shared conversations). */
export async function blockUser(blockedId: string): Promise<Result> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in." };
  if (blockedId === actor.id) return { ok: false, error: "You can't block yourself." };
  await prisma.userBlock.upsert({
    where: { blockerId_blockedId: { blockerId: actor.id, blockedId } },
    create: { blockerId: actor.id, blockedId },
    update: {},
  });
  return { ok: true };
}

export async function unblockUser(blockedId: string): Promise<Result> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in." };
  await prisma.userBlock.deleteMany({ where: { blockerId: actor.id, blockedId } });
  return { ok: true };
}

const groupSchema = z.object({
  userIds: z.array(z.string()).min(1).max(9),
});

/** Start a small-group conversation (creator + up to 9 others). */
export async function startGroupConversation(input: z.infer<typeof groupSchema>): Promise<Result<{ id: string }>> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in." };
  const parsed = groupSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid group." };

  const ids = [...new Set(parsed.data.userIds.filter((id) => id !== actor.id))];
  if (ids.length === 0) return { ok: false, error: "Add at least one other member." };

  // Respect each invitee's inbox privacy + blocks.
  const invitees = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, allowMessagesFrom: true },
  });
  const blocks = await prisma.userBlock.findMany({
    where: {
      OR: [
        { blockerId: actor.id, blockedId: { in: ids } },
        { blockerId: { in: ids }, blockedId: actor.id },
      ],
    },
    select: { blockerId: true, blockedId: true },
  });
  const blockedSet = new Set(blocks.flatMap((b) => [b.blockerId, b.blockedId]));
  const allowed = invitees.filter((u) => u.allowMessagesFrom === "EVERYONE" && !blockedSet.has(u.id));
  if (allowed.length === 0) return { ok: false, error: "None of those members can be added." };

  const convo = await prisma.conversation.create({
    data: {
      participants: { create: [{ userId: actor.id }, ...allowed.map((u) => ({ userId: u.id }))] },
    },
    select: { id: true },
  });
  return { ok: true, id: convo.id };
}
