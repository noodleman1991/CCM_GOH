/**
 * Shared helpers for extracting a stable, linkable id from a Portable Text
 * heading block, and for pulling the heading outline out of a body for an
 * "On this page" table of contents. Used by both the PortableTextRenderer
 * (to anchor h2/h3) and the reader TOC (to target them) so the ids match.
 */

type PTSpan = { _type?: string; text?: string };
type PTBlock = {
  _type?: string;
  _key?: string;
  style?: string;
  children?: PTSpan[];
};

/** Plain text of a block's spans. */
export function blockPlainText(block: PTBlock): string {
  return (block?.children ?? [])
    .filter((c) => c?._type === "span")
    .map((c) => c?.text ?? "")
    .join("");
}

/** Slugify heading text into an anchor id (ascii-folded, kebab). */
export function headingSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

/**
 * The id for a heading block — stable across renders. Prefers a slug of the
 * text; falls back to the block _key so it's never empty/duplicate-blank.
 */
export function headingId(block: PTBlock): string {
  const slug = headingSlug(blockPlainText(block));
  return slug || `h-${block?._key ?? ""}`;
}

export type TocItem = { id: string; text: string; level: 2 | 3 };

/** Extract the h2/h3 outline from a Portable Text body for a TOC. */
export function extractToc(body: PTBlock[] | undefined): TocItem[] {
  if (!Array.isArray(body)) return [];
  const items: TocItem[] = [];
  for (const block of body) {
    if (block?._type !== "block") continue;
    const level = block.style === "h2" ? 2 : block.style === "h3" ? 3 : null;
    if (!level) continue;
    const text = blockPlainText(block).trim();
    if (!text) continue;
    items.push({ id: headingId(block), text, level });
  }
  return items;
}
