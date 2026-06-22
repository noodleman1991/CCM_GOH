"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { followTarget, unfollowTarget } from "@/lib/actions/follows";

type FollowTargetType = "REGION" | "THEME" | "PROJECT";

/**
 * One-click follow toggle for a region / theme / project. Optimistic: flips
 * immediately, reverts + toasts on failure. `initialFollowing` is resolved on
 * the server (via `isFollowing`) so the first paint is correct.
 */
export function FollowButton({
  targetType,
  targetId,
  initialFollowing,
  size = "sm",
  className,
}: {
  targetType: FollowTargetType;
  targetId: string;
  initialFollowing: boolean;
  size?: "sm" | "default";
  className?: string;
}) {
  const t = useTranslations("follow");
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();

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
      {following ? t("following") : t("follow")}
    </Button>
  );
}
