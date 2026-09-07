/**
 * Task 10c: the display-text helper.
 *
 * Eleven block components used to import `stegaClean` from `next-sanity`
 * directly — a display-only concern (stripping Sanity's invisible
 * click-to-edit metadata from rendered strings) that nonetheless coupled each
 * component to the CMS for no structural reason. `cleanText` is the
 * seam-routed replacement, and this is the file that routes it.
 *
 * ---------------------------------------------------------------------------
 * Why it is a branch and not a re-export
 * ---------------------------------------------------------------------------
 *
 * Until Phase 3 this module was `export { cleanText } from
 * "./internal/sanity-source"` — one line, and the header said it would "become
 * a plain identity function once Phase 3 removes Sanity entirely". That is
 * this. Under Payload there is nothing to strip: stega is a Sanity encoding
 * that Sanity's own Presentation tool puts into strings, and Payload embeds
 * none, so calling `stegaClean` on a Payload string is a walk over a value it
 * cannot change.
 *
 * The branch matters anyway, for a reason that is not performance. `stegaClean`
 * is not a no-op on arbitrary input: it round-trips objects and arrays through
 * a recursive copy, so on the Payload path it would keep rebuilding values it
 * had no business touching, and any future divergence in its handling of a
 * shape would land on data it was never written for. Reading the flag makes it
 * unambiguous which store's convention is being applied.
 *
 * ---------------------------------------------------------------------------
 * The call sites do not change, and could not
 * ---------------------------------------------------------------------------
 *
 * Eleven of them across seven files — `all-posts`, `carousel-1`,
 * `section-header`, `cta-1`, `events-calendar`, `grid-row`, `grid-card` — and
 * every one is a **server** component (none carries `"use client"`), which is
 * what makes reaching for `payload-source`'s twin safe: it imports
 * `next/cache` and `next/headers`. That is not a new constraint. Its Sanity
 * counterpart already pulls `next/headers` in through
 * `sanity/lib/cached-fetch.ts`, so this module has been server-only since it
 * was written.
 *
 * Both twins are taken from `lib/content/internal/`, not defined here: that
 * directory is the only place allowed to know which store is answering
 * (`lib/__tests__/content-layer-boundary.test.ts` enforces the Sanity half),
 * and a third definition of "the identity function" living above the seam
 * would be one this file could quietly drift from.
 *
 * Domain: `text`. `CONTENT_BACKEND_TEXT=payload` flips it alone; Phase 4
 * deletes the Sanity arm and this becomes the one-line identity export the
 * original header promised.
 */
import { activeBackend } from "./internal/backend";
import { cleanText as sanityCleanText } from "./internal/sanity-source";
import { cleanText as payloadCleanText } from "./internal/payload-source";

/**
 * Strip the CMS's display-only metadata from a value.
 *
 * Generic rather than string-only, because `stegaClean` is
 * (`<Result = unknown>(result: Result) => Result`) and cleans recursively
 * through whatever it is given: call sites in this codebase pass numbers and
 * `null`/`undefined` through it too (a numeric `limit` field, an absent
 * variant), and narrowing to a string signature would silently misfit them.
 *
 * The backend is read per call, not at module load, so a test or a preview
 * deployment can flip it after this module has been imported.
 */
export function cleanText<T>(value: T): T {
  return activeBackend("text") === "payload" ? payloadCleanText(value) : sanityCleanText(value);
}
