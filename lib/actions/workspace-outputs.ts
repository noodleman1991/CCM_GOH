"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/authz";
import { authorizeCollab } from "@/lib/collaboration/service";
import { writeClient } from "@/sanity/lib/write-client";
import { isOutputType } from "@/lib/collaboration/outputs";

type Result<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

const addSchema = z.object({
  collaborationId: z.string().min(1),
  sanityType: z.string().min(1),
  mode: z.enum(["create", "link"]),
  sanityId: z.string().min(1).optional(),
  title: z.string().max(200).optional(),
});

export async function addOutput(input: z.infer<typeof addSchema>): Promise<Result<{ outputId: string }>> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in." };

  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const { collaborationId, sanityType, mode, sanityId, title } = parsed.data;
  if (!isOutputType(sanityType)) return { ok: false, error: "Unsupported output type." };

  try {
    await authorizeCollab(collaborationId, "collab:editOutputs");
  } catch {
    return { ok: false, error: "Not permitted." };
  }

  const resolvedTitle = title || "Untitled";
  let resolvedId = sanityId;

  if (mode === "create") {
    // Create a Sanity DRAFT of the chosen output type. It enters the existing
    // review pipeline (status pending by default for the moderated types).
    const draft = await writeClient.create({
      _type: sanityType,
      _id: `drafts.${crypto.randomUUID()}`,
      title: { en: resolvedTitle },
      status: "pending",
    } as Parameters<typeof writeClient.create>[0]);
    resolvedId = draft._id;
  } else {
    if (!sanityId) return { ok: false, error: "Pick a draft to link." };
    resolvedId = sanityId;
  }

  const row = await prisma.workspaceOutput.create({
    data: {
      collaborationId,
      sanityId: resolvedId!,
      sanityType,
      title: resolvedTitle,
      status: mode === "create" ? "pending" : "draft",
      createdById: actor.id,
    },
  });
  return { ok: true, outputId: row.id };
}

const removeSchema = z.object({ collaborationId: z.string().min(1), outputId: z.string().min(1) });

export async function removeOutput(input: z.infer<typeof removeSchema>): Promise<Result> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in." };
  const parsed = removeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const { collaborationId, outputId } = parsed.data;

  try {
    await authorizeCollab(collaborationId, "collab:editOutputs");
  } catch {
    return { ok: false, error: "Not permitted." };
  }

  // Only delete the LINK (not the Sanity draft) and only if it belongs here.
  const row = await prisma.workspaceOutput.findFirst({ where: { id: outputId, collaborationId } });
  if (!row) return { ok: false, error: "Output not found." };
  await prisma.workspaceOutput.delete({ where: { id: outputId } });
  return { ok: true };
}
