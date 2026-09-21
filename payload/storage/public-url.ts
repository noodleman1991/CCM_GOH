/**
 * Serving CMS uploads straight from the bucket (2026-09-21).
 *
 * Without this, every image and PDF on the site is fetched through Payload's
 * static handler at `/payload-api/<slug>/file/<name>`: a Vercel function
 * invocation that streams the object out of R2, and then, for images,
 * Vercel's image optimizer on top. Both are billed. R2 egress through a
 * public bucket hostname is free and sits behind Cloudflare's cache.
 *
 * One variable switches it: `NEXT_PUBLIC_PAYLOAD_MEDIA_PUBLIC_URL`, the public
 * hostname of the bucket Payload writes to (a custom domain on the bucket, or
 * its r2.dev hostname for a preview). It is `NEXT_PUBLIC_` because the
 * `next/image` loader in the browser has to recognise the same host
 * (lib/images/next-image-loader.ts). Set, the storage plugin stops mounting
 * the static handler (`disablePayloadAccessControl`) and every stored `url`
 * and `sizes.*.url` becomes `<base>/<prefix>/<filename>`. Unset, nothing here
 * changes: local development and a bucket without public access keep the
 * handler.
 *
 * What the handler did that the bucket does not, and why that is acceptable:
 *   - SVG sandboxing (payload/hooks/upload-headers.ts) existed because the
 *     handler served SVGs on the hub's own origin. On the bucket's hostname an
 *     SVG's script would run on that origin instead, which holds no session.
 *     Keep the public hostname off the hub's cookie domain (`cdn.` on the
 *     apex is fine only if the session cookie is host-only, which Clerk's
 *     `__session` is) and note that Payload's own `validateSvg` still runs on
 *     upload.
 *   - Cache-Control: the handler added a one-day header; objects now carry a
 *     one-year immutable one, stamped by payload/hooks/upload-cache-control.ts.
 *   - Access control: both upload collections already read as
 *     `editorOrStaticFile`, which allowed every static-file read anyway.
 *
 * Pure module: read by payload.config.ts (server and CLI) and by tests.
 */
/** The two per-collection options of @payloadcms/plugin-cloud-storage this
 *  module sets. Declared here because that package is only a transitive
 *  dependency (through @payloadcms/storage-s3); the shapes are assignable to
 *  its `CollectionOptions`. */
export interface DirectUploadOptions {
  disablePayloadAccessControl?: true;
  generateFileURL?: (args: { collection: unknown; filename: string; prefix?: string; size?: unknown }) => string;
}

export const MEDIA_PUBLIC_URL_ENV = "NEXT_PUBLIC_PAYLOAD_MEDIA_PUBLIC_URL";

/** The public base, or null when uploads are served through Payload. */
export function mediaPublicBase(env: Record<string, string | undefined> = process.env): string | null {
  const raw = env.NEXT_PUBLIC_PAYLOAD_MEDIA_PUBLIC_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/+$/, "");
}

/** `<base>/<prefix>/<filename>`, the filename percent-encoded per segment. */
export function publicUploadURL(base: string, prefix: string | undefined, filename: string): string {
  const path = [prefix?.replace(/^\/+|\/+$/g, ""), filename]
    .filter((part): part is string => Boolean(part))
    .map((part) => part.split("/").map(encodeURIComponent).join("/"))
    .join("/");
  return `${base.replace(/\/+$/, "")}/${path}`;
}

/** The per-collection plugin options that turn direct serving on; `{}` when off. */
export function directUploadOptions(env: Record<string, string | undefined> = process.env): DirectUploadOptions {
  const base = mediaPublicBase(env);
  if (!base) return {};
  return {
    disablePayloadAccessControl: true,
    generateFileURL: ({ prefix, filename }) => publicUploadURL(base, prefix, filename),
  };
}
