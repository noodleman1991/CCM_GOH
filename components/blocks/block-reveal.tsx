"use client";

import * as React from "react";

/**
 * Unified scroll-triggered entrance for page-builder blocks: a gentle fade + rise
 * as each block enters (or, for above-the-fold blocks, on mount). Wraps every
 * block from the dispatcher so the effect is consistent across ALL block types.
 *
 * Render-stable (the "re-fires on re-render" fix): reveal is tracked in a ref and
 * the observer is one-shot — once revealed we never flip back to hidden, so a
 * parent re-render / filter change / locale switch never replays or flashes it.
 *
 * Reduced-motion / SSR / no-JS: content renders fully visible immediately; the
 * hidden→reveal only happens when JS runs and motion is allowed.
 */
export function BlockReveal({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  // SSR/no-JS default: visible (never gate content behind the animation).
  const [revealed, setRevealed] = React.useState(true);

  // On the client with motion allowed, flip to hidden BEFORE paint (layout
  // effect) so there's no flash of the final state, then reveal.
  React.useLayoutEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return; // stay visible, no animation
    setRevealed(false);
  }, []);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    // Above the fold on mount → reveal on the next frame (animates in on load).
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92) {
      const id = requestAnimationFrame(() => setRevealed(true));
      return () => cancelAnimationFrame(id);
    }

    // Below the fold → reveal when scrolled into view (one-shot).
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-revealed={revealed}
      className="motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-out data-[revealed=false]:translate-y-4 data-[revealed=false]:opacity-0"
    >
      {children}
    </div>
  );
}

export default BlockReveal;
