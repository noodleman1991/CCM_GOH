/**
 * The site's `next/image` loader (next.config.mjs `images.loaderFile`).
 *
 * Setting a custom loader turns Vercel's optimizer off for the whole app:
 * `/_next/image` stops existing, so a loader must return a URL that serves
 * the image itself. (Measured 2026-09-22: the first version of this file fell
 * back to `/_next/image?...` for non-CMS images and every one of them 404'd,
 * including the sidebar logo.) Each source is therefore sized by whatever
 * transform that source offers:
 *
 *   1. CMS derivatives. `lib/content/images.ts` already picked the size the
 *      slot needs, from the eleven Payload cut at upload, so the URL is
 *      returned untouched — no transformation is billed and, with
 *      `NEXT_PUBLIC_PAYLOAD_MEDIA_PUBLIC_URL` set, the bytes come straight
 *      from the bucket. A CMS *original* (a call site that asked for no size)
 *      is left alone too; there is no optimizer left to shrink it.
 *   2. Sanity's CDN, while Sanity is retained: its own query parameters
 *      (`w`, `q`, `auto=format`, `fit=max`) resize and re-encode at the edge.
 *   3. Clerk avatars: the same, through `width`/`quality`.
 *   4. Everything else — files under /public, YouTube thumbnails, Gravatar —
 *      is served as it is. These are small and already sized.
 *
 * Bundled for the browser, so it reads the variable by its full literal name
 * (Next inlines NEXT_PUBLIC_ variables referenced that way) and imports
 * nothing server-side.
 */
const PUBLIC_BASE = process.env.NEXT_PUBLIC_PAYLOAD_MEDIA_PUBLIC_URL;

const HANDLER_PREFIXES = ["/payload-api/media/", "/payload-api/files/"];

const SANITY_HOST = "cdn.sanity.io";
const CLERK_HOSTS = ["img.clerk.com", "images.clerk.dev"];

export function isCmsUpload(src: string, base: string | undefined = PUBLIC_BASE): boolean {
  if (HANDLER_PREFIXES.some((prefix) => src.startsWith(prefix))) return true;
  const trimmed = base?.trim().replace(/\/+$/, "");
  return Boolean(trimmed) && src.startsWith(`${trimmed}/`);
}

/**
 * Payload names a generated size `<stem>-<width>x<height>.<ext>`; an original
 * has no such suffix. Only a derivative is right-sized for its slot.
 */
export function isCmsDerivative(src: string): boolean {
  const path = src.split(/[?#]/)[0] ?? "";
  return /-\d+x\d+\.[a-z0-9]+$/i.test(path);
}

/** Adds query parameters to an absolute URL, keeping the ones already there. */
function withParams(src: string, params: Record<string, string>): string {
  try {
    const url = new URL(src);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    return url.toString();
  } catch {
    return src;
  }
}

interface LoaderArgs {
  src: string;
  width: number;
  quality?: number;
}

export default function imageLoader({ src, width, quality }: LoaderArgs): string {
  if (isCmsUpload(src)) return src;
  if (/\.svg(?:[?#]|$)/i.test(src)) return src;

  const host = src.startsWith("http") ? (src.split("/")[2] ?? "") : "";
  if (host === SANITY_HOST) {
    return withParams(src, { w: String(width), q: String(quality ?? 75), auto: "format", fit: "max" });
  }
  if (CLERK_HOSTS.includes(host)) {
    return withParams(src, { width: String(width), quality: String(quality ?? 75) });
  }
  return src;
}
