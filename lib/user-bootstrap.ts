import "server-only";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { reportError } from "@/lib/errors/report";
import { applyStaffRoleInvite } from "@/lib/staff-role-invite";

/**
 * Make sure a signed-in Clerk user has a Prisma row.
 *
 * The row is normally written by the Clerk webhook, which can lag a first
 * sign-in by a few seconds. The dashboard used to handle that by sleeping in
 * the render — three seconds in the layout, one more in the page — and
 * retrying once. Every first visit paid that wait, and a slow webhook still
 * lost. Creating the row here, with the same defaults the webhook and the
 * onboarding route use, makes the first render as fast as any other; the
 * webhook's own create then finds the row and updates it instead.
 *
 * Returns `true` when a row exists afterwards. A unique-constraint race with
 * the webhook is treated as success (the row exists). Any other failure is
 * reported and returns `false`; the caller decides whether to redirect.
 */
export async function ensureUserRow(userId: string): Promise<boolean> {
  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (existing) return true;
  try {
    const clerkUser = await (await clerkClient()).users.getUser(userId);
    await prisma.user.create({
      data: {
        id: userId,
        email: clerkUser.primaryEmailAddress?.emailAddress || null,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        username: clerkUser.username,
        image: clerkUser.imageUrl,
        emailVerified: clerkUser.primaryEmailAddress?.verification?.status === "verified" ? new Date() : null,
        phoneNumber: clerkUser.primaryPhoneNumber?.phoneNumber || null,
        phoneVerified: clerkUser.primaryPhoneNumber?.verification?.status === "verified" ? new Date() : null,
        workTypes: [],
        expertiseAreas: [],
        isSearchable: true,
        profileVisibility: "MEMBERS", // members-only by default, like the webhook and onboarding (user, 2026-09-22)
        showEmail: false,
        showPhoneNumber: false,
        showWorkDetails: true,
        showSocialLinks: true,
        showLocation: true,
      },
    });
    // A staff role reserved for this email (pnpm user:role --invite) — the
    // webhook and the lazy sync apply it too; whichever creates the row must.
    await applyStaffRoleInvite(userId, clerkUser.primaryEmailAddress?.emailAddress);
    return true;
  } catch (error) {
    if ((error as { code?: string })?.code === "P2002") return true;
    reportError(error, { route: "user-bootstrap", tags: { userId } });
    return false;
  }
}
