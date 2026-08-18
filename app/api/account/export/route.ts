import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * GDPR data export (Articles 15/20). Returns the signed-in user's personal data
 * as a JSON download: their profile, authored content, prompt answers, recent
 * work, comments, collaboration memberships, and (PII-light) download history.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user, recentWork, promptAnswers, comments, memberships, downloads, conversations] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.recentWork.findMany({ where: { userId } }),
    prisma.profilePromptAnswer.findMany({ where: { userId } }),
    prisma.comment.findMany({
      where: { authorId: userId },
      select: { id: true, targetType: true, targetId: true, body: true, status: true, createdAt: true },
    }),
    prisma.collaborationMember.findMany({
      where: { userId },
      select: { collaborationId: true, role: true, joinedAt: true },
    }),
    prisma.downloadEvent.findMany({
      where: { userId },
      select: { reportId: true, fileLanguage: true, timestamp: true },
    }),
    prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true, joinedAt: true },
    }),
  ]);

  // Second batch (Promise.all is capped by connection-pool friendliness).
  const [messages, notifications, notificationPreference, reactions, follows, rsvps, joinRequests, contactRequests] =
    await Promise.all([
      prisma.message.findMany({
        where: { senderId: userId },
        select: { id: true, conversationId: true, body: true, createdAt: true },
      }),
      prisma.notification.findMany({
        where: { recipientId: userId },
        select: { type: true, entityType: true, entityId: true, snippet: true, readAt: true, createdAt: true },
      }),
      prisma.notificationPreference.findUnique({
        where: { userId },
        select: { emailOnReply: true, emailOnMention: true, emailOnMessage: true, emailWeeklyDigest: true },
      }),
      prisma.reaction.findMany({
        where: { userId },
        select: { commentId: true, emoji: true, createdAt: true },
      }),
      prisma.follow.findMany({
        where: { userId },
        select: { targetType: true, targetId: true, createdAt: true },
      }),
      prisma.rsvp.findMany({
        where: { userId },
        select: { eventId: true, status: true, createdAt: true },
      }),
      prisma.joinRequest.findMany({
        where: { requesterId: userId },
        select: { collaborationId: true, status: true, createdAt: true },
      }),
      prisma.contactRequest.findMany({
        where: { requesterId: userId },
        select: { recipientId: true, status: true, createdAt: true },
      }),
    ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    user,
    recentWork,
    promptAnswers,
    comments,
    collaborationMemberships: memberships,
    downloadHistory: downloads, // IP/user-agent are not stored (privacy)
    conversations: conversations.map((c) => ({ conversationId: c.conversationId, joinedAt: c.joinedAt })),
    messagesSent: messages,
    notifications,
    notificationPreference,
    reactions,
    follows,
    eventRsvps: rsvps,
    joinRequests,
    contactRequests,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="ccm-data-export-${userId}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
