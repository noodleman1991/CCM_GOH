import "server-only";

import { prisma, safeQuery } from "@/lib/prisma";
import { client } from "@/sanity/lib/client";
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
      select: { id: true, sanityId: true, sanityType: true, title: true },
    })
  );
  const outputRows = or.success ? or.data : [];

  // Resolve real slugs from Sanity (same round-trip getOutputs does) so the
  // public page links to each output's detail page instead of the type index.
  let slugById = new Map<string, string | null>();
  if (outputRows.length > 0) {
    try {
      const docs: { _id: string; slug: string | null }[] = await client.fetch(
        `*[_id in $ids]{ _id, "slug": slug.current }`,
        { ids: outputRows.map((x) => x.sanityId.replace(/^drafts\./, "")) }
      );
      slugById = new Map(docs.map((d) => [d._id, d.slug]));
    } catch {
      // Sanity unreachable — fall back to type-index links.
    }
  }
  const outputs = outputRows.map((o) => ({
    id: o.id,
    sanityType: o.sanityType,
    title: o.title,
    slug: slugById.get(o.sanityId.replace(/^drafts\./, "")) ?? null,
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
