"use client";

import { useTranslations } from "next-intl";
import { CircleDashed, MessageSquareQuote } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Edit-mode review context (X7 tail): when a submission is reopened, tell the
 * author where it sits in the pipeline and show the editor's notes when
 * changes were asked for. Shared by all four submission forms.
 */
export function ReviewContext({
  status,
  reviewNotes,
}: {
  status: string | null | undefined;
  reviewNotes?: string | null;
}) {
  const t = useTranslations("editorReview");
  const st = status === "revision" || status === "pending" ? status : "draft";

  return (
    <section
      className={cn(
        "rounded-xl border p-4",
        st === "revision" ? "border-ccm-amber/50 bg-ccm-amber/10" : "border-ccm-sky/50 bg-ccm-sky/10"
      )}
    >
      <div className="flex items-center gap-2">
        <CircleDashed className="size-4 shrink-0 text-ccm-midnight/70" aria-hidden />
        <p className="text-sm font-bold text-ccm-midnight">{t(`status.${st}`)}</p>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{t(`hint.${st}`)}</p>
      {st === "revision" && reviewNotes && (
        <blockquote className="mt-3 flex items-start gap-2 rounded-lg bg-white/70 p-3 text-sm leading-relaxed text-foreground/90">
          <MessageSquareQuote className="mt-0.5 size-4 shrink-0 text-ccm-amber" aria-hidden />
          <span className="whitespace-pre-wrap">
            <bdi>{reviewNotes}</bdi>
          </span>
        </blockquote>
      )}
    </section>
  );
}
