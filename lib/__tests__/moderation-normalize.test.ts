import { describe, it, expect } from "vitest";
import { normalizeForMatch, findWordlistHit, classify } from "../moderation/normalize";

describe("normalizeForMatch", () => {
  it("lowercases, NFKC-normalizes, collapses whitespace", () => {
    expect(normalizeForMatch("  Héllo   World  ")).toBe("héllo world");
  });

  it("strips Arabic diacritics (tashkeel)", () => {
    // سَلَام (with fatha marks) → سلام
    expect(normalizeForMatch("سَلَام")).toBe("سلام");
  });

  it("strips tatweel/kashida", () => {
    expect(normalizeForMatch("سـلـام")).toBe("سلام");
  });

  it("folds alef variants, alef maqsura, ta marbuta", () => {
    expect(normalizeForMatch("أحمد")).toBe("احمد");
    expect(normalizeForMatch("إسلام")).toBe("اسلام");
    expect(normalizeForMatch("علي")).toBe(normalizeForMatch("على")); // ى → ي
    expect(normalizeForMatch("مدرسة")).toBe("مدرسه"); // ة → ه
  });
});

describe("findWordlistHit — Latin", () => {
  it("matches a whole word", () => {
    expect(findWordlistHit("this is a badword here", ["badword"])).toEqual({ term: "badword" });
  });
  it("does not match inside another word", () => {
    expect(findWordlistHit("classic assessment", ["ass"])).toBeNull();
  });
  it("matches the term as its own word", () => {
    expect(findWordlistHit("you ass!", ["ass"])).toEqual({ term: "ass" });
  });
  it("is case-insensitive", () => {
    expect(findWordlistHit("A BADWORD", ["badword"])).toEqual({ term: "badword" });
  });
});

describe("findWordlistHit — Arabic", () => {
  it("matches despite diacritics/tatweel obfuscation", () => {
    // term stored plain; text obfuscated with marks + kashida
    expect(findWordlistHit("هذا كَلـمة سيئة", ["كلمة"])).toEqual({ term: "كلمة" });
  });
  it("matches across alef-variant folding", () => {
    expect(findWordlistHit("قال أحمد شيئا", ["احمد"])).toEqual({ term: "احمد" });
  });
});

describe("classify — two tiers", () => {
  const block = ["slur1", "تهديد"];
  const review = ["maybe", "بذيء"];

  it("block tier wins and is reported", () => {
    expect(classify("a slur1 appears", block, review)).toEqual({ tier: "block", term: "slur1" });
  });
  it("review tier when only a review term hits", () => {
    expect(classify("this is maybe ok", block, review)).toEqual({ tier: "review", term: "maybe" });
  });
  it("block beats review when both present", () => {
    expect(classify("maybe slur1", block, review)).toEqual({ tier: "block", term: "slur1" });
  });
  it("clean when neither hits", () => {
    expect(classify("a perfectly nice comment", block, review)).toEqual({ tier: "clean" });
  });
});
