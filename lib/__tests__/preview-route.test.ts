import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const actor = vi.fn();
const enable = vi.fn();
vi.mock("@/lib/authz", () => ({ getActor: () => actor() }));
vi.mock("next/headers", () => ({ draftMode: async () => ({ enable }) }));

import { GET } from "@/app/api/preview/route";
import { previewPath, safePreviewPath } from "@/lib/preview/safe-path";

const req = (path: string) => new Request(`http://hub.test/api/preview?path=${encodeURIComponent(path)}`);

beforeEach(() => {
  actor.mockReset();
  enable.mockReset();
});

describe("safePreviewPath", () => {
  it("accepts site paths", () => {
    expect(safePreviewPath("/en/about")).toBe("/en/about");
    expect(safePreviewPath("/fr")).toBe("/fr");
  });

  it("refuses protocol-relative and absolute paths", () => {
    for (const bad of ["//evil.com", "https://evil.com", "/\\evil.com", "javascript:alert(1)", "/%2F%2Fevil.com", "", null]) {
      expect(safePreviewPath(bad)).toBeNull();
    }
  });
});

describe("previewPath", () => {
  it("builds a page's address in the language being edited", () => {
    expect(previewPath({ slug: "about" }, "fr")).toBe("/api/preview?path=%2Ffr%2Fabout");
  });

  it("builds the homepage's address", () => {
    expect(previewPath(null, "ar")).toBe("/api/preview?path=%2Far");
  });

  it("uses English when the language is unknown, and the homepage when there's no slug yet", () => {
    expect(previewPath({ slug: "" }, undefined)).toBe("/api/preview?path=%2Fen");
  });
});

describe("GET /api/preview", () => {
  it("is staff only", async () => {
    actor.mockResolvedValue(null);
    expect((await GET(req("/en/about"))).status).toBe(403);
    actor.mockResolvedValue({ id: "u", role: "member" });
    expect((await GET(req("/en/about"))).status).toBe(403);
    expect(enable).not.toHaveBeenCalled();
  });

  it("refuses unsafe paths even for staff", async () => {
    actor.mockResolvedValue({ id: "u", role: "admin" });
    expect((await GET(req("//evil.com"))).status).toBe(400);
    expect(enable).not.toHaveBeenCalled();
  });

  it("turns on draft mode and redirects staff to the page", async () => {
    actor.mockResolvedValue({ id: "u", role: "team_editor" });
    const res = await GET(req("/fr/about"));
    expect(enable).toHaveBeenCalled();
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://hub.test/fr/about");
  });
});
