"use client";

import { useTranslations } from "next-intl";
import { OUTPUT_TYPES } from "@/lib/collaboration/outputs";

/** Status → pill classes. Kept identical to the prior inline map so this is a
 *  pure refactor (no visual change); centralized so Home + Outputs share it
 *  instead of each re-declaring the raw color literals. */
const STATUS_PILL: Record<string, { key: string; cls: string }> = {
  draft: { key: "statusDraft", cls: "bg-muted text-muted-foreground" },
  pending: { key: "statusPending", cls: "bg-[#fde9c8] text-[#92610a]" },
  revision: { key: "statusRevision", cls: "bg-[#fde9c8] text-[#92610a]" },
  approved: { key: "statusApproved", cls: "bg-[#d7f0dc] text-[#1d7a36]" },
};

/** The uppercase output-type chip (case study / lived experience / research output). */
export function OutputTypeChip({ type }: { type: string }) {
  const def = OUTPUT_TYPES.find((d) => d.type === type);
  return (
    <span className="inline-block rounded-full bg-ccm-sky/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ccm-sea">
      {def?.label ?? type}
    </span>
  );
}

/** The colored review-status pill for a workspace output. */
export function OutputStatusPill({ status }: { status: string }) {
  const t = useTranslations("outputs");
  const badge = STATUS_PILL[status] ?? STATUS_PILL.draft;
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.cls}`}>
      {t(badge.key)}
    </span>
  );
}
