"use server";

import { auth } from "@clerk/nextjs/server";
import { markAllRead } from "@/lib/notifications/service";

export async function markNotificationsRead(): Promise<{ ok: boolean }> {
  const { userId } = await auth();
  if (!userId) return { ok: false };
  await markAllRead(userId);
  return { ok: true };
}
