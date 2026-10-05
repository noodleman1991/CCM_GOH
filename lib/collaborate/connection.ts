import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Accepting a request has meant sharing contact details only since this
 * change; connections accepted earlier were agreed on other terms and keep
 * their emails private.
 */
export const EMAIL_SHARING_SINCE = new Date("2026-10-05T00:00:00.000Z");

/** An accepted connection between the two, in either direction, since EMAIL_SHARING_SINCE. */
async function acceptedLink(viewerId: string, profileUserId: string): Promise<boolean> {
  if (!viewerId || viewerId === profileUserId) return false;
  const link = await prisma.contactRequest.findFirst({
    where: {
      status: "ACCEPTED",
      resolvedAt: { gte: EMAIL_SHARING_SINCE },
      OR: [
        { requesterId: viewerId, recipientId: profileUserId },
        { requesterId: profileUserId, recipientId: viewerId },
      ],
    },
    select: { id: true },
  });
  return !!link;
}

/** Whether the viewer may reach this member through their connection (the profile line; no email read). */
export async function areConnected(viewerId: string, profileUserId: string): Promise<boolean> {
  return acceptedLink(viewerId, profileUserId);
}

/**
 * The profile owner's email for someone they're connected with (opening-
 * collaboration spec C5). Accepting is the consent; nothing is shared before
 * it. Read only by revealContactEmail, behind a human check — never put in a page.
 */
export async function connectedEmail(viewerId: string, profileUserId: string): Promise<string | null> {
  if (!(await acceptedLink(viewerId, profileUserId))) return null;
  const user = await prisma.user.findUnique({ where: { id: profileUserId }, select: { email: true } });
  return user?.email ?? null;
}
