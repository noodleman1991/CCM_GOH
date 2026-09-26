import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Batch-load the sender→recipient relations the FOLLOWERS/CONTACTS privacy
 * tiers consult: which of `recipientIds` the sender follows (Follow USER
 * target), and which have an ACCEPTED ContactRequest with the sender in
 * either direction.
 */
export async function messagingRelations(senderId: string, recipientIds: string[]) {
  if (recipientIds.length === 0) {
    return { followedBySender: new Set<string>(), contactsOfSender: new Set<string>() };
  }
  const [follows, contacts] = await Promise.all([
    prisma.follow.findMany({
      where: { userId: senderId, targetType: "USER", targetId: { in: recipientIds } },
      select: { targetId: true },
    }),
    prisma.contactRequest.findMany({
      where: {
        status: "ACCEPTED",
        OR: [
          { requesterId: senderId, recipientId: { in: recipientIds } },
          { recipientId: senderId, requesterId: { in: recipientIds } },
        ],
      },
      select: { requesterId: true, recipientId: true },
    }),
  ]);
  return {
    followedBySender: new Set(follows.map((f) => f.targetId)),
    contactsOfSender: new Set(
      contacts.map((c) => (c.requesterId === senderId ? c.recipientId : c.requesterId))
    ),
  };
}
