/**
 * Everything a member has sent to the hub, in one shape (my-contributions
 * spec, 2026-10-03). Pure — the reader feeds it Payload rows.
 */
import { outputDetailHref } from "@/lib/collaboration/outputs";

export type ContributionKind = "caseStudy" | "livedExperience" | "researchOutput" | "event";
export type ContributionStatus = "draft" | "pending" | "revision" | "approved" | "rejected";

export interface Contribution {
  id: string;
  kind: ContributionKind;
  /** In the page's language, else English, else any; null when it has none. */
  title: string | null;
  status: ContributionStatus;
  reviewNotes: string | null;
  /** When it was sent (or saved, for a draft). */
  date: string | null;
  /** The public page — approved and slugged only. */
  href: string | null;
  /** Where the member changes it — null once approved or declined. */
  editHref: string | null;
  /** The admin record, for editors. */
  adminHref: string;
}

export const CONTRIBUTION_KINDS: readonly ContributionKind[] = ["caseStudy", "livedExperience", "researchOutput", "event"];
export const SECTION_ORDER: readonly ContributionStatus[] = ["revision", "draft", "pending", "approved", "rejected"];

const COLLECTION: Record<ContributionKind, string> = {
  caseStudy: "caseStudies",
  livedExperience: "livedExperiences",
  researchOutput: "researchOutputs",
  event: "events",
};
const EDIT: Record<ContributionKind, (id: string) => string> = {
  caseStudy: (id) => `/research-and-action/case-studies/submit?edit=${encodeURIComponent(id)}`,
  livedExperience: (id) => `/lived-experiences/submit?edit=${encodeURIComponent(id)}`,
  researchOutput: (id) => `/research-and-action/research-outputs/submit?edit=${encodeURIComponent(id)}`,
  event: (id) => `/events/suggest?edit=${encodeURIComponent(id)}`,
};
const STATUSES = new Set<ContributionStatus>(["pending", "revision", "approved", "rejected"]);

const text = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);
const idOf = (v: unknown): string | null => (typeof v === "string" && v ? v : typeof v === "number" ? String(v) : null);

function pickTitle(value: unknown, locale: string): string | null {
  if (typeof value === "string") return text(value);
  if (!value || typeof value !== "object") return null;
  const arms = value as Record<string, unknown>;
  return text(arms[locale]) ?? text(arms.en) ?? Object.values(arms).map(text).find(Boolean) ?? null;
}

export function toContribution(kind: ContributionKind, row: Record<string, unknown>, locale: string): Contribution | null {
  const id = idOf(row.id);
  if (!id) return null;
  const raw = text(row.moderationStatus);
  const status: ContributionStatus = raw && STATUSES.has(raw as ContributionStatus) ? (raw as ContributionStatus) : "pending";
  const slug = text(row.slug);
  return {
    id,
    kind,
    title: pickTitle(row.title, locale),
    status,
    reviewNotes: text(row.reviewNotes),
    date: text(row.submittedAt) ?? text(row.createdAt),
    href: status === "approved" && slug ? outputDetailHref(kind, slug) : null,
    editHref: status === "pending" || status === "revision" ? EDIT[kind](id) : null,
    adminHref: `/admin/collections/${COLLECTION[kind]}/${id}`,
  };
}

/** An unsent case-study draft (`caseStudyDrafts`). */
export function draftToContribution(row: Record<string, unknown>, locale: string): Contribution | null {
  const id = idOf(row.id);
  if (!id) return null;
  return {
    id,
    kind: "caseStudy",
    title: pickTitle(row.title, locale),
    status: "draft",
    reviewNotes: null,
    date: text(row.lastSaved) ?? text(row.updatedAt),
    href: null,
    editHref: `/research-and-action/case-studies/submit?draft=${encodeURIComponent(id)}`,
    adminHref: `/admin/collections/caseStudyDrafts/${id}`,
  };
}

/** Sections in the order of what needs doing; newest first inside each; empty sections left out. */
export function groupContributions(items: Contribution[]): Array<{ status: ContributionStatus; items: Contribution[] }> {
  return SECTION_ORDER.map((status) => ({
    status,
    items: items.filter((i) => i.status === status).sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")),
  })).filter((g) => g.items.length > 0);
}

export function countByStatus(items: Contribution[]): Record<ContributionStatus, number> {
  const out: Record<ContributionStatus, number> = { draft: 0, pending: 0, revision: 0, approved: 0, rejected: 0 };
  for (const i of items) out[i.status] += 1;
  return out;
}

export function countByKind(items: Contribution[]): Record<ContributionKind, number> {
  const out: Record<ContributionKind, number> = { caseStudy: 0, livedExperience: 0, researchOutput: 0, event: 0 };
  for (const i of items) out[i.kind] += 1;
  return out;
}
