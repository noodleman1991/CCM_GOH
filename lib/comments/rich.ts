/**
 * Sanitizer for rich (Portable Text) comment bodies. Comments allow
 * TEXT-LEVEL richness only: paragraphs/blockquotes, bullet/numbered lists,
 * bold/em/underline/code marks, and http(s) links. Everything else — images,
 * embeds, custom story blocks, unknown mark defs — is stripped server-side so
 * the renderer can trust the stored value. Pure (unit-testable).
 */

type Span = { _type: "span"; _key?: string; text: string; marks?: string[] };
type MarkDef = { _type: string; _key: string; href?: string };
export type RichBlock = {
  _type: "block";
  _key?: string;
  style?: string;
  listItem?: "bullet" | "number";
  level?: number;
  markDefs?: MarkDef[];
  children: Span[];
};

const ALLOWED_STYLES = new Set(["normal", "blockquote"]);
const ALLOWED_DECORATORS = new Set(["strong", "em", "underline", "code", "strike-through"]);
const MAX_BLOCKS = 100;
const MAX_TEXT = 4000;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function safeHref(href: unknown): string | null {
  if (typeof href !== "string") return null;
  try {
    const u = new URL(href);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Returns sanitized blocks, or null when the input has no usable text content
 * (callers then fall back to plain-body-only storage).
 */
export function sanitizeCommentRich(input: unknown): RichBlock[] | null {
  if (!Array.isArray(input)) return null;
  const out: RichBlock[] = [];
  let textBudget = MAX_TEXT;

  for (const raw of input.slice(0, MAX_BLOCKS)) {
    if (!isRecord(raw) || raw._type !== "block" || !Array.isArray(raw.children)) continue;

    // Link mark defs only, with validated hrefs.
    const markDefs: MarkDef[] = [];
    const validDefKeys = new Set<string>();
    if (Array.isArray(raw.markDefs)) {
      for (const d of raw.markDefs) {
        if (!isRecord(d) || d._type !== "link" || typeof d._key !== "string") continue;
        const href = safeHref(d.href);
        if (!href) continue;
        markDefs.push({ _type: "link", _key: d._key, href });
        validDefKeys.add(d._key);
      }
    }

    const children: Span[] = [];
    for (const c of raw.children) {
      if (!isRecord(c) || c._type !== "span" || typeof c.text !== "string") continue;
      const text = c.text.slice(0, Math.max(0, textBudget));
      textBudget -= text.length;
      const marks = Array.isArray(c.marks)
        ? c.marks.filter(
            (m): m is string =>
              typeof m === "string" && (ALLOWED_DECORATORS.has(m) || validDefKeys.has(m))
          )
        : [];
      children.push({
        _type: "span",
        ...(typeof c._key === "string" ? { _key: c._key } : {}),
        text,
        marks,
      });
      if (textBudget <= 0) break;
    }
    if (children.length === 0) continue;

    const block: RichBlock = {
      _type: "block",
      ...(typeof raw._key === "string" ? { _key: raw._key } : {}),
      style: typeof raw.style === "string" && ALLOWED_STYLES.has(raw.style) ? raw.style : "normal",
      markDefs,
      children,
    };
    if (raw.listItem === "bullet" || raw.listItem === "number") {
      block.listItem = raw.listItem;
      block.level = typeof raw.level === "number" && raw.level >= 1 && raw.level <= 3 ? raw.level : 1;
    }
    out.push(block);
    if (textBudget <= 0) break;
  }

  return extractPlainText(out).trim().length > 0 ? out : null;
}

/** Plain text of the sanitized blocks — feeds body/moderation/@mentions. */
export function extractPlainText(blocks: RichBlock[]): string {
  return blocks
    .map((b) => b.children.map((c) => c.text).join(""))
    .join("\n")
    .slice(0, MAX_TEXT);
}
