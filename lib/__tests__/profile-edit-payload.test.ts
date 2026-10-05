import { describe, expect, it } from "vitest";
import { profileUpdateFromForm } from "@/lib/profile/edit-payload";

const base = {
  firstName: "Amina", lastName: "K", username: "amina", bio: "", ageGroup: undefined, country: "", city: "",
  workTypes: [], expertiseAreas: [], organization: "", position: "", workBio: "", personalWebsite: "", linkedinProfile: "",
  otherSocialLinks: [], isSearchable: true, profileVisibility: "MEMBERS" as const, showEmail: false, showPhoneNumber: false,
  showWorkDetails: true, showSocialLinks: true, showLocation: true, communityIds: [], recentWork: [],
};

describe("saving Edit profile", () => {
  // Until 2026-10-05 the form never sent these, and the API wrote each one as
  // null / [] / false — so every save erased a member's headline, pronouns,
  // what brought them here, what they're looking for and more.
  it("sends a member's own words, so a save never erases them", () => {
    const update = profileUpdateFromForm({
      ...base,
      headline: " Listening to rivers ", pronouns: "she/her", languages: ["en", "Swahili"], motivation: "A flood",
      focusTopics: ["eco-anxiety"], lookingFor: ["mentoring"], openToCollaboration: true, collaborationInterests: "Youth groups",
      livedExperienceStatement: "My story", showLivedExperience: true, orcidId: "0000-0002-1825-0097",
    });
    expect(update).toMatchObject({
      headline: "Listening to rivers", pronouns: "she/her", languages: ["en", "Swahili"], motivation: "A flood",
      focusTopics: ["eco-anxiety"], lookingFor: ["mentoring"], openToCollaboration: true, collaborationInterests: "Youth groups",
      livedExperienceStatement: "My story", showLivedExperience: true, orcidId: "0000-0002-1825-0097",
    });
  });

  it("clears a field the member emptied", () => {
    expect(profileUpdateFromForm({ ...base, headline: "  ", pronouns: "", orcidId: "" })).toMatchObject({ headline: null, pronouns: null, orcidId: null });
  });
});

describe("Edit profile's form rules", () => {
  // A member who skipped age group at onboarding has null stored; the form
  // refused that null and no save went through at all (found 2026-10-05).
  it("accepts a member with no age group", async () => {
    const { makeProfileSchema } = await import("@/components/blocks/profile/profile-edit-form");
    const messages = new Proxy({}, { get: () => "msg" }) as Parameters<typeof makeProfileSchema>[0];
    expect(makeProfileSchema(messages).innerType().shape.ageGroup.safeParse(null).success).toBe(true);
  });
});
