import { NextRequest, NextResponse } from "next/server";
import { prisma, safeQuery } from "@/lib/prisma";
import { client } from "@/sanity/lib/client";
import { emitLifecycle } from "@/lib/notifications/emit";

/**
 * GET /api/cron/event-reminders (X6): T-24h reminders to RSVP'd attendees.
 * Idempotent per event: an EVENT_REMINDER notification for the event marks it
 * sent — re-runs skip it, so the cron can fire hourly without duplicates.
 * Protected by CRON_SECRET (Vercel cron sends it as a bearer token).
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  let events: { _id: string; title: string | null }[] = [];
  try {
    events = await client.fetch(
      `*[_type == "event" && status == "approved" && dateTime(startAt) > dateTime($now) && dateTime(startAt) < dateTime($end)]{ _id, title }`,
      { now: now.toISOString(), end: windowEnd.toISOString() }
    );
  } catch (error) {
    console.error("[event-reminders] Sanity fetch failed:", error);
    return NextResponse.json({ error: "Upstream unavailable" }, { status: 502 });
  }

  let sent = 0;
  for (const event of events) {
    if (!event.title) continue;
    const already = await safeQuery(() =>
      prisma.notification.findFirst({
        where: { type: "EVENT_REMINDER", entityId: event._id },
        select: { id: true },
      })
    );
    if (already.success && already.data) continue;

    const rsvps = await safeQuery(() =>
      prisma.rsvp.findMany({ where: { eventId: event._id, status: "GOING" }, select: { userId: true } })
    );
    if (!rsvps.success || rsvps.data.length === 0) continue;

    await emitLifecycle({
      kind: "event_reminder",
      attendeeIds: rsvps.data.map((r) => r.userId),
      eventId: event._id,
      eventTitle: event.title,
    });
    sent += rsvps.data.length;
  }

  return NextResponse.json({ events: events.length, remindersSent: sent });
}
