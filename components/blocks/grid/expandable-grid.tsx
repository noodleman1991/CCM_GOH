"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpandableGridProps {
  children: React.ReactNode[];
  initialDisplayCount?: number;
  gridClassName?: string;
  locale: string;
  isRTL?: boolean;
  // Required: resolved by the server parent (grid-row) via next-intl so this
  // client component never depends on NextIntlClientProvider context.
  expandLabel: string;
  collapseLabel: string;
}

export function ExpandableGrid({
  children,
  initialDisplayCount,
  gridClassName = "grid-cols-3",
  locale,
  isRTL = false,
  expandLabel,
  collapseLabel,
}: ExpandableGridProps) {
  // ✅ HYDRATION FIX: Initial state is false (collapsed)
  const [isExpanded, setIsExpanded] = useState(false);

  const shouldShowExpandButton =
    initialDisplayCount && initialDisplayCount < children.length;

  const displayedItems =
    shouldShowExpandButton && !isExpanded
      ? children.slice(0, initialDisplayCount)
      : children;

  return (
    <div>
      {/* Grid */}
      <div className={cn("grid gap-6", gridClassName)}>{displayedItems}</div>

      {/* Expand/Collapse Button */}
      {shouldShowExpandButton && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "inline-flex items-center gap-2 rounded-md border border-input bg-background px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
              isRTL && "flex-row-reverse"
            )}
            aria-expanded={isExpanded}
          >
            <span>{isExpanded ? collapseLabel : expandLabel}</span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
