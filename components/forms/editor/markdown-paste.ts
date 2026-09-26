/** Pasted markdown → TipTap JSON. Only clear markdown is converted; ordinary prose is left alone. */

type Mark = { type: "bold" | "italic" | "code" | "strike" | "link"; attrs?: { href: string } };
type Inline = { type: "text"; text: string; marks?: Mark[] };
type Block = { type: string; attrs?: Record<string, unknown>; content?: unknown[] };

const BLOCK_START = /^(#{1,4}\s|[-*+]\s|\d+\.\s|>\s?|```)/;
const INLINE = /\*\*[^*\n]+\*\*|__[^_\n]+__|\[[^\]\n]+\]\(https?:\/\/[^)\s]+\)/;

export function looksLikeMarkdown(text: string): boolean {
  return text.split(/\r?\n/).some((line) => BLOCK_START.test(line.trimStart())) || INLINE.test(text);
}

const TOKEN = /(\*\*([^*\n]+)\*\*|__([^_\n]+)__|~~([^~\n]+)~~|`([^`\n]+)`|\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)|\*([^*\n]+)\*|_([^_\n]+)_)/g;

function inline(text: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    if (m.index! > last) out.push({ type: "text", text: text.slice(last, m.index) });
    if (m[2] || m[3]) out.push({ type: "text", text: m[2] ?? m[3], marks: [{ type: "bold" }] });
    else if (m[4]) out.push({ type: "text", text: m[4], marks: [{ type: "strike" }] });
    else if (m[5]) out.push({ type: "text", text: m[5], marks: [{ type: "code" }] });
    else if (m[6]) out.push({ type: "text", text: m[6], marks: [{ type: "link", attrs: { href: m[7] } }] });
    else out.push({ type: "text", text: m[8] ?? m[9], marks: [{ type: "italic" }] });
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push({ type: "text", text: text.slice(last) });
  return out.filter((node) => node.text.length > 0);
}

const paragraph = (text: string): Block => ({ type: "paragraph", content: inline(text) });

export function markdownToTiptap(text: string): { type: "doc"; content: unknown[] } | null {
  if (!looksLikeMarkdown(text)) return null;
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const content: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) { i++; continue; }

    const fence = trimmed.match(/^```(\w*)/);
    if (fence) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) code.push(lines[i++]);
      i++;
      content.push({ type: "codeBlock", attrs: { language: fence[1] || null }, content: code.length ? [{ type: "text", text: code.join("\n") }] : [] });
      continue;
    }

    // `#` is the page title's level, so every pasted heading lands at h2 or below.
    const heading = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      content.push({ type: "heading", attrs: { level: Math.max(2, heading[1].length) }, content: inline(heading[2]) });
      i++;
      continue;
    }

    const listKind = /^[-*+]\s/.test(trimmed) ? "bulletList" : /^\d+\.\s/.test(trimmed) ? "orderedList" : null;
    if (listKind) {
      const items: Block[] = [];
      const pattern = listKind === "bulletList" ? /^[-*+]\s+(.*)$/ : /^\d+\.\s+(.*)$/;
      while (i < lines.length && pattern.test(lines[i].trim())) {
        items.push({ type: "listItem", content: [paragraph(lines[i].trim().match(pattern)![1])] });
        i++;
      }
      content.push({ type: listKind, content: items });
      continue;
    }

    if (trimmed.startsWith(">")) {
      const quoted: Block[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoted.push(paragraph(lines[i].trim().replace(/^>\s?/, "")));
        i++;
      }
      content.push({ type: "blockquote", content: quoted });
      continue;
    }

    content.push(paragraph(trimmed));
    i++;
  }
  return { type: "doc", content };
}
