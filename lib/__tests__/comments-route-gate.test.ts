import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const authMock = vi.fn<() => Promise<{ userId: string | null }>>();
vi.mock("@clerk/nextjs/server", () => ({ auth: () => authMock() }));

const collaborationIdForTargetMock = vi.fn<(...a: any[]) => Promise<string | null>>();
vi.mock("@/lib/comments/target", () => ({
  collaborationIdForTarget: (...a: any[]) => collaborationIdForTargetMock(...a),
}));

const authorizeCollabMock = vi.fn<(...a: any[]) => Promise<any>>();
vi.mock("@/lib/collaboration/service", () => ({
  authorizeCollab: (...a: any[]) => authorizeCollabMock(...a),
}));

const listCommentsMock = vi.fn<(...a: any[]) => Promise<any>>(async () => ({
  comments: [],
  nextCursor: null,
}));
vi.mock("@/lib/comments/queries", () => ({
  listComments: (...a: any[]) => listCommentsMock(...a),
}));

import { GET } from "@/app/api/comments/route";

function reqFor(targetType: string, targetId: string) {
  return new NextRequest(
    `http://localhost/api/comments?targetType=${targetType}&targetId=${targetId}`
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({ userId: null });
});

describe("GET /api/comments — workspace target membership gate", () => {
  it.each(["collaborationThread", "collaborationFile", "collaborationDoc"])(
    "returns 403 for %s when the viewer isn't authorized",
    async (targetType) => {
      collaborationIdForTargetMock.mockResolvedValue("c1");
      authorizeCollabMock.mockRejectedValue(new Error("Forbidden"));

      const res = await GET(reqFor(targetType, "t1"));

      expect(res.status).toBe(403);
      expect(listCommentsMock).not.toHaveBeenCalled();
    }
  );

  it.each(["collaborationThread", "collaborationFile", "collaborationDoc"])(
    "returns 404 for %s when the target doesn't resolve to a collaboration",
    async (targetType) => {
      collaborationIdForTargetMock.mockResolvedValue(null);

      const res = await GET(reqFor(targetType, "missing"));

      expect(res.status).toBe(404);
      expect(authorizeCollabMock).not.toHaveBeenCalled();
      expect(listCommentsMock).not.toHaveBeenCalled();
    }
  );

  it.each(["collaborationThread", "collaborationFile", "collaborationDoc"])(
    "requests collab:read and lists comments for %s when authorized",
    async (targetType) => {
      collaborationIdForTargetMock.mockResolvedValue("c1");
      authorizeCollabMock.mockResolvedValue({ actorId: "u1", role: "VIEWER" });

      const res = await GET(reqFor(targetType, "t1"));

      expect(authorizeCollabMock).toHaveBeenCalledWith("c1", "collab:read");
      expect(listCommentsMock).toHaveBeenCalled();
      expect(res.status).toBe(200);
    }
  );

  it("does not gate Sanity-backed targets (caseStudy)", async () => {
    const res = await GET(reqFor("caseStudy", "cs1"));
    expect(authorizeCollabMock).not.toHaveBeenCalled();
    expect(listCommentsMock).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });
});
