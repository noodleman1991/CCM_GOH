import { describe, expect, it } from "vitest";
import { aboutYouWrites } from "@/lib/onboarding/about-you";
import { resolveAboutYouOptions, FALLBACK_LOOKING_FOR } from "@/lib/onboarding/about-you-options";
import { createOnboardingSchema, defaultOnboardingValues } from "@/lib/schemas/onboarding-schema";
import { LIMITS } from "@/lib/validation/limits";

describe("what the About you step saves", () => {
  it("keeps only what the member filled in, trimmed and once each", () => {
    expect(
      aboutYouWrites({ pronouns: "  ", languages: ["en", " en", ""], lookingFor: ["partners", "partners"], focusTopics: [], promptId: "", promptAnswer: "" }),
    ).toEqual({ profile: { languages: ["en"], lookingFor: ["partners"] }, promptAnswer: null });
  });

  it("saves a prompt answer only with both the question and the answer", () => {
    expect(aboutYouWrites({ promptId: "p1", promptAnswer: "  " }).promptAnswer).toBeNull();
    expect(aboutYouWrites({ promptId: "", promptAnswer: "Rivers" }).promptAnswer).toBeNull();
    expect(aboutYouWrites({ promptId: "p1", promptAnswer: " Rivers " }).promptAnswer).toEqual({ promptId: "p1", answer: "Rivers" });
  });

  it("asks nothing it has no answer for — an empty step saves nothing", () => {
    expect(aboutYouWrites({})).toEqual({ profile: {}, promptAnswer: null });
  });
});

describe("the step in the onboarding form", () => {
  const schema = createOnboardingSchema();
  it("is optional all the way through", () => {
    expect(schema.shape.aboutYou.safeParse(defaultOnboardingValues.aboutYou).success).toBe(true);
    expect(schema.shape.aboutYou.safeParse({}).success).toBe(true);
  });
  it("follows the shared limits", () => {
    const ok = (o: Record<string, unknown>) => schema.shape.aboutYou.safeParse(o).success;
    expect(ok({ headline: "x".repeat(LIMITS.profile.headline) })).toBe(true);
    expect(ok({ headline: "x".repeat(LIMITS.profile.headline + 1) })).toBe(false);
    expect(ok({ promptAnswer: "x".repeat(LIMITS.profile.promptAnswer + 1) })).toBe(false);
  });
});

describe("the step's options", () => {
  it("come from the team's list, in the member's language", () => {
    const opts = resolveAboutYouOptions({ lookingForOptions: [{ value: "mentors", label: "Mentores" }], focusTopicOptions: [{ value: "grief", label: "Duelo climático" }] });
    expect(opts.lookingFor).toEqual([{ value: "mentors", label: "Mentores" }]);
    expect(opts.focusTopics).toEqual([{ value: "grief", label: "Duelo climático" }]);
  });
  it("fall back to a starter list only when the team hasn't made one", () => {
    expect(resolveAboutYouOptions(null).lookingFor).toEqual(FALLBACK_LOOKING_FOR);
    expect(resolveAboutYouOptions({ lookingForOptions: [], focusTopicOptions: [{ value: "a", label: "" }] }).focusTopics.length).toBeGreaterThan(0);
  });
});
