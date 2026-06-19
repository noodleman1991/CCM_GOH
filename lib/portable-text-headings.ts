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
 * The id for a heading block — stable AND unique across renders. A slug of the
 * text alone collides when two headings share text (e.g. two "Executive
 * Summary"), which breaks both React keys and anchor targets. So we suffix the
 * block's _key (unique per block) onto a readable slug. The renderer and the
 * TOC both call this on the same blocks, so their ids stay in lockstep.
 */
export function headingId(block: PTBlock): string {
  const slug = headingSlug(blockPlainText(block));
  const key = block?._key ?? "";
  if (slug && key) return `${slug}-${key}`;
  return slug || `h-${key}`;
}

export type TocItem = { id: string; text: string; level: 2 | 3 };

export type Footnote = { key: string; number: number; text: string };

/**
 * Extract footnotes from a body in document order and number them 1..N.
 * Returns the ordered list plus a map from the footnote markDef _key to its
 * number, so the renderer can show the right superscript for each reference.
 */
export function extractFootnotes(body: PTBlock[] | undefined): {
  footnotes: Footnote[];
  numberByKey: Record<string, number>;
} {
  const footnotes: Footnote[] = [];
  const numberByKey: Record<string, number> = {};
  if (!Array.isArray(body)) return { footnotes, numberByKey };
  for (const block of body) {
    const defs = (block as PTBlock & { markDefs?: { _type?: string; _key?: string; text?: string }[] }).markDefs;
    if (!Array.isArray(defs)) continue;
    for (const def of defs) {
      if (def?._type !== "footnote" || !def._key) continue;
      if (def._key in numberByKey) continue;
      const number = footnotes.length + 1;
      numberByKey[def._key] = number;
      footnotes.push({ key: def._key, number, text: (def.text ?? "").trim() });
    }
  }
  return { footnotes, numberByKey };
}

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
