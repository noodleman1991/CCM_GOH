import { describe, expect, it } from "vitest";
import { pickTagFilter, tagQuery } from "@/lib/maps/tag-filter";

const themes = new Set(["drought", "trauma"]);
const communities = new Set(["youth", "farmers"]);
const sp = (q: string) => new URLSearchParams(q);

describe("the atlas's tag parameters", () => {
  it("reads themes and communities as lists, keeping only real options", () => {
    expect(pickTagFilter(sp("themes=drought,nope,trauma&communities=youth,ghost"), themes, communities)).toEqual({ themes: ["drought", "trauma"], communities: ["youth"] });
  });
  it("still reads the old single theme, and sorts an audience tag passed as a theme into communities", () => {
    expect(pickTagFilter(sp("theme=drought"), themes, communities)).toEqual({ themes: ["drought"], communities: [] });
    expect(pickTagFilter(sp("theme=youth"), themes, communities)).toEqual({ themes: [], communities: ["youth"] });
  });
  it("is empty when nothing (valid) is chosen", () => {
    expect(pickTagFilter(sp(""), themes, communities)).toEqual({ themes: [], communities: [] });
    expect(pickTagFilter(sp("theme=livelihoods"), themes, communities)).toEqual({ themes: [], communities: [] });
  });
  it("writes the query fragment the atlas requests carry", () => {
    expect(tagQuery({ themes: ["drought", "trauma"], communities: ["youth"] })).toBe("&themes=drought%2Ctrauma&communities=youth");
    expect(tagQuery({ themes: [], communities: [] })).toBe("");
  });
});
