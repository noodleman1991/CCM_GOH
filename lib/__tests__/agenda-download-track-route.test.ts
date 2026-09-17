/**
 * `app/api/agendas/download/track/route.ts` (and the legacy reports twin).
 *
 * Only the content-layer tracker is mocked — the route's own parsing, its
 * validation and its rate limit all run for real. Prisma is mocked to THROW so
 * `assertRateLimit` falls through to its in-process bucket: the 429 below is
 * the real limiter counting, not a stubbed `rateLimitRequest`.
 *
 * Every test posts from its own client IP: the in-process bucket is module
 * state, so a shared IP would let one test's hits count against another's.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const trackAgendaDownload = vi.fn();
const trackReportDownload = vi.fn();

vi.mock("@/lib/content/outputs", () => ({
  trackAgendaDownload: (...args: unknown[]) => trackAgendaDownload(...args),
  trackReportDownload: (...args: unknown[]) => trackReportDownload(...args),
}));
vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({ userId: null }),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: vi.fn(async () => {
      throw new Error("no database under test");
    }),
  },
}));

import { POST } from "@/app/api/agendas/download/track/route";
import { POST as reportsPOST } from "@/app/api/reports/download/track/route";

let ipCounter = 0;
function nextIp(): string {
  ipCounter += 1;
  return `10.0.${Math.floor(ipCounter / 250)}.${ipCounter % 250}`;
}

function post(path: string, body: unknown, ip: string): NextRequest {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  }) as unknown as NextRequest;
}

const AGENDA_PATH = "/api/agendas/download/track";
const REPORTS_PATH = "/api/reports/download/track";
const LIMIT = 30;

beforeEach(() => {
  vi.clearAllMocks();
  trackAgendaDownload.mockResolvedValue("tracked");
  trackReportDownload.mockResolvedValue(undefined);
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("POST /api/agendas/download/track", () => {
  it("increments once, through the content layer, for a valid body", async () => {
    const response = await POST(post(AGENDA_PATH, { agendaId: "agenda-1", fileLanguage: "en" }, nextIp()));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ success: true });
    expect(trackAgendaDownload).toHaveBeenCalledTimes(1);
    expect(trackAgendaDownload).toHaveBeenCalledWith("agenda-1", "en");
  });

  it("rejects a language the site does not publish in with 400 and never reaches the tracker", async () => {
    const response = await POST(post(AGENDA_PATH, { agendaId: "agenda-1", fileLanguage: "de" }, nextIp()));

    expect(response.status).toBe(400);
    expect(trackAgendaDownload).not.toHaveBeenCalled();
  });

  it("rejects a missing agenda id with 400", async () => {
    const response = await POST(post(AGENDA_PATH, { fileLanguage: "en" }, nextIp()));

    expect(response.status).toBe(400);
    expect(trackAgendaDownload).not.toHaveBeenCalled();
  });

  it("rejects a body that is not JSON with 400 rather than 500", async () => {
    const response = await POST(post(AGENDA_PATH, "not json", nextIp()));

    expect(response.status).toBe(400);
    expect(trackAgendaDownload).not.toHaveBeenCalled();
  });

  it("answers 404 when the agenda does not exist", async () => {
    trackAgendaDownload.mockResolvedValue("agenda-not-found");

    const response = await POST(post(AGENDA_PATH, { agendaId: "nope", fileLanguage: "en" }, nextIp()));

    expect(response.status).toBe(404);
  });

  it("answers 400 when the agenda has no file in that language", async () => {
    trackAgendaDownload.mockResolvedValue("language-not-found");

    const response = await POST(post(AGENDA_PATH, { agendaId: "agenda-1", fileLanguage: "ar" }, nextIp()));

    expect(response.status).toBe(400);
  });

  it("a failed counter write never fails the request — the download itself is not gated on it", async () => {
    trackAgendaDownload.mockRejectedValue(new Error("cms down"));

    const response = await POST(post(AGENDA_PATH, { agendaId: "agenda-1", fileLanguage: "en" }, nextIp()));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ success: false });
  });

  it(`rate-limits an anonymous caller to ${LIMIT} per window, per client, with Retry-After`, async () => {
    const ip = nextIp();
    const body = { agendaId: "agenda-1", fileLanguage: "en" };

    for (let i = 0; i < LIMIT; i += 1) {
      const ok = await POST(post(AGENDA_PATH, body, ip));
      expect(ok.status).toBe(200);
    }
    const limited = await POST(post(AGENDA_PATH, body, ip));

    expect(limited.status).toBe(429);
    expect(limited.headers.get("Retry-After")).toMatch(/^\d+$/);
    expect(trackAgendaDownload).toHaveBeenCalledTimes(LIMIT);

    // Another client is unaffected.
    const other = await POST(post(AGENDA_PATH, body, nextIp()));
    expect(other.status).toBe(200);
  });

  it("counts invalid bodies against the limit too, so garbage cannot be sent for free", async () => {
    const ip = nextIp();
    for (let i = 0; i < LIMIT; i += 1) {
      await POST(post(AGENDA_PATH, { fileLanguage: "xx" }, ip));
    }
    const limited = await POST(post(AGENDA_PATH, { agendaId: "agenda-1", fileLanguage: "en" }, ip));

    expect(limited.status).toBe(429);
    expect(trackAgendaDownload).not.toHaveBeenCalled();
  });
});

describe("POST /api/reports/download/track (legacy; deleted by Slice 3a)", () => {
  it("validates the body — a bad language is 400 before any CMS read", async () => {
    const response = await reportsPOST(post(REPORTS_PATH, { reportId: "r1", fileLanguage: "zz" }, nextIp()));

    expect(response.status).toBe(400);
    expect(trackReportDownload).not.toHaveBeenCalled();
  });

  it("still tracks a valid body", async () => {
    const response = await reportsPOST(post(REPORTS_PATH, { reportId: "r1", fileLanguage: "fr" }, nextIp()));

    expect(response.status).toBe(200);
    expect(trackReportDownload).toHaveBeenCalledWith("r1", "fr");
  });

  it(`rate-limits to ${LIMIT} per window as well`, async () => {
    const ip = nextIp();
    for (let i = 0; i < LIMIT; i += 1) {
      await reportsPOST(post(REPORTS_PATH, { reportId: "r1", fileLanguage: "en" }, ip));
    }
    const limited = await reportsPOST(post(REPORTS_PATH, { reportId: "r1", fileLanguage: "en" }, ip));

    expect(limited.status).toBe(429);
  });
});
