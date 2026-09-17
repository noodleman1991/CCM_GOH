/**
 * `POST /api/case-studies/drafts` (audit M6). Before this test the handler
 * spread `request.json()` straight into a CMS write: any size, any shape, any
 * key — including `_id` (the Sanity arm's `writeClient.create` honours it),
 * `userId` and `status`. The content layer is mocked; the limiter is real and
 * runs on its in-process bucket because the prisma mock has no `$queryRaw`.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const authMock = vi.fn<() => Promise<{ userId: string | null }>>();
vi.mock("@clerk/nextjs/server", () => ({ auth: () => authMock() }));

const saveDraft = vi.fn(async () => ({ id: "draft-1" }));
vi.mock("@/lib/content/case-studies", () => ({
  CaseStudyDraftNotFoundError: class CaseStudyDraftNotFoundError extends Error {},
  saveCaseStudyDraft: (...a: unknown[]) => saveDraft(...(a as [])),
  getLatestCaseStudyDraft: vi.fn(),
  deleteCaseStudyDraft: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: async () => {
      throw new Error("no database in tests");
    },
  },
}));

import { POST } from "@/app/api/case-studies/drafts/route";

function post(body: unknown, ip = "203.0.113.1") {
  return new NextRequest("http://localhost/api/case-studies/drafts", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const GOOD_DRAFT = {
  title: { en: "Heatwaves and sleep", es: "" },
  excerpt: { en: "" },
  topic: "",
  layout: "story",
  content: [],
  authors: [{ name: "", email: "a@example.org", role: "lead" }],
  tags: [],
  selectedTags: ["t1"],
  studyPeriod: { startDate: "", endDate: "" },
  locationText: { country: "", city: "" },
  studyLocation: {},
};

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({ userId: "user_drafts" });
});

describe("POST /api/case-studies/drafts", () => {
  it("accepts the shape the form's autosave really sends (empty strings, empty arrays)", async () => {
    const res = await POST(post({ draftId: undefined, draftData: GOOD_DRAFT }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: "draft-1" });
    expect(saveDraft).toHaveBeenCalledTimes(1);
  });

  it("strips the keys the server owns before the CMS write", async () => {
    const res = await POST(
      post({
        draftId: "draft-1",
        draftData: {
          ...GOOD_DRAFT,
          _id: "drafts.someone-elses",
          _type: "caseStudy",
          _rev: "abc",
          id: "someone-elses",
          userId: "user_victim",
          status: "approved",
          moderationStatus: "approved",
        },
      })
    );
    expect(res.status).toBe(200);
    const [userId, draftId, data] = saveDraft.mock.calls[0] as unknown as [string, string, Record<string, unknown>];
    expect(userId).toBe("user_drafts");
    expect(draftId).toBe("draft-1");
    for (const key of ["_id", "_type", "_rev", "id", "userId", "status", "moderationStatus"]) {
      expect(data).not.toHaveProperty(key);
    }
    expect(data.title).toEqual(GOOD_DRAFT.title);
    expect(data.selectedTags).toEqual(["t1"]);
  });

  it("rejects a body that is not draft-shaped with 400", async () => {
    const res = await POST(post({ draftData: { title: 5, content: "not blocks" } }));
    expect(res.status).toBe(400);
    expect(saveDraft).not.toHaveBeenCalled();
  });

  it("rejects a non-string draftId with 400", async () => {
    const res = await POST(post({ draftId: { $ne: null }, draftData: GOOD_DRAFT }));
    expect(res.status).toBe(400);
    expect(saveDraft).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON with 400 rather than 500", async () => {
    const res = await POST(post("{not json"));
    expect(res.status).toBe(400);
  });

  it("returns 413 for a body over the cap without parsing it", async () => {
    const huge = { draftData: { ...GOOD_DRAFT, excerpt: { en: "x".repeat(250 * 1024) } } };
    const res = await POST(post(huge));
    expect(res.status).toBe(413);
    expect(saveDraft).not.toHaveBeenCalled();
  });

  it("returns 429 on the 61st save inside the window for one user", async () => {
    authMock.mockResolvedValue({ userId: "user_autosave_flood" });
    const statuses: number[] = [];
    for (let i = 0; i < 61; i++) {
      statuses.push((await POST(post({ draftData: GOOD_DRAFT }))).status);
    }
    expect(statuses.slice(0, 60).every((s) => s === 200)).toBe(true);
    expect(statuses[60]).toBe(429);
    expect(saveDraft).toHaveBeenCalledTimes(60);
  });

  it("still requires sign-in", async () => {
    authMock.mockResolvedValue({ userId: null });
    const res = await POST(post({ draftData: GOOD_DRAFT }, "203.0.113.50"));
    expect(res.status).toBe(401);
    expect(saveDraft).not.toHaveBeenCalled();
  });
});
