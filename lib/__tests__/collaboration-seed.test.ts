import { describe, it, expect, vi } from "vitest";
import { STARTER_STAGES, STARTER_DOC_TITLE, starterDocContent, seedWorkspace } from "@/lib/collaboration/seed";

describe("workspace seed", () => {
  it("defines the three starter stages in order", () => {
    expect(STARTER_STAGES).toEqual(["To do", "In progress", "Done"]);
  });

  it("starterDocContent is a non-empty portable-text array", () => {
    const c = starterDocContent();
    expect(Array.isArray(c)).toBe(true);
    expect(c.length).toBeGreaterThan(0);
  });

  it("seedWorkspace creates a plan, its stages (ordered), and a starter doc", async () => {
    const stageCreate = vi.fn<(args: { data: { title: string; order: number; planId: string } }) => Promise<{ id: string }>>(
      async () => ({ id: "st" })
    );
    const tx = {
      plan: { create: vi.fn(async () => ({ id: "p1" })) },
      planStage: { create: stageCreate },
      collaborationDoc: { create: vi.fn(async () => ({ id: "d1" })) },
    };
    await seedWorkspace(tx as unknown as Parameters<typeof seedWorkspace>[0], "c1", "u1");

    expect(tx.plan.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ collaborationId: "c1" }) })
    );
    expect(stageCreate).toHaveBeenCalledTimes(3);
    expect(stageCreate.mock.calls[0][0].data).toEqual(
      expect.objectContaining({ title: "To do", order: 0 })
    );
    expect(stageCreate.mock.calls[2][0].data).toEqual(
      expect.objectContaining({ title: "Done", order: 2 })
    );
    expect(tx.collaborationDoc.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ collaborationId: "c1", createdById: "u1", title: STARTER_DOC_TITLE }),
      })
    );
  });
});
