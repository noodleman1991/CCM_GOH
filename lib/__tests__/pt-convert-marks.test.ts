import { describe, expect, it } from "vitest";
import { portableTextToTiptap, tiptapToPortableText } from "@/components/forms/editor/pt-convert";

const doc = {
  type: "doc",
  content: [
    { type: "paragraph", content: [
      { type: "text", text: "gone", marks: [{ type: "strike" }] },
      { type: "text", text: "x = 1", marks: [{ type: "code" }] },
    ] },
    { type: "codeBlock", attrs: { language: "r" }, content: [{ type: "text", text: "summary(df)" }] },
    { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Big" }] },
  ],
};

describe("pt-convert keeps what the editor shows", () => {
  it("round-trips strikethrough, inline code and code blocks", () => {
    const pt = tiptapToPortableText(doc);
    expect(pt[0].children.map((c: { marks: string[] }) => c.marks)).toEqual([["strike-through"], ["code"]]);
    expect(pt[1]).toMatchObject({ _type: "code", code: "summary(df)", language: "r" });
    const back = portableTextToTiptap(pt);
    expect(JSON.stringify(back)).toContain('"type":"strike"');
    expect(JSON.stringify(back)).toContain('"type":"code"');
    expect(back.content[1]).toMatchObject({ type: "codeBlock", attrs: { language: "r" } });
  });

  it("stores a level-1 heading as the page's section heading (h2)", () => {
    expect(tiptapToPortableText(doc)[2].style).toBe("h2");
  });
});
