"use client";

import * as React from "react";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Pin, PinOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleRecentWorkHidden, setRecentWorkPinned } from "@/lib/actions/recent-work";

/**
 * Owner-only quick controls on a Recent Work item (shown only on your own
 * profile): hide it from visitors, or pin it to the top. Optimistic-ish via a
 * router.refresh() after the server action.
 */
export function RecentWorkOwnerControls({
  id,
  hidden,
  pinned,
}: {
  id: string;
  hidden: boolean;
  pinned: boolean;
}) {
  const t = useTranslations("profile.recentWork");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } catch {
        /* surfaced via the unchanged UI; no-op */
      }
    });

  const btn = "inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50";

  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <button
        type="button"
        disabled={isPending}
        onClick={() => run(() => setRecentWorkPinned(id, !pinned))}
        aria-pressed={pinned}
        aria-label={pinned ? t("unpin") : t("pin")}
        title={pinned ? t("unpin") : t("pin")}
        className={cn(btn, pinned && "text-ccm-sea")}
      >
        {pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => run(() => toggleRecentWorkHidden(id))}
        aria-pressed={hidden}
        aria-label={hidden ? t("show") : t("hide")}
        title={hidden ? t("show") : t("hide")}
        className={cn(btn, hidden && "text-ccm-amber")}
      >
        {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export default RecentWorkOwnerControls;
