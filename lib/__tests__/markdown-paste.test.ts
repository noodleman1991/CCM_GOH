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

  it("never eats underscores or asterisks inside words, URLs or arithmetic", () => {
    const doc = markdownToTiptap("## Notes\nSee file_name_here at https://x.org/some_path_here where 5 * 3 * 2 = 30.");
    const para = doc?.content[1] as { content: { text: string; marks?: unknown[] }[] };
    expect(para.content).toEqual([
      { type: "text", text: "See file_name_here at https://x.org/some_path_here where 5 * 3 * 2 = 30." },
    ]);
    expect(looksLikeMarkdown("5 ** 3 ** 2")).toBe(false);
    expect(looksLikeMarkdown("a__b__c")).toBe(false);
  });

  it("still turns real emphasis into italics and bold", () => {
    const doc = markdownToTiptap("## Notes\n*real italics* and _real italics_ and **bold** and __bold__.");
    const para = doc?.content[1] as { content: { text: string; marks?: { type: string }[] }[] };
    expect(para.content.filter((n) => n.marks).map((n) => [n.text, n.marks![0].type])).toEqual([
      ["real italics", "italic"],
      ["real italics", "italic"],
      ["bold", "bold"],
      ["bold", "bold"],
    ]);
  });
});
