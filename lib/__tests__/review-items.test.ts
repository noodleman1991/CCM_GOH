import { describe, expect, it } from "vitest";
import { commentItem, mergeReviewItems, toSubmissionItem } from "@/lib/moderation/review-items";

describe("review items", () => {
  it("shows a submission in the reader's language, falling back to English", () => {
    const item = toSubmissionItem("caseStudies", { id: "c1", title: { en: "Drought", fr: "Sécheresse" }, summary: { en: "Short" }, coverImage: { url: "/m/c.jpg" }, submittedBy: { name: "Ana" }, createdAt: "2026-09-01T00:00:00.000Z" }, "fr");
    expect(item).toMatchObject({ kind: "submission", collection: "caseStudies", id: "c1", title: "Sécheresse", summary: "Short", imageUrl: "/m/c.jpg", sender: "Ana", adminHref: "/admin/collections/caseStudies/c1" });
    expect(item.kind === "submission" && item.actions).toEqual(["approve", "revision", "reject"]);
  });
  it("still renders with no title in any language, no picture and no sender", () => {
    const item = toSubmissionItem("events", { id: "e1", createdAt: "2026-09-02T00:00:00.000Z" }, "ar");
    expect(item).toMatchObject({ title: "(untitled)", imageUrl: null, sender: null, summary: null });
  });
  it("lists everything newest first", () => {
    const a = toSubmissionItem("events", { id: "e1", title: "A", createdAt: "2026-09-01T00:00:00.000Z" }, "en");
    const b = commentItem({ id: "k1", targetType: "page", targetId: "x", authorName: null, authorId: null, body: "hi", createdAt: "2026-09-03T00:00:00.000Z", reason: null, reportCount: 0 });
    const c = toSubmissionItem("caseStudies", { id: "c1", title: "C", createdAt: "2026-09-02T00:00:00.000Z" }, "en");
    expect(mergeReviewItems([a, c], [b]).map((i) => i.key)).toEqual(["comment:k1", "caseStudies:c1", "events:e1"]);
  });
});

describe("event suggestions in the queue", () => {
  it("carry who sent them, and whether that person is already stopped from suggesting", () => {
    const doc = { id: "ev1", title: { en: "Reef day" }, submittedBy: "user_9", createdAt: "2026-10-01T00:00:00Z" };
    expect(toSubmissionItem("events", doc, "en")).toMatchObject({ submitterId: "user_9", submitterBlocked: false });
    expect(toSubmissionItem("events", doc, "en", new Set(["user_9"]))).toMatchObject({ submitterBlocked: true });
  });
  it("other submissions don't offer stopping anyone", () => {
    const doc = { id: "cs1", title: { en: "Floods" }, submittedBy: "user_9", createdAt: "2026-10-01T00:00:00Z" };
    expect(toSubmissionItem("caseStudies", doc, "en")).toMatchObject({ submitterId: null });
  });
});
