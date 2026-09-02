/**
 * Content types owned by the application, not by the CMS.
 *
 * Nothing here imports from sanity.types.ts or @sanity/*. That is the point:
 * when the backend changes in Phase 3, these definitions stay put and only
 * lib/content/internal/ is rewritten.
 */

export type Locale = "en" | "es" | "fr" | "ar";

export const LOCALES: readonly Locale[] = ["en", "es", "fr", "ar"] as const;
export const DEFAULT_LOCALE: Locale = "en";

/** A value translated into some subset of the supported locales. */
export type Localized<T = string> = Partial<Record<Locale, T>>;

/**
 * A rich-text body. Portable Text today, Lexical after Phase 3 — callers must
 * treat it as opaque and hand it to a renderer rather than walking it.
 */
export type RichText = unknown[];

export interface ContentImage {
  url: string;
  alt?: string;
  caption?: string;
}

export interface ContentTag {
  id: string;
  label: Localized;
  value?: string;
  color?: string;
}

export interface ContentRegion {
  id: string;
  name: Localized;
  slug: string;
}

export interface ContentFile {
  url: string;
  filename: string;
  bytes?: number;
}

/** Every content type the app indexes, links to, or comments on. */
export type ContentKind =
  | "caseStudy"
  | "livedExperience"
  | "researchOutput"
  | "newsPost"
  | "agenda"
  | "event";

/** One Algolia record. Each domain module produces these for its own kind. */
export interface SearchRecord {
  objectID: string;
  kind: ContentKind;
  title: string;
  excerpt?: string;
  url: string;
  locale: Locale;
}

/** Resolve a localized value, falling back to English then to any present value. */
export function localize(value: Localized | string | undefined, locale: Locale): string {
  if (typeof value === "string") return value;
  if (!value) return "";
  return value[locale] ?? value[DEFAULT_LOCALE] ?? Object.values(value)[0] ?? "";
}
