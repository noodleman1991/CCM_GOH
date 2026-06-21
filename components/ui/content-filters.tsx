"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/filter-chip";
import { cn } from "@/lib/utils";
import { ChevronDown, X, Search } from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
  /** Selected values for this group. */
  selected: string[];
  /** Toggle one value in this group (multi-select). */
  onToggle: (value: string) => void;
}

/**
 * One shared content-filter bar used across case studies, news and lived
 * experiences (collaborate-style). Collapsed by default: each group is a pill
 * trigger with a count badge that expands to multi-select option pills. Optional
 * search box + a clear-all. Keeps every listing page's filtering consistent.
 */
export function ContentFilters({
  groups,
  search,
  onClearAll,
  className,
}: {
  groups: FilterGroup[];
  /** Optional search field. */
  search?: { value: string; onChange: (v: string) => void; placeholder?: string };
  onClearAll: () => void;
  className?: string;
}) {
  const t = useTranslations("common");
  const [openGroup, setOpenGroup] = React.useState<string | null>(null);
  const toggleGroup = (id: string) => setOpenGroup((prev) => (prev === id ? null : id));

  const activeCount = groups.reduce((sum, g) => sum + g.selected.length, 0);
  const open = groups.find((g) => g.id === openGroup);

  return (
    <div className={cn("w-full space-y-3", className)}>
      {search && (
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            placeholder={search.placeholder}
            className="h-11 w-full rounded-full border border-input bg-background ps-10 pe-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {search.value && (
            <button
              type="button"
              onClick={() => search.onChange("")}
              aria-label={t("clear")}
              className="absolute end-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      )}

      {/* Collapsed group triggers */}
      <div className="flex flex-wrap items-center gap-2">
        {groups.map((group) => {
          const count = group.selected.length;
          const isOpen = openGroup === group.id;
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => toggleGroup(group.id)}
              aria-expanded={isOpen}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                count > 0
                  ? "border-ccm-sea/40 bg-ccm-sea/10 text-ccm-sea"
                  : "border-border bg-background text-foreground/80 hover:bg-muted"
              )}
            >
              <span>{group.label}</span>
              {count > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ccm-sea px-1.5 text-xs font-semibold text-white">
                  {count}
                </span>
              )}
              <ChevronDown className={cn("size-4 transition-transform", isOpen && "rotate-180")} />
            </button>
          );
        })}

        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-9 text-muted-foreground hover:text-foreground"
          >
            <X className="me-1.5 size-4" />
            {t("clearFilters")}
          </Button>
        )}
      </div>

      {/* Expanded options for the open group */}
      {open && (
        <div className="rounded-xl border bg-muted/30 p-3">
          <div className="flex flex-wrap gap-2">
            {open.options.map((opt) => (
              <FilterChip
                key={opt.value}
                label={opt.label}
                active={open.selected.includes(opt.value)}
                onClick={() => open.onToggle(opt.value)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ContentFilters;
