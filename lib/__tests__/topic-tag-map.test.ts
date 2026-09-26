import { describe, expect, it } from "vitest";
import { legacyTopicsToTagSlugs } from "@/lib/case-studies/topic-tag-map";

describe("legacyTopicsToTagSlugs", () => {
  const map = { "climate-environment": "climate-change", "mental-health": "mental-health-support" };

  it("maps known legacy topics to their tag slug", () => {
    expect(legacyTopicsToTagSlugs(["climate-environment"], map)).toEqual(["climate-change"]);
  });

  it("drops unknown/unmapped topics instead of erroring", () => {
    expect(legacyTopicsToTagSlugs(["not-a-real-topic"], map)).toEqual([]);
  });

  it("removes duplicates when two topics map to the same slug", () => {
    expect(
      legacyTopicsToTagSlugs(["climate-environment", "climate-environment"], { "climate-environment": "climate-change" }),
    ).toEqual(["climate-change"]);
  });

  it("appends mapped slugs alongside real ones (undisturbed by the caller's own dedupe)", () => {
    const mapped = legacyTopicsToTagSlugs(["mental-health"], map);
    expect(Array.from(new Set(["climate-change", ...mapped]))).toEqual(["climate-change", "mental-health-support"]);
  });

  it("defaults to the live LEGACY_TOPIC_TO_TAG map and returns nothing while it's empty", () => {
    expect(legacyTopicsToTagSlugs(["climate-environment"])).toEqual([]);
  });
});
