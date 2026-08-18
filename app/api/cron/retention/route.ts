import { NextRequest, NextResponse } from "next/server";
import { prisma, safeQuery } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Data-retention sweep. The privacy policy's Retention section promises that
 * identifying data is not kept indefinitely; this cron is what enforces it.
 * Weekly via vercel.json.
 *
 * Windows (days, env-overridable):
 *  - download events: identifying rows (userId/sessionId) older than 365d are
 *    deleted — the aggregate download counters live in Sanity and are kept.
 *  - rate-limit counters: rows whose window closed more than a day ago.
 *  - notifications: read ones older than 180d.
 */
const DAY_MS = 24 * 3600 * 1000;
const days = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export async function GET(req: NextRequest) {
  // Fail closed like the digest cron: destructive route, secret required.
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const downloadCutoff = new Date(now - days(process.env.RETENTION_DOWNLOAD_EVENT_DAYS, 365) * DAY_MS);
  const notificationCutoff = new Date(now - days(process.env.RETENTION_NOTIFICATION_DAYS, 180) * DAY_MS);
  const rateLimitCutoff = new Date(now - DAY_MS);

  const [downloadEvents, rateLimits, notifications] = await Promise.all([
    safeQuery(() => prisma.downloadEvent.deleteMany({ where: { createdAt: { lt: downloadCutoff } } })),
    safeQuery(() => prisma.rateLimit.deleteMany({ where: { resetAt: { lt: rateLimitCutoff } } })),
    safeQuery(() =>
      prisma.notification.deleteMany({
        where: { readAt: { not: null }, createdAt: { lt: notificationCutoff } },
      })
    ),
  ]);

  const result = {
    downloadEvents: downloadEvents.success ? downloadEvents.data.count : -1,
    rateLimits: rateLimits.success ? rateLimits.data.count : -1,
    notifications: notifications.success ? notifications.data.count : -1,
  };
  console.log("[retention] purged", result);
  return NextResponse.json({ ok: true, purged: result });
}
