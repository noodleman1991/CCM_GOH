/**
 * Response headers for `/payload-api/<slug>/file/<name>`.
 *
 * Applied through `upload.modifyResponseHeaders` on both upload collections;
 * both Payload's own static handler and `@payloadcms/storage-s3`'s call it
 * with the response headers after `Content-Type` is set.
 *
 * ---------------------------------------------------------------------------
 * SVG: sandbox the response
 * ---------------------------------------------------------------------------
 *
 * `media` accepts `image/*`, which includes SVG, and Payload stores an SVG
 * verbatim — sharp never touches it (`payload/dist/uploads/canResizeImage.js`).
 * Served from the hub's own origin under the site CSP, which allows inline
 * script, an SVG carrying `<script>` runs with the origin's cookies: stored
 * XSS reachable by any editor account. SVG cannot simply be refused —
 * `backgroundOption.svgPattern` and the logo fields exist for it.
 *
 * So the SVG response carries its own `Content-Security-Policy` with
 * `sandbox` and `script-src 'none'`. Opened directly, the document is an
 * inert picture. Used as `<img src>`, nothing changes: images never executed
 * script. `nosniff` stops a browser second-guessing the type.
 *
 * ---------------------------------------------------------------------------
 * Cache-Control for everything
 * ---------------------------------------------------------------------------
 *
 * Neither handler sets `Cache-Control`, so the CDN could not cache an origin
 * response and `next/image` re-fetched through two function invocations every
 * `minimumCacheTTL`. One day, revalidated in the background for a week: long
 * enough to matter, short enough that an editor re-uploading over the same
 * name (imported assets keep stable names) is not stale for long. New uploads
 * get a random name per `randomizeUploadFilename`, so they never collide.
 */
const SVG_CSP = "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data:; script-src 'none'";
const CACHE_CONTROL = "public, max-age=86400, stale-while-revalidate=604800";

export function uploadResponseHeaders({ headers }: { headers: Headers }): Headers {
  const type = headers.get("content-type") ?? "";
  if (type.startsWith("image/svg+xml")) {
    headers.set("Content-Security-Policy", SVG_CSP);
    headers.set("X-Content-Type-Options", "nosniff");
  }
  if (!headers.has("cache-control")) headers.set("Cache-Control", CACHE_CONTROL);
  return headers;
}
