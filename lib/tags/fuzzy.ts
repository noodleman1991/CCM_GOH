/**
 * Fuzzy matching between a member's free-text tag suggestion and the tags
 * that already exist (2026-09-20).
 *
 * The suggestion box on the submission forms would otherwise fill the
 * moderation queue with "Climate change", "climate-change" and "Climat
 * change" next to the existing tag. Every existing tag is compared through
 * all four language labels and its slug; a close match is offered as "did
 * you mean" and picked as the existing tag, and `cleanSuggestions` is what
 * the server stores after dropping anything that already exists.
 *
 * Pure and dependency-free so both the form and the route share it.
 */
export type FuzzyTag = {
  id: string;
  /** A localized object (`{ en, es, fr, ar }`), a plain string, or nothing. */
  label?: object | string | null;
  value?: string | { current?: string } | null;
};

export type TagMatch<T extends FuzzyTag = FuzzyTag> = { tag: T; score: number; matched: string };

/** Lower-case, accents and punctuation stripped, whitespace collapsed. */
export function normalizeTagText(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = cur;
  }
  return prev[b.length];
}

/** 0..1 — 1 for the same text after normalisation. */
export function similarity(a: string, b: string): number {
  const x = normalizeTagText(a);
  const y = normalizeTagText(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  const longest = Math.max(x.length, y.length);
  return 1 - levenshtein(x, y) / longest;
}

function candidateStrings(tag: FuzzyTag): string[] {
  const out: string[] = [];
  if (typeof tag.label === "string") out.push(tag.label);
  else if (tag.label) for (const v of Object.values(tag.label)) if (typeof v === "string" && v) out.push(v);
  const slug = typeof tag.value === "string" ? tag.value : tag.value?.current;
  if (slug) out.push(slug);
  return out;
}

/** Whole-word containment: "youth mental health" contains the tag "youth". */
function containsAsWords(haystack: string, needle: string): boolean {
  if (!needle || needle.length < 3) return false;
  return ` ${haystack} `.includes(` ${needle} `);
}

/**
 * Existing tags that the input probably means, best first. `threshold` is
 * the minimum similarity to count as a candidate (0.6 shows "did you mean";
 * 0.85 is treated as the same tag).
 */
export function matchTags<T extends FuzzyTag>(input: string, tags: readonly T[], options: { threshold?: number; limit?: number } = {}): TagMatch<T>[] {
  const threshold = options.threshold ?? 0.6;
  const limit = options.limit ?? 3;
  const needle = normalizeTagText(input);
  if (!needle) return [];
  const matches: TagMatch<T>[] = [];
  for (const tag of tags) {
    let best: TagMatch<T> | null = null;
    for (const candidate of candidateStrings(tag)) {
      const norm = normalizeTagText(candidate);
      let score = similarity(needle, norm);
      if (score < 1 && (containsAsWords(needle, norm) || containsAsWords(norm, needle))) {
        score = Math.max(score, 0.75);
      }
      if (!best || score > best.score) best = { tag, score, matched: candidate };
    }
    if (best && best.score >= threshold) matches.push(best);
  }
  return matches.sort((a, b) => b.score - a.score).slice(0, limit);
}

export const SAME_TAG_THRESHOLD = 0.85;

/**
 * What the server keeps of a submission's suggestions: trimmed, capped in
 * count and length, without anything that is already a tag, and without
 * near-duplicates of each other (the first spelling wins).
 */
export function cleanSuggestions(
  inputs: readonly string[],
  tags: readonly FuzzyTag[],
  options: { max?: number; maxLength?: number } = {},
): string[] {
  const max = options.max ?? 3;
  const maxLength = options.maxLength ?? 40;
  const kept: string[] = [];
  for (const raw of inputs) {
    if (typeof raw !== "string") continue;
    const text = raw.trim().replace(/\s+/g, " ");
    if (!text || text.length > maxLength) continue;
    if (matchTags(text, tags, { threshold: SAME_TAG_THRESHOLD, limit: 1 }).length > 0) continue;
    if (kept.some((k) => similarity(k, text) >= SAME_TAG_THRESHOLD)) continue;
    kept.push(text);
    if (kept.length >= max) break;
  }
  return kept;
}
