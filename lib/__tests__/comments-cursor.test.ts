import { describe, it, expect } from "vitest";
import { encodeCursor, decodeCursor, isCommentTargetType } from "../comments/types";

describe("comment cursor", () => {
  it("round-trips a (createdAt, id) pair", () => {
    const d = new Date("2026-06-18T10:20:30.000Z");
    const c = encodeCursor(d, "abc123");
    const back = decodeCursor(c);
    expect(back).not.toBeNull();
    expect(back!.id).toBe("abc123");
    expect(back!.createdAt.toISOString()).toBe(d.toISOString());
  });

  it("returns null on garbage", () => {
    expect(decodeCursor("not-a-real-cursor!!")).toBeNull();
    expect(decodeCursor("")).toBeNull();
  });
});

describe("isCommentTargetType", () => {
  it("accepts the allowlist", () => {
    expect(isCommentTargetType("caseStudy")).toBe(true);
    expect(isCommentTargetType("newsPost")).toBe(true);
    expect(isCommentTargetType("collaborationThread")).toBe(true);
  });
  it("rejects anything else", () => {
    expect(isCommentTargetType("project")).toBe(false);
    expect(isCommentTargetType("")).toBe(false);
    expect(isCommentTargetType(42)).toBe(false);
  });
});
