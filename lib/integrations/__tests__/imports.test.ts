import { describe, it, expect } from "vitest";
import { normalizeOrcidId, mapOpenAlexWork } from "../openalex";
import { orcidPath, mapOrcidWorks, mapOrcidAffiliations } from "../orcid";

describe("ORCID iD normalization", () => {
  it("normalizeOrcidId returns the canonical URL", () => {
    expect(normalizeOrcidId("0000-0002-1825-0097")).toBe("https://orcid.org/0000-0002-1825-0097");
    expect(normalizeOrcidId("https://orcid.org/0000-0002-1825-0097")).toBe("https://orcid.org/0000-0002-1825-0097");
    expect(normalizeOrcidId("garbage")).toBeNull();
  });
  it("orcidPath returns the bare id", () => {
    expect(orcidPath("https://orcid.org/0000-0002-1825-009X")).toBe("0000-0002-1825-009X");
    expect(orcidPath("nope")).toBeNull();
  });
});

describe("mapOpenAlexWork", () => {
  it("maps an OpenAlex work to ImportedWork", () => {
    const w = mapOpenAlexWork({
      id: "https://openalex.org/W123",
      title: "Climate anxiety in youth",
      publication_year: 2024,
      doi: "https://doi.org/10.1/abc",
      primary_location: { source: { display_name: "The Lancet" } },
    });
    expect(w).toEqual({
      title: "Climate anxiety in youth",
      description: "The Lancet",
      link: "https://doi.org/10.1/abc",
      year: 2024,
      sourceId: "https://openalex.org/W123",
    });
  });
  it("drops a work with no title", () => {
    expect(mapOpenAlexWork({ id: "x" })).toBeNull();
  });
});

describe("mapOrcidWorks", () => {
  it("maps an ORCID works group, building a DOI link", () => {
    const works = mapOrcidWorks({
      group: [
        {
          "work-summary": [
            {
              "put-code": 42,
              title: { title: { value: "Eco-grief and resilience" } },
              "journal-title": { value: "Nature Climate Change" },
              "publication-date": { year: { value: "2023" } },
              "external-ids": {
                "external-id": [{ "external-id-type": "doi", "external-id-value": "10.5/xyz" }],
              },
            },
          ],
        },
      ],
    });
    expect(works).toHaveLength(1);
    expect(works[0]).toMatchObject({
      title: "Eco-grief and resilience",
      description: "Nature Climate Change",
      year: 2023,
      link: "https://doi.org/10.5/xyz",
      sourceId: "42",
    });
  });
  it("handles an empty group", () => {
    expect(mapOrcidWorks({ group: [] })).toEqual([]);
    expect(mapOrcidWorks({})).toEqual([]);
  });
});

describe("mapOrcidAffiliations", () => {
  it("maps employment + education summaries", () => {
    const affs = mapOrcidAffiliations({
      "affiliation-group": [
        { summaries: [{ "employment-summary": { organization: { name: "WHO" }, "role-title": "Researcher" } }] },
        { summaries: [{ "education-summary": { organization: { name: "Oxford" } } }] },
      ],
    });
    expect(affs).toEqual([
      { organization: "WHO", role: "Researcher" },
      { organization: "Oxford", role: null },
    ]);
  });
});
