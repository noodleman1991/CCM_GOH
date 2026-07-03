"use client";

import { useTranslations } from "next-intl";
import {
  AlignHorizontalDistributeCenter,
  AlignStartVertical,
  AlignEndVertical,
  Rows3,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ImagePlacement = "full" | "wide" | "start" | "end" | "center";

const PLACEMENTS: { value: ImagePlacement; icon: typeof Rows3 }[] = [
  { value: "full", icon: Rows3 },
  { value: "start", icon: AlignStartVertical },
  { value: "end", icon: AlignEndVertical },
  { value: "center", icon: AlignHorizontalDistributeCenter },
];

/**
 * Dark floating block toolbar ("CCM midnight" pattern from the redesign
 * mockups) — shown above a selected block node (currently: image) to set
 * placement and delete the block. 44px hit targets, RTL-safe (icons use
 * inline-start/end semantics via the `start`/`end` placement values, which
 * the renderer already mirrors in RTL).
 */
export function BlockToolbar({
  placement,
  onPlacementChangeAction,
  onDeleteAction,
  className,
}: {
  placement: ImagePlacement;
  onPlacementChangeAction: (placement: ImagePlacement) => void;
  onDeleteAction: () => void;
  className?: string;
}) {
  const t = useTranslations("editor");

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg bg-ccm-midnight p-1 shadow-lg",
        className
      )}
      role="toolbar"
      aria-label={t("toolbar.label")}
    >
      {PLACEMENTS.map(({ value, icon: Icon }) => (
        <button
          key={value}
          type="button"
          aria-label={t(`toolbar.placement.${value}`)}
          aria-pressed={placement === value}
          onClick={() => onPlacementChangeAction(value)}
          className={cn(
            "flex size-11 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white",
            placement === value && "bg-white/20 text-white"
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </button>
      ))}
      <div className="mx-0.5 h-6 w-px bg-white/20" aria-hidden="true" />
      <button
        type="button"
        aria-label={t("toolbar.delete")}
        onClick={onDeleteAction}
        className="flex size-11 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-red-500/80 hover:text-white"
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
