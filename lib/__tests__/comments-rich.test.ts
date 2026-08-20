import { describe, it, expect } from "vitest";
import { sanitizeCommentRich, extractPlainText } from "../comments/rich";

const span = (text: string, marks: string[] = []) => ({ _type: "span", _key: "s1", text, marks });
const block = (children: unknown[], extra: Record<string, unknown> = {}) => ({
  _type: "block",
  _key: "b1",
  style: "normal",
  markDefs: [],
  children,
  ...extra,
});

describe("sanitizeCommentRich", () => {
  it("keeps plain paragraphs and allowed decorators", () => {
    const out = sanitizeCommentRich([block([span("hello ", ["strong"]), span("world", ["em"])])]);
    expect(out).not.toBeNull();
    expect(out![0].children.map((c) => c.marks)).toEqual([["strong"], ["em"]]);
  });

  it("strips unknown block types (images, embeds, custom blocks)", () => {
    const out = sanitizeCommentRich([
      { _type: "image", asset: { _ref: "x" } },
      { _type: "storyChart", spec: "{}" },
      block([span("kept")]),
    ]);
    expect(out).toHaveLength(1);
    expect(extractPlainText(out!)).toBe("kept");
  });

  it("strips disallowed marks and dead markDef references", () => {
    const out = sanitizeCommentRich([block([span("x", ["strong", "highlight", "missing-def"])])]);
    expect(out![0].children[0].marks).toEqual(["strong"]);
  });

  it("keeps http(s) links, drops javascript: and malformed hrefs", () => {
    const out = sanitizeCommentRich([
      block([span("a", ["l1"]), span("b", ["l2"]), span("c", ["l3"])], {
        markDefs: [
          { _type: "link", _key: "l1", href: "https://example.org/x" },
          { _type: "link", _key: "l2", href: "javascript:alert(1)" },
          { _type: "link", _key: "l3", href: "not a url" },
        ],
      }),
    ]);
    expect(out![0].markDefs).toEqual([{ _type: "link", _key: "l1", href: "https://example.org/x" }]);
    // spans referencing dropped defs lose that mark
    expect(out![0].children.map((c) => c.marks)).toEqual([["l1"], [], []]);
  });

  it("normalizes unknown styles to normal, keeps blockquote and lists", () => {
    const out = sanitizeCommentRich([
      block([span("q")], { style: "blockquote" }),
      block([span("h")], { style: "h1" }),
      block([span("li")], { listItem: "bullet", level: 9 }),
    ]);
    expect(out![0].style).toBe("blockquote");
    expect(out![1].style).toBe("normal");
    expect(out![2].listItem).toBe("bullet");
    expect(out![2].level).toBe(1);
  });

  it("returns null for empty/whitespace/garbage input", () => {
    expect(sanitizeCommentRich([block([span("   ")])])).toBeNull();
    expect(sanitizeCommentRich("nope")).toBeNull();
    expect(sanitizeCommentRich([{ _type: "image" }])).toBeNull();
  });

  it("caps total text at 4000 chars", () => {
    const out = sanitizeCommentRich([block([span("x".repeat(6000))])]);
    expect(extractPlainText(out!).length).toBeLessThanOrEqual(4000);
  });
});
