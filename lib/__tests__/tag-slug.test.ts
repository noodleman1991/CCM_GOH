import { describe, expect, it } from "vitest";
import { tagSlug, tagSearchTextChanged } from "@/lib/tags/slug";

/**
 * Tag audit, 2026-09-17. Sanity derived `value` from `label.en` (a slug field
 * with `source`); the Payload collection modelled it as free text with no
 * generator, so an editor creating a tag had to hand-type a slug and nothing
 * normalised it. `tagSlug` is the one rule; the collection's beforeValidate
 * hook applies it when `value` is empty and normalises it when it is not.
 */
describe("tagSlug", () => {
  it.each([
    ["Heat & Health", "heat-and-health"],
    ["  Connection to Nature ", "connection-to-nature"],
    ["Éducation climatique", "education-climatique"],
    ["Mental_Health/Wellbeing", "mental-health-wellbeing"],
    ["--Already-Slug--", "already-slug"],
  ])("%s → %s", (input, expected) => {
    expect(tagSlug(input)).toBe(expected);
  });

  it("returns an empty string for a label with nothing usable", () => {
    expect(tagSlug("   ")).toBe("");
    expect(tagSlug("!!!")).toBe("");
  });
});

describe("tagSearchTextChanged — when a tag edit must re-index the content carrying it", () => {
  const prev = { label: { en: "Heat", ar: "حرارة" }, value: "heat", color: "#111" };
  it("is false when only presentation fields changed", () => {
    expect(tagSearchTextChanged(prev, { ...prev, color: "#222", category: "topic" })).toBe(false);
  });
  it("is true when any label or the slug changed", () => {
    expect(tagSearchTextChanged(prev, { ...prev, label: { en: "Heat", ar: "حر" } })).toBe(true);
    expect(tagSearchTextChanged(prev, { ...prev, value: "heat-2" })).toBe(true);
  });
  it("is true on create (no previous document)", () => {
    expect(tagSearchTextChanged(undefined, prev)).toBe(true);
  });
});
