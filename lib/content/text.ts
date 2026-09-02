/**
 * Task 10c: the display-text helper.
 *
 * Eleven block components used to import `stegaClean` from `next-sanity`
 * directly — a display-only concern (stripping Sanity's invisible
 * click-to-edit metadata from rendered strings) that nonetheless coupled
 * each component to the CMS for no structural reason. `cleanText` is the
 * seam-routed replacement: it delegates to the real `stegaClean` via
 * lib/content/internal/sanity-source.ts (the one file under lib/content/
 * permitted to import Sanity packages) and becomes a plain identity function
 * once Phase 3 removes Sanity entirely — no call site changes when that
 * happens.
 */
export { cleanText } from "./internal/sanity-source";
