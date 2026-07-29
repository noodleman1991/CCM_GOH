"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type SpineSection = {
  id: string;
  label: string;
  count?: number;
};

/**
 * Sticky anchor spine for long region/profile pages (Gate-2 §regional):
 * line-tab visual grammar (quiet labels on a hairline, active carries the
 * ccm-water bar), but these are ANCHORS on one scrollable page — clicking
 * jumps to the section, scroll-spy highlights the section in view. The page
 * never swaps content. RTL-safe, scrolls horizontally on small screens, and
 * the active tab keeps itself scrolled into view.
 */
export function RegionSectionSpine({
  sections,
  className,
}: {
  sections: SpineSection[];
  className?: string;
}) {
  const [active, setActive] = useState<string | null>(sections[0]?.id ?? null);
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const targets = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (targets.length === 0) return;

    // Spy line sits 35% down the viewport: the section crossing it is "in
    // view" — steadier than intersection ratios for tall, uneven sections.
    const pick = () => {
      const line = window.innerHeight * 0.35;
      let current: string | null = targets[0]?.id ?? null;
      for (const el of targets) {
        if (el.getBoundingClientRect().top <= line) current = el.id;
      }
      setActive(current);
    };
    pick();
    window.addEventListener("scroll", pick, { passive: true });
    window.addEventListener("resize", pick);
    return () => {
      window.removeEventListener("scroll", pick);
      window.removeEventListener("resize", pick);
    };
  }, [sections]);

  // Keep the active anchor visible when the spine itself overflows on mobile.
  // Scrolls ONLY the nav's own horizontal overflow — scrollIntoView here would
  // also scroll the window (it walks every scrollable ancestor), which fought
  // the user's scroll position on every spy update.
  useEffect(() => {
    const nav = navRef.current;
    if (!active || !nav) return;
    const el = nav.querySelector<HTMLElement>(`[data-spine-id="${active}"]`);
    if (!el) return;
    const start = el.offsetLeft;
    const end = start + el.offsetWidth;
    if (start < nav.scrollLeft) nav.scrollLeft = start - 8;
    else if (end > nav.scrollLeft + nav.clientWidth) nav.scrollLeft = end - nav.clientWidth + 8;
  }, [active]);

  return (
    <nav
      ref={navRef}
      aria-label={sections.map((s) => s.label).join(" · ")}
      className={cn(
        "sticky top-0 z-20 -mb-px flex gap-0.5 overflow-x-auto border-b-[1.5px] border-border",
        "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {sections.map((s) => {
        const isActive = active === s.id;
        return (
          <a
            key={s.id}
            href={`#${s.id}`}
            data-spine-id={s.id}
            onClick={(e) => {
              // Scroll ourselves: letting the hash click through triggers a
              // Next soft navigation that re-suspends the section boundaries
              // (page collapses to fallbacks and the jump strands). Manual
              // scrollIntoView + replaceState keeps the URL shareable with
              // zero router involvement.
              e.preventDefault();
              const el = document.getElementById(s.id);
              if (!el) return;
              el.scrollIntoView({ behavior: "smooth", block: "start" });
              window.history.replaceState(null, "", `#${s.id}`);
            }}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "relative inline-flex flex-none items-center gap-1.5 whitespace-nowrap px-4 pb-2.5 pt-2",
              "font-heading text-sm font-medium text-muted-foreground no-underline",
              "hover:text-[var(--color-ccm-midnight)]",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ccm-water)]",
              "after:absolute after:inset-x-3.5 after:-bottom-[1.5px] after:h-[3px] after:origin-center",
              "after:scale-x-0 after:rounded-t-full after:bg-[var(--color-ccm-water)]",
              "after:transition-transform after:duration-200 motion-reduce:after:transition-none",
              isActive && "font-bold text-[var(--color-ccm-midnight)] after:scale-x-100"
            )}
          >
            {s.label}
            {typeof s.count === "number" && (
              <span className="rounded-full bg-[var(--color-ccm-sky)]/25 px-1.5 py-px text-[10.5px] font-bold tabular-nums text-[var(--color-ccm-sea)]">
                {s.count}
              </span>
            )}
          </a>
        );
      })}
    </nav>
  );
}
