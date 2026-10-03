"use client";

import { useEffect, useState, type CSSProperties } from "react";

const FADE = 22;

/** The mask for a scrolling chip row: a fade only on an edge that hides chips. */
export function edgeFadeStyle(edges: { start: boolean; end: boolean; rtl: boolean }): CSSProperties | undefined {
  if (!edges.start && !edges.end) return undefined;
  const gradient = `linear-gradient(${edges.rtl ? "to left" : "to right"}, ${edges.start ? "transparent" : "#000"}, #000 ${edges.start ? FADE : 0}px, #000 calc(100% - ${edges.end ? FADE : 0}px), ${edges.end ? "transparent" : "#000"})`;
  return { maskImage: gradient, WebkitMaskImage: gradient };
}

/**
 * A sideways-scrolling chip row fades the edge where more chips are hidden —
 * the end until it's scrolled there, the start once it has moved — and
 * nothing when everything fits (2026-10-03: a fixed fade dimmed the last chip
 * of rows that just fit, e.g. in Spanish, and the first chip in Arabic).
 */
export function useEdgeFade<T extends HTMLElement>() {
  // A callback ref (state), so the row is measured again if it remounts.
  const [el, attach] = useState<T | null>(null);
  const [edges, setEdges] = useState({ start: false, end: false, rtl: false });

  useEffect(() => {
    if (!el) return;
    const update = () => {
      const rtl = getComputedStyle(el).direction === "rtl";
      const max = el.scrollWidth - el.clientWidth;
      // In right-to-left rows scrollLeft runs from 0 down to -max.
      const at = Math.abs(el.scrollLeft);
      const start = max > 1 && at > 1;
      const end = max > 1 && at < max - 1;
      setEdges((e) => (e.start === start && e.end === end && e.rtl === rtl ? e : { start, end, rtl }));
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    // Older browsers (and test DOMs) without ResizeObserver still get the scroll updates.
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    resize?.observe(el);
    // Chips added or removed ("+N more") change what's hidden without resizing the row.
    const mutations = new MutationObserver(update);
    mutations.observe(el, { childList: true, subtree: true, characterData: true });
    return () => {
      el.removeEventListener("scroll", update);
      resize?.disconnect();
      mutations.disconnect();
    };
  }, [el]);

  return { attach, style: edgeFadeStyle(edges) };
}
