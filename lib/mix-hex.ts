/**
 * Mix two #rrggbb colours in sRGB: `weight` (0–1) of `a`, the rest `b` — the
 * same result as CSS `color-mix(in srgb, a weight%, b)`.
 *
 * Use this instead of color-mix() in INLINE styles and SVG attributes. Tailwind
 * classes carry an @supports fallback, but an inline value has none: on iPhones
 * whose Safari predates color-mix (iOS < 16.2) the declaration is dropped and
 * the element paints with no colour at all (blank white card covers / maps,
 * 2026-11-18). Non-hex input passes `a` through unchanged.
 */
export function mixHex(a: string, b: string, weight: number): string {
  const ca = parseHex(a);
  const cb = parseHex(b);
  if (!ca || !cb) return a;
  const w = Math.min(1, Math.max(0, weight));
  return `rgb(${ca.map((v, i) => Math.round(v * w + cb[i] * (1 - w))).join(", ")})`;
}

function parseHex(hex: string): number[] | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  return m ? [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)) : null;
}
