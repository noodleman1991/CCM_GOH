const VIMEO_HOSTS = ["vimeo.com", "www.vimeo.com", "player.vimeo.com"];

/**
 * Extract a Vimeo video id from a URL. Supports the shapes users actually
 * paste — vimeo.com/{id}, vimeo.com/channels/{channel}/{id} and the
 * player.vimeo.com/video/{id} embed URL — with query strings and trailing
 * slashes tolerated. Anything on a non-Vimeo host is rejected (host parsing,
 * not substring matching, so lookalike domains don't pass).
 */
export function vimeoId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (!VIMEO_HOSTS.includes(parsed.hostname)) return null;

  const path = parsed.pathname.replace(/\/+$/, "");
  const m =
    parsed.hostname === "player.vimeo.com"
      ? path.match(/^\/video\/(\d+)$/)
      : path.match(/^\/(?:channels\/[^/]+\/)?(\d+)$/);
  return m ? m[1] : null;
}
