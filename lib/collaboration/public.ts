import "server-only";

import { prisma, safeQuery } from "@/lib/prisma";
import type { PublicProject } from "./public-access";

export type { PublicProject } from "./public-access";

function displayName(u: { firstName: string | null; lastName: string | null; username: string | null }): string {
  return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || "Member";
}

/**
 * Public-safe projection of a collaboration for the visitor-facing project
 * page. Emits ONLY published (`approved`) outputs and never exposes emails,
 * private docs, or files. Returns null if the collaboration doesn't exist.
 */
export async function getPublicProject(id: string): Promise<PublicProject | null> {
  const cr = await safeQuery(() =>
    prisma.collaboration.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: { select: { id: true, username: true, firstName: true, lastName: true, image: true } },
          },
        },
        _count: { select: { members: true, outputs: true } },
      },
    })
  );
  if (!cr.success || !cr.data) return null;
  const c = cr.data;

  const or = await safeQuery(() =>
    prisma.workspaceOutput.findMany({
      where: { collaborationId: id, status: "approved" },
      orderBy: { createdAt: "asc" },
      select: { id: true, sanityType: true, title: true },
    })
  );
  const outputs = (or.success ? or.data : []).map((o) => ({
    id: o.id,
    sanityType: o.sanityType,
    title: o.title,
    slug: null as string | null,
  }));

  const leadMember = c.members.find((m) => m.user.id === c.createdById) ?? c.members[0] ?? null;
  const lead = leadMember
    ? {
        id: leadMember.user.id,
        name: displayName(leadMember.user),
        username: leadMember.user.username,
        image: leadMember.user.image,
      }
    : { id: c.createdById, name: "Lead", username: null, image: null };

  return {
    id: c.id,
    title: c.title,
    description: c.description,
    status: c.status,
    visibility: c.visibility,
    lead,
    members: c.members.map((m) => ({
      name: displayName(m.user),
      username: m.user.username,
      image: m.user.image,
      role: m.role,
    })),
    outputs,
    counts: { members: c._count.members, outputs: c._count.outputs },
  };
}
