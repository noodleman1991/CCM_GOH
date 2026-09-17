import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const authMock = vi.fn<() => Promise<{ userId: string | null }>>();
vi.mock("@clerk/nextjs/server", () => ({ auth: () => authMock() }));

const getLatest = vi.fn<(userId: string) => Promise<unknown>>();
const getById = vi.fn<(userId: string, draftId: string) => Promise<unknown>>();
vi.mock("@/lib/content/case-studies", () => ({
  CaseStudyDraftNotFoundError: class extends Error {},
  deleteCaseStudyDraft: vi.fn(),
  saveCaseStudyDraft: vi.fn(),
  getLatestCaseStudyDraft: (userId: string) => getLatest(userId),
  getCaseStudyDraftById: (userId: string, draftId: string) => getById(userId, draftId),
}));

import { GET } from "@/app/api/case-studies/drafts/route";

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({ userId: "u1" });
});

/**
 * The submission form resumes the caller's *latest* draft on mount. The
 * submissions dashboard lists *every* draft with a Continue button, so it
 * needs to reopen one by id — `?id=` — and that lookup must stay scoped to
 * the caller: a guessed id must answer 404, never someone else's draft.
 */
describe("GET /api/case-studies/drafts", () => {
  it("without ?id returns the caller's latest draft (the autosave resume path)", async () => {
    getLatest.mockResolvedValue({ _id: "latest" });
    const res = await GET(new NextRequest("http://localhost/api/case-studies/drafts"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ draft: { _id: "latest" } });
    expect(getLatest).toHaveBeenCalledWith("u1");
    expect(getById).not.toHaveBeenCalled();
  });

  it("with ?id returns that draft, looked up under the caller's own id (the dashboard Continue path)", async () => {
    getById.mockResolvedValue({ _id: "d2" });
    const res = await GET(new NextRequest("http://localhost/api/case-studies/drafts?id=d2"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ draft: { _id: "d2" } });
    expect(getById).toHaveBeenCalledWith("u1", "d2");
    expect(getLatest).not.toHaveBeenCalled();
  });

  it("with ?id for a draft the caller does not own answers 404", async () => {
    getById.mockResolvedValue(null);
    const res = await GET(new NextRequest("http://localhost/api/case-studies/drafts?id=not-mine"));
    expect(res.status).toBe(404);
  });

  it("answers 401 when signed out, before any lookup", async () => {
    authMock.mockResolvedValue({ userId: null });
    const res = await GET(new NextRequest("http://localhost/api/case-studies/drafts?id=d2"));
    expect(res.status).toBe(401);
    expect(getById).not.toHaveBeenCalled();
    expect(getLatest).not.toHaveBeenCalled();
  });
});
