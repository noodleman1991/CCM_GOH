"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { AlertTriangle } from "lucide-react";
import { BlockToolbar, type ImagePlacement } from "../block-toolbar";
import { cn } from "@/lib/utils";

const PLACEMENT_CLASS: Record<string, string> = {
  full: "mx-auto w-full",
  start: "me-auto w-1/2 sm:w-2/5",
  end: "ms-auto w-1/2 sm:w-2/5",
  center: "mx-auto w-2/3",
};

/** Tiptap NodeView for the image block: preview + caption/alt inputs + the dark floating toolbar for placement/delete. */
export function ImageView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const t = useTranslations("editor");
  const { src, alt, caption, placement } = node.attrs as {
    src: string;
    alt: string;
    caption: string;
    placement: ImagePlacement;
  };
  const [showAltWarning, setShowAltWarning] = useState(false);

  return (
    <NodeViewWrapper className="my-4" data-drag-handle>
      <figure className={cn("group relative", PLACEMENT_CLASS[placement] || PLACEMENT_CLASS.full)}>
        {selected && (
          <div className="absolute -top-14 start-0 z-10">
            <BlockToolbar
              placement={placement}
              onPlacementChangeAction={(next) => updateAttributes({ placement: next })}
              onDeleteAction={() => deleteNode()}
            />
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element -- editor preview, not the public render path */}
        <img
          src={src}
          alt={alt || ""}
          className={cn(
            "w-full rounded-xl border",
            selected ? "border-ccm-water ring-2 ring-ccm-water/40" : "border-transparent"
          )}
        />
        <div className="mt-2 space-y-1.5">
          <label className="block">
            <span className="sr-only">{t("image.altLabel")}</span>
            <input
              type="text"
              value={alt || ""}
              onChange={(e) => updateAttributes({ alt: e.target.value })}
              onBlur={() => setShowAltWarning(!alt)}
              placeholder={t("image.altPlaceholder")}
              className="w-full min-h-[44px] rounded-md border bg-background px-3 text-sm"
            />
          </label>
          {showAltWarning && !alt && (
            <p className="flex items-center gap-1.5 text-xs text-amber-600">
              <AlertTriangle className="size-3.5 flex-shrink-0" aria-hidden="true" />
              {t("image.altRequiredHint")}
            </p>
          )}
          <label className="block">
            <span className="sr-only">{t("image.captionLabel")}</span>
            <input
              type="text"
              value={caption || ""}
              onChange={(e) => updateAttributes({ caption: e.target.value })}
              placeholder={t("image.captionPlaceholder")}
              className="w-full min-h-[44px] rounded-md border bg-background px-3 text-sm italic text-muted-foreground"
            />
          </label>
        </div>
      </figure>
    </NodeViewWrapper>
  );
}
