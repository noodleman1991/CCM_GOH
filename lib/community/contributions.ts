/**
 * Pure helpers for the community graph: normalising a user's contributions and
 * filtering members by privacy. The actual data fetching (Sanity + Prisma) lives
 * in the API routes; this module holds the shaping + rules so they can be unit
 * tested without I/O.
 */
import type { RegionCode } from "@/lib/maps/region-codes";

export type ContributionKind = "caseStudy" | "content" | "recentWork";

export interface Contribution {
  id: string;
  kind: ContributionKind;
  title: string;
  href: string | null;
  /** ISO date string (publish / created), or null. */
  date: string | null;
  region?: RegionCode | null;
}

/** A member of a region, as surfaced on region/profile pages. */
export interface RegionMember {
  id: string;
  username: string | null;
  displayName: string;
  image: string | null;
  role: string | null;
  contributionCount: number;
}

type RawCaseStudy = {
  _id?: string;
  title?: unknown;
  slug?: { current?: string } | null;
  publishedAt?: string | null;
  region?: RegionCode | null;
};
type RawRecentWork = {
  id?: string;
  title?: string | null;
  link?: string | null;
  startDate?: string | Date | null;
};
type RawContent = {
  id?: string;
  title?: string | null;
  createdAt?: string | Date | null;
};

/** Resolve a localized-or-plain title to a string. */
function resolveTitle(title: unknown, locale: string): string {
  if (typeof title === "string") return title;
  if (title && typeof title === "object") {
    const t = title as Record<string, string>;
    return t[locale] || t.en || Object.values(t).find(Boolean) || "Untitled";
  }
  return "Untitled";
}

function toISO(d: string | Date | null | undefined): string | null {
  if (!d) return null;
  if (d instanceof Date) return isNaN(d.getTime()) ? null : d.toISOString();
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

/**
 * Merge a user's case studies (Sanity), Content + RecentWork (Prisma) into one
 * normalized, date-sorted (newest first) Contribution[].
 */
export function normalizeContributions(args: {
  caseStudies?: RawCaseStudy[] | null;
  content?: RawContent[] | null;
  recentWork?: RawRecentWork[] | null;
  locale: string;
}): Contribution[] {
  const { caseStudies, content, recentWork, locale } = args;
  const out: Contribution[] = [];

  for (const cs of caseStudies ?? []) {
    if (!cs?._id) continue;
    out.push({
      id: cs._id,
      kind: "caseStudy",
      title: resolveTitle(cs.title, locale),
      href: cs.slug?.current ? `/research-and-action/case-studies/${cs.slug.current}` : null,
      date: toISO(cs.publishedAt),
      region: cs.region ?? null,
    });
  }
  for (const c of content ?? []) {
    if (!c?.id) continue;
    out.push({
      id: c.id,
      kind: "content",
      title: c.title || "Untitled",
      href: null,
      date: toISO(c.createdAt),
    });
  }
  for (const w of recentWork ?? []) {
    if (!w?.id) continue;
    out.push({
      id: w.id,
      kind: "recentWork",
      title: w.title || "Untitled",
      href: w.link || null,
      date: toISO(w.startDate),
    });
  }

  // Newest first; undated items sink to the bottom in a stable order.
  return out.sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return 0;
  });
}

type RawMember = {
  id?: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  image?: string | null;
  isSearchable?: boolean | null;
  profileVisibility?: "PUBLIC" | "MEMBERS" | "PRIVATE" | null;
  role?: string | null;
  contributionCount?: number | null;
};

/**
 * Shape + privacy-filter a region's members for PUBLIC display. PRIVATE profiles
 * and non-searchable users are excluded (the dataset is public, so this is the
 * real boundary). Members without a username can't be linked, so they're dropped.
 */
export function publicRegionMembers(raw: (RawMember | null | undefined)[] | null | undefined): RegionMember[] {
  const members: RegionMember[] = [];
  for (const m of raw ?? []) {
    if (!m?.id || !m.username) continue;
    if (m.profileVisibility === "PRIVATE") continue;
    if (m.isSearchable === false) continue;
    const displayName =
      [m.firstName, m.lastName].filter(Boolean).join(" ").trim() || m.username;
    members.push({
      id: m.id,
      username: m.username,
      displayName,
      image: m.image ?? null,
      role: m.role ?? null,
      contributionCount: m.contributionCount ?? 0,
    });
  }
  // Most-active first, then alphabetical for stability.
  return members.sort(
    (a, b) =>
      b.contributionCount - a.contributionCount ||
      a.displayName.localeCompare(b.displayName)
  );
}
