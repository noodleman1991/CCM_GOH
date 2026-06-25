import { describe, it, expect, vi, beforeEach } from "vitest";

const getActorMock = vi.fn<() => any>();
vi.mock("@/lib/authz", () => ({ getActor: () => getActorMock() }));

const authorizeMock = vi.fn<(...a: any[]) => Promise<void>>(async () => {});
vi.mock("@/lib/collaboration/service", () => ({ authorizeCollab: (...a: any[]) => authorizeMock(...a) }));

const createMock = vi.fn<(...a: any[]) => Promise<any>>(async () => ({ _id: "draft.new" }));
vi.mock("@/sanity/lib/write-client", () => ({ writeClient: { create: (...a: any[]) => createMock(...a) } }));

const db = vi.hoisted(() => {
  const d: any = {
    workspaceOutput: {
      create: vi.fn(async () => ({ id: "wo1" })),
      findFirst: vi.fn(async () => ({ id: "wo1", collaborationId: "c1" })),
      delete: vi.fn(async () => ({})),
    },
  };
  return d;
});
vi.mock("@/lib/prisma", () => ({ prisma: db }));

import { addOutput, removeOutput } from "@/lib/actions/workspace-outputs";

const ACTOR = { id: "u1", role: "community_member" as const };
beforeEach(() => {
  vi.clearAllMocks();
  getActorMock.mockResolvedValue(ACTOR);
  authorizeMock.mockResolvedValue(undefined);
});

describe("addOutput", () => {
  it("requires sign-in", async () => {
    getActorMock.mockResolvedValueOnce(null);
    const res = await addOutput({ collaborationId: "c1", sanityType: "caseStudy", mode: "create" });
    expect(res.ok).toBe(false);
  });

  it("rejects an unknown output type", async () => {
    const res = await addOutput({ collaborationId: "c1", sanityType: "dataset", mode: "create" });
    expect(res.ok).toBe(false);
  });

  it("create mode makes a Sanity draft and links it", async () => {
    const res = await addOutput({ collaborationId: "c1", sanityType: "caseStudy", mode: "create", title: "X" });
    expect(res.ok).toBe(true);
    expect(createMock).toHaveBeenCalled();
    expect(db.workspaceOutput.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ collaborationId: "c1", sanityType: "caseStudy", sanityId: "draft.new" }) })
    );
  });

  it("link mode requires a sanityId", async () => {
    const res = await addOutput({ collaborationId: "c1", sanityType: "caseStudy", mode: "link" });
    expect(res.ok).toBe(false);
  });

  it("link mode links an existing draft without creating one", async () => {
    const res = await addOutput({ collaborationId: "c1", sanityType: "caseStudy", mode: "link", sanityId: "draft.x" });
    expect(res.ok).toBe(true);
    expect(createMock).not.toHaveBeenCalled();
    expect(db.workspaceOutput.create).toHaveBeenCalled();
  });

  it("propagates an authz failure", async () => {
    authorizeMock.mockRejectedValueOnce(new Error("Not permitted."));
    const res = await addOutput({ collaborationId: "c1", sanityType: "caseStudy", mode: "create" });
    expect(res.ok).toBe(false);
  });
});

describe("removeOutput", () => {
  it("deletes a linked output the workspace owns", async () => {
    const res = await removeOutput({ collaborationId: "c1", outputId: "wo1" });
    expect(res.ok).toBe(true);
    expect(db.workspaceOutput.delete).toHaveBeenCalledWith({ where: { id: "wo1" } });
  });

  it("rejects removing an output from another workspace", async () => {
    db.workspaceOutput.findFirst.mockResolvedValueOnce(null);
    const res = await removeOutput({ collaborationId: "c1", outputId: "nope" });
    expect(res.ok).toBe(false);
  });
});
