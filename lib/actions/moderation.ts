"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getActor, assertCan, ForbiddenError } from "@/lib/authz";
import { notifyCommentApproved } from "@/lib/comment-notifications";

type ModResult = { ok: boolean; error?: string };

async function requireModerator() {
  const actor = await getActor();
  assertCan(actor, "moderation:view");
  return actor!;
}

/** Approve a held comment → VISIBLE, and notify the author (email, idempotent). */
export async function approveComment(id: string): Promise<ModResult> {
  try {
    await requireModerator();
  } catch (e) {
    if (e instanceof ForbiddenError) return { ok: false, error: "Not permitted." };
    throw e;
  }

  const comment = await prisma.comment.findUnique({
    where: { id },
    select: { id: true, status: true, authorId: true, targetType: true, targetId: true },
  });
  if (!comment) return { ok: false, error: "Not found." };
  if (comment.status !== "PENDING") return { ok: true }; // already actioned

  await prisma.comment.update({ where: { id }, data: { status: "VISIBLE" } });
  // Notify the author (signed-in only; anonymous has no account to notify).
  if (comment.authorId) {
    await notifyCommentApproved(comment.id).catch(() => {});
  }
  revalidatePath("/moderation");
  return { ok: true };
}

/** Remove a comment → REMOVED_BY_MOD (hidden for everyone). */
export async function removeComment(id: string): Promise<ModResult> {
  try {
    await requireModerator();
  } catch (e) {
    if (e instanceof ForbiddenError) return { ok: false, error: "Not permitted." };
    throw e;
  }
  await prisma.comment.update({ where: { id }, data: { status: "REMOVED_BY_MOD" } });
  // Resolve any open reports on it.
  await prisma.commentReport.updateMany({
    where: { commentId: id, status: "OPEN" },
    data: { status: "ACTIONED" },
  });
  revalidatePath("/moderation");
  return { ok: true };
}

/** Dismiss the reports on a comment (keep it visible). */
export async function dismissReports(id: string): Promise<ModResult> {
  try {
    await requireModerator();
  } catch (e) {
    if (e instanceof ForbiddenError) return { ok: false, error: "Not permitted." };
    throw e;
  }
  await prisma.commentReport.updateMany({
    where: { commentId: id, status: "OPEN" },
    data: { status: "DISMISSED" },
  });
  revalidatePath("/moderation");
  return { ok: true };
}
