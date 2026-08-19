"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { OUTPUT_TYPES, outputDetailHref } from "@/lib/collaboration/outputs";
import { addOutput, removeOutput } from "@/lib/actions/workspace-outputs";

type Output = { id: string; sanityId: string; sanityType: string; title: string; status: string; slug: string | null };

const STATUS_BADGE: Record<string, { key: string; cls: string }> = {
  draft: { key: "statusDraft", cls: "bg-muted text-muted-foreground" },
  pending: { key: "statusPending", cls: "bg-[#fde9c8] text-[#92610a]" },
  revision: { key: "statusRevision", cls: "bg-[#fde9c8] text-[#92610a]" },
  approved: { key: "statusApproved", cls: "bg-[#d7f0dc] text-[#1d7a36]" },
};

export default function WorkspaceOutputs({
  outputs,
  collaborationId,
  canEdit,
}: {
  outputs: Output[];
  collaborationId: string;
  canEdit: boolean;
}) {
  const t = useTranslations("outputs");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [adding, setAdding] = useState(false);
  // Two-click removal (matches the members/threads pattern — no blocking
  // confirm dialog) + optimistic hide instead of a full page reload.
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [gone, setGone] = useState<Set<string>>(new Set());

  // Case studies and lived experiences have real submit flows — creating
  // there (with ?workspace=) produces actual content that links back here.
  const SUBMIT_ROUTES: Record<string, string> = {
    caseStudy: "/research-and-action/case-studies/submit",
    livedExperience: "/lived-experiences/submit",
    event: "/collaborate/events/new",
    researchOutput: "/research-and-action/research-outputs/submit",
  };

  const create = (sanityType: string) => {
    const submitRoute = SUBMIT_ROUTES[sanityType];
    if (submitRoute) {
      router.push(`${submitRoute}?workspace=${collaborationId}`);
      return;
    }
    start(async () => {
      const res = await addOutput({ collaborationId, sanityType, mode: "create", title: "Untitled" });
      if (res.ok) {
        setAdding(false);
        router.refresh();
      } else toast.error(res.error);
    });
  };
  const remove = (outputId: string) => {
    if (confirmRemove !== outputId) {
      setConfirmRemove(outputId);
      return;
    }
    setConfirmRemove(null);
    start(async () => {
      const res = await removeOutput({ collaborationId, outputId });
      if (res.ok) {
        setGone((g) => new Set(g).add(outputId));
        router.refresh();
      } else toast.error(res.error);
    });
  };

  return (
    <div className="space-y-5">
      <SectionHeader title={t("title")} subtitle={t("subtitle")} />

      {outputs.length === 0 && !adding && (
        <Card className="p-6 text-sm text-muted-foreground">{t("empty")}</Card>
      )}

      {outputs.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {outputs.filter((o) => !gone.has(o.id)).map((o) => {
            const def = OUTPUT_TYPES.find((d) => d.type === o.sanityType);
            const badge = STATUS_BADGE[o.status] ?? STATUS_BADGE.draft;
            const published = o.status === "approved" && !!o.slug;
            return (
              <Card key={o.id} className="space-y-2 p-4">
                <span className="inline-block rounded-full bg-ccm-sky/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ccm-sea">
                  {def?.label ?? o.sanityType}
                </span>
                {published ? (
                  <Link
                    href={outputDetailHref(o.sanityType, o.slug!)}
                    className="block font-medium text-ccm-midnight underline-offset-2 hover:underline"
                  >
                    <bdi>{o.title}</bdi>
                  </Link>
                ) : (
                  <p className="font-medium text-ccm-midnight">
                    <bdi>{o.title}</bdi>
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.cls}`}>{t(badge.key)}</span>
                  {canEdit && (
                    <button
                      onClick={() => remove(o.id)}
                      onBlur={() => setConfirmRemove((c) => (c === o.id ? null : c))}
                      disabled={pending}
                      className={
                        confirmRemove === o.id
                          ? "text-xs font-semibold text-destructive"
                          : "text-xs text-muted-foreground hover:text-destructive"
                      }
                    >
                      {confirmRemove === o.id ? t("removeArmed") : t("remove")}
                    </button>
                  )}
                </div>
                {!published &&
                  (canEdit && SUBMIT_ROUTES[o.sanityType] ? (
                    <Link
                      href={`${SUBMIT_ROUTES[o.sanityType]}?edit=${o.sanityId}&workspace=${collaborationId}`}
                      className="text-xs font-bold text-ccm-sea underline-offset-2 hover:underline"
                    >
                      {t("continueEditing")}
                    </Link>
                  ) : (
                    <p className="text-xs text-muted-foreground">{t("pendingHint")}</p>
                  ))}
              </Card>
            );
          })}
        </div>
      )}

      {canEdit &&
        (adding ? (
          <Card className="space-y-3 p-4">
            <p className="text-sm font-medium text-ccm-midnight">{t("pickType")}</p>
            <div className="flex flex-wrap gap-2">
              {OUTPUT_TYPES.map((d) => (
                <Button key={d.type} size="sm" variant="outline" disabled={pending} onClick={() => create(d.type)}>
                  {d.label}
                </Button>
              ))}
            </div>
          </Card>
        ) : (
          <Button size="sm" onClick={() => setAdding(true)}>
            {t("addOutput")}
          </Button>
        ))}
    </div>
  );
}
