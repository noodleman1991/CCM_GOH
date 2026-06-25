"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { OUTPUT_TYPES } from "@/lib/collaboration/outputs";

type Output = { id: string; sanityType: string; title: string; status: string };
type Stage = { id: string; title: string; tasks: { status: string }[] };
type Activity = { kind: string; summary: string; at: string };

const STATUS_BADGE: Record<string, { key: string; cls: string }> = {
  draft: { key: "statusDraft", cls: "bg-muted text-muted-foreground" },
  pending: { key: "statusPending", cls: "bg-[#fde9c8] text-[#92610a]" },
  revision: { key: "statusRevision", cls: "bg-[#fde9c8] text-[#92610a]" },
  approved: { key: "statusApproved", cls: "bg-[#d7f0dc] text-[#1d7a36]" },
};

export default function WorkspaceHome({
  outputs,
  planStages,
  activity,
  memberCount,
  onGoToTab,
}: {
  outputs: Output[];
  planStages: Stage[];
  activity: Activity[];
  memberCount: number;
  onGoToTab: (tab: string) => void;
}) {
  const t = useTranslations("outputs");
  const tCollab = useTranslations("collaboration");
  const allTasks = planStages.flatMap((s) => s.tasks);
  const done = allTasks.filter((x) => x.status === "DONE").length;
  const total = allTasks.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-8">
      <section>
        <SectionHeader title={t("title")} subtitle={t("subtitle")} />
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {outputs.map((o) => {
            const def = OUTPUT_TYPES.find((d) => d.type === o.sanityType);
            const badge = STATUS_BADGE[o.status] ?? STATUS_BADGE.draft;
            return (
              <Card key={o.id} className="space-y-2 p-4">
                <span className="inline-block rounded-full bg-ccm-sky/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ccm-sea">
                  {def?.label ?? o.sanityType}
                </span>
                <p className="font-medium text-ccm-midnight">{o.title}</p>
                <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.cls}`}>
                  {t(badge.key)}
                </span>
              </Card>
            );
          })}
          <button
            onClick={() => onGoToTab("outputs")}
            className="flex items-center justify-center rounded-lg border border-dashed border-ccm-sea/40 p-4 text-sm font-semibold text-ccm-sea"
          >
            + {t("addOutput")}
          </button>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section>
          <SectionHeader title={`${tCollab("nav.plan")} · ${done}/${total}`} />
          <div className="mt-2 h-2 overflow-hidden rounded bg-muted">
            <div className="h-full bg-ccm-sea" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-3 space-y-1 text-sm">
            {planStages.length === 0 ? (
              <p className="text-muted-foreground">—</p>
            ) : (
              planStages.map((s) => {
                const d = s.tasks.filter((x) => x.status === "DONE").length;
                return (
                  <div key={s.id} className="flex justify-between border-b py-1 text-muted-foreground">
                    <span>{s.title}</span>
                    <span>
                      {d}/{s.tasks.length}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section>
          <SectionHeader title={tCollab("nav.overview")} />
          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
            {activity.length === 0 ? (
              <p>—</p>
            ) : (
              activity.map((a, i) => (
                <div key={i} className="border-b py-1">
                  {a.summary}
                </div>
              ))
            )}
          </div>
          <button onClick={() => onGoToTab("members")} className="mt-4 text-sm text-ccm-sea">
            {memberCount} {tCollab("nav.members")} →
          </button>
        </section>
      </div>
    </div>
  );
}
