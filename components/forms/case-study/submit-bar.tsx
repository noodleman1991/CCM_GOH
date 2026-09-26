"use client";

import { useTranslations } from "next-intl";
import { Check, CloudOff, Eye, Loader2, Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DraftState } from "@/components/forms/case-study/use-case-study-draft";

/** "Saved · 12:04", "Saving…" or the failure line — always visible in "What's left". */
export function DraftStatusLine({ state, savedAt, locale }: { state: DraftState; savedAt: Date | null; locale: string }) {
  const t = useTranslations("caseStudySubmission.draft");
  const time = savedAt?.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  return (
    <p className="flex min-w-0 items-start gap-1.5" aria-live="polite">
      {state === "saving" ? (
        <>
          <Loader2 className="mt-0.5 size-3.5 shrink-0 animate-spin" aria-hidden />
          <span>{t("saving")}</span>
        </>
      ) : state === "error" ? (
        <>
          <CloudOff className="mt-0.5 size-3.5 shrink-0 text-ccm-amber" aria-hidden />
          <span>{t("error")}</span>
        </>
      ) : state === "saved" && time ? (
        <>
          <Check className="mt-0.5 size-3.5 shrink-0 text-green-600" aria-hidden />
          <span>{t("savedAt", { time })}</span>
        </>
      ) : (
        <span>{t("idle")}</span>
      )}
    </p>
  );
}

/** Save draft · Preview · Submit for review (icons only on phones, so the bottom bar fits). Submit is never
 *  disabled: pressing it shows what's missing instead. */
export function SubmitActions({
  isSubmitting,
  disabled = false,
  onSaveDraft,
  onPreview,
  onSubmit,
}: {
  isSubmitting: boolean;
  /** While the saved draft is still loading. */
  disabled?: boolean;
  onSaveDraft: () => void;
  onPreview: () => void;
  onSubmit: () => void;
}) {
  const t = useTranslations("caseStudySubmission.bar");
  return (
    <>
      <Button type="button" variant="ghost" className="min-h-11 min-w-11" onClick={onSaveDraft} disabled={disabled} aria-label={t("saveDraft")}>
        <Save className="size-4 sm:me-2" aria-hidden />
        <span className="hidden sm:inline">{t("saveDraft")}</span>
      </Button>
      <Button type="button" variant="outline" className="min-h-11 min-w-11" onClick={onPreview} disabled={disabled} aria-label={t("preview")}>
        <Eye className="size-4 sm:me-2" aria-hidden />
        <span className="hidden sm:inline">{t("preview")}</span>
      </Button>
      <Button type="button" className="min-h-11" onClick={onSubmit} disabled={disabled || isSubmitting}>
        {isSubmitting ? <Loader2 className="me-2 size-4 animate-spin" aria-hidden /> : <Send className="me-2 size-4" aria-hidden />}
        {isSubmitting ? t("submitting") : t("submit")}
      </Button>
    </>
  );
}
