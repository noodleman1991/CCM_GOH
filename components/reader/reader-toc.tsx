"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ListTree } from "lucide-react";
import type { TocItem } from "@/lib/portable-text-headings";

/**
 * "On this page" table of contents for the reader. Extracts nothing itself —
 * it's given the chapter's heading outline (server-computed via extractToc) and
 * tracks the active heading with IntersectionObserver (scroll-spy), the same
 * pattern used elsewhere in the app. Hidden when a chapter has < 2 headings.
 */
export function ReaderToc({ items }: { items: TocItem[] }) {
  const t = useTranslations("reader");
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    if (items.length === 0) return;
    const ids = items.map((i) => i.id);

    // Recompute the active section from scroll position. The active heading is
    // the LAST one whose top has crossed a line ~96px below the viewport top —
    // so the highlight stays put while reading a long section (no flicker, no
    // "nothing active" gap between headings). Falls back to the first heading
    // when scrolled above everything.
    const compute = () => {
      const trigger = 96;
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top - trigger <= 0) current = id;
        else break;
      }
      setActiveId((prev) => (prev === current ? prev : current));
    };

    compute();
    window.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
    };
  }, [items]);

  if (items.length < 2) return null;

  return (
    <aside className="hidden xl:block">
      {/* Sticky, viewport-bounded so a long outline scrolls within itself. */}
      <div className="sticky top-20 max-h-[calc(100dvh-7rem)] overflow-y-auto pb-4">
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ccm-water">
          <ListTree className="size-4" />
          {t("onThisPage")}
        </p>
        <nav className="space-y-px">
          {items.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={cn(
                // Active item gets an accent inline-start border + color.
                "block border-s-2 py-1 text-sm leading-snug transition-colors",
                item.level === 3 ? "ps-6" : "ps-3",
                item.id === activeId
                  ? "border-ccm-sea font-medium text-ccm-sea"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
              )}
            >
              <bdi>{item.text}</bdi>
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
}
