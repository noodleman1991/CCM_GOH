/** Editorial masonry rhythm for the case-studies gallery (WIREFRAMES §4.11).
 *  Position 0 leads as a "feature"; every 4th card after the lead becomes a
 *  full-width "wide" split (only once the gallery is big enough to carry it);
 *  everything else is a standard card. Deterministic: same inputs → same
 *  layout, so server and client renders always agree. */
export type GalleryVariant = "feature" | "wide" | "classic";

export function assignGalleryVariant(index: number, total: number): GalleryVariant {
  if (index === 0) return "feature";
  if (total > 4 && (index - 1) % 4 === 3) return "wide";
  return "classic";
}

/** Column span per variant in the 6-col masonry grid: feature spans 2/3,
 *  wide spans full width, classic takes a normal 3-up slot. */
export function spanForVariant(variant: GalleryVariant): string {
  if (variant === "feature") return "sm:col-span-2 lg:col-span-4";
  if (variant === "wide") return "sm:col-span-2 lg:col-span-6";
  return "sm:col-span-1 lg:col-span-2";
}
