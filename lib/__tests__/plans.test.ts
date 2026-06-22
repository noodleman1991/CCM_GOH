import { describe, it, expect, vi, beforeEach } from "vitest";

const getActorMock = vi.fn<() => any>();
const authorizeCollabMock = vi.fn<(...a: any[]) => Promise<any>>();
vi.mock("@/lib/authz", () => ({ getActor: () => getActorMock() }));
vi.mock("@/lib/collaboration/service", () => ({
  authorizeCollab: (...a: any[]) => authorizeCollabMock(...a),
}));

const db = vi.hoisted(() => {
  const d: any = {
    plan: { upsert: vi.fn(async () => ({ id: "p1", _count: { stages: 0 } })) },
    planStage: { create: vi.fn(async () => ({ id: "s1" })), update: vi.fn(async () => ({})), delete: vi.fn(async () => ({})) },
    task: {
      count: vi.fn(async () => 0),
      create: vi.fn(async () => ({ id: "tk1" })),
      findUnique: vi.fn(async () => ({ status: "TODO" })),
      update: vi.fn(async () => ({})),
      delete: vi.fn(async () => ({})),
      findMany: vi.fn(async () => []),
    },
  };
  return d;
});
vi.mock("@/lib/prisma", () => ({ prisma: db }));

import { addStage, addTask, cycleTaskStatus, deleteTask } from "@/lib/actions/plans";

beforeEach(() => {
  vi.clearAllMocks();
  getActorMock.mockResolvedValue({ id: "u1", role: "community_member" });
  authorizeCollabMock.mockResolvedValue({ actorId: "u1", role: "EDITOR" }); // allowed
});

describe("plan authz gate", () => {
  it("blocks mutation when authorizeCollab throws (viewer/non-member)", async () => {
    authorizeCollabMock.mockRejectedValueOnce(new Error("Forbidden"));
    const res = await addStage("c1", "Discovery");
    expect(res.ok).toBe(false);
    expect(db.planStage.create).not.toHaveBeenCalled();
  });

  it("requests the collab:editPlan capability", async () => {
    await addStage("c1", "Discovery");
    expect(authorizeCollabMock).toHaveBeenCalledWith("c1", "collab:editPlan");
  });
});

describe("addStage / addTask", () => {
  it("creates a stage with order = current stage count", async () => {
    db.plan.upsert.mockResolvedValueOnce({ id: "p1", _count: { stages: 2 } });
    const res = await addStage("c1", "Build");
    expect(res.ok).toBe(true);
    expect(db.planStage.create.mock.calls[0][0].data.order).toBe(2);
  });

  it("rejects an empty task title", async () => {
    const res = await addTask("c1", "s1", "   ");
    expect(res.ok).toBe(false);
    expect(db.task.create).not.toHaveBeenCalled();
  });

  it("creates a task with order = current task count", async () => {
    db.task.count.mockResolvedValueOnce(3);
    const res = await addTask("c1", "s1", "Write intro");
    expect(res.ok).toBe(true);
    expect(db.task.create.mock.calls[0][0].data.order).toBe(3);
  });
});

describe("cycleTaskStatus", () => {
  it("cycles TODO -> IN_PROGRESS", async () => {
    db.task.findUnique.mockResolvedValueOnce({ status: "TODO" });
    const res = await cycleTaskStatus("c1", "tk1");
    expect(res.ok && res.status).toBe("IN_PROGRESS");
  });
  it("cycles IN_PROGRESS -> DONE", async () => {
    db.task.findUnique.mockResolvedValueOnce({ status: "IN_PROGRESS" });
    const res = await cycleTaskStatus("c1", "tk1");
    expect(res.ok && res.status).toBe("DONE");
  });
  it("cycles DONE -> TODO", async () => {
    db.task.findUnique.mockResolvedValueOnce({ status: "DONE" });
    const res = await cycleTaskStatus("c1", "tk1");
    expect(res.ok && res.status).toBe("TODO");
  });
});

describe("deleteTask", () => {
  it("deletes when authorized", async () => {
    const res = await deleteTask("c1", "tk1");
    expect(res.ok).toBe(true);
    expect(db.task.delete).toHaveBeenCalledWith({ where: { id: "tk1" } });
  });
});
