"use client";

import { useTranslations } from "next-intl";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STYLES = ["hr", "readMore", "section", "chapter"] as const;

const PREVIEW: Record<(typeof STYLES)[number], string> = {
  hr: "—",
  readMore: "···",
  section: "§",
  chapter: "※",
};

/** Tiptap NodeView for the section-break block: a style picker (hr/readMore/section/chapter). */
export function BreakView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const t = useTranslations("editor");
  const style = (node.attrs.style as (typeof STYLES)[number]) || "hr";

  return (
    <NodeViewWrapper
      className={cn(
        "group relative my-4 flex items-center justify-center gap-3 rounded-lg border border-dashed p-3",
        selected && "border-ccm-water ring-2 ring-ccm-water/40"
      )}
      data-drag-handle
    >
      <span className="text-lg text-muted-foreground" aria-hidden="true">
        {PREVIEW[style]}
      </span>
      <div role="radiogroup" aria-label={t("break.styleLabel")} className="inline-flex gap-1">
        {STYLES.map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={style === value}
            onClick={() => updateAttributes({ style: value })}
            className={cn(
              "flex min-h-[36px] items-center rounded-full border px-3 text-xs font-medium transition-colors",
              style === value
                ? "border-ccm-water bg-ccm-water text-white"
                : "border-border bg-background text-muted-foreground hover:bg-muted"
            )}
          >
            {t(`break.style.${value}`)}
          </button>
        ))}
      </div>
      <button
        type="button"
        aria-label={t("toolbar.delete")}
        onClick={() => deleteNode()}
        className="flex size-11 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
    </NodeViewWrapper>
  );
}
