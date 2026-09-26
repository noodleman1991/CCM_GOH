"use server";

import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/authz";
import { authorizeCollab } from "@/lib/collaboration/service";
import type { Prisma } from "@/generated/prisma";

type Result<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

/** The collaboration a file belongs to (for authorization). */
async function fileCollab(fileId: string): Promise<string | null> {
  const f = await prisma.collaborationFile.findUnique({
    where: { id: fileId },
    select: { collaborationId: true },
  });
  return f?.collaborationId ?? null;
}

/** Load the saved EmbedPDF annotation blob for a file (read = collab:readFiles). */
export async function loadAnnotations(fileId: string): Promise<Result<{ data: unknown }>> {
  const collaborationId = await fileCollab(fileId);
  if (!collaborationId) return { ok: false, error: "Not found." };
  try {
    await authorizeCollab(collaborationId, "collab:readFiles");
  } catch {
    return { ok: false, error: "Not permitted." };
  }
  const row = await prisma.collaborationFileAnnotations.findUnique({
    where: { fileId },
    select: { data: true },
  });
  return { ok: true, data: row?.data ?? null };
}

/** Save the exported annotation blob (write = collab:annotate, COMMENTER+). */
export async function saveAnnotations(fileId: string, data: unknown): Promise<Result> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in." };
  const collaborationId = await fileCollab(fileId);
  if (!collaborationId) return { ok: false, error: "Not found." };
  try {
    await authorizeCollab(collaborationId, "collab:annotate");
  } catch {
    return { ok: false, error: "Not permitted." };
  }

  await prisma.collaborationFileAnnotations.upsert({
    where: { fileId },
    create: { fileId, data: data as Prisma.InputJsonValue, updatedById: actor.id },
    update: { data: data as Prisma.InputJsonValue, updatedById: actor.id },
  });
  return { ok: true };
}
