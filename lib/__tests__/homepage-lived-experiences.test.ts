import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/content/lived-experiences", () => ({
  getLivedExperiencesCarousel: vi.fn(),
}));

import { getLivedExperiencesCarousel } from "@/lib/content/lived-experiences";
import {
  AUTO_LIVED_EXPERIENCES_LIMIT,
  resolveLivedExperiencesMode,
  resolveLivedExperiencesSection,
  type LivedExperiencesSlot,
} from "@/lib/content/homepage-lived-experiences";

const mockGetCarousel = vi.mocked(getLivedExperiencesCarousel);

const EXPERIENCE = { _id: "le-1", _type: "livedExperience" } as never;

describe("resolveLivedExperiencesMode (pure)", () => {
  it("prefers the hand-picked testimonials whenever any are picked", () => {
    expect(resolveLivedExperiencesMode(3, 0)).toBe("manual");
    expect(resolveLivedExperiencesMode(1, 8)).toBe("manual");
  });

  it("falls back to the automatic feed when nothing is hand-picked but the feed has items", () => {
    expect(resolveLivedExperiencesMode(0, 8)).toBe("auto");
  });

  it("hides the section when nothing is hand-picked and the automatic feed is also empty", () => {
    expect(resolveLivedExperiencesMode(0, 0)).toBe("hidden");
  });
});

describe("resolveLivedExperiencesSection", () => {
  it("returns hidden when the homepage document has no slot at all", async () => {
    const result = await resolveLivedExperiencesSection(null, "en");
    expect(result).toEqual({ mode: "hidden" });
    expect(mockGetCarousel).not.toHaveBeenCalled();
  });

  it("keeps today's behaviour when testimonials are hand-picked — no automatic fetch", async () => {
    const section: LivedExperiencesSlot = {
      title: "Voices",
      testimonial: [{ _id: "t-1" }],
    };
    const result = await resolveLivedExperiencesSection(section, "en");
    expect(result).toEqual({ mode: "manual", section });
    expect(mockGetCarousel).not.toHaveBeenCalled();
  });

  it("falls back to the latest published lived experiences, keeping the slot's heading/copy", async () => {
    mockGetCarousel.mockResolvedValueOnce([EXPERIENCE]);
    const section: LivedExperiencesSlot = {
      title: { en: "Lived Experiences Stories", es: "Historias" },
      description: { en: "Voices from the community", es: "Voces de la comunidad" },
      testimonial: [],
    };
    const result = await resolveLivedExperiencesSection(section, "es");
    expect(mockGetCarousel).toHaveBeenCalledWith({ maxItems: AUTO_LIVED_EXPERIENCES_LIMIT });
    expect(result).toEqual({
      mode: "auto",
      section: {
        title: "Historias",
        subtitle: "Voces de la comunidad",
        padding: undefined,
        experiences: [EXPERIENCE],
        maxItems: AUTO_LIVED_EXPERIENCES_LIMIT,
        locale: "es",
      },
    });
  });

  it("hides the section rather than rendering an empty carousel when there are no lived experiences at all", async () => {
    mockGetCarousel.mockResolvedValueOnce([]);
    const result = await resolveLivedExperiencesSection({ title: "Voices", testimonial: [] }, "en");
    expect(result).toEqual({ mode: "hidden" });
  });
});
