import { beforeAll, describe, expect, it } from "vitest";
import config from "@/payload.config";

type Collection = { slug: string; fields: unknown[] };

const field = (fields: unknown[], name: string) =>
  (fields as Array<{ name?: string }>).find((f) => f.name === name) as Record<string, unknown> | undefined;

describe("case study fields", () => {
  let caseStudies: Collection;
  let drafts: Collection;

  beforeAll(async () => {
    const resolved = await config;
    caseStudies = resolved.collections.find((c) => c.slug === "caseStudies")!;
    drafts = resolved.collections.find((c) => c.slug === "caseStudyDrafts")!;
  });

  it("no longer requires the old topic", () => {
    expect(field(caseStudies.fields, "topic")?.required).toBeFalsy();
  });

  it("records the language the story was written in", () => {
    const original = field(caseStudies.fields, "originalLanguage");
    expect(original?.defaultValue).toBe("en");
    expect((original?.options as Array<{ value: string }>).map((o) => o.value)).toEqual(["en", "es", "fr", "ar"]);
  });

  it("does not require a story body in every language", () => {
    expect(field(caseStudies.fields, "content")?.required).toBeFalsy();
  });

  it("keeps the place on drafts", () => {
    for (const name of ["locationDisplayText", "locationPrecision", "locationCountryCode"]) {
      expect(field(drafts.fields, name)).toBeDefined();
    }
  });
});
