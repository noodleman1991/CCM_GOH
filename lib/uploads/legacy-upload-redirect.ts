/**
 * Where an old upload URL goes once uploads are served from the bucket.
 *
 * Before `NEXT_PUBLIC_PAYLOAD_MEDIA_PUBLIC_URL`, every image and file was at
 * `/payload-api/<media|files>/file/<name>?prefix=<cms/…>`. Those URLs are in
 * the wild: emails, shared Open Graph previews, pages still in a cache. With
 * direct serving on, Payload no longer mounts that handler (it answers 500),
 * so proxy.ts turns the old path into a 308 to the same object on the public
 * hostname. Pure, so proxy.ts stays bundle-safe and this is unit-testable.
 */
import { publicUploadURL } from "@/payload/storage/public-url";

const LEGACY_PATH = /^\/payload-api\/(media|files)\/file\/(.+)$/;

const DEFAULT_PREFIX: Record<string, string> = { media: "cms/media", files: "cms/files" };

export function legacyUploadRedirect(
  pathname: string,
  searchParams: URLSearchParams,
  base: string | undefined,
): string | null {
  const trimmed = base?.trim().replace(/\/+$/, "");
  if (!trimmed) return null;
  const match = LEGACY_PATH.exec(pathname);
  if (!match) return null;
  const [, collection, rawName] = match;
  let filename: string;
  try {
    filename = decodeURIComponent(rawName);
  } catch {
    return null;
  }
  if (!filename || filename.includes("..")) return null;
  const prefix = searchParams.get("prefix") || DEFAULT_PREFIX[collection];
  return publicUploadURL(trimmed, prefix, filename);
}
