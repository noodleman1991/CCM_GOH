import { NextRequest, NextResponse } from "next/server";
import { prisma, safeQuery } from "@/lib/prisma";
import { sendWeeklyDigestEmail } from "@/lib/notifications/email";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Human line for a digest highlight, grouped by notification type. */
const TYPE_LINE: Record<string, string> = {
  COMMENT_REPLY: "replies to your comments",
  MENTION: "mentions of you",
  REACTION: "reactions to your comments",
  MESSAGE: "direct messages",
  REQUEST: "requests and invitations",
  TASK_ASSIGNED: "tasks assigned to you",
  TASK_DUE: "task reminders",
  OUTPUT_STATUS: "output status changes",
  THREAD_REPLY: "thread activity in your workspaces",
  MEMBER_JOINED: "new members in your workspaces",
  FOLLOWED_PUBLISH: "publications from projects you follow",
  EVENT_REMINDER: "event confirmations and reminders",
  COLLAB_ACTIVITY: "workspace activity",
  COMMENT_APPROVED: "approved comments",
};

/**
 * Weekly digest (X8): one summary email per user who accumulated notifications
 * in the past 7 days. Idempotent via NotificationPreference.digestSentAt (a
 * re-run within 6 days skips the user). Respects emailWeeklyDigest + the
 * kind=digest unsubscribe. Trigger: vercel.json cron, Mondays 08:00 UTC.
 */
export async function GET(req: NextRequest) {
  // Fail CLOSED: this route sends real email, so no secret means no run —
  // unlike the notification-only crons, an unset CRON_SECRET must not leave
  // it publicly triggerable (learned the hard way in dev, 2026-07-14).
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const sixDaysAgo = new Date(Date.now() - 6 * 24 * 3600 * 1000);

  // Everyone with fresh notifications this week.
  const grouped = await safeQuery(() =>
    prisma.notification.groupBy({
      by: ["recipientId", "type"],
      where: { createdAt: { gte: weekAgo } },
      _count: true,
    })
  );
  if (!grouped.success) return NextResponse.json({ error: "DB unavailable" }, { status: 502 });

  const byUser = new Map<string, { type: string; count: number }[]>();
  for (const row of grouped.data) {
    const list = byUser.get(row.recipientId) ?? [];
    list.push({ type: row.type, count: row._count });
    byUser.set(row.recipientId, list);
  }

  let sent = 0;
  let skipped = 0;
  for (const [userId, counts] of byUser) {
    // Preference row (created lazily) is also the idempotency marker.
    const pref = await prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
    if (!pref.emailWeeklyDigest) {
      skipped++;
      continue;
    }
    if (pref.digestSentAt && pref.digestSentAt > sixDaysAgo) {
      skipped++;
      continue;
    }

    const [user, unread] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, preferredLanguage: true },
      }),
      prisma.notification.count({ where: { recipientId: userId, readAt: null } }),
    ]);
    if (!user?.email) {
      skipped++;
      continue;
    }

    const highlights = counts
      .sort((a, b) => b.count - a.count)
      .map((c) => `${c.count} ${TYPE_LINE[c.type] ?? "notifications"}`);

    const ok = await sendWeeklyDigestEmail({
      email: user.email,
      locale: user.preferredLanguage,
      unread,
      highlights,
      unsubscribeToken: pref.unsubscribeToken,
    });
    if (ok) {
      await prisma.notificationPreference.update({
        where: { userId },
        data: { digestSentAt: new Date() },
      });
      sent++;
    } else {
      skipped++;
    }
  }

  return NextResponse.json({ users: byUser.size, sent, skipped });
}
