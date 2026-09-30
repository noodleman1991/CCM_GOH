import { describe, expect, it } from "vitest";
import { caseStudyToFilterable, externalToFilterable, newsToFilterable, regionsOf, toFilterTags } from "@/lib/filters/adapters";

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
  it("turns a news post into a filterable item, region from its code or its community", () => {
    const item = newsToFilterable(
      { _id: "n1", title: { en: "Heat study" }, excerpt: { en: "Youth anxiety" }, publishedAt: "2026-05-10", regionCode: null, relatedCommunity: { _id: "rc", slug: "oceania" }, tags: [{ _id: "t", value: "youth", category: "audience", label: { en: "Youth" } }] } as never,
      "en",
    );
    expect(item).toEqual({ id: "n1", tags: [{ slug: "youth", category: "audience", label: { en: "Youth" } }], regions: ["oce"], date: "2026-05-10", text: { en: "Heat study Youth anxiety" } });
  });
  it("turns an external source into a filterable item", () => {
    const item = externalToFilterable({ _id: "e1", title: { en: "Eco-anxiety" }, excerpt: null, publishedAt: "2026-03-25T00:00:00.000Z", communitySlug: null, tags: null } as never, "en");
    expect(item).toEqual({ id: "e1", tags: [], regions: [], date: "2026-03-25T00:00:00.000Z", text: { en: "Eco-anxiety" } });
  });
});
