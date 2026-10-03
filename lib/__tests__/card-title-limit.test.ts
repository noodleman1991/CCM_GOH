import { describe, expect, it } from "vitest";
import { CARD_TITLE_MAX, LIMITS } from "@/lib/validation/limits";

// Cards show titles on up to three lines; longer titles were cut off
// (user, 2026-10-03). Every title that lands on a card is capped at what fits.
describe("titles that show on cards", () => {
  it("fit the card's three lines", () => {
    expect(CARD_TITLE_MAX).toBe(90);
    for (const form of ["caseStudy", "livedExperience", "researchOutput", "event"] as const) {
      expect(LIMITS[form].title, form).toBe(CARD_TITLE_MAX);
    }
  });
});
