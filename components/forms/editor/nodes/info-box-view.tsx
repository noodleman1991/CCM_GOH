"use client";

import { useTranslations } from "next-intl";
import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from "@tiptap/react";
import { Info, AlertTriangle, CheckCircle2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const VARIANTS = [
  { value: "info", icon: Info, wrapClass: "bg-ccm-sky/10 border-ccm-water" },
  { value: "warning", icon: AlertTriangle, wrapClass: "bg-red-50 dark:bg-red-900/30 border-red-500" },
  { value: "success", icon: CheckCircle2, wrapClass: "bg-ccm-sea/10 border-ccm-sea" },
] as const;

/** Tiptap NodeView for the info box block: variant pills + nested editable content. */
export function InfoBoxView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const t = useTranslations("editor");
  const variant = (node.attrs.variant as string) || "info";
  const active = VARIANTS.find((v) => v.value === variant) || VARIANTS[0];

  return (
    <NodeViewWrapper
      className={cn(
        "group relative my-4 rounded-lg border-s-4 p-4",
        active.wrapClass,
        selected && "ring-2 ring-ccm-water/40"
      )}
      data-drag-handle
    >
      <div className="mb-2 flex items-center justify-between gap-2" contentEditable={false}>
        <div role="radiogroup" aria-label={t("infoBox.variantLabel")} className="inline-flex gap-1">
          {VARIANTS.map(({ value, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={variant === value}
              onClick={() => updateAttributes({ variant: value })}
              className={cn(
                "flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors",
                variant === value
                  ? "border-ccm-water bg-ccm-water text-white"
                  : "border-border bg-background text-muted-foreground hover:bg-muted"
              )}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              {t(`infoBox.variant.${value}`)}
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
      </div>
      <NodeViewContent className="prose prose-sm max-w-none [&>p]:mb-0" />
    </NodeViewWrapper>
  );
}
