"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TurnstileWidget } from "@/components/comments/turnstile-widget";
import { revealContactEmail, type RevealResult } from "@/lib/actions/reveal-contact-email";

/**
 * A member's email, kept out of the page (user, 2026-10-05): a click shows a
 * Cloudflare Turnstile check, and only a passed check fetches the address.
 * Stops scrapers harvesting emails from profiles.
 */
export function RevealEmail({ profileUserId, className }: { profileUserId: string; className?: string }) {
  const t = useTranslations("profile.revealEmail");
  const [step, setStep] = useState<"idle" | "checking" | "shown" | "failed">("idle");
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<Exclude<RevealResult, { ok: true }>["error"] | null>(null);
  const [pending, start] = useTransition();

  const onToken = (token: string | null) => {
    if (!token) return;
    start(async () => {
      const res = await revealContactEmail({ profileUserId, token });
      if (res.ok) {
        setEmail(res.email);
        setStep("shown");
      } else {
        setError(res.error);
        setStep("failed");
      }
    });
  };

  if (step === "shown" && email) {
    return (
      <a href={`mailto:${email}`} dir="ltr" className={className ?? "inline-flex min-h-11 items-center gap-1.5 font-semibold text-ccm-sea underline underline-offset-2"}>
        {email}
      </a>
    );
  }
  if (step === "failed") {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        {t(`errors.${error ?? "notShared"}`)}
      </p>
    );
  }
  if (step === "checking") {
    return (
      <div className="space-y-1" aria-busy={pending}>
        <p className="text-xs text-muted-foreground">{t("checking")}</p>
        <TurnstileWidget onToken={onToken} />
      </div>
    );
  }
  return (
    <Button type="button" variant="outline" size="sm" className="min-h-11 gap-1.5" onClick={() => setStep("checking")}>
      <Mail className="size-4" aria-hidden />
      {t("show")}
    </Button>
  );
}
