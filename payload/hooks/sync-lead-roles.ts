import type { CollectionAfterChangeHook } from "payload";
import { nextRole } from "@/payload/access/leads";

const ids = (v: unknown) => new Set(Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

/**
 * Keeps Prisma's role in step with who leads what (editor-experience spec
 * §3.5): someone added as a lead becomes `community_editor`; someone who
 * leads nothing any more returns to `community_member`. Staff are never
 * touched. Runs on publish, because the access rules read the published row.
 *
 * Prisma is imported when the hook runs, not at module load: the generated
 * client reads `.env` (production) on import, and this module is part of the
 * Payload config that scripts and tests load against the dev database.
 */
export const syncLeadRoles: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  if (doc?._status !== "published") return doc;
  const now = ids(doc.leadIds);
  const before = ids(previousDoc?.leadIds);
  const changed = [...new Set([...now, ...before])].filter((id) => now.has(id) !== before.has(id));
  if (changed.length === 0) return doc;
  const { prisma } = await import("@/lib/prisma");
  for (const userId of changed) {
    const leads = await req.payload.count({
      collection: "regionalCommunities",
      where: { and: [{ leadIds: { in: [userId] } }, { _status: { equals: "published" } }] },
      overrideAccess: true,
      req,
    });
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user) continue;
    const role = nextRole(user.role, leads.totalDocs);
    if (role !== user.role) await prisma.user.update({ where: { id: userId }, data: { role: role as typeof user.role } });
  }
  return doc;
};
