/**
 * The homepage's `livedExperiences` slot (payload/blocks/carousel-2.ts,
 * "Lived Experiences Stories") is a hand-picked `testimonial` list, and it is
 * empty on all four language documents — 0 of 4 instances ever had a
 * testimonial picked (see carousel-2.ts's own comment: "the homepage's
 * testimonial carousel currently renders with zero cards"). Homepage.tsx
 * rendered `Carousel2` unconditionally whenever the slot existed, so the
 * section showed its heading over an empty carousel.
 *
 * Controller ruling (2026-09-27): when no items are hand-picked, the section
 * falls back to the latest published LIVED EXPERIENCES — the same automatic
 * feed `components/blocks/carousel/lived-experiences-carousel-block.tsx`
 * already fetches for the regional community template — keeping the slot's
 * own heading/copy. An editor's hand-picked testimonials still win outright
 * (today's behaviour, unchanged). With no lived experiences at all, the
 * section is hidden rather than rendering an empty carousel.
 */
import { getLivedExperiencesCarousel, type LivedExperienceCarouselItem } from "@/lib/content/lived-experiences";
import { getLocalizedField, type SupportedLocale } from "@/lib/localization-utils";
import type { SectionPadding } from "@/components/ui/section-container";

/** A field that carries either a plain string or a `{en, es, fr, ar}` map. */
export type LocalizedText = string | Record<string, string> | null | undefined;

export interface LivedExperiencesSlot {
  title?: LocalizedText;
  description?: LocalizedText;
  padding?: SectionPadding | null;
  testimonial?: unknown[] | null;
}

export interface AutoLivedExperiencesSection {
  title?: string;
  subtitle?: string;
  padding?: SectionPadding | null;
  experiences: LivedExperienceCarouselItem[];
  maxItems: number;
  locale: string;
}

/** The automatic fallback shows the latest ~8 published lived experiences. */
export const AUTO_LIVED_EXPERIENCES_LIMIT = 8;

export type LivedExperiencesResolution<T extends LivedExperiencesSlot> =
  | { mode: "manual"; section: T }
  | { mode: "auto"; section: AutoLivedExperiencesSection }
  | { mode: "hidden" };

/**
 * Pure: decides whether the hand-picked testimonials render, the automatic
 * fallback renders, or the section is hidden outright — never an empty
 * carousel.
 */
export function resolveLivedExperiencesMode(
  testimonialCount: number,
  autoExperienceCount: number,
): "manual" | "auto" | "hidden" {
  if (testimonialCount > 0) return "manual";
  if (autoExperienceCount > 0) return "auto";
  return "hidden";
}

/**
 * Resolves the homepage's `livedExperiences` slot into what to render.
 *
 * Generic over the caller's own slot type (Carousel2's props, in practice) so
 * the "manual" branch — an unmodified pass-through of today's behaviour —
 * keeps its original, richer type instead of widening to the generic
 * {@link LivedExperiencesSlot}.
 *
 * `getLivedExperiencesCarousel` already degrades to `[]` on any read failure
 * (`lib/content/lived-experiences.ts` wraps it in `safe()`), so no manual
 * catch is needed here — a failed automatic fetch simply hides the section,
 * same as "no lived experiences at all".
 */
export async function resolveLivedExperiencesSection<T extends LivedExperiencesSlot>(
  section: T | null | undefined,
  locale: string,
): Promise<LivedExperiencesResolution<T>> {
  if (!section) return { mode: "hidden" };

  const testimonialCount = section.testimonial?.length ?? 0;
  if (testimonialCount > 0) return { mode: "manual", section };

  const experiences = await getLivedExperiencesCarousel({ maxItems: AUTO_LIVED_EXPERIENCES_LIMIT });
  if (resolveLivedExperiencesMode(testimonialCount, experiences.length) === "hidden") {
    return { mode: "hidden" };
  }

  const supportedLocale = (locale || "en") as SupportedLocale;
  return {
    mode: "auto",
    section: {
      title: getLocalizedField<string>(section.title as never, supportedLocale, undefined),
      subtitle: getLocalizedField<string>(section.description as never, supportedLocale, undefined),
      padding: section.padding,
      experiences,
      maxItems: AUTO_LIVED_EXPERIENCES_LIMIT,
      locale,
    },
  };
}
