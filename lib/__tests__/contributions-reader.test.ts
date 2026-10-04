import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const queryLive = vi.fn();
// queryRaw, not queryLive: a member must see their own unpublished submissions (drafts-enabled collections).
vi.mock("@/lib/content/internal/payload-source", () => ({ queryRaw: (d: unknown) => queryLive(d) }));
import { readMyContributions } from "@/lib/content/internal/payload/contributions";

beforeEach(() => queryLive.mockReset());

describe("reading a member's contributions", () => {
  it("asks each collection for the member's own rows, and drafts by their owner", async () => {
    queryLive.mockResolvedValue({ docs: [] });
    await readMyContributions("user_1", "en");
    const calls = queryLive.mock.calls.map(([d]) => d as { collection: string; where: unknown });
    expect(calls.map((c) => c.collection).sort()).toEqual(["caseStudies", "caseStudyDrafts", "events", "livedExperiences", "researchOutputs"]);
    for (const c of calls.filter((c) => c.collection !== "caseStudyDrafts")) expect(c.where).toEqual({ submittedBy: { equals: "user_1" } });
    expect(calls.find((c) => c.collection === "caseStudyDrafts")?.where).toEqual({ userId: { equals: "user_1" } });
  });
  it("keeps the other kinds when one read fails", async () => {
    queryLive.mockImplementation(async (d?: { collection: string }) => {
      if (d?.collection === "events") throw new Error("down");
      return { docs: d?.collection === "livedExperiences" ? [{ id: "l1", title: { en: "Story" }, moderationStatus: "revision" }] : [] };
    });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const list = await readMyContributions("user_1", "en");
    expect(list.map((c) => [c.kind, c.id, c.status])).toEqual([["livedExperience", "l1", "revision"]]);
    expect(spy).toHaveBeenCalled();
    expect(queryLive.mock.calls.map(([d]) => (d as { collection?: string } | undefined)?.collection ?? "NO ARGUMENT").sort()).toEqual(["caseStudies", "caseStudyDrafts", "events", "livedExperiences", "researchOutputs"]);
    spy.mockRestore();
  });
});
