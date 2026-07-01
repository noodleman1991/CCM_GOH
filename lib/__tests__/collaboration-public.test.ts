import { describe, it, expect, vi, beforeEach } from "vitest";
import { canShowPublicProject, canRequestToJoin } from "@/lib/collaboration/public";

const findUniqueMock = vi.fn();
const outputsFindManyMock = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    collaboration: { findUnique: (...a: any[]) => findUniqueMock(...a) },
    workspaceOutput: { findMany: (...a: any[]) => outputsFindManyMock(...a) },
  },
  safeQuery: async (fn: () => Promise<any>) => {
    try {
      return { success: true, data: await fn() };
    } catch (e) {
      return { success: false, error: e };
    }
  },
}));

// import AFTER the mock
import { getPublicProject } from "@/lib/collaboration/public";

describe("canShowPublicProject", () => {
  it("shows the public page to a non-member, non-staff viewer", () => {
    expect(canShowPublicProject({ membershipRole: null, isStaff: false })).toBe(true);
  });

  it("shows the workspace (not public page) to a member", () => {
    expect(canShowPublicProject({ membershipRole: "VIEWER", isStaff: false })).toBe(false);
    expect(canShowPublicProject({ membershipRole: "OWNER", isStaff: false })).toBe(false);
  });

  it("shows the workspace (not public page) to global staff", () => {
    expect(canShowPublicProject({ membershipRole: null, isStaff: true })).toBe(false);
  });
});

describe("getPublicProject", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null when the collaboration is missing", async () => {
    findUniqueMock.mockResolvedValueOnce(null);
    expect(await getPublicProject("nope")).toBeNull();
  });

  it("projects public-safe fields, lead, members, and approved-only outputs", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "c1",
      title: "Flood recovery study",
      description: "About it",
      status: "ACTIVE",
      visibility: "PUBLIC",
      createdById: "u-lead",
      members: [
        { role: "OWNER", user: { id: "u-lead", username: "lead", firstName: "Ama", lastName: "O", image: null } },
        { role: "EDITOR", user: { id: "u2", username: "co", firstName: "Ben", lastName: null, image: null } },
      ],
      _count: { members: 2, outputs: 3 },
    });
    outputsFindManyMock.mockResolvedValueOnce([
      { id: "o1", sanityType: "caseStudy", title: "Published CS", status: "approved" },
    ]);

    const p = await getPublicProject("c1");
    expect(p).not.toBeNull();
    expect(p!.title).toBe("Flood recovery study");
    expect(p!.status).toBe("ACTIVE");
    expect(p!.lead).toEqual({ id: "u-lead", name: "Ama O", username: "lead", image: null });
    expect(p!.members).toHaveLength(2);
    // the prisma query must have filtered to approved status
    expect(outputsFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ collaborationId: "c1", status: "approved" }) })
    );
    expect(p!.outputs).toEqual([{ id: "o1", sanityType: "caseStudy", title: "Published CS", slug: null }]);
  });
});

describe("canRequestToJoin", () => {
  it("allows a signed-in non-member", () => {
    expect(canRequestToJoin({ isSignedIn: true, isMember: false })).toBe(true);
  });
  it("blocks anonymous viewers", () => {
    expect(canRequestToJoin({ isSignedIn: false, isMember: false })).toBe(false);
  });
  it("blocks existing members", () => {
    expect(canRequestToJoin({ isSignedIn: true, isMember: true })).toBe(false);
  });
});
