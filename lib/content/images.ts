/**
 * Task 10a: the image URL builder, flattened to a plain function.
 *
 * `urlFor` / `urlForCropped` (`@/sanity/lib/image`) return a chainable
 * Sanity builder — call sites did `urlFor(img).width(800).height(450).url()`.
 * That builder API is Sanity-specific and cannot survive the Phase 3 backend
 * swap, so every call site now goes through `imageUrl` instead. This module
 * imports the builder from lib/content/internal/image-source.ts — the seam
 * re-export of `@/sanity/lib/image`, not that module directly, since only
 * lib/content/internal/ may import Sanity — no `@sanity/image-url` type
 * appears in this file's own exported signature.
 *
 * Behaviour mirrors the two builders exactly, including their load-bearing
 * special cases:
 *  - SVGs bypass the CDN transform pipeline entirely (handled inside the
 *    seam) — routing an SVG through width/height/format/fit rasterizes or
 *    crops it, which breaks vector logos.
 *  - The cropped and uncropped paths use different formats, deliberately:
 *    uncropped forces `.format("webp").fit("max")`; cropped uses
 *    `.fit("crop").auto("format")` (AVIF/WebP per browser). This function
 *    does not unify them — `opts.crop` selects which one runs.
 */
import { urlFor, urlForCropped } from "./internal/image-source";
import type { ContentImage } from "./types";

type SanitySource = Parameters<typeof urlFor>[0];

export interface ImageUrlOptions {
  width?: number;
  height?: number;
  /** Hotspot-aware crop via urlForCropped. Requires both width and height. */
  crop?: boolean;
  /** Sanity CDN quality (0-100). Omitted by default, matching the builders'
   *  own default; pass explicitly for a use case that needs to override it
   *  (e.g. Open Graph images, which want the ceiling). */
  quality?: number;
}

/**
 * Resolve a CMS image reference to a URL string.
 *
 * `image` is typed `ContentImage | unknown` rather than a Sanity type: today
 * every call site still passes a raw Sanity image object (asset reference,
 * hotspot, crop, mimeType — structurally incompatible with the flat
 * `ContentImage` shape), which is why `unknown` carries the real traffic.
 * `ContentImage` is included for the backend this becomes after Phase 3.
 *
 * Never throws: a null, missing, or otherwise unresolvable image resolves
 * to `""` — an image is never worth a 500.
 */
export function imageUrl(image: ContentImage | unknown, opts: ImageUrlOptions = {}): string {
  if (!image) return "";

  try {
    const { width, height, crop, quality } = opts;
    const source = image as SanitySource;

    if (crop && width && height) {
      let builder = urlForCropped(source, width, height);
      if (quality) builder = builder.quality(quality);
      return builder.url() || "";
    }

    let builder = urlFor(source);
    if (width) builder = builder.width(width);
    if (height) builder = builder.height(height);
    if (quality) builder = builder.quality(quality);
    return builder.url() || "";
  } catch {
    return "";
  }
}
