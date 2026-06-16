import { describe, it, expect } from "vitest";
import { normalizeContributions, publicRegionMembers } from "../contributions";

describe("normalizeContributions", () => {
  it("merges case studies, content and recent work, newest first", () => {
    const out = normalizeContributions({
      caseStudies: [
        { _id: "cs1", title: { en: "Study A" }, slug: { current: "study-a" }, publishedAt: "2025-01-10" },
      ],
      content: [{ id: "c1", title: "Article", createdAt: "2025-03-01" }],
      recentWork: [{ id: "w1", title: "Project", link: "https://x.org", startDate: "2024-06-01" }],
      locale: "en",
    });
    expect(out.map((c) => c.id)).toEqual(["c1", "cs1", "w1"]); // 2025-03 > 2025-01 > 2024-06
    expect(out[0].kind).toBe("content");
  });

  it("resolves a localized case-study title for the locale, falling back to en", () => {
    const [es] = normalizeContributions({
      caseStudies: [{ _id: "cs1", title: { en: "Hello", es: "Hola" }, publishedAt: "2025-01-01" }],
      locale: "es",
    });
    expect(es.title).toBe("Hola");
    const [en] = normalizeContributions({
      caseStudies: [{ _id: "cs2", title: { en: "Hello" }, publishedAt: "2025-01-01" }],
      locale: "fr",
    });
    expect(en.title).toBe("Hello");
  });

  it("builds the case-study href from the slug, null when missing", () => {
    const [a, b] = normalizeContributions({
      caseStudies: [
        { _id: "1", title: "A", slug: { current: "a" }, publishedAt: "2025-02-01" },
        { _id: "2", title: "B", publishedAt: "2025-01-01" },
      ],
      locale: "en",
    });
    expect(a.href).toBe("/research-and-action/case-studies/a");
    expect(b.href).toBeNull();
  });

  it("sorts undated items to the end", () => {
    const out = normalizeContributions({
      recentWork: [
        { id: "w1", title: "no date" },
        { id: "w2", title: "dated", startDate: "2025-01-01" },
      ],
      locale: "en",
    });
    expect(out.map((c) => c.id)).toEqual(["w2", "w1"]);
  });

  it("skips entries with no id and handles empty input", () => {
    expect(normalizeContributions({ locale: "en" })).toEqual([]);
    const out = normalizeContributions({ content: [{ title: "no id" } as any], locale: "en" });
    expect(out).toEqual([]);
  });
});

describe("publicRegionMembers", () => {
  const base = { id: "u1", username: "alice", firstName: "Alice", isSearchable: true, profileVisibility: "PUBLIC" as const };

  it("excludes PRIVATE profiles and non-searchable users", () => {
    const out = publicRegionMembers([
      base,
      { ...base, id: "u2", username: "bob", profileVisibility: "PRIVATE" },
      { ...base, id: "u3", username: "cara", isSearchable: false },
    ]);
    expect(out.map((m) => m.id)).toEqual(["u1"]);
  });

  it("drops members without a username (can't be linked)", () => {
    const out = publicRegionMembers([{ ...base, id: "u4", username: null }]);
    expect(out).toEqual([]);
  });

  it("builds displayName from first+last, falling back to username", () => {
    const [a, b] = publicRegionMembers([
      { ...base, firstName: "Alice", lastName: "Smith" },
      { ...base, id: "u2", username: "bob", firstName: null, lastName: null },
    ]);
    expect(a.displayName).toBe("Alice Smith");
    expect(b.displayName).toBe("bob");
  });

  it("sorts by contribution count desc, then name", () => {
    const out = publicRegionMembers([
      { ...base, id: "u1", username: "zoe", firstName: "Zoe", contributionCount: 1 },
      { ...base, id: "u2", username: "amy", firstName: "Amy", contributionCount: 5 },
      { ...base, id: "u3", username: "bea", firstName: "Bea", contributionCount: 5 },
    ]);
    expect(out.map((m) => m.username)).toEqual(["amy", "bea", "zoe"]);
  });

  it("handles null/empty input", () => {
    expect(publicRegionMembers(null)).toEqual([]);
    expect(publicRegionMembers([null, undefined])).toEqual([]);
  });
});
