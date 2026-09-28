/**
 * Live preview addresses (spec §3.4). Pure — used by the Payload config's
 * `livePreview.url` and by the /api/preview route.
 */

const LOCALES = ["en", "es", "fr", "ar"];

/** A path on this site, or `null`. Refuses anything that could leave the site
 *  (`//host`, `https://…`, backslashes, encoded slashes, `javascript:`). */
export function safePreviewPath(raw: string | null | undefined): string | null {
  if (!raw || !raw.startsWith("/")) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }
  if (decoded.startsWith("//") || decoded.includes("\\") || decoded.includes("://")) return null;
  return raw;
}

/** The preview link for a page (by its slug) or, with no slug, the homepage. */
export function previewPath(doc: { slug?: unknown } | null | undefined, locale: string | undefined): string {
  const lang = locale && LOCALES.includes(locale) ? locale : "en";
  const slug = typeof doc?.slug === "string" && doc.slug ? doc.slug : "";
  const path = slug ? `/${lang}/${slug}` : `/${lang}`;
  return `/api/preview?path=${encodeURIComponent(path)}`;
}
