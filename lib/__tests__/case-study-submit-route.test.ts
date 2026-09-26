import { beforeEach, describe, expect, it, vi } from "vitest";

const { submit, tags, rateLimit, EditNotAllowed } = vi.hoisted(() => ({
  submit: vi.fn<(input: unknown) => Promise<{ id: string; slug: string; status: string }>>(async () => ({ id: "cs1", slug: "s", status: "pending" })),
  tags: vi.fn(async (): Promise<Array<{ _id: string; category?: string }>> => [{ _id: "t1", category: "topic" }]),
  rateLimit: vi.fn(async (): Promise<Response | null> => null),
  EditNotAllowed: class CaseStudyEditNotAllowedError extends Error {},
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(async () => ({ userId: "u1" })),
  currentUser: vi.fn(async () => ({ imageUrl: "", username: "ada", emailAddresses: [] })),
}));
vi.mock("@/lib/rate-limit-route", () => ({ rateLimitRequest: rateLimit }));
vi.mock("@/lib/analytics/server", () => ({ captureAfterResponse: vi.fn() }));
vi.mock("@/lib/actions/workspace-outputs", () => ({ addOutput: vi.fn() }));
vi.mock("next-intl/server", () => ({
  getTranslations: async () => Object.assign((key: string) => `T(${key})`, { has: () => true }),
}));
vi.mock("@/lib/content/case-studies", () => ({
  submitCaseStudy: submit,
  getAvailableCaseStudyTags: tags,
  CaseStudyEditNotAllowedError: EditNotAllowed,
}));

import { auth } from "@clerk/nextjs/server";
import { POST } from "@/app/api/case-studies/submit/route";

const request = (data: unknown, raw?: string) => {
  const body = new FormData();
  body.append("data", raw ?? JSON.stringify(data));
  return new Request("http://x/api/case-studies/submit", { method: "POST", body, headers: { "x-locale": "fr" } }) as never;
};

const place = { lat: 6.45, lng: 3.39, text: "Lagos", precision: "city", countryCode3: "NGA", country: "Nigeria", city: "Lagos" };
const complete = {
  originalLanguage: "en",
  title: { en: "Floods in Lagos" },
  excerpt: { en: "x".repeat(60) },
  content: [{ _type: "block", children: [{ _type: "span", text: "It rained." }] }],
  authors: [{ name: "Ada" }],
  tags: ["t1"],
  place,
};

beforeEach(() => {
  submit.mockClear();
  tags.mockReset();
  tags.mockResolvedValue([{ _id: "t1", category: "topic" }]);
  rateLimit.mockResolvedValue(null);
});

describe("POST /api/case-studies/submit", () => {
  it("answers problems per field in plain words", async () => {
    const res = await POST(request({ title: { en: "ab" }, content: [], authors: [{ name: "A" }], tags: [] }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.message).toBe("T(form.fixBelow)");
    expect(body.error.fields).toMatchObject({ "title.en": "T(title.tooShort)", tags: "T(tags.themeRequired)", location: "T(location.required)" });
    expect(submit).not.toHaveBeenCalled();
  });

  it("accepts a complete submission and passes language and place through", async () => {
    const res = await POST(request(complete));
    expect(res.status).toBe(200);
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ originalLanguage: "en", place }));
    const body = await res.json();
    expect(body).toEqual({ success: true, id: "cs1", slug: "s", status: "pending" });
  });

  it("passes a removed cover through as null, so a resubmission can clear it", async () => {
    await POST(request({ ...complete, imageAssetId: null, editId: "cs1" }));
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ imageAssetId: null, editId: "cs1" }));
  });

  it("does not enforce the theme rule when no theme tags exist, and says so once in the log", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    tags.mockResolvedValue([{ _id: "a1", category: "audience" }]);
    const res = await POST(request({ ...complete, tags: ["a1"] }));
    expect(res.status).toBe(200);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it("answers in plain words when the tags cannot be loaded", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    tags.mockRejectedValue(new Error("db down"));
    const res = await POST(request(complete));
    expect(res.status).toBe(500);
    expect((await res.json()).error.message).toBe("T(form.generic)");
    err.mockRestore();
  });

  it("asks the reader to sign in", async () => {
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never);
    const res = await POST(request(complete));
    expect(res.status).toBe(401);
    expect((await res.json()).error.message).toBe("T(form.signIn)");
  });

  it("answers a rate limit in plain words", async () => {
    rateLimit.mockResolvedValue(new Response("slow down", { status: 429 }));
    const res = await POST(request(complete));
    expect(res.status).toBe(429);
    expect((await res.json()).error.message).toBe("T(form.rateLimited)");
  });

  it("answers unreadable data with the generic message", async () => {
    const res = await POST(request(null, "{not json"));
    expect(res.status).toBe(400);
    expect((await res.json()).error.message).toBe("T(form.generic)");
  });

  it("answers an edit that is no longer allowed with 403", async () => {
    submit.mockRejectedValueOnce(new EditNotAllowed());
    const res = await POST(request({ ...complete, editId: "cs1" }));
    expect(res.status).toBe(403);
    expect((await res.json()).error.message).toBe("T(form.notAllowed)");
  });
});
