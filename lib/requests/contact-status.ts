import "server-only";
import { prisma } from "@/lib/prisma";
import type { RequestStatus } from "@/generated/prisma";

/**
 * The viewer's contact-request status per other member, used to seed the
 * Connect button on the server so a reload shows "Requested" / "Connected"
 * instead of a fresh button (audit M7: requester state lived only in a
 * client `useState(false)`).
 *
 * Reads only rows the viewer is party to. Outgoing rows count in every status;
 * an incoming row counts only once ACCEPTED, because "connected" is symmetric
 * (the messaging guard treats either direction as contacts) while a pending
 * request the *other* person sent is theirs to see, not the viewer's.
 *
 * Deliberately a `server-only` helper rather than an exported server action:
 * the collaborate page calls it during render, and a server action would add
 * one more public POST endpoint for no caller (audit M18).
 */
export async function getContactStatuses(
  viewerId: string,
  otherIds: readonly string[]
): Promise<Record<string, RequestStatus>> {
  const ids = [...new Set(otherIds)].filter((id) => id !== viewerId);
  if (ids.length === 0) return {};

  const rows = await prisma.contactRequest.findMany({
    where: {
      OR: [
        { requesterId: viewerId, recipientId: { in: ids } },
        { recipientId: viewerId, requesterId: { in: ids }, status: "ACCEPTED" },
      ],
    },
    select: { requesterId: true, recipientId: true, status: true },
  });

  const byOther: Record<string, RequestStatus> = {};
  for (const row of rows) {
    const other = row.requesterId === viewerId ? row.recipientId : row.requesterId;
    // Both directions can exist for a pair; ACCEPTED wins because it is the
    // only status that changes what the viewer can do (message freely).
    if (byOther[other] === "ACCEPTED") continue;
    byOther[other] = row.status;
  }
  return byOther;
}
