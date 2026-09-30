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
  /**
   * The tag's stable slug — a flat string, in both stores.
   *
   * Phase-2 obligation 4, settled here because Payload now models the field:
   * Sanity stores `value` as a slug OBJECT (`{_type:"slug", current:"…"}`),
   * Payload as a flat `text` column holding what Sanity called `value.current`.
   * The flat string is what this type has always promised and what Payload
   * always returns, so the declaration stands as written; `getTags()` projects
   * `value.current` on the Sanity side and reads the column on the Payload
   * side, and both hand back a string.
   *
   * It is not yet true of every path that *produces* a `ContentTag`. Three
   * GROQ projections still bind a bare `value` inside `tags[]->{…}` and feed
   * the result to `toTag()`, so on the Sanity backend they populate this field
   * with the slug object:
   *
   *   - `lib/content/lived-experiences.ts` (`tags[]->` and its `allTags`
   *     aggregate) — the only one that reaches `ContentTag` — Task 9
   *   - `lib/content/news.ts:189` — declared honestly as
   *     `NewsPostTag.value: {current: string}`, not as a `ContentTag` — Task 10
   *   - `lib/content/outputs.ts:181` — declared as `AgendaTag.value?: string`,
   *     which is the same lie in a different type — Task 11
   *
   * Those three flatten with their own module's swap. Note what the compiler
   * cannot do for us here: each of them asserts its raw row shape through
   * `query<T>`'s caller-supplied generic (and, in lived-experiences, an
   * explicit `as RawTag[]`), and a GROQ result is unchecked, so no declaration
   * on this interface — or on `RawTag` — can turn the mismatch into a type
   * error. Only the swap fixes it; the type only says what is true afterwards.
   */
  value?: string;
  color?: string;
  /** The tag's kind (topic, impact, audience, location, method), when the reader includes it. */
  category?: string | null;
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
