/**
 * Regions and partners on the pages (regions-and-partners spec §3.6) — pure.
 *
 * Works on Sections lists read with `locale: "all"` (text fields are
 * `{ en, es, fr, ar }`). Each change is idempotent: running the plan on its
 * own output changes nothing.
 */
type Row = Record<string, unknown>;

const isRow = (v: unknown): v is Row => typeof v === "object" && v !== null && !Array.isArray(v);
const english = (v: unknown): string => (typeof v === "string" ? v : isRow(v) && typeof v.en === "string" ? v.en : "");
const hasText = (v: unknown) => english(v).trim().length > 0;

/** The seven-card grid: a grid whose heading mentions regions or communities, else the first grid right after the region map. */
function regionsGridIndex(sections: Row[]): number {
  const byHeading = sections.findIndex((s) => s.blockType === "gridRow" && /regional|communit|region/i.test(english(s.title)));
  if (byHeading >= 0) return byHeading;
  const map = sections.findIndex((s) => s.blockType === "regionMap");
  return map >= 0 && sections[map + 1]?.blockType === "gridRow" ? map + 1 : -1;
}

export function planRegionsAndPartners(
  input: Row[],
  orgs: { fundedBy: string | null; hostedBy: string | null },
): { sections: Row[]; changes: string[]; missing: string[] } {
  const changes: string[] = [];
  const missing: string[] = [];
  if (!orgs.fundedBy) missing.push("Funded by: Wellcome");
  if (!orgs.hostedBy) missing.push("Hosted by: Climate Cares Centre");

  let sections = input.map((s) => ({ ...s }));

  // Once the page has a carousel, no grid is ever replaced again.
  const grid = sections.some((s) => s.blockType === "communityCarousel") ? -1 : regionsGridIndex(sections);
  if (grid >= 0) {
    const old = sections[grid];
    const intro = hasText(old.subtitle) ? old.subtitle : hasText(old.description) ? old.description : null;
    // A new row: no id, so Payload creates it (English first; the other languages land on the same row).
    const carousel: Row = { blockType: "communityCarousel", heading: old.title ?? null, intro, autoplay: true, speed: "calm" };
    sections = [...sections.slice(0, grid), carousel, ...sections.slice(grid + 1)];
    changes.push(`Replaced the regional communities grid with a Community carousel ("${english(old.title) || "untitled"}").`);
  }

  sections = sections.map((s) => {
    if (s.blockType === "regionMap" && s.showRegionStories !== false) {
      changes.push(`Turned off "Show the latest from each region" on the region map ("${english(s.title) || "untitled"}").`);
      return { ...s, showRegionStories: false };
    }
    if (s.blockType === "logoCloud1") {
      const fundedBy = orgs.fundedBy ? [orgs.fundedBy] : [];
      const hostedBy = orgs.hostedBy ? [orgs.hostedBy] : [];
      const same =
        s.layout === "grid" &&
        JSON.stringify(ids(s.fundedBy)) === JSON.stringify(fundedBy) &&
        JSON.stringify(ids(s.hostedBy)) === JSON.stringify(hostedBy);
      if (same) return s;
      changes.push(`Made the logo strip ("${english(s.title) || "untitled"}") a grouped wall with Funded by and Hosted by on top.`);
      return { ...s, layout: "grid", fundedBy, hostedBy };
    }
    return s;
  });

  return { sections, changes, missing };
}

/** A relationship list as ids (depth 0 gives ids; depth ≥ 1 gives rows). */
function ids(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => (isRow(x) ? String(x.id) : String(x))) : [];
}

/** Community pages: every logo strip becomes the one-line carousel (spec §3.5). */
export function planCommunityLogos(input: Row[]): { sections: Row[]; changes: string[] } {
  const changes: string[] = [];
  const sections = input.map((s) => {
    if (s.blockType !== "logoCloud1" || s.layout === "carousel") return s;
    changes.push(`Logo strip ("${english(s.title) || "untitled"}") → one line.`);
    return { ...s, layout: "carousel" };
  });
  return { sections, changes };
}

/** A Sections list as each language stores it (read one language at a time, no fallback). */
export type ByLanguage = Record<"en" | "es" | "fr" | "ar", Row[]>;

export interface RegionsBackup {
  /** 2: sections saved per language. Older backups stored a mixed-language read and can't be put back safely. */
  version: 2;
  homepageChanged: boolean;
  homepage: ByLanguage;
  communities: Array<{ id: string; slug: string; changed: boolean; sections: ByLanguage }>;
}

/** What --revert writes: only what the run changed — pages it never touched are left alone. */
export function toPutBack(backup: RegionsBackup): { homepage: ByLanguage | null; communities: RegionsBackup["communities"] } {
  return {
    homepage: backup.homepageChanged ? backup.homepage : null,
    communities: backup.communities.filter((c) => c.changed),
  };
}
