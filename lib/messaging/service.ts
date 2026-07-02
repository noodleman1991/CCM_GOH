import "server-only";
import { prisma, safeQuery } from "@/lib/prisma";

export type ConversationSummary = {
  id: string;
  kind: "DIRECT" | "PROJECT" | "COMMUNITY";
  /** Channel title (project/community name); null for DMs (use otherName). */
  title: string | null;
  otherName: string | null;
  otherImage: string | null;
  otherUsername: string | null;
  lastMessage: string | null;
  lastMessageAt: string;
  unread: boolean;
};

function displayName(u: { firstName: string | null; lastName: string | null; username: string | null }) {
  return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || null;
}

/** List a user's conversations (1:1 focus): other participant + last message + unread. */
export async function listConversations(userId: string): Promise<ConversationSummary[]> {
  const r = await safeQuery(() =>
    prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      orderBy: { lastMessageAt: "desc" },
      take: 50,
      include: {
        participants: {
          include: { user: { select: { id: true, firstName: true, lastName: true, username: true, image: true } } },
        },
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, createdAt: true } },
        collaboration: { select: { title: true } },
      },
    })
  );
  if (!r.success) return [];

  return r.data.map((c) => {
    const me = c.participants.find((p) => p.userId === userId);
    const other = c.participants.find((p) => p.userId !== userId)?.user ?? null;
    const last = c.messages[0] ?? null;
    const unread = !!last && (!me?.lastReadAt || last.createdAt > me.lastReadAt);
    return {
      id: c.id,
      kind: c.kind,
      title: c.kind === "PROJECT" ? (c.collaboration?.title ?? null) : null,
      otherName: other ? displayName(other) : null,
      otherImage: other?.image ?? null,
      otherUsername: other?.username ?? null,
      lastMessage: last?.body.slice(0, 120) ?? null,
      lastMessageAt: c.lastMessageAt.toISOString(),
      unread,
    };
  });
}

/** Total unread conversations (for an inbox badge). */
export async function unreadConversationCount(userId: string): Promise<number> {
  const convos = await listConversations(userId);
  return convos.filter((c) => c.unread).length;
}

/** Messages in a conversation (caller must be a participant). */
export async function listMessages(conversationId: string, userId: string) {
  const isParticipant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
    select: { conversationId: true },
  });
  if (!isParticipant) return null;

  const r = await safeQuery(() =>
    prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: 200,
      select: { id: true, senderId: true, body: true, createdAt: true, deletedAt: true },
    })
  );
  return r.success
    ? r.data.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        body: m.deletedAt ? "" : m.body,
        deleted: !!m.deletedAt,
        createdAt: m.createdAt.toISOString(),
      }))
    : [];
}

/**
 * The workspace's single PROJECT channel, created lazily on first use
 * ("no empty rooms" — spec F1). Member-gated; all current members join.
 */
export async function getOrCreateProjectConversation(
  collaborationId: string,
  userId: string
): Promise<{ id: string } | null> {
  const membership = await prisma.collaborationMember.findUnique({
    where: { collaborationId_userId: { collaborationId, userId } },
    select: { role: true },
  });
  if (!membership) return null;

  const existing = await prisma.conversation.findUnique({
    where: { kind_collaborationId: { kind: "PROJECT", collaborationId } },
    select: { id: true },
  });
  if (existing) return existing;

  const collab = await prisma.collaboration.findUnique({
    where: { id: collaborationId },
    select: { members: { select: { userId: true } } },
  });
  if (!collab) return null;

  const created = await prisma.conversation.create({
    data: {
      kind: "PROJECT",
      collaborationId,
      participants: { createMany: { data: collab.members.map((m) => ({ userId: m.userId })) } },
    },
    select: { id: true },
  });
  return created;
}
