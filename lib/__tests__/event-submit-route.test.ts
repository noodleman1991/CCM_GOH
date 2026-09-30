import { beforeEach, describe, expect, it, vi } from "vitest";

const { settings, pending, submitEvent, updateEvent, editGate, rateLimit, authUser } = vi.hoisted(() => ({
  settings: vi.fn(async () => ({ open: true, blocked: [] as string[] })),
  pending: vi.fn(async () => 0),
  submitEvent: vi.fn(async () => ({ id: "ev-new" })),
  updateEvent: vi.fn(async () => undefined),
  editGate: vi.fn(async () => ({ _id: "ev1", submittedBy: "user_1", status: "pending" })),
  rateLimit: vi.fn(async (): Promise<Response | null> => null),
  authUser: { userId: "user_1" as string | null },
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(async () => ({ userId: authUser.userId })),
  currentUser: vi.fn(async () => ({ id: authUser.userId })),
}));
vi.mock("@/lib/rate-limit-route", () => ({ rateLimitRequest: rateLimit }));
vi.mock("@/lib/analytics/server", () => ({ captureAfterResponse: vi.fn() }));
vi.mock("@/lib/actions/workspace-outputs", () => ({ addOutput: vi.fn(async () => ({ ok: true })) }));
vi.mock("next-intl/server", () => ({
  getTranslations: async () => Object.assign((key: string) => `T(${key})`, { has: () => true }),
}));
vi.mock("@/lib/content/discovery", () => ({
  getEventSuggestionSettings: settings,
  countPendingEventSuggestions: pending,
  submitEvent,
  updateEvent,
  getEventEditGate: editGate,
}));

import { POST } from "@/app/api/events/submit/route";

const req = (body: unknown) =>
  new Request("http://x/api/events/submit", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json", "x-locale": "en" } }) as never;
const start = "2026-11-02T10:00:00.000Z";

beforeEach(() => {
  vi.clearAllMocks();
  authUser.userId = "user_1";
  settings.mockResolvedValue({ open: true, blocked: [] });
  pending.mockResolvedValue(0);
});

describe("POST /api/events/submit", () => {
  it("asks visitors to sign in", async () => {
    authUser.userId = null;
    expect((await POST(req({ title: "Coastal walk", startAt: start }))).status).toBe(401);
  });

  it("refuses while suggestions are paused, in the reader's words", async () => {
    settings.mockResolvedValue({ open: false, blocked: [] });
    const res = await POST(req({ title: "Coastal walk", startAt: start }));
    expect(res.status).toBe(403);
    expect((await res.json()).error.message).toBe("T(events.paused)");
    expect(submitEvent).not.toHaveBeenCalled();
  });

  it("refuses a blocked member's edit", async () => {
    settings.mockResolvedValue({ open: true, blocked: ["user_1"] });
    const res = await POST(req({ editId: "ev1", title: "Coastal walk", startAt: start }));
    expect(res.status).toBe(403);
    expect((await res.json()).error.message).toBe("T(events.blocked)");
    expect(updateEvent).not.toHaveBeenCalled();
  });

  it("refuses a sixth waiting suggestion", async () => {
    pending.mockResolvedValue(5);
    const res = await POST(req({ title: "Coastal walk", startAt: start }));
    expect(res.status).toBe(429);
    expect((await res.json()).error.message).toBe("T(events.tooMany)");
  });

  it("works without the engagement switch and saves who runs it and where", async () => {
    const res = await POST(
      req({
        title: "Reef day",
        startAt: start,
        mode: "in_person",
        origin: "external",
        organiserName: "Reef Trust",
        url: "https://reef.example",
        place: { lat: -18.1, lng: 178.4, text: "Suva, Fiji", precision: "city", countryCode3: "FJI" },
      }),
    );
    expect(res.status).toBe(200);
    expect(submitEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: "external",
        organiserName: "Reef Trust",
        url: "https://reef.example",
        submittedBy: "user_1",
        place: { text: "Suva, Fiji", point: [178.4, -18.1], precision: "city", countryCode: "FJI" },
      }),
    );
  });

  it("asks for the website of an outside event", async () => {
    const res = await POST(req({ title: "Reef day", startAt: start, origin: "external" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error.fields.url).toBe("T(events.websiteRequired)");
    expect(submitEvent).not.toHaveBeenCalled();
  });
});
