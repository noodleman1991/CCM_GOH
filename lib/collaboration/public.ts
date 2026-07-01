import "server-only";

import type { CollaborationRole, CollaborationStatus, CollaborationVisibility } from "@/generated/prisma";
import { prisma, safeQuery } from "@/lib/prisma";

/**
 * Viewers who are neither a member nor global staff see the PUBLIC project
 * page instead of the workspace editing shell. Members and staff get the shell.
 */
export function canShowPublicProject(input: {
  membershipRole: CollaborationRole | null;
  isStaff: boolean;
}): boolean {
  return input.membershipRole === null && !input.isStaff;
}

/** Only a signed-in non-member may request to join a workspace. */
export function canRequestToJoin(input: { isSignedIn: boolean; isMember: boolean }): boolean {
  return input.isSignedIn && !input.isMember;
}

export type PublicProject = {
  id: string;
  title: string;
  description: string | null;
  status: CollaborationStatus;
  visibility: CollaborationVisibility;
  lead: { id: string; name: string; username: string | null; image: string | null };
  members: { name: string; username: string | null; image: string | null; role: string }[];
  outputs: { id: string; sanityType: string; title: string; slug: string | null }[];
  counts: { members: number; outputs: number };
};

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
