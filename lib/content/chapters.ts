/**
 * A community page's chapter menu, built from its sections (CMS project 3,
 * spec §3.3). Pure — used by the page and safe anywhere.
 *
 * A section with a chapter starts that chapter; the sections below it join it
 * until the next one. Sections before the first chapter form an unnamed group.
 */
export const CHAPTER_KINDS = ["overview", "agendas", "caseStudies", "news", "voices", "members", "partners", "custom"] as const;
export type ChapterKind = (typeof CHAPTER_KINDS)[number];
type Standard = Exclude<ChapterKind, "custom">;

/** Standard chapters' labels: keys under `regional.sectionTitles`. */
export const CHAPTER_MESSAGE: Record<Standard, string> = {
  overview: "overview",
  agendas: "agendas",
  caseStudies: "caseStudies",
  news: "newsUpdates",
  voices: "communityVoices",
  members: "members",
  partners: "partners",
};

/** The anchors today's community pages already use. */
const ANCHOR: Record<Standard, string> = {
  overview: "overview",
  agendas: "agendas",
  caseStudies: "case-studies",
  news: "news",
  voices: "voices",
  members: "members",
  partners: "partners",
};

export interface Chapter<T> {
  id: string | null;
  kind: ChapterKind | null;
  label: string | null;
  blocks: T[];
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "") || "section";

export function groupIntoChapters<T extends { chapter?: { kind?: string | null; label?: string | null } | null }>(
  blocks: T[],
  labelFor: (kind: Standard) => string,
): Chapter<T>[] {
  const out: Chapter<T>[] = [];
  const used = new Map<string, number>();
  const anchor = (base: string) => {
    const n = (used.get(base) ?? 0) + 1;
    used.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  };
  for (const block of blocks) {
    const kind = block.chapter?.kind ?? null;
    const custom = kind === "custom" ? (block.chapter?.label ?? "").trim() : "";
    const known = kind !== null && (CHAPTER_KINDS as readonly string[]).includes(kind);
    const starts = known && (kind !== "custom" || custom.length > 0);
    if (starts) {
      const k = kind as ChapterKind;
      const label = k === "custom" ? custom : labelFor(k as Standard);
      out.push({ id: anchor(k === "custom" ? slugify(custom) : ANCHOR[k as Standard]), kind: k, label, blocks: [block] });
    } else if (out.length === 0) {
      out.push({ id: null, kind: null, label: null, blocks: [block] });
    } else {
      out[out.length - 1].blocks.push(block);
    }
  }
  return out;
}
