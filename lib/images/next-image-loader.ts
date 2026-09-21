/**
 * The site's `next/image` loader (next.config.mjs `images.loaderFile`).
 *
 * Two kinds of image reach `<Image>`:
 *
 *   1. CMS derivatives. `lib/content/images.ts` has already chosen the derivative
 *      that fits the slot (one of the eleven sizes Payload cut at upload,
 *      WebP for the uncropped family), so running it through Vercel's
 *      optimizer again buys nothing and bills a transformation per width. The
 *      loader hands the URL back untouched; the browser fetches it from
 *      Payload's handler or, with `NEXT_PUBLIC_PAYLOAD_MEDIA_PUBLIC_URL` set,
 *      straight from the bucket's public hostname.
 *   2. Everything else (Sanity's CDN while it is retained, YouTube thumbnails,
 *      Clerk and Gravatar avatars, files under /public). These keep the
 *      default `/_next/image?url=&w=&q=` path, byte for byte what Next's own
 *      loader builds, so `remotePatterns` and the cache TTL still apply.
 *
 * One consequence to know about: for a CMS image Next still emits a `srcset`
 * with one entry per candidate width, all the same URL. Browsers fetch it
 * once; the markup is merely longer.
 *
 * This file is bundled for the browser, so the variable is read by its full
 * literal name (Next inlines NEXT_PUBLIC_ variables referenced that way) and
 * nothing server-side is imported.
 */
const PUBLIC_BASE = process.env.NEXT_PUBLIC_PAYLOAD_MEDIA_PUBLIC_URL;

const HANDLER_PREFIXES = ["/payload-api/media/", "/payload-api/files/"];

export function isCmsUpload(src: string, base: string | undefined = PUBLIC_BASE): boolean {
  if (HANDLER_PREFIXES.some((prefix) => src.startsWith(prefix))) return true;
  const trimmed = base?.trim().replace(/\/+$/, "");
  return Boolean(trimmed) && src.startsWith(`${trimmed}/`);
}

/**
 * Payload names a generated size `<stem>-<width>x<height>.<ext>`; an original
 * has no such suffix. Only a derivative is right-sized for its slot, so only a
 * derivative skips the optimizer. An original reaching `<Image>` means a call
 * site asked `imageUrl()` for no size (payload-image-source.ts, tier 3) and it
 * keeps the optimizer's resizing rather than shipping the full upload.
 */
export function isCmsDerivative(src: string): boolean {
  const path = src.split(/[?#]/)[0] ?? "";
  return /-\d+x\d+\.[a-z0-9]+$/i.test(path);
}

interface LoaderArgs {
  src: string;
  width: number;
  quality?: number;
}

export default function imageLoader({ src, width, quality }: LoaderArgs): string {
  if (isCmsUpload(src) && isCmsDerivative(src)) return src;
  // The default loader serves SVGs as-is unless `dangerouslyAllowSVG` is on;
  // the optimizer would refuse them otherwise.
  if (/\.svg(?:[?#]|$)/i.test(src)) return src;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality ?? 75}`;
}
