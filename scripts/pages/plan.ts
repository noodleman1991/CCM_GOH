/**
 * Plans the move of one regular page onto the shared Sections list (CMS project 4).
 *
 * English's list is the layout. Each other language's list is lined up with it
 * by block type, in order, and every lined-up section is rebuilt with the
 * homepage move's field-by-field builder, so each language keeps its own text
 * wherever a section lines up. Sections only another language has are left out
 * (listed, and still in the hidden backup list).
 */
import type { Block } from "payload";
import * as library from "@/payload/blocks";
import { planSection, type Difference } from "../homepage/plan";

type Row = Record<string, unknown>;
const OTHERS = ["es", "fr", "ar"] as const;
export const ABOUT_HEADING_EN = "The Connecting Climate Minds Journey";
const isRow = (v: unknown): v is Row => typeof v === "object" && v !== null && !Array.isArray(v);
const BLOCKS = new Map(
  Object.values(library)
    .filter((b): b is Block => isRow(b) && typeof (b as Block).slug === "string")
    .map((b) => [b.slug, b]),
);

/** For each English index, the aligned index in `other` (longest common subsequence on block type), or null. */
export function alignByType(en: string[], other: string[]): Array<number | null> {
  const n = en.length;
  const m = other.length;
  const dp = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = en[i] === other[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: Array<number | null> = new Array(n).fill(null);
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (en[i] === other[j]) {
      out[i] = j;
      i++;
      j++;
    } else if (dp[i + 1][j] > dp[i][j + 1]) i++;
    else j++; // on a tie, skip the other language's section so English's earlier one keeps its match
  }
  return out;
}

/** Per-language copies of one section as the "slot" shape planSection reads: every key a { lang: value } map. */
function merged(perLang: Partial<Record<string, Row>>): Row {
  const keys = new Set(Object.values(perLang).flatMap((r) => (r ? Object.keys(r) : [])));
  return Object.fromEntries(
    [...keys].map((k) => [k, Object.fromEntries(Object.entries(perLang).filter(([, r]) => r).map(([l, r]) => [l, (r as Row)[k]]))]),
  );
}

export function planPageSections(page: Row) {
  const lists = (isRow(page.blocks) ? page.blocks : {}) as Record<string, Row[] | undefined>;
  const en = Array.isArray(lists.en) ? lists.en : [];
  const types = (l: Row[]) => l.map((b) => String(b.blockType));
  const differences: Difference[] = [];
  const notes: string[] = [];
  const leftOut: Array<{ lang: string; blockType: string; index: number }> = [];
  const alignments = Object.fromEntries(OTHERS.map((l) => [l, Array.isArray(lists[l]) ? alignByType(types(en), types(lists[l]!)) : null]));
  const shared = OTHERS.every((l) => !Array.isArray(lists[l]) || types(lists[l]!).join() === types(en).join());

  const sections: Row[] = [];
  // About: the other languages' leading journey heading stays, with English added.
  const about = page.slug === "about";
  if (about) {
    const perLang: Partial<Record<string, Row>> = { en: { blockType: "sectionHeader", title: ABOUT_HEADING_EN } };
    for (const l of OTHERS) {
      const first = lists[l]?.[0];
      if (first?.blockType === "sectionHeader" && alignments[l]![0] !== 0) perLang[l] = first;
    }
    sections.push(planSection(BLOCKS.get("sectionHeader")!, merged(perLang), "about:journey", differences));
    notes.push("About: the journey heading is kept in every language (English added).");
  }

  en.forEach((block, i) => {
    const perLang: Partial<Record<string, Row>> = { en: block };
    for (const l of OTHERS) {
      const j = alignments[l]?.[i];
      if (j !== null && j !== undefined) perLang[l] = lists[l]![j];
    }
    const target = BLOCKS.get(String(block.blockType));
    if (target) sections.push(planSection(target, merged(perLang), `${page.slug}#${i}`, differences));
  });

  for (const l of OTHERS) {
    const list = lists[l];
    if (!Array.isArray(list)) continue;
    const used = new Set(alignments[l]!.filter((j): j is number => j !== null));
    list.forEach((b, j) => {
      if (used.has(j)) return;
      if (about && j === 0 && b.blockType === "sectionHeader") return; // kept above
      leftOut.push({ lang: l, blockType: String(b.blockType), index: j });
    });
  }
  return { sections, mode: (shared ? "shared" : "aligned") as "shared" | "aligned", leftOut, differences, notes };
}
