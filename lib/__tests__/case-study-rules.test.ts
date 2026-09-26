import { describe, expect, it } from "vitest";
import {
  caseStudyDraftSchema,
  caseStudyFieldOrder,
  makeCaseStudySubmissionSchema,
} from "@/lib/validation/case-study";
import { toFieldIssues } from "@/lib/validation/messages";

const schema = makeCaseStudySubmissionSchema({ themeTagIds: new Set(["theme-1"]) });
const story = [{ _type: "block", children: [{ _type: "span", text: "Something happened." }] }];
const valid = {
  originalLanguage: "en",
  title: { en: "Floods in Lagos" },
  excerpt: { en: "A".repeat(50) },
  content: story,
  authors: [{ name: "Ada" }],
  tags: ["theme-1"],
  relatedCommunity: "community-1",
};

const problems = (input: unknown) => {
  const result = schema.safeParse(input);
  return result.success ? {} : Object.fromEntries(toFieldIssues(result.error).map((i) => [i.path, i.key]));
};

describe("case study rules", () => {
  it("accepts a complete English submission with only a community for location", () => {
    expect(problems(valid)).toEqual({});
  });

  it("names every missing piece in plain keys", () => {
    expect(problems({ originalLanguage: "en", title: {}, content: [], authors: [], tags: [] })).toEqual({
      "title.en": "title.required",
      "excerpt.en": "summary.required",
      content: "story.required",
      authors: "authors.required",
      tags: "tags.themeRequired",
      location: "location.required",
    });
  });

  it("arabic writing language needs Arabic text plus a short English title and summary", () => {
    const input = { ...valid, originalLanguage: "ar", title: { ar: "فيضانات لاغوس" }, excerpt: { ar: "ب".repeat(50) } };
    expect(problems(input)).toEqual({ "title.en": "englishTitle.required", "excerpt.en": "englishSummary.tooShort" });
    expect(problems({ ...input, title: { ar: "فيضانات لاغوس", en: "Lagos floods" }, excerpt: { ar: "ب".repeat(50), en: "E".repeat(20) } })).toEqual({});
  });

  it("a non-theme tag does not satisfy the theme rule", () => {
    expect(problems({ ...valid, tags: ["audience-tag"] })).toEqual({ tags: "tags.themeRequired" });
  });

  it("does not enforce the theme rule when there are no theme tags to choose from (themeTagIds: null)", () => {
    const unenforced = makeCaseStudySubmissionSchema({ themeTagIds: null });
    expect(unenforced.safeParse({ ...valid, tags: ["audience-tag"] }).success).toBe(true);
  });

  it("a country or region pick (no city, sent as null) passes", () => {
    const { relatedCommunity: _drop, ...rest } = valid;
    void _drop;
    const country = { lat: 9.1, lng: 8.7, text: "Nigeria", precision: "country", countryCode3: "NGA", country: "Nigeria", city: null };
    expect(problems({ ...rest, place: country })).toEqual({});
    const hamlet = { lat: 9.1, lng: 8.7, text: "Somewhere", precision: "exact", countryCode3: null, country: null, city: null };
    expect(problems({ ...rest, place: hamlet })).toEqual({});
    expect(caseStudyDraftSchema.safeParse({ place: country }).success).toBe(true);
  });

  it("a place alone satisfies location", () => {
    const place = { lat: 6.5, lng: 3.4, text: "Lagos, Nigeria", precision: "city", countryCode3: "NGA" };
    const { relatedCommunity: _drop, ...rest } = valid;
    void _drop;
    expect(problems({ ...rest, place })).toEqual({});
  });

  it("shows co-author name and email problems under that co-author", () => {
    expect(problems({ ...valid, authors: [{ name: "Ada" }, { name: " ", email: "not-an-email" }] })).toEqual({
      "authors.1.name": "author.nameRequired",
      "authors.1.email": "author.email",
    });
  });

  it("a blank co-author never hides the other problems", () => {
    expect(problems({ ...valid, title: {}, authors: [{ name: "" }] })).toEqual({
      "title.en": "title.required",
      "authors.0.name": "author.nameRequired",
    });
  });

  it("catches an end date before the start date", () => {
    expect(problems({ ...valid, studyPeriod: { startDate: "2024-05-01", endDate: "2024-04-01" } })).toEqual({
      "studyPeriod.endDate": "dates.endBeforeStart",
    });
  });

  it("a draft needs nothing", () => {
    expect(caseStudyDraftSchema.safeParse({}).success).toBe(true);
    expect(caseStudyDraftSchema.safeParse({ originalLanguage: "ar", place: { text: "Lag" } }).success).toBe(true);
  });

  it("orders fields the way the page shows them", () => {
    expect(caseStudyFieldOrder("ar", 2).slice(0, 5)).toEqual(["title.ar", "excerpt.ar", "content", "title.en", "excerpt.en"]);
    expect(caseStudyFieldOrder("en", 2)).toContain("authors.1.email");
  });
});
