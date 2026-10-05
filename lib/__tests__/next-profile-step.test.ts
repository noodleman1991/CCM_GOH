import { describe, expect, it } from "vitest";
import { nextProfileStep } from "@/lib/profile/next-step";

const full = { image: "x.jpg", headline: "Researcher", bio: "Hi", motivation: "Because", lookingFor: [], organization: "BRAC", position: "Fellow", communityCount: 1 };

describe("the one next step for your profile", () => {
  it("asks for the first missing thing, in order", () => {
    expect(nextProfileStep({ ...full, image: null })).toEqual({ key: "photo", href: "/dashboard/profile/edit#photo" });
    expect(nextProfileStep({ ...full, headline: "" })).toEqual({ key: "headline", href: "/dashboard/profile/edit#headline" });
    expect(nextProfileStep({ ...full, bio: null })).toEqual({ key: "bio", href: "/dashboard/profile/edit#bio" });
    expect(nextProfileStep({ ...full, motivation: null, lookingFor: [] })).toEqual({ key: "aboutYou", href: "/dashboard/profile/edit#about-you" });
    expect(nextProfileStep({ ...full, organization: null, position: "" })).toEqual({ key: "work", href: "/dashboard/profile/edit#work" });
    expect(nextProfileStep({ ...full, communityCount: 0 })).toEqual({ key: "community", href: "/communities" });
  });
  it("counts what you're looking for as telling people about you", () => {
    expect(nextProfileStep({ ...full, motivation: null, lookingFor: ["partners"] })).toBeNull();
  });
  it("has nothing to ask of a complete profile", () => {
    expect(nextProfileStep(full)).toBeNull();
  });
});
