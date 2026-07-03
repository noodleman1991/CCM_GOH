"use client";

import { useState, useEffect, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { followTarget, unfollowTarget, isFollowing as isFollowingAction } from "@/lib/actions/follows";

type FollowTargetType = "REGION" | "THEME" | "PROJECT";

/**
 * One-click follow toggle for a region / theme / project. Optimistic: flips
 * immediately, reverts + toasts on failure.
 *
 * `initialFollowing` may be passed when the host can resolve it on the server.
 * On ISR/statically-cached pages (where per-user state must NOT be baked in),
 * omit it and the button resolves its own state on mount via `isFollowing`.
 */
export function FollowButton({
  targetType,
  targetId,
  initialFollowing,
  size = "sm",
  className,
  followLabel,
  followingLabel,
}: {
  targetType: FollowTargetType;
  targetId: string;
  initialFollowing?: boolean;
  size?: "sm" | "default";
  className?: string;
  /** Optional context-specific label (e.g. "Follow this region"); defaults to the shared "Follow". */
  followLabel?: string;
  /** Optional label for the followed state; defaults to the shared "Following". */
  followingLabel?: string;
}) {
  const t = useTranslations("follow");
  const [following, setFollowing] = useState(initialFollowing ?? false);
  const [pending, startTransition] = useTransition();

  // Self-resolve initial state when the host didn't provide it (ISR-safe).
  useEffect(() => {
    if (initialFollowing !== undefined) return;
    let active = true;
    isFollowingAction({ targetType, targetId }).then((v) => {
      if (active) setFollowing(v);
    });
    return () => {
      active = false;
    };
  }, [initialFollowing, targetType, targetId]);

  const toggle = () => {
    const next = !following;
    setFollowing(next); // optimistic
    startTransition(async () => {
      const res = next
        ? await followTarget({ targetType, targetId })
        : await unfollowTarget({ targetType, targetId });
      if (!res.ok) {
        setFollowing(!next); // revert
        toast.error(res.error);
      }
    });
  };

  return (
    <Button
      type="button"
      size={size}
      variant={following ? "secondary" : "outline"}
      onClick={toggle}
      disabled={pending}
      aria-pressed={following}
      className={cn("gap-1.5", className)}
    >
      {following ? <Check className="size-4" /> : <Plus className="size-4" />}
      {following ? followingLabel ?? t("following") : followLabel ?? t("follow")}
    </Button>
  );
}
