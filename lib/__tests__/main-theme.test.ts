import { describe, expect, it } from "vitest";
import { mainTheme } from "@/lib/case-studies/main-theme";

describe("mainTheme", () => {
  it("is the first theme tag in pick order", () => {
    expect(mainTheme([{ id: "a", category: "audience" }, { id: "b", category: "topic" }, { id: "c", category: "topic" }])?.id).toBe("b");
  });
  it("skips tags that no longer exist (null in the list) instead of crashing", () => {
    expect(mainTheme([null, { id: "a", category: "audience" }, undefined, { id: "b", category: "topic" }])?.id).toBe("b");
    expect(mainTheme([null])).toBeNull();
  });
  it("is empty without a theme", () => {
    expect(mainTheme([{ id: "a", category: "impact" }])).toBeNull();
  });
});
