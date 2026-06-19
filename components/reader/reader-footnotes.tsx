"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ListOrdered } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { Footnote } from "@/lib/portable-text-headings";

/**
 * Footnotes for a chapter, in a collapsible section. Each note is anchored
 * (#footnote-N) so the in-text superscript [N] jumps here; a back-link returns
 * to the reference. Text is small, wraps, and never overflows the container.
 */
export function ReaderFootnotes({ footnotes }: { footnotes: Footnote[] }) {
  const t = useTranslations("reader");
  const [open, setOpen] = useState(false);
  if (footnotes.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mt-12 border-t pt-6">
      <CollapsibleTrigger className="flex w-full items-center gap-2 text-start text-sm font-semibold uppercase tracking-wider text-ccm-water">
        <ListOrdered className="size-4 shrink-0" />
        <span>{t("footnotes")} ({footnotes.length})</span>
        <ChevronDown
          className={cn("ms-auto size-4 shrink-0 transition-transform", open && "rotate-180")}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ol className="mt-4 space-y-2">
          {footnotes.map((fn) => (
            <li
              key={fn.key}
              id={`footnote-${fn.number}`}
              className="scroll-mt-24 flex gap-2 text-xs leading-relaxed text-muted-foreground"
            >
              <a
                href={`#footnote-ref-${fn.number}`}
                className="shrink-0 font-medium text-ccm-water hover:text-ccm-sea no-underline tabular-nums"
                aria-label={`Back to reference ${fn.number}`}
              >
                {fn.number}.
              </a>
              {/* min-w-0 + break-words keep long URLs/citations inside the box. */}
              <span className="min-w-0 break-words"><bdi>{fn.text}</bdi></span>
            </li>
          ))}
        </ol>
      </CollapsibleContent>
    </Collapsible>
  );
}
