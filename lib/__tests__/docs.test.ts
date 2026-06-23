import { describe, it, expect, vi, beforeEach } from "vitest";

const getActorMock = vi.fn<() => any>();
const authorizeCollabMock = vi.fn<(...a: any[]) => Promise<any>>();
vi.mock("@/lib/authz", () => ({ getActor: () => getActorMock() }));
vi.mock("@/lib/collaboration/service", () => ({
  authorizeCollab: (...a: any[]) => authorizeCollabMock(...a),
}));

const db = vi.hoisted(() => {
  const d: any = {
    collaborationDoc: {
      count: vi.fn(async () => 0),
      create: vi.fn(async () => ({ id: "doc1" })),
      update: vi.fn(async () => ({})),
      delete: vi.fn(async () => ({})),
    },
  };
  return d;
});
vi.mock("@/lib/prisma", () => ({ prisma: db }));

import { createDoc, renameDoc, updateDocContent, deleteDoc } from "@/lib/actions/docs";

beforeEach(() => {
  vi.clearAllMocks();
  getActorMock.mockResolvedValue({ id: "u1", role: "community_member" });
  authorizeCollabMock.mockResolvedValue({ actorId: "u1", role: "EDITOR" });
});

describe("createDoc", () => {
  it("requires sign-in", async () => {
    getActorMock.mockResolvedValueOnce(null);
    const res = await createDoc("c1");
    expect(res.ok).toBe(false);
    expect(db.collaborationDoc.create).not.toHaveBeenCalled();
  });
  it("blocks non-editors", async () => {
    authorizeCollabMock.mockRejectedValueOnce(new Error("Forbidden"));
    const res = await createDoc("c1");
    expect(res.ok).toBe(false);
  });
  it("creates with order = current doc count", async () => {
    db.collaborationDoc.count.mockResolvedValueOnce(2);
    const res = await createDoc("c1");
    expect(res.ok).toBe(true);
    expect(db.collaborationDoc.create.mock.calls[0][0].data.order).toBe(2);
  });
  it("requests collab:editDoc", async () => {
    await createDoc("c1");
    expect(authorizeCollabMock).toHaveBeenCalledWith("c1", "collab:editDoc");
  });
});

describe("renameDoc", () => {
  it("rejects empty title", async () => {
    const res = await renameDoc("c1", "doc1", "  ");
    expect(res.ok).toBe(false);
  });
  it("updates a valid title", async () => {
    const res = await renameDoc("c1", "doc1", "Spec");
    expect(res.ok).toBe(true);
    expect(db.collaborationDoc.update).toHaveBeenCalledWith({ where: { id: "doc1" }, data: { title: "Spec" } });
  });
});

describe("updateDocContent", () => {
  it("rejects non-array content", async () => {
    const res = await updateDocContent("c1", "doc1", { not: "an array" });
    expect(res.ok).toBe(false);
    expect(db.collaborationDoc.update).not.toHaveBeenCalled();
  });
  it("persists Portable Text array", async () => {
    const pt = [{ _type: "block", children: [{ _type: "span", text: "hi" }] }];
    const res = await updateDocContent("c1", "doc1", pt);
    expect(res.ok).toBe(true);
    expect(db.collaborationDoc.update).toHaveBeenCalledWith({ where: { id: "doc1" }, data: { content: pt } });
  });
});

describe("deleteDoc", () => {
  it("deletes when authorized", async () => {
    const res = await deleteDoc("c1", "doc1");
    expect(res.ok).toBe(true);
    expect(db.collaborationDoc.delete).toHaveBeenCalledWith({ where: { id: "doc1" } });
  });
});
