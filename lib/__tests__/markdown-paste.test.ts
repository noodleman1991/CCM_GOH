import { describe, expect, it } from "vitest";
import { looksLikeMarkdown, markdownToTiptap } from "@/components/forms/editor/markdown-paste";

describe("markdown paste", () => {
  it("prose with symbols stays prose", () => {
    expect(looksLikeMarkdown("We met #3 times and 5 * 3 = 15.")).toBe(false);
    expect(markdownToTiptap("We met #3 times.")).toBeNull();
  });

  it("turns headings, lists, quotes, bold, italic and links into editor blocks", () => {
    const doc = markdownToTiptap("# Title\n## Findings\n- one\n- **two**\n1. first\n> quoted\nSee [the report](https://example.org) and *this*.");
    expect(doc?.content.map((n) => (n as { type: string }).type)).toEqual([
      "heading", "heading", "bulletList", "orderedList", "blockquote", "paragraph",
    ]);
    expect((doc?.content[0] as { attrs: { level: number } }).attrs.level).toBe(2);
    expect((doc?.content[1] as { attrs: { level: number } }).attrs.level).toBe(2);
    expect(JSON.stringify(doc)).toContain('"type":"bold"');
    expect(JSON.stringify(doc)).toContain('"href":"https://example.org"');
    expect(JSON.stringify(doc)).toContain('"type":"italic"');
  });

  it("keeps fenced code as a code block", () => {
    const doc = markdownToTiptap("```python\nprint('hi')\n```");
    expect(doc?.content[0]).toEqual({ type: "codeBlock", attrs: { language: "python" }, content: [{ type: "text", text: "print('hi')" }] });
  });
});
