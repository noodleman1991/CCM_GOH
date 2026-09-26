"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/** Owner toggles whether a recent-work item is hidden from their public profile. */
export async function toggleRecentWorkHidden(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const existing = await prisma.recentWork.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Recent work not found or unauthorized");

  const updated = await prisma.recentWork.update({
    where: { id },
    data: { hidden: !existing.hidden },
  });
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: true, hidden: updated.hidden };
}

/**
 * Owner pins (or unpins) a recent-work item to the top of their profile. Only one
 * item is pinned at a time — pinning clears any other pin.
 */
export async function setRecentWorkPinned(id: string, pinned: boolean) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const existing = await prisma.recentWork.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Recent work not found or unauthorized");

  await prisma.$transaction([
    // single pin: clear the user's other pins first
    ...(pinned
      ? [prisma.recentWork.updateMany({ where: { userId, pinned: true }, data: { pinned: false } })]
      : []),
    prisma.recentWork.update({ where: { id }, data: { pinned } }),
  ]);
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: true, pinned };
}