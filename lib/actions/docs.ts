"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/authz";
import { authorizeCollab } from "@/lib/collaboration/service";

type Result<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

async function canEdit(collaborationId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await authorizeCollab(collaborationId, "collab:editDoc");
    return { ok: true };
  } catch {
    return { ok: false, error: "Not permitted." };
  }
}

/** Create a new (empty) document in the workspace. */
export async function createDoc(collaborationId: string): Promise<Result<{ docId: string }>> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in." };
  const auth = await canEdit(collaborationId);
  if (!auth.ok) return auth;

  const count = await prisma.collaborationDoc.count({ where: { collaborationId } });
  const doc = await prisma.collaborationDoc.create({
    data: { collaborationId, createdById: actor.id, order: count, content: [] },
    select: { id: true },
  });
  return { ok: true, docId: doc.id };
}

/** A doc is only addressable through the collaboration it belongs to — see the
 *  same note in lib/actions/plans.ts (cross-workspace IDOR). */
const OUT_OF_SCOPE = { ok: false as const, error: "Not found in this workspace." };

export async function renameDoc(collaborationId: string, docId: string, title: string): Promise<Result> {
  const auth = await canEdit(collaborationId);
  if (!auth.ok) return auth;
  const t = title.trim();
  if (t.length < 1 || t.length > 200) return { ok: false, error: "Title must be 1–200 chars." };
  const r = await prisma.collaborationDoc.updateMany({
    where: { id: docId, collaborationId },
    data: { title: t },
  });
  if (r.count === 0) return OUT_OF_SCOPE;
  return { ok: true };
}

// Portable Text is an array of blocks; we store it verbatim. Keep validation
// light (it's produced by our own editor) but bound the size.
const contentSchema = z.array(z.any()).max(5000);

export async function updateDocContent(
  collaborationId: string,
  docId: string,
  content: unknown
): Promise<Result> {
  const auth = await canEdit(collaborationId);
  if (!auth.ok) return auth;
  const parsed = contentSchema.safeParse(content);
  if (!parsed.success) return { ok: false, error: "Invalid content." };
  const r = await prisma.collaborationDoc.updateMany({
    where: { id: docId, collaborationId },
    data: { content: parsed.data },
  });
  if (r.count === 0) return OUT_OF_SCOPE;
  return { ok: true };
}

export async function deleteDoc(collaborationId: string, docId: string): Promise<Result> {
  const auth = await canEdit(collaborationId);
  if (!auth.ok) return auth;
  const r = await prisma.collaborationDoc.deleteMany({ where: { id: docId, collaborationId } });
  if (r.count === 0) return OUT_OF_SCOPE;
  return { ok: true };
}
