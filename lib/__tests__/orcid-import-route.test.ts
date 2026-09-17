/**
 * `app/api/profile/import/orcid/route.ts` — how upstream timeouts surface.
 *
 * The integrations stay thin wrappers that throw; this route already mapped a
 * thrown ORCID error to 500 "Import failed" and a thrown OpenAlex error to an
 * empty supplement. Those results must not change when the failure is a
 * timeout, but both must now be reported instead of one being `console.error`ed
 * and the other swallowed by `.catch(() => [])`.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

const report = vi.hoisted(() => ({ reportError: vi.fn() }));
vi.mock("@/lib/errors/report", () => report);
vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({ userId: "user_1" }),
}));

import { GET } from "@/app/api/profile/import/orcid/route";

const ORCID = "0000-0002-1825-0097";
const TIMEOUT = () => new DOMException("The operation was aborted due to timeout", "TimeoutError");

function req(): NextRequest {
  return new NextRequest(`http://localhost/api/profile/import/orcid?orcid=${ORCID}`);
}

function okJson(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as unknown as Response;
}

const ORCID_WORKS = {
  group: [{ "work-summary": [{ "put-code": 1, title: { title: { value: "Heat and mind" } }, "publication-date": { year: { value: "2024" } } }] }],
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GET /api/profile/import/orcid", () => {
  it("ORCID timeout → the existing 500 'Import failed', reported with the route", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("orcid.org")) throw TIMEOUT();
        return okJson({ results: [] });
      })
    );

    const res = await GET(req());
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Import failed" });
    expect(report.reportError).toHaveBeenCalled();
    const ctx = report.reportError.mock.calls.find((c) => (c[1] as { tags?: { source?: string } })?.tags?.source !== "openalex")?.[1];
    expect(ctx).toMatchObject({ route: "profile/import/orcid" });
  });

  it("OpenAlex timeout → 200 with ORCID works only, and the OpenAlex failure is reported", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("openalex.org")) throw TIMEOUT();
        if (url.endsWith("/works")) return okJson(ORCID_WORKS);
        return okJson({ "affiliation-group": [] });
      })
    );

    const res = await GET(req());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { works: { title: string }[]; affiliations: unknown[] };
    expect(body.works.map((w) => w.title)).toEqual(["Heat and mind"]);
    expect(report.reportError).toHaveBeenCalledTimes(1);
    const [err, ctx] = report.reportError.mock.calls[0];
    expect((err as DOMException).name).toBe("TimeoutError");
    expect(ctx).toMatchObject({ route: "profile/import/orcid", tags: { source: "openalex" } });
  });

  it("healthy upstreams → merged works, nothing reported", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("openalex.org")) return okJson({ results: [{ id: "W1", title: "Flood grief", publication_year: 2023 }] });
        if (url.endsWith("/works")) return okJson(ORCID_WORKS);
        return okJson({ "affiliation-group": [] });
      })
    );

    const res = await GET(req());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { works: { title: string }[] };
    expect(body.works.map((w) => w.title)).toEqual(["Heat and mind", "Flood grief"]);
    expect(report.reportError).not.toHaveBeenCalled();
  });
});
