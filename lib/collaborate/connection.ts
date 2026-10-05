import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Accepting a request has meant sharing contact details only since this
 * change; connections accepted earlier were agreed on other terms and keep
 * their emails private.
 */
export const EMAIL_SHARING_SINCE = new Date("2026-10-05T00:00:00.000Z");

/**
 * The profile owner's email for someone they're connected with — an ACCEPTED
 * request in either direction (opening-collaboration spec C5). Accepting is
 * the consent; nothing is shared before it.
 */
export async function connectedEmail(viewerId: string, profileUserId: string): Promise<string | null> {
  if (!viewerId || viewerId === profileUserId) return null;
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
  if (!link) return null;
  const user = await prisma.user.findUnique({ where: { id: profileUserId }, select: { email: true } });
  return user?.email ?? null;
}
