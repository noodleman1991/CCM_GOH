import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn(async () => ({ userId: "user_1" })) }));
const list = vi.fn();
vi.mock("@/lib/content/contributions", () => ({ listMyContributions: (...a: unknown[]) => list(...a) }));
import { GET } from "@/app/api/case-studies/revisions/route";

describe("the sign-in revision alert", () => {
  it("lists every kind that needs changes, with its own edit link", async () => {
    list.mockResolvedValue([
      { id: "l1", kind: "livedExperience", title: "Rising tide", status: "revision", reviewNotes: "Add a place.", date: null, href: null, editHref: "/lived-experiences/submit?edit=l1", adminHref: "" },
      { id: "c1", kind: "caseStudy", title: "Reef", status: "approved", reviewNotes: null, date: null, href: "/x", editHref: null, adminHref: "" },
    ]);
    const body = await (await GET()).json();
    expect(body.submissions).toEqual([{ _id: "l1", kind: "livedExperience", title: { en: "Rising tide" }, reviewNotes: "Add a place.", editHref: "/lived-experiences/submit?edit=l1" }]);
  });
});
