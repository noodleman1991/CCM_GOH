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
    const elements = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    // Track which headings are in view; the topmost visible one is "active".
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        }
        // Pick the first item (in document order) that's currently visible.
        const firstVisible = items.find((i) => visible.has(i.id));
        if (firstVisible) setActiveId(firstVisible.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: [0, 1] }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  if (items.length < 2) return null;

  return (
    <aside className="hidden xl:block">
      <div className="sticky top-20">
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ccm-water">
          <ListTree className="size-4" />
          {t("onThisPage")}
        </p>
        <nav className="space-y-1 border-s ps-3">
          {items.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={cn(
                "block text-sm leading-snug transition-colors",
                item.level === 3 && "ps-3",
                item.id === activeId
                  ? "font-medium text-ccm-sea"
                  : "text-muted-foreground hover:text-foreground"
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
