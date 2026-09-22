import type { Role } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

/** Emails are compared case-insensitively and trimmed, the way Clerk reports them. */
export function normalizeInviteEmail(email: string | null | undefined): string | null {
  const e = email?.trim().toLowerCase();
  return e && e.includes("@") ? e : null;
}

/**
 * The role reserved for this email, if any, consumed exactly once. Called by
 * both user-creation paths (Clerk webhook `user.created`, and the lazy sync
 * on first request) right after the row exists. Never throws: a failure here
 * must not break sign-in; the invite stays and applies on the next sync.
 */
export async function applyStaffRoleInvite(userId: string, email: string | null | undefined): Promise<Role | null> {
  const key = normalizeInviteEmail(email);
  if (!key) return null;
  try {
    const invite = await prisma.staffRoleInvite.findUnique({ where: { email: key } });
    if (!invite) return null;
    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { role: invite.role } }),
      prisma.staffRoleInvite.delete({ where: { email: key } }),
    ]);
    return invite.role;
  } catch (error) {
    console.error("[staff-role-invite] could not apply reserved role:", error);
    return null;
  }
}
