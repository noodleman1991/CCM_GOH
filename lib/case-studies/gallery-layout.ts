/** Editorial masonry rhythm for the case-studies gallery (WIREFRAMES §4.11).
 *  Position 0 leads as a full-width "feature"; after every six standard cards
 *  comes a full-width "wide" split (only once the gallery is big enough);
 *  everything else is a standard card. Deterministic: same inputs → same
 *  layout, so server and client renders always agree. */
export type GalleryVariant = "feature" | "wide" | "classic";

export function assignGalleryVariant(index: number, total: number): GalleryVariant {
  if (index === 0) return "feature";
  // After every six standard cards: six fill whole rows of two and of three.
  if (total > 7 && (index - 1) % 7 === 6) return "wide";
  return "classic";
}

/** Column span per variant in the gallery's two-column grid: feature spans 2/3,
 *  wide spans full width, classic sits two to a row so titles show in full
 *  on three lines (user, 2026-10-03). */
export function spanForVariant(variant: GalleryVariant): string {
  if (variant === "feature") return "@content-md/page:col-span-2";
  if (variant === "wide") return "@content-md/page:col-span-2";
  // Two to a row (by the content area's width, not the window's — the sidebar
  // takes 290px), so a 100-character title fits its three lines.
  return "col-span-1";
}
