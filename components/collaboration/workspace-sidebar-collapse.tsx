"use client";

import { useEffect } from "react";
import { useSidebar } from "@/components/ui/sidebar";

/**
 * Route-scoped: collapses the global app sidebar to an icon rail while a
 * workspace is open, and restores the previous open/closed state on exit.
 * Mounted only by the collaboration detail page, so the effect is bounded to
 * that route's lifecycle — it never mutates global state that outlives the page.
 * Pairs with app-sidebar's route-derived `collapsible="icon"`.
 */
export function WorkspaceSidebarCollapse() {
  const { setOpen, open, isMobile } = useSidebar();
  useEffect(() => {
    if (isMobile) return; // mobile uses a drawer; nothing to collapse.
    const prev = open;
    setOpen(false);
    return () => setOpen(prev);
    // Intentionally run once on mount/unmount: capture the entry state, restore
    // it on exit. Re-running on `open` changes would fight the user toggling it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
