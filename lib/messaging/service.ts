import "server-only";
import { prisma, safeQuery } from "@/lib/prisma";

export type ConversationSummary = {
  id: string;
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
      select: { id: true, senderId: true, body: true, createdAt: true },
    })
  );
  return r.success
    ? r.data.map((m) => ({ id: m.id, senderId: m.senderId, body: m.body, createdAt: m.createdAt.toISOString() }))
    : [];
}
