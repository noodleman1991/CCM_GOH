import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A member's search term echoed back into copy ("Results for …"). A single
 * unbroken 300-character token cannot be truncated without hiding what was
 * searched, so it wraps anywhere instead; `bdi` keeps a Latin term inside an
 * Arabic sentence (and the reverse) in its own direction (Slice 13b).
 */
export function QueryEcho({ children, className }: { children: ReactNode; className?: string }) {
  return <bdi className={cn("break-words [overflow-wrap:anywhere]", className)}>{children}</bdi>;
}
