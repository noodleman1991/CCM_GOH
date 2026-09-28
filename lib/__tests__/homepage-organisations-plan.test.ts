import { describe, expect, it } from "vitest";
import { planOrganisationFixes, planPartners } from "@/scripts/homepage/organisations";

describe("planPartners", () => {
  const orgs = [
    { id: "o1", name: "University of Nigeria" },
    { id: "o2", name: "Climate Cares Centre" },
  ];

  it("matches by name from the logo's description, ignoring 'Logo' and case", () => {
    expect(planPartners([{ asset: "m1", alt: "University of Nigeria Logo" }], orgs)).toEqual([
      { index: 0, name: "University of Nigeria", action: "match", orgId: "o1" },
    ]);
  });

  it("creates an organisation for an unmatched logo, keeping its picture and type", () => {
    expect(planPartners([{ asset: "m2", alt: "Wellcome Logo ", orgType: "foundation" }], orgs)).toEqual([
      { index: 0, name: "Wellcome", action: "create", logo: "m2", type: "foundation" },
    ]);
  });

  it("defaults an unknown type to other", () => {
    expect(planPartners([{ asset: "m3", alt: "Force of Nature Logo" }], orgs)[0]).toMatchObject({ action: "create", type: "other" });
  });

  it("skips a logo with no description, and says why", () => {
    expect(planPartners([{ asset: "m4", alt: "  " }], orgs)[0]).toEqual({ index: 0, action: "skip", reason: "no description to name it by" });
  });

  it("matches the same new partner once when it appears twice", () => {
    const steps = planPartners([{ asset: "a", alt: "Wellcome Logo" }, { asset: "b", alt: "wellcome logo" }], orgs);
    expect(steps.map((s) => s.action)).toEqual(["create", "match"]);
    expect(steps[1]).toMatchObject({ orgId: "new:wellcome" });
  });
});

describe("planOrganisationFixes", () => {
  it("renames clipped names it knows, hides unclear ones, keeps the rest", () => {
    expect(
      planOrganisationFixes([
        { id: "a", name: "Cook University" },
        { id: "b", name: "The University" },
        { id: "c", name: "University of Nairobi" },
      ]),
    ).toEqual([
      { id: "a", from: "Cook University", action: "rename", to: "James Cook University" },
      { id: "b", from: "The University", action: "hide" },
      { id: "c", from: "University of Nairobi", action: "keep" },
    ]);
  });

  it("never hides an organisation that content links to", () => {
    expect(planOrganisationFixes([{ id: "b", name: "The University", used: true }])[0].action).toBe("keep");
  });

  it("leaves an already-hidden organisation alone", () => {
    expect(planOrganisationFixes([{ id: "b", name: "The University", showOnSite: false }])[0].action).toBe("keep");
  });
});
