import { NextRequest, NextResponse } from "next/server";
import { prisma, safeQuery } from "@/lib/prisma";
import { bearerMatches } from "@/lib/auth/bearer";

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
  // bearerMatches() refuses an unset secret and compares in constant time.
  if (!bearerMatches(req.headers.get("authorization"), process.env.CRON_SECRET)) {
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
  // A sweep that failed is a retention promise that lapsed, not a success
  // with a -1 in it: say so with the status code, so the cron dashboard and
  // any alert on it notice. Until 2026-09-17 this returned ok:true regardless.
  const failed = (
    [
      ["downloadEvents", downloadEvents],
      ["rateLimits", rateLimits],
      ["notifications", notifications],
    ] as const
  )
    .filter(([, r]) => !r.success)
    .map(([name]) => name);
  if (failed.length > 0) {
    console.error("[retention] failed sweeps", failed, result);
    return NextResponse.json({ ok: false, purged: result, failed }, { status: 500 });
  }
  console.log("[retention] purged", result);
  return NextResponse.json({ ok: true, purged: result });
}
