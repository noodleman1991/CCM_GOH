"use client";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { cn } from "@/lib/utils";
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import type { PortableTextBlock } from "@portabletext/types";

/** Fields one split-cards-list entry carries. Exported so split-cards-list.tsx
 *  (the array owner) can type its `list` prop against the same shape rather
 *  than redeclaring it. */
export interface SplitCardItemFields {
  tagLine?: string | null;
  title?: string | null;
  body?: PortableTextBlock[] | null;
}

interface SplitCardsItemProps extends SplitCardItemFields {
  locale?: string;
}

export default function SplitCardsItem({
  tagLine,
  title,
  body,
  locale = "en",
}: SplitCardsItemProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    amount: 1,
  });

  return (
    <motion.div
      ref={ref}
      className={cn(
        "flex flex-col items-start border border-primary rounded-3xl px-6 @content-lg/page:px-8 py-6 @content-lg/page:py-8 transition-colors duration-1000 ease-in-out",
        isInView ? "bg-foreground/85" : "bg-background"
      )}
    >
      {tagLine && (
        <div
          className={cn(
            "font-bold text-2xl @content-lg/page:text-3xl transition-colors duration-1000 ease-in-out",
            isInView ? "text-background" : "text-foreground"
          )}
        >
          {tagLine}
        </div>
      )}
      {title && (
        <div
          className={cn(
            "my-2 font-semibold text-xl transition-colors duration-1000 ease-in-out",
            isInView ? "text-background" : "text-foreground"
          )}
        >
          {title}
        </div>
      )}
      {body && (
        <div
          className={cn(
            "transition-colors duration-1000 ease-in-out",
            isInView ? "text-background" : "text-foreground"
          )}
        >
          <PortableTextRenderer value={body} locale={locale} />
        </div>
      )}
    </motion.div>
  );
}
