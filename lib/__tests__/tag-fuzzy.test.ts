import { describe, expect, it } from "vitest";
import { cleanSuggestions, matchTags, normalizeTagText, similarity } from "@/lib/tags/fuzzy";

/**
 * Member tag suggestions (2026-09-20). A free-text "suggest a tag" box would
 * fill the queue with "Climate change", "climate-change" and "Climat change"
 * next to the existing tag. Matching is fuzzy against every language's label
 * and the slug: a near-duplicate becomes a pick of the existing tag, and the
 * suggestion list itself is de-duplicated before it is stored.
 */
const TAGS = [
  { id: "t-cc", label: { en: "Climate Change", es: "Cambio climático", fr: "Changement climatique", ar: "تغير المناخ" }, value: "climate-change" },
  { id: "t-ad", label: { en: "Adaptation" }, value: "adaptation" },
  { id: "t-yo", label: { en: "Youth", ar: "الشباب" }, value: "youth" },
  { id: "t-mh", label: { en: "Mental Health" }, value: "mental-health" },
];

describe("normalizeTagText", () => {
  it("lower-cases, strips accents and punctuation, collapses whitespace", () => {
    expect(normalizeTagText("  Cambio  Climático! ")).toBe("cambio climatico");
    expect(normalizeTagText("climate-change")).toBe("climate change");
  });
});

describe("similarity", () => {
  it("is 1 for the same text after normalisation and high for a typo", () => {
    expect(similarity("Climate change", "climate-change")).toBe(1);
    expect(similarity("Climat change", "Climate Change")).toBeGreaterThanOrEqual(0.85);
    expect(similarity("Adaptaton", "Adaptation")).toBeGreaterThanOrEqual(0.85);
  });
  it("is low for unrelated terms", () => {
    expect(similarity("Heatwaves", "Adaptation")).toBeLessThan(0.5);
  });
});

describe("matchTags", () => {
  it("finds the existing tag through any language's label or the slug, best first", () => {
    expect(matchTags("cambio climatico", TAGS)[0]?.tag.id).toBe("t-cc");
    expect(matchTags("تغير المناخ", TAGS)[0]?.tag.id).toBe("t-cc");
    expect(matchTags("mental health", TAGS)[0]?.tag.id).toBe("t-mh");
    expect(matchTags("adaptaton", TAGS)[0]?.tag.id).toBe("t-ad");
  });
  it("returns nothing for a genuinely new term", () => {
    expect(matchTags("Heatwaves", TAGS)).toEqual([]);
  });
  it("also matches a term that contains the tag as a word", () => {
    expect(matchTags("youth mental health", TAGS).map((m) => m.tag.id)).toEqual(expect.arrayContaining(["t-yo", "t-mh"]));
  });
});

describe("cleanSuggestions — what the server stores", () => {
  it("drops suggestions that are an existing tag, de-duplicates the list, trims, caps count and length", () => {
    const out = cleanSuggestions(
      ["  Heatwaves ", "heat waves", "Climate Change", "climate-change", "Eco-anxiety", "Solastalgia", "Grief", "x".repeat(80)],
      TAGS,
      { max: 3, maxLength: 40 },
    );
    expect(out).toEqual(["Heatwaves", "Eco-anxiety", "Solastalgia"]);
  });
  it("keeps distinct terms and ignores empties", () => {
    expect(cleanSuggestions(["", "Loss and damage", "  "], TAGS)).toEqual(["Loss and damage"]);
  });
});
