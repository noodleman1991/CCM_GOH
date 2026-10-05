"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowRight, User } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useBrowserTimeZone } from "@/components/events/local-when";
import type { ProfileStep } from "@/lib/profile/next-step";

/** Time of day in the visitor's own zone; "welcome" until the browser says which zone that is. */
function partOfDay(timeZone: string | null): "morning" | "afternoon" | "evening" | "welcome" {
  if (!timeZone) return "welcome";
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone, hour: "numeric", hourCycle: "h23" }).format(new Date()));
  return hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
}

/**
 * The dashboard header (dashboard spec D2): a greeting, the profile's
 * strength as a small ring, and the one next step that would improve it —
 * instead of a percentage bar and two Edit buttons.
 */
export function DashboardGreeting({
  name,
  image,
  percent,
  step,
  profileHref,
}: {
  name: string;
  image: string | null;
  percent: number;
  step: ProfileStep;
  profileHref: string | null;
}) {
  const t = useTranslations("dashboard");
  const zone = useBrowserTimeZone();
  const r = 18;
  const circumference = 2 * Math.PI * r;
  const filled = Math.max(0, Math.min(100, percent));

  return (
    <header className="flex flex-col gap-4 @content-md/page:flex-row @content-md/page:items-center @content-md/page:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <span className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-ccm-sky/25 ring-4 ring-white">
          {image ? <Image src={image} alt="" fill className="object-cover" sizes="64px" /> : <User className="size-8 text-ccm-sea" aria-hidden />}
        </span>
        <h1 className="font-heading text-2xl font-bold text-ccm-midnight @content-md/page:text-3xl">
          <bdi>{t(`greeting.${partOfDay(zone)}`, { name })}</bdi>
        </h1>
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-ccm-midnight/10 bg-white px-3 py-2">
        <svg viewBox="0 0 44 44" className="size-11 shrink-0 -rotate-90" role="img" aria-label={t("greeting.strength", { percent: filled })}>
          <circle cx="22" cy="22" r={r} fill="none" strokeWidth="5" className="stroke-ccm-sky/30" />
          <circle cx="22" cy="22" r={r} fill="none" strokeWidth="5" strokeLinecap="round" className="stroke-ccm-sea" strokeDasharray={`${(filled / 100) * circumference} ${circumference}`} />
        </svg>
        {step ? (
          <Link href={step.href} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-ccm-midnight hover:underline">
            {t(`nextStep.${step.key}`)}
            <ArrowRight className="size-4 shrink-0 rtl:-scale-x-100" aria-hidden />
          </Link>
        ) : (
          <span className="flex flex-wrap items-center gap-x-2 text-sm text-ccm-midnight">
            {t("greeting.done")}
            {profileHref && (
              <Link href={profileHref} className="inline-flex min-h-11 items-center font-bold text-ccm-sea hover:underline">
                {t("greeting.viewProfile")}
              </Link>
            )}
          </span>
        )}
      </div>
    </header>
  );
}
