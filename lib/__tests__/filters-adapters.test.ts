import { describe, expect, it } from "vitest";
import { caseStudyToFilterable, regionsOf, toFilterTags } from "@/lib/filters/adapters";

describe("filter adapters", () => {
  it("reads tags whether the slug is a string or a slug object", () => {
    expect(toFilterTags([{ value: { current: "youth" }, category: "audience", label: { en: "Youth" } }, { value: "drought", category: "topic", label: { en: "Drought" } }, null])).toEqual([
      { slug: "youth", category: "audience", label: { en: "Youth" } },
      { slug: "drought", category: "topic", label: { en: "Drought" } },
    ]);
  });
  it("collects region codes from codes, region objects and community slugs", () => {
    expect(regionsOf("oce", { region: "ssa" }, { slug: "latin-america-and-the-caribbean" }, null, "nope").sort()).toEqual(["lac", "oce", "ssa"]);
  });
  it("turns a case study into a filterable item, region from its own code or its community", () => {
    const item = caseStudyToFilterable(
      {
        _id: "c1",
        slug: "c1",
        title: { en: "Drought in Afghanistan", fr: "Sécheresse" },
        excerpt: { en: "Heat and farmers" },
        publishedAt: "2025-02-01",
        regionCode: "csa",
        communitySlug: null,
        tags: [{ _id: "t1", value: { current: "drought" }, category: "topic", label: { en: "Drought" } }],
      } as never,
      "fr",
    );
    expect(item).toEqual({
      id: "c1",
      tags: [{ slug: "drought", category: "topic", label: { en: "Drought" } }],
      regions: ["csa"],
      date: "2025-02-01",
      text: { fr: "Sécheresse Heat and farmers", en: "Drought in Afghanistan Heat and farmers" },
    });
    expect(caseStudyToFilterable({ _id: "c2", slug: "c2", communitySlug: "oceania" } as never, "en").regions).toEqual(["oce"]);
  });
});
