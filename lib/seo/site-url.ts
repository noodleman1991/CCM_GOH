/**
 * The site's public origin, once.
 *
 * `NEXT_PUBLIC_SITE_URL` was read raw in seventeen files, some of which
 * interpolated it into a URL with no guard, so an unset variable produced
 * `undefined/sitemap.xml`, and a trailing slash produced `//images/og.jpg`.
 * Every base-URL need goes through these two functions now.
 */
const PRODUCTION_ORIGIN = "https://connectingclimateminds.org";

export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const base = raw && raw.length > 0 ? raw : PRODUCTION_ORIGIN;
  return base.replace(/\/+$/, "");
}

/**
 * Absolutise a path against the site origin. An already-absolute URL (a CDN
 * image, an external link) is returned unchanged; `null`/`undefined` stay
 * `null`, so a caller can pass an optional image straight through.
 */
export function absoluteUrl(pathOrUrl: string | null | undefined): string | null {
  if (!pathOrUrl) return null;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${siteUrl()}/${pathOrUrl.replace(/^\/+/, "")}`;
}
