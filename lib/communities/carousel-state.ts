/**
 * The Community carousel's motion rules (regions-and-partners spec §3.3). Pure.
 * Hover and a hidden tab pause it for a while; keyboard focus or the visitor
 * using the controls stops it for good; reduced motion never moves.
 */
export type PauseReason = "hover" | "hidden" | "focus" | "touched";
const STICKY: ReadonlySet<PauseReason> = new Set(["focus", "touched"]);

export interface CarouselState {
  index: number;
  count: number;
  paused: ReadonlySet<PauseReason>;
  reduced: boolean;
}

export type CarouselAction =
  | { type: "tick" }
  | { type: "next" }
  | { type: "prev" }
  | { type: "goto"; index: number }
  | { type: "pause"; reason: PauseReason }
  | { type: "resume"; reason: PauseReason }
  | { type: "setReduced"; reduced: boolean };

export function initialCarousel(count: number, reduced: boolean): CarouselState {
  return { index: 0, count, paused: new Set(), reduced };
}

export function shouldAdvance(s: CarouselState): boolean {
  return !s.reduced && s.count > 1 && s.paused.size === 0;
}

const wrap = (i: number, n: number) => (n > 0 ? ((i % n) + n) % n : 0);
const touched = (s: CarouselState) => new Set([...s.paused, "touched" as const]);

export function carouselReducer(s: CarouselState, a: CarouselAction): CarouselState {
  switch (a.type) {
    case "tick":
      return shouldAdvance(s) ? { ...s, index: wrap(s.index + 1, s.count) } : s;
    case "next":
      return { ...s, index: wrap(s.index + 1, s.count), paused: touched(s) };
    case "prev":
      return { ...s, index: wrap(s.index - 1, s.count), paused: touched(s) };
    case "goto":
      return { ...s, index: wrap(a.index, s.count), paused: touched(s) };
    case "pause":
      return s.paused.has(a.reason) ? s : { ...s, paused: new Set([...s.paused, a.reason]) };
    case "resume": {
      if (STICKY.has(a.reason) || !s.paused.has(a.reason)) return s;
      const paused = new Set(s.paused);
      paused.delete(a.reason);
      return { ...s, paused };
    }
    case "setReduced":
      return { ...s, reduced: a.reduced };
  }
}
