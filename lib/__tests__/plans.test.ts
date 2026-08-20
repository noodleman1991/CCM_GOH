import { describe, it, expect, vi, beforeEach } from "vitest";

const getActorMock = vi.fn<() => Promise<unknown>>();
const authorizeCollabMock = vi.fn<(...a: unknown[]) => Promise<unknown>>();
vi.mock("@/lib/authz", () => ({ getActor: () => getActorMock() }));
vi.mock("@/lib/collaboration/service", () => ({
  authorizeCollab: (...a: unknown[]) => authorizeCollabMock(...a),
}));

const db = vi.hoisted(() => {
  type MockFn = ReturnType<typeof vi.fn>;
  const d: {
    plan: Record<string, MockFn>;
    planStage: Record<string, MockFn>;
    task: Record<string, MockFn>;
    collaborationMember: Record<string, MockFn>;
    $transaction: MockFn;
  } = {
    plan: { upsert: vi.fn(async () => ({ id: "p1", _count: { stages: 0 } })) },
    planStage: {
      create: vi.fn(async () => ({ id: "s1" })),
      update: vi.fn(async () => ({})),
      delete: vi.fn(async () => ({})),
      updateMany: vi.fn(async () => ({ count: 1 })),
      deleteMany: vi.fn(async () => ({ count: 1 })),
      findFirst: vi.fn(async () => ({ id: "s1" })),
    },
    task: {
      count: vi.fn(async () => 0),
      create: vi.fn(async () => ({ id: "tk1" })),
      findUnique: vi.fn(async () => ({ status: "TODO" })),
      findFirst: vi.fn(async () => ({ id: "tk1", status: "TODO", title: "T" })),
      update: vi.fn(async () => ({ title: "T" })),
      delete: vi.fn(async () => ({})),
      updateMany: vi.fn(async () => ({ count: 1 })),
      deleteMany: vi.fn(async () => ({ count: 1 })),
      findMany: vi.fn(async () => []),
    },
    collaborationMember: { findUnique: vi.fn(async () => ({ userId: "u2" })) },
    $transaction: vi.fn(async (ops: unknown[]) => Promise.all(ops)),
  };
  return d;
});
vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/notifications/emit", () => ({ emitLifecycle: vi.fn(async () => {}) }));

import { addStage, addTask, cycleTaskStatus, deleteTask, reorderTasks, reorderStages, assignTask, renameStage } from "@/lib/actions/plans";

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
    db.task.findFirst.mockResolvedValueOnce({ status: "TODO" });
    const res = await cycleTaskStatus("c1", "tk1");
    expect(res.ok && res.status).toBe("IN_PROGRESS");
  });
  it("cycles IN_PROGRESS -> DONE", async () => {
    db.task.findFirst.mockResolvedValueOnce({ status: "IN_PROGRESS" });
    const res = await cycleTaskStatus("c1", "tk1");
    expect(res.ok && res.status).toBe("DONE");
  });
  it("cycles DONE -> TODO", async () => {
    db.task.findFirst.mockResolvedValueOnce({ status: "DONE" });
    const res = await cycleTaskStatus("c1", "tk1");
    expect(res.ok && res.status).toBe("TODO");
  });
});

describe("deleteTask", () => {
  it("deletes when authorized", async () => {
    const res = await deleteTask("c1", "tk1");
    expect(res.ok).toBe(true);
    expect(db.task.deleteMany).toHaveBeenCalledWith({
      where: { id: "tk1", stage: { plan: { collaborationId: "c1" } } },
    });
  });
});

describe("reorder (drag persistence)", () => {
  it("reorderTasks rewrites each task's order in one transaction", async () => {
    const res = await reorderTasks("c1", "s1", ["tk3", "tk1", "tk2"]);
    expect(res.ok).toBe(true);
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    // each task updated to its new index + the target stage
    // Scoped through the stage→plan relation so a foreign task id matches nothing.
    expect(db.task.updateMany).toHaveBeenCalledWith({
      where: { id: "tk3", stage: { plan: { collaborationId: "c1" } } },
      data: { stageId: "s1", order: 0 },
    });
    expect(db.task.updateMany).toHaveBeenCalledWith({
      where: { id: "tk2", stage: { plan: { collaborationId: "c1" } } },
      data: { stageId: "s1", order: 2 },
    });
  });

  it("reorderTasks is blocked for non-editors", async () => {
    authorizeCollabMock.mockRejectedValueOnce(new Error("Forbidden"));
    const res = await reorderTasks("c1", "s1", ["tk1"]);
    expect(res.ok).toBe(false);
  });

  it("reorderStages rewrites stage order", async () => {
    const res = await reorderStages("c1", ["s2", "s1"]);
    expect(res.ok).toBe(true);
    expect(db.planStage.updateMany).toHaveBeenCalledWith({
      where: { id: "s2", plan: { collaborationId: "c1" } },
      data: { order: 0 },
    });
    expect(db.planStage.updateMany).toHaveBeenCalledWith({
      where: { id: "s1", plan: { collaborationId: "c1" } },
      data: { order: 1 },
    });
  });
});

// Being authorized for a workspace does not make another workspace's stages and
// tasks addressable — the scope filter is what enforces that.
describe("cross-workspace scoping", () => {
  it("refuses to rename a stage from another workspace", async () => {
    db.planStage.updateMany.mockResolvedValueOnce({ count: 0 });
    const res = await renameStage("c1", "stage-from-c2", "Hijacked");
    expect(res.ok).toBe(false);
  });
  it("refuses to delete a task from another workspace", async () => {
    db.task.deleteMany.mockResolvedValueOnce({ count: 0 });
    const res = await deleteTask("c1", "task-from-c2");
    expect(res.ok).toBe(false);
  });
  it("refuses to add a task to a stage from another workspace", async () => {
    db.planStage.findFirst.mockResolvedValueOnce(null);
    const res = await addTask("c1", "stage-from-c2", "Sneaky");
    expect(res.ok).toBe(false);
    expect(db.task.create).not.toHaveBeenCalled();
  });
  it("refuses to reorder into a stage from another workspace", async () => {
    db.planStage.findFirst.mockResolvedValueOnce(null);
    const res = await reorderTasks("c1", "stage-from-c2", ["tk1"]);
    expect(res.ok).toBe(false);
    expect(db.$transaction).not.toHaveBeenCalled();
  });
  it("refuses to assign someone who isn't a member", async () => {
    db.collaborationMember.findUnique.mockResolvedValueOnce(null);
    const res = await assignTask("c1", "tk1", "outsider");
    expect(res.ok).toBe(false);
    expect(db.task.update).not.toHaveBeenCalled();
  });
});

describe("assignTask", () => {
  it("is blocked for non-editors", async () => {
    authorizeCollabMock.mockRejectedValueOnce(new Error("Forbidden"));
    const res = await assignTask("c1", "tk1", "u2");
    expect(res.ok).toBe(false);
    expect(db.task.update).not.toHaveBeenCalled();
  });

  it("requests the collab:editPlan capability", async () => {
    await assignTask("c1", "tk1", "u2");
    expect(authorizeCollabMock).toHaveBeenCalledWith("c1", "collab:editPlan");
  });

  it("assigns a member", async () => {
    const res = await assignTask("c1", "tk1", "u2");
    expect(res.ok).toBe(true);
    expect(db.task.update).toHaveBeenCalledWith({ where: { id: "tk1" }, data: { assigneeId: "u2" }, select: { title: true } });
  });

  it("clears the assignment when given null", async () => {
    const res = await assignTask("c1", "tk1", null);
    expect(res.ok).toBe(true);
    expect(db.task.update).toHaveBeenCalledWith({ where: { id: "tk1" }, data: { assigneeId: null }, select: { title: true } });
  });
});
