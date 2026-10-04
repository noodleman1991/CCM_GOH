// lib/__tests__/contributions-model.test.ts
import { describe, expect, it } from "vitest";
import { countByKind, countByStatus, draftToContribution, groupContributions, toContribution, type Contribution } from "@/lib/contributions/model";

const row = (o: Record<string, unknown> = {}) => ({ id: "s1", title: { en: "Reef day", ar: "يوم الشعاب" }, slug: "reef-day", moderationStatus: "pending", reviewNotes: null, createdAt: "2026-09-01T10:00:00.000Z", ...o });

describe("a contribution", () => {
  it("links each kind to its own edit form while it can still change", () => {
    expect(toContribution("caseStudy", row(), "en")?.editHref).toBe("/research-and-action/case-studies/submit?edit=s1");
    expect(toContribution("livedExperience", row(), "en")?.editHref).toBe("/lived-experiences/submit?edit=s1");
    expect(toContribution("researchOutput", row(), "en")?.editHref).toBe("/research-and-action/research-outputs/submit?edit=s1");
    expect(toContribution("event", row({ moderationStatus: "revision" }), "en")?.editHref).toBe("/events/suggest?edit=s1");
  });
  it("opens the public page only once approved and slugged", () => {
    expect(toContribution("event", row({ moderationStatus: "approved" }), "en")).toMatchObject({ href: "/events/reef-day", editHref: null });
    expect(toContribution("event", row({ moderationStatus: "approved", slug: null }), "en")?.href).toBeNull();
    expect(toContribution("event", row(), "en")?.href).toBeNull();
  });
  it("offers no edit once declined, but keeps the team's note", () => {
    expect(toContribution("caseStudy", row({ moderationStatus: "rejected", reviewNotes: "Out of scope." }), "en")).toMatchObject({ editHref: null, reviewNotes: "Out of scope." });
  });
  it("reads an unknown status as waiting, and picks the page's language for the title", () => {
    const c = toContribution("livedExperience", row({ moderationStatus: undefined }), "ar");
    expect(c).toMatchObject({ status: "pending", title: "يوم الشعاب" });
    expect(toContribution("livedExperience", row({ title: { fr: "Journée récif" } }), "es")?.title).toBe("Journée récif");
    expect(toContribution("livedExperience", row({ title: null }), "en")?.title).toBeNull();
  });
  it("uses the case study's sent date and points the admin at the right collection", () => {
    expect(toContribution("caseStudy", row({ submittedAt: "2026-09-02T00:00:00.000Z" }), "en")).toMatchObject({ date: "2026-09-02T00:00:00.000Z", adminHref: "/admin/collections/caseStudies/s1" });
  });
  it("turns an unsent case-study draft into a Continue item", () => {
    expect(draftToContribution({ id: "d1", title: { en: "Half done" }, lastSaved: "2026-09-03T00:00:00.000Z" }, "en")).toMatchObject({
      kind: "caseStudy", status: "draft", editHref: "/research-and-action/case-studies/submit?draft=d1", adminHref: "/admin/collections/caseStudyDrafts/d1",
    });
  });
  it("skips rows without an id", () => {
    expect(toContribution("event", row({ id: undefined }), "en")).toBeNull();
  });
});

describe("the list", () => {
  const c = (id: string, status: Contribution["status"], kind: Contribution["kind"] = "caseStudy", date = "2026-09-01T00:00:00.000Z"): Contribution => ({ id, kind, title: id, status, reviewNotes: null, date, href: null, editHref: null, adminHref: "" });
  it("puts what needs changes first, then drafts, waiting, published, declined — newest first inside each", () => {
    const groups = groupContributions([c("a", "approved"), c("b", "revision"), c("c", "pending", "event", "2026-09-01T00:00:00.000Z"), c("d", "pending", "event", "2026-09-05T00:00:00.000Z"), c("e", "rejected"), c("f", "draft")]);
    expect(groups.map((g) => [g.status, g.items.map((i) => i.id)])).toEqual([["revision", ["b"]], ["draft", ["f"]], ["pending", ["d", "c"]], ["approved", ["a"]], ["rejected", ["e"]]]);
  });
  it("counts by status and by kind", () => {
    const list = [c("a", "approved"), c("b", "revision", "event"), c("c", "revision")];
    expect(countByStatus(list)).toEqual({ draft: 0, pending: 0, revision: 2, approved: 1, rejected: 0 });
    expect(countByKind(list)).toEqual({ caseStudy: 2, livedExperience: 0, researchOutput: 0, event: 1 });
  });
});
