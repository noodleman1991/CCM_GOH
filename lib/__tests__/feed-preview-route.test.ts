import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const actor = vi.fn();
vi.mock("@/lib/authz", () => ({ getActor: () => actor() }));
const resolve = vi.fn();
vi.mock("@/lib/content/feeds/resolve", () => ({ resolveContentFeed: (s: unknown, c: unknown) => resolve(s, c) }));

import { POST } from "@/app/api/admin/feed-preview/route";

const req = (body: unknown) =>
  new Request("http://hub.test/api/admin/feed-preview", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } });

beforeEach(() => {
  actor.mockReset();
  resolve.mockReset();
});

describe("POST /api/admin/feed-preview", () => {
  it("is staff only", async () => {
    actor.mockResolvedValue({ id: "u", role: "member" });
    expect((await POST(req({ settings: {} }))).status).toBe(403);
    actor.mockResolvedValue(null);
    expect((await POST(req({ settings: {} }))).status).toBe(403);
    expect(resolve).not.toHaveBeenCalled();
  });

  it("returns titles, kinds and skipped picks for staff", async () => {
    actor.mockResolvedValue({ id: "u", role: "admin" });
    resolve.mockResolvedValue({
      items: [{ type: "newsPost", id: "1", title: "A", href: "/news/a" }],
      skipped: [{ pick: { kind: "caseStudies", id: "x" }, reason: "unpublished" }],
    });
    const res = await POST(req({ settings: { kinds: ["newsPosts"] }, locale: "fr", communityId: "c-1" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ items: [{ title: "A", kind: "newsPost", href: "/news/a" }], skipped: [{ kind: "caseStudies", id: "x" }] });
    expect(resolve).toHaveBeenCalledWith({ kinds: ["newsPosts"] }, { locale: "fr", communityId: "c-1" });
  });

  it("falls back to English for an unknown language", async () => {
    actor.mockResolvedValue({ id: "u", role: "team_editor" });
    resolve.mockResolvedValue({ items: [], skipped: [] });
    await POST(req({ settings: {}, locale: "xx" }));
    expect(resolve).toHaveBeenCalledWith({}, { locale: "en", communityId: null });
  });

  it("answers a plain error instead of crashing", async () => {
    actor.mockResolvedValue({ id: "u", role: "admin" });
    resolve.mockRejectedValue(new Error("db down"));
    const res = await POST(req({ settings: {} }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Couldn't load the preview. Try again in a moment." });
  });

  it("copes with a body that isn't JSON", async () => {
    actor.mockResolvedValue({ id: "u", role: "admin" });
    resolve.mockResolvedValue({ items: [], skipped: [] });
    const res = await POST(new Request("http://hub.test/api/admin/feed-preview", { method: "POST", body: "not json" }));
    expect(res.status).toBe(200);
  });

  it("reads a section's raw form values the same way the page does", async () => {
    actor.mockResolvedValue({ id: "u", role: "admin" });
    resolve.mockResolvedValue({ items: [], skipped: [] });
    await POST(
      req({
        block: {
          blockType: "contentFeed",
          kinds: ["newsPosts"],
          fill: "picksOnly",
          picks: [{ relationTo: "newsPosts", value: "n1" }],
          filters: { tags: ["t1"] },
        },
      }),
    );
    expect(resolve.mock.calls[0][0]).toMatchObject({
      kinds: ["newsPosts"],
      fill: "picksOnly",
      picks: [{ kind: "newsPosts", id: "n1" }],
      filters: { tagIds: ["t1"] },
    });
  });
});
