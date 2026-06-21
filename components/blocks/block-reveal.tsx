"use client";

import * as React from "react";

/**
 * Unified scroll-triggered entrance for page-builder blocks: a gentle fade + rise
 * as each block scrolls into view. Wraps every block from the dispatcher so the
 * effect is consistent across ALL block types (not just heroes).
 *
 * Render-stable by design — the key fix for the "re-fires on re-render" problem:
 * once revealed, the element stays revealed (the observer disconnects and we never
 * flip back to hidden), so a parent re-render / filter change / locale switch does
 * not replay or flash the animation.
 *
 * Reduced-motion safe: users with prefers-reduced-motion (and any non-JS/SSR
 * render) see the block fully visible immediately — content is never gated behind
 * the animation.
 */
export function BlockReveal({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  // Start visible so SSR + reduced-motion + no-JS never hide content. JS flips it
  // to hidden-then-reveal only when motion is allowed.
  const [revealed, setRevealed] = React.useState(true);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return; // stay visible, no animation

    // Already in/near the viewport on mount? Reveal without hiding first to avoid
    // a flash for above-the-fold blocks.
    const rect = el.getBoundingClientRect();
    const inViewOnMount = rect.top < window.innerHeight * 0.9;
    if (inViewOnMount) return;

    setRevealed(false);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            observer.disconnect(); // one-shot — never re-hide / re-fire
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-revealed={revealed}
      className="motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-out data-[revealed=false]:translate-y-3 data-[revealed=false]:opacity-0"
    >
      {children}
    </div>
  );
}

export default BlockReveal;
