import { describe, it, expect } from "vitest";
import { parseMentions } from "../comments/mentions";

describe("parseMentions", () => {
  it("extracts a single mention", () => {
    expect(parseMentions("hi @ana welcome")).toEqual(["ana"]);
  });
  it("extracts multiple, de-duped, lowercased", () => {
    expect(parseMentions("@Ana and @bob and @ana again")).toEqual(["ana", "bob"]);
  });
  it("ignores emails (no @ at a word boundary)", () => {
    expect(parseMentions("mail me at me@example.com")).toEqual([]);
  });
  it("handles start-of-string mention", () => {
    expect(parseMentions("@first hello")).toEqual(["first"]);
  });
  it("caps at 10 mentions (anti-spam)", () => {
    const body = Array.from({ length: 20 }, (_, i) => `@user${i}`).join(" ");
    expect(parseMentions(body).length).toBe(10);
  });
  it("returns empty for no mentions", () => {
    expect(parseMentions("just a normal comment")).toEqual([]);
  });
});
