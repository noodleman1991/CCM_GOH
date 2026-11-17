"use client";

import * as React from "react";

/**
 * Unified scroll-triggered entrance for page-builder blocks: a gentle fade + rise
 * as each block scrolls into view. Wraps every block from the dispatcher so the
 * effect is consistent across ALL block types.
 *
 * Only blocks that are still entirely BELOW the viewport at hydration take part.
 * Server HTML is painted long before hydration — seconds on a phone — so the
 * old "hide everything, then fade the visible ones back in" made every block
 * already on screen vanish and reappear: the mobile page-load flicker. A block
 * the visitor can already see is left alone; one below the fold is hidden while
 * offscreen (invisible to the visitor) and revealed as it scrolls in.
 *
 * Render-stable: the observer is one-shot — once revealed we never flip back to
 * hidden, so a parent re-render / filter change / locale switch never replays it.
 *
 * Reduced-motion / SSR / no-JS: content renders fully visible; nothing is ever
 * gated behind the animation.
 */
export function BlockReveal({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  // SSR/no-JS default: visible (never gate content behind the animation).
  const [revealed, setRevealed] = React.useState(true);

  // Layout effect: decide before the hydrated frame paints, so a block we hide
  // is never shown-then-hidden.
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver === "undefined") return;

    // Any part already on screen (or above it) → it has been seen; keep it.
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    setRevealed(false);
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      // Fire the moment any pixel enters. A positive threshold / negative
      // margin left tall blocks (most of them on a phone) as a blank band at
      // the bottom of the screen before the fade started — a pop-in flicker.
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-revealed={revealed}
      className="motion-safe:transition-[opacity,translate] motion-safe:duration-[350ms] motion-safe:ease-out data-[revealed=false]:translate-y-3 data-[revealed=false]:opacity-0"
    >
      {children}
    </div>
  );
}

export default BlockReveal;
