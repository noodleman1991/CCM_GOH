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
 *
 * ---------------------------------------------------------------------------
 * Phase 3: which builder runs
 * ---------------------------------------------------------------------------
 *
 * `activeBackend("images")` decides, exactly as it does for the sixteen domain
 * modules, and the two arms answer different stores rather than different
 * shapes of the same one:
 *
 *   sanity   `@/sanity/lib/image`'s parametric URL builder — any width, any
 *            height, any quality, computed by the CDN at request time.
 *   payload  `lib/content/internal/payload-image-source.ts`, which turns that
 *            parametric request into a choice among the eleven derivatives
 *            `media` writes at upload time, and is loud when none of them fits.
 *
 * The Payload arm is **not** reimplemented here. Its four tiers — the exact
 * size key, then the smallest *covering* derivative, then "a dimension-less
 * request resolves to the original, deliberately", then a recorded and warned
 * fall-through — are the whole substance of that module, and a second copy of
 * that policy is a second thing to keep in step.
 *
 * ---------------------------------------------------------------------------
 * Five of the call sites are client components, and that is a hazard
 * ---------------------------------------------------------------------------
 *
 * `case-study-modal`, `split-info-item`, `lived-experiences-carousel`,
 * `logo-cloud-1` and `grid-section-header` all carry `"use client"` and all
 * call `imageUrl()` in their render bodies. A client component renders twice —
 * once on the server, once on hydration — and Next inlines only
 * `NEXT_PUBLIC_*` into the browser bundle, so a deployment that sets
 * `CONTENT_BACKEND=payload` and nothing else has a server answering `payload`
 * and a browser answering `sanity` for the same image. That is a hydration
 * mismatch producing two different `src` values, not a graceful fallback.
 *
 * `backend.ts` therefore reads a public twin (`NEXT_PUBLIC_CONTENT_BACKEND`,
 * `NEXT_PUBLIC_CONTENT_BACKEND_IMAGES`) when the server-only variable says
 * nothing, and `warnOnSplitBackend()` below says so once, on the server, when
 * the two disagree. Task 18's flip must set both.
 */
import { activeBackend, publicBackend } from "./internal/backend";
import { urlFor, urlForCropped } from "./internal/image-source";
import { imageUrl as payloadImageUrl } from "./internal/payload-image-source";
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
/**
 * Warned once per process, on the server only.
 *
 * The browser cannot detect this — it has only its own half of the answer —
 * so the server, which can see both, is the only place the disagreement is
 * observable at all. Once rather than per image: a page renders dozens.
 */
let warnedSplitBackend = false;

function warnOnSplitBackend(server: "sanity" | "payload"): void {
  if (warnedSplitBackend || typeof window !== "undefined") return;
  const browser = publicBackend("images");
  if (browser === server) return;
  warnedSplitBackend = true;
  console.warn(
    `[content/images] the server builds image URLs from "${server}" but a browser would build them from "${browser}". ` +
      `Five "use client" components call imageUrl() and will re-render with the browser's answer on hydration. ` +
      `Set NEXT_PUBLIC_CONTENT_BACKEND (or NEXT_PUBLIC_CONTENT_BACKEND_IMAGES) to "${server}" as well.`,
  );
}

/**
 * Warned once per process. Expected for the whole of Tasks 7-13 and a bug from
 * Task 14 on, which is why it names the module that has to move.
 */
let warnedSanityShapedImage = false;

function warnOnSanityShapedImage(): void {
  if (warnedSanityShapedImage) return;
  warnedSanityShapedImage = true;
  console.warn(
    "[content/images] the image backend is \"payload\" but an image arrived in Sanity's shape, " +
      "so the Sanity URL builder answered it. Expected while lib/content/pages.ts still reads Sanity (Task 14); " +
      "a bug once it does not.",
  );
}

export function imageUrl(image: ContentImage | unknown, opts: ImageUrlOptions = {}): string {
  if (!image) return "";

  const backend = activeBackend("images");
  warnOnSplitBackend(backend);
  if (backend === "payload") {
    // Never throws either: `payload-image-source` carries the same `catch`
    // returning `""`, for the same reason — an image is never worth a 500.
    const url = payloadImageUrl(image, opts);
    if (url) return url;
    // Falling through is not a hedge, it is the transition window. Thirteen
    // domain modules — `pages.ts` above all — do not swap until Task 14, so
    // with the flag set this wrapper is still handed *Sanity* images by most
    // of its 35 call sites. `payload-image-source` identifies those
    // positively (`_id`/`_ref`/`_type` are Sanity's spelling and a `media` row
    // has none of them) and refuses them, which is what makes this branch
    // unambiguous rather than a guess: it runs only for an image Payload
    // could not have produced.
    //
    // The alternative was measured, not imagined. Before the refusal existed,
    // a dereferenced Sanity asset looked enough like a media row to be
    // accepted, and every homepage image came back as its CDN URL stripped of
    // `?fm=webp&fit=max` — 56 differing lines on `/en`, silently un-transformed.
    // Returning `""` here instead would blank them altogether.
    //
    // No store is read on either side of this: both arms format a string.
    // The branch dies with Task 14.
    warnOnSanityShapedImage();
  }

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
