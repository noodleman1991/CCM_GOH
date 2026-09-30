import { describe, expect, it } from "vitest";
import { softBreaksToParagraphs } from "@/lib/content/soft-breaks-to-paragraphs";

const block = (style: string, children: Array<{ text: string; marks?: string[] }>, key = "b1") => ({
  _type: "block",
  _key: key,
  style,
  markDefs: [],
  children: children.map((c, i) => ({ _type: "span", _key: `s${i}`, marks: c.marks ?? [], text: c.text })),
});

describe("pasted line breaks become paragraphs", () => {
  it("splits a paragraph at each line break, keeping text and marks", () => {
    const out = softBreaksToParagraphs([block("normal", [{ text: "One.\nTwo " }, { text: "bold", marks: ["strong"] }, { text: " end.\nThree." }])]);
    expect(out.map((b) => (b as { children: Array<{ text: string }> }).children.map((c) => c.text).join(""))).toEqual(["One.", "Two bold end.", "Three."]);
    expect((out[1] as { children: Array<{ marks: string[] }> }).children[1].marks).toEqual(["strong"]);
    expect(new Set(out.map((b) => (b as { _key: string })._key)).size).toBe(3);
  });
  it("splits quotes too, and keeps each part's style", () => {
    const out = softBreaksToParagraphs([block("blockquote", [{ text: "“A.”\nB said." }])]);
    expect(out.map((b) => (b as { style: string }).style)).toEqual(["blockquote", "blockquote"]);
  });
  it("drops empty pieces and leaves headings, lists and non-text blocks alone", () => {
    const h = block("h2", [{ text: "Title\nline" }], "h");
    const img = { _type: "image", _key: "i" };
    const list = { ...block("normal", [{ text: "a\nb" }], "l"), listItem: "bullet" };
    const out = softBreaksToParagraphs([h, img, list, block("normal", [{ text: "x\n\ny" }], "p")]);
    expect(out.slice(0, 3)).toEqual([h, img, list]);
    expect(out.slice(3).map((b) => (b as { children: Array<{ text: string }> }).children.map((c) => c.text).join(""))).toEqual(["x", "y"]);
  });
});
