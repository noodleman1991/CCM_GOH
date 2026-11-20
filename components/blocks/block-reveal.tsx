import * as React from "react";

/**
 * Unified entrance for page-builder blocks: a gentle fade + rise as each block
 * scrolls in. Wraps every block from the dispatcher so the effect is consistent
 * across ALL block types.
 *
 * Pure CSS (`.block-reveal` in app/globals.css), driven by a scroll-linked
 * `animation-timeline: view()`. It used to be JS — hide on hydration, show when
 * an IntersectionObserver fired — and on iPhones that observer sometimes never
 * fired, so whole sections stayed invisible while scrolling (the 2026-11-18
 * "page disappears / flickers on mobile" recording). A scroll-linked animation
 * can't get stuck: its state is a pure function of where the block is, and a
 * block on screen is always fully visible.
 *
 * Only desktop-class pointers (hover + ≥768px) with motion allowed and browser
 * support get the effect; phones, reduced-motion and older browsers render the
 * block plainly. Nothing is ever hidden by JavaScript.
 */
export function BlockReveal({ children }: { children: React.ReactNode }) {
  return <div className="block-reveal">{children}</div>;
}

export default BlockReveal;
