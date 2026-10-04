import type { ContributionStatus } from "@/lib/contributions/model";

/** One set of status colours for every list of member content. */
export const STATUS_TONE: Record<ContributionStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-ccm-amber/15 text-ccm-midnight",
  revision: "bg-ccm-sea/10 text-ccm-sea",
  approved: "bg-emerald-100 text-emerald-900",
  rejected: "bg-muted text-muted-foreground",
};
