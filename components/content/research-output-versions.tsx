"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Download, FileText } from "lucide-react";
import { FilterChip } from "@/components/ui/filter-chip";
import { Card } from "@/components/ui/card";

type Version = {
  _key: string;
  kind: string;
  lang: string;
  label?: string;
  pages?: number;
  fileUrl?: string;
  fileName?: string;
};

const LANG_LABEL: Record<string, string> = { en: "EN", es: "ES", fr: "FR", ar: "AR" };

/**
 * Version × language switcher for a research output's documents (SANITY_SCHEMA §4).
 * Chips pick a version; the panel shows its download (file) — the public face of
 * the Documents tab. Mirrors the EmbedPDF-ready download flow.
 */
export function ResearchOutputVersions({ versions }: { versions: Version[] }) {
  const t = useTranslations("researchOutputs");
  const usable = (versions || []).filter((v) => v.fileUrl);
  const [activeKey, setActiveKey] = useState(usable[0]?._key);

  const active = useMemo(() => usable.find((v) => v._key === activeKey) || usable[0], [usable, activeKey]);
  if (usable.length === 0) return null;

  const labelFor = (v: Version) =>
    v.label || `${v.kind.charAt(0).toUpperCase() + v.kind.slice(1)} (${LANG_LABEL[v.lang] || v.lang.toUpperCase()})`;

  return (
    <Card className="space-y-4 p-5">
      <h3 className="font-heading text-lg font-semibold text-ccm-midnight">{t("documents")}</h3>

      {usable.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {usable.map((v) => (
            <FilterChip key={v._key} label={labelFor(v)} active={active?._key === v._key} onClick={() => setActiveKey(v._key)} />
          ))}
        </div>
      )}

      {active && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/20 p-4">
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="size-5 shrink-0 text-ccm-sea" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ccm-midnight">{labelFor(active)}</p>
              <p className="text-xs text-muted-foreground">
                {active.fileName || active.kind}
                {active.pages ? ` · ${active.pages} ${t("pages")}` : ""}
              </p>
            </div>
          </div>
          <a
            href={active.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Download className="size-4" />
            {t("download")}
          </a>
        </div>
      )}
    </Card>
  );
}
