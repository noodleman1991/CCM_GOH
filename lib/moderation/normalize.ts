/**
 * Deterministic, locale-aware text normalization for the comment wordlist
 * moderation. Pure functions — unit-tested. No AI.
 *
 * Latin-script matching is trivial; Arabic is the hard case (and a first-class
 * RTL locale here), so we fold the common variants that obfuscation/diacritics
 * introduce:
 *   - strip tashkeel (U+064B–U+065F) + superscript alef (U+0670)
 *   - strip tatweel/kashida (U+0640)
 *   - strip ZWJ/ZWNJ (U+200C/U+200D)
 *   - alef variants  أ إ آ ٱ → ا
 *   - alef maqsura  ى → ي
 *   - ta marbuta   ة → ه
 * Then NFKC + lowercase + collapse whitespace.
 */

const ARABIC_DIACRITICS = /[ً-ٰٟ]/g;
const TATWEEL = /ـ/g;
const ZERO_WIDTH = /[‌‍]/g;

export function normalizeForMatch(input: string): string {
  if (!input) return "";
  let s = input.normalize("NFKC");
  s = s.replace(ARABIC_DIACRITICS, "");
  s = s.replace(TATWEEL, "");
  s = s.replace(ZERO_WIDTH, "");
  // Arabic letter folding
  s = s
    .replace(/[أإآٱ]/g, "ا") // أ إ آ ٱ → ا
    .replace(/ى/g, "ي") // ى → ي
    .replace(/ة/g, "ه"); // ة → ه
  s = s.toLowerCase();
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

/** Normalize a single term for storage/comparison (no whitespace collapse needed). */
export function normalizeTerm(term: string): string {
  return normalizeForMatch(term);
}

export type WordlistMatch = { term: string };

/**
 * Returns the first matching term from `terms` found in `text`, or null.
 * Matching is whole-word (word-boundary) on the normalized forms, so "classic"
 * does not trip a "ass" term, while still catching the term as its own word.
 * For scripts without ASCII word boundaries (Arabic), we fall back to a
 * separator-delimited check on the normalized string.
 */
export function findWordlistHit(text: string, terms: string[]): WordlistMatch | null {
  const haystack = normalizeForMatch(text);
  if (!haystack) return null;

  for (const raw of terms) {
    const term = normalizeForMatch(raw);
    if (!term) continue;

    // Latin/ASCII terms: real word boundaries.
    if (/^[\x00-\x7F]+$/.test(term)) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`(?:^|\\W)${escaped}(?:$|\\W)`, "u");
      if (re.test(haystack)) return { term: raw };
      continue;
    }

    // Non-ASCII (e.g. Arabic): match as a whitespace/separator-delimited token,
    // or as a substring bounded by non-letters.
    const padded = ` ${haystack} `;
    if (padded.includes(` ${term} `)) return { term: raw };
    // Also catch term adjacent to punctuation.
    const re = new RegExp(`(?:^|[^\\p{L}])${escapeUnicode(term)}(?:$|[^\\p{L}])`, "u");
    if (re.test(haystack)) return { term: raw };
  }
  return null;
}

function escapeUnicode(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type Tier = "block" | "review" | "clean";

/**
 * Classify text against the two-tier wordlist. `block` terms win over `review`.
 */
export function classify(
  text: string,
  blockTerms: string[],
  reviewTerms: string[]
): { tier: Tier; term?: string } {
  const blocked = findWordlistHit(text, blockTerms);
  if (blocked) return { tier: "block", term: blocked.term };
  const review = findWordlistHit(text, reviewTerms);
  if (review) return { tier: "review", term: review.term };
  return { tier: "clean" };
}
