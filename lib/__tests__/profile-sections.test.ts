import { describe, expect, it } from "vitest";
import { profileSections } from "@/lib/profile/sections";

const empty = { bio: null, motivation: null, lookingFor: [], focusTopics: [], collaborationInterests: null, promptCount: 0, livedExperienceStatement: null, workBio: null, skillsCount: 0, recentWorkCount: 0, linkCount: 0, contributionCount: 0, organisedEventCount: 0, workspaceCount: 0, communityCount: 0 };

describe("which profile sections show", () => {
  it("shows a visitor only sections with something in them", () => {
    expect(profileSections(empty, { isOwner: false })).toEqual([]);
    expect(profileSections({ ...empty, communityCount: 1 }, { isOwner: false }).map((s) => s.id)).toEqual(["communities"]);
  });
  it("shows the owner every section, with an Add link where it's empty", () => {
    expect(profileSections(empty, { isOwner: true })).toEqual([
      { id: "about", hasContent: false, addHref: "/dashboard/profile/edit#about-you" },
      { id: "work", hasContent: false, addHref: "/dashboard/profile/edit#work" },
      { id: "onTheHub", hasContent: false, addHref: "/dashboard/submissions" },
      { id: "communities", hasContent: false, addHref: "/communities" },
    ]);
  });
  it("counts any of a person's own words as About, and links or skills as Work", () => {
    const sections = profileSections({ ...empty, lookingFor: ["partners"], skillsCount: 2, organisedEventCount: 1 }, { isOwner: false });
    expect(sections.map((s) => [s.id, s.hasContent, s.addHref])).toEqual([["about", true, null], ["work", true, null], ["onTheHub", true, null]]);
  });
  it("leaves a role alone to the header — it isn't a Work section of its own", () => {
    expect(profileSections({ ...empty, ...({ organization: "BRAC", position: "Lead" } as object) }, { isOwner: false })).toEqual([]);
  });
  it("gives an owner's filled sections no Add link", () => {
    const full = { ...empty, bio: "Hi", workBio: "Field research", contributionCount: 2, communityCount: 1 };
    expect(profileSections(full, { isOwner: true }).every((s) => s.hasContent && s.addHref === null)).toBe(true);
  });
});

describe("a profile's links", () => {
  it("turns a LinkedIn handle and an ORCID iD into addresses, and keeps only web addresses", async () => {
    const { profileLinks } = await import("@/lib/profile/sections");
    expect(
      profileLinks({
        personalWebsite: "https://amina.example",
        linkedinProfile: "amina-k",
        orcidId: "0000-0002-1825-0097",
        otherSocialLinks: [{ platform: "Mastodon", url: "https://social.example/@amina" }, { platform: "Bad", url: "javascript:alert(1)" }],
      }),
    ).toEqual([
      { kind: "website", label: null, href: "https://amina.example" },
      { kind: "linkedin", label: null, href: "https://linkedin.com/in/amina-k" },
      { kind: "orcid", label: null, href: "https://orcid.org/0000-0002-1825-0097" },
      { kind: "other", label: "Mastodon", href: "https://social.example/@amina" },
    ]);
    expect(profileLinks({ personalWebsite: "javascript:x", linkedinProfile: null, orcidId: null, otherSocialLinks: [] })).toEqual([]);
  });
});
