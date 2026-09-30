/**
 * Pasted stories often arrive as one long block with single line breaks
 * between paragraphs, so they render as one wall of text (news, 2026-09-30).
 * For display, a line break inside a plain paragraph or a quote starts a new
 * block of the same style. Headings, list items and non-text blocks are left
 * as they are. Pure; the stored content is never changed.
 */
type Span = { _type?: string; _key?: string; text?: string; marks?: string[] } & Record<string, unknown>;
type Block = { _type?: string; _key?: string; style?: string; listItem?: string; children?: Span[] } & Record<string, unknown>;

const SPLITTABLE = new Set(["normal", "blockquote"]);

export function softBreaksToParagraphs(value: unknown[]): unknown[] {
  return value.flatMap((item) => {
    const block = item as Block;
    const splittable =
      block?._type === "block" &&
      SPLITTABLE.has(block.style ?? "normal") &&
      !block.listItem &&
      Array.isArray(block.children) &&
      block.children.some((c) => typeof c.text === "string" && c.text.includes("\n"));
    if (!splittable) return [item];

    const pieces: Span[][] = [[]];
    for (const child of block.children!) {
      if (typeof child.text !== "string" || !child.text.includes("\n")) {
        pieces[pieces.length - 1].push(child);
        continue;
      }
      child.text.split("\n").forEach((part, i) => {
        if (i > 0) pieces.push([]);
        if (part.length > 0) pieces[pieces.length - 1].push({ ...child, text: part });
      });
    }

    return pieces
      .map((children) => children.filter((c) => typeof c.text !== "string" || c.text.trim().length > 0))
      .filter((children) => children.length > 0)
      .map((children, i) => ({
        ...block,
        _key: `${block._key ?? "b"}-${i}`,
        children: children.map((c, j) => ({ ...c, _key: `${c._key ?? "s"}-${i}-${j}` })),
      }));
  });
}
