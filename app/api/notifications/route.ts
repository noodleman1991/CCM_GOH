import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { listNotifications, unreadCount } from "@/lib/notifications/service";

/** GET /api/notifications -> { unread, notifications } for the bell dropdown. */
export async function GET(_req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ unread: 0, notifications: [] });

  const [unread, notifications] = await Promise.all([
    unreadCount(userId),
    listNotifications(userId),
  ]);
  return NextResponse.json({ unread, notifications }, { headers: { "Cache-Control": "private, no-store" } });
}
