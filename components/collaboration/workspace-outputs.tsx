"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { OUTPUT_TYPES } from "@/lib/collaboration/outputs";
import { addOutput, removeOutput } from "@/lib/actions/workspace-outputs";
import { OutputStatusPill, OutputTypeChip } from "./workspace-output-chip";

type Output = { id: string; sanityId: string; sanityType: string; title: string; status: string };

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
  const [pending, start] = useTransition();
  const [adding, setAdding] = useState(false);

  const create = (sanityType: string) => {
    start(async () => {
      const res = await addOutput({ collaborationId, sanityType, mode: "create", title: "Untitled" });
      if (res.ok) {
        setAdding(false);
        location.reload();
      } else toast.error(res.error);
    });
  };
  const remove = (outputId: string) => {
    if (!confirm(t("removeConfirm"))) return;
    start(async () => {
      const res = await removeOutput({ collaborationId, outputId });
      if (res.ok) location.reload();
      else toast.error(res.error);
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
          {outputs.map((o) => {
            return (
              <Card key={o.id} className="space-y-2 p-4">
                <OutputTypeChip type={o.sanityType} />
                <p className="font-medium text-ccm-midnight">{o.title}</p>
                <div className="flex items-center justify-between">
                  <OutputStatusPill status={o.status} />
                  {canEdit && (
                    <button
                      onClick={() => remove(o.id)}
                      disabled={pending}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      {t("remove")}
                    </button>
                  )}
                </div>
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
