import "server-only";
import { prisma, safeQuery } from "@/lib/prisma";
import { getActor } from "@/lib/authz";

export type PublicProjectCard = {
  id: string;
  title: string;
  description: string | null;
  memberCount: number;
  leadName: string | null;
  isMember: boolean;
};

/** Public, active projects for the Collaborate → Projects tab (§4.6).
 *  isMember is computed for the signed-in actor so the card CTA can route
 *  members straight into the workspace; anonymous readers get false. */
export async function getPublicProjects(): Promise<PublicProjectCard[]> {
  const actor = await getActor().catch(() => null);
  const r = await safeQuery(() =>
    prisma.collaboration.findMany({
      where: { visibility: "PUBLIC", status: "ACTIVE" },
      orderBy: { updatedAt: "desc" },
      take: 60,
      select: {
        id: true,
        title: true,
        description: true,
        createdBy: { select: { firstName: true, lastName: true, username: true } },
        _count: { select: { members: true } },
        members: actor ? { where: { userId: actor.id }, select: { userId: true } } : undefined,
      },
    })
  );
  if (!r.success) return [];
  return r.data.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    memberCount: c._count.members,
    leadName:
      [c.createdBy?.firstName, c.createdBy?.lastName].filter(Boolean).join(" ") ||
      c.createdBy?.username ||
      null,
    isMember: Array.isArray(c.members) && c.members.length > 0,
  }));
}
