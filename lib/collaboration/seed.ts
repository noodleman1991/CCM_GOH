import type { PrismaClient } from "@/generated/prisma";

/** Default kanban columns every new workspace starts with. */
export const STARTER_STAGES = ["To do", "In progress", "Done"] as const;

export const STARTER_DOC_TITLE = "Welcome";

/** A minimal Portable Text starter body (one paragraph of guidance). */
export function starterDocContent(): unknown[] {
  return [
    {
      _type: "block",
      _key: "seed0",
      style: "normal",
      markDefs: [],
      children: [
        {
          _type: "span",
          _key: "seed0s",
          marks: [],
          text: "Welcome to your workspace. Use Docs to draft, Plan to track stages, and Outputs to link the hub content you are producing.",
        },
      ],
    },
  ];
}

/**
 * Seed a freshly-created workspace so it is never empty: a plan with the three
 * starter stages and one starter document. Accepts a Prisma client OR a
 * transaction client so the caller controls the transaction boundary.
 * Best-effort: the caller wraps this so a seed failure never blocks creation.
 */
export async function seedWorkspace(
  db: Pick<PrismaClient, "plan" | "planStage" | "collaborationDoc">,
  collaborationId: string,
  actorId: string
): Promise<void> {
  const plan = await db.plan.create({ data: { collaborationId }, select: { id: true } });
  for (let i = 0; i < STARTER_STAGES.length; i++) {
    await db.planStage.create({ data: { planId: plan.id, title: STARTER_STAGES[i], order: i } });
  }
  await db.collaborationDoc.create({
    data: {
      collaborationId,
      createdById: actorId,
      title: STARTER_DOC_TITLE,
      order: 0,
      content: starterDocContent() as never,
    },
  });
}
