"use client";

import { useState, useEffect, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { setRsvp, clearRsvp, myRsvp } from "@/lib/actions/rsvp";

/**
 * RSVP toggle for an event. GOING ⇄ none, optimistic, reverts + toasts on
 * failure. Self-resolves the current status on mount (ISR-safe) when
 * `initialGoing` isn't provided.
 */
export function RsvpButton({
  eventId,
  initialGoing,
  size = "sm",
  className,
}: {
  eventId: string;
  initialGoing?: boolean;
  size?: "sm" | "default";
  className?: string;
}) {
  const t = useTranslations("events");
  const [going, setGoing] = useState(initialGoing ?? false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (initialGoing !== undefined) return;
    let active = true;
    myRsvp(eventId).then((s) => {
      if (active) setGoing(s === "GOING");
    });
    return () => {
      active = false;
    };
  }, [initialGoing, eventId]);

  const toggle = () => {
    const next = !going;
    setGoing(next);
    startTransition(async () => {
      const res = next ? await setRsvp(eventId, "GOING") : await clearRsvp(eventId);
      if (!res.ok) {
        setGoing(!next);
        toast.error(res.error);
      }
    });
  };

  return (
    <Button
      type="button"
      size={size}
      variant={going ? "secondary" : "outline"}
      onClick={toggle}
      disabled={pending}
      aria-pressed={going}
      className={cn("gap-1.5", className)}
    >
      {going ? <Check className="size-4" /> : <CalendarPlus className="size-4" />}
      {going ? t("going") : t("rsvp")}
    </Button>
  );
}
