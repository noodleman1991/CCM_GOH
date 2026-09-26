"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * The live counter under a capped input (Slice 13a). Pair it with
 * `maxLength={LIMITS.…}` on the input so the number it shows is the number
 * the browser enforces and the server checks. Turns clay at 90% and
 * destructive at the cap; announced politely for screen readers.
 */
export function CharCounter({
  value,
  max,
  className,
}: {
  value: string | null | undefined;
  max: number;
  className?: string;
}) {
  const t = useTranslations("common");
  const count = (value ?? "").length;
  const ratio = max > 0 ? count / max : 0;
  return (
    <p
      aria-live="polite"
      className={cn(
        "mt-1 text-end text-xs tabular-nums",
        ratio >= 1 ? "text-destructive" : ratio >= 0.9 ? "text-ccm-clay" : "text-muted-foreground",
        className,
      )}
    >
      <span aria-hidden="true">{t("charCount", { count, max })}</span>
      <span className="sr-only">{t("charCountSr", { count, max })}</span>
    </p>
  );
}
