/**
 * The image half of the seam: re-exports the Sanity image-URL builder for
 * lib/content/images.ts to consume.
 *
 * Task 10a's brief said "import the builder from the seam only" — reasonably
 * read at the time as Sanity's own `@/sanity/lib/image`, but that module is
 * not under lib/content/, so lib/content/images.ts importing it directly
 * violated the rule that only lib/content/internal/ may import Sanity. This
 * file is the fix: it is the only thing images.ts imports, and it is the
 * only file that imports `@/sanity/lib/image`. Phase 3 adds a payload-source
 * equivalent beside this file and images.ts switches over without its own
 * callers noticing.
 */
export { urlFor, urlForCropped } from "@/sanity/lib/image";
