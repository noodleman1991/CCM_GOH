"use client";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { PAGE_QUERY_RESULT } from "@/sanity.types";

type Block = NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];
type TimelineRow = Extract<Block, { _type: "timeline-row" }>;
type Timeline1 = NonNullable<NonNullable<TimelineRow["timelines"]>>[number];

interface Timeline1Props extends Timeline1 {
  locale?: string;
}

export default function Timeline1({
  title,
  tagLine,
  body,
  locale = "en",
}: Timeline1Props) {
  const ref = useRef(null);
  const isInView = useInView(ref);

  // Entrance (fade/rise) is handled once by the shared BlockReveal wrapper;
  // the timeline keeps only its internal rail-dot fill animation.
  return (
    <div ref={ref} className="relative border-s-2 ps-12 lg:ps-28 py-8">
      <motion.div
        className="absolute w-8 h-8 rounded-full top-[3.5rem] lg:top-[3.75rem] start-[-1.1rem] border-8"
        initial={{
          backgroundColor: "hsl(var(--background))",
          opacity: 0.3,
        }}
        animate={
          isInView && {
            backgroundColor: "hsl(var(--muted-foreground))",
            opacity: 1,
          }
        }
        transition={{
          duration: 1,
          ease: "easeInOut",
          delay: 0.6,
        }}
      />
      <div>
        <h3 className="flex justify-between items-center font-semibold mb-4">
          <span>{title}</span>
          <span>{tagLine}</span>
        </h3>
        {body && <PortableTextRenderer value={body} locale={locale} />}
      </div>
    </div>
  );
}
