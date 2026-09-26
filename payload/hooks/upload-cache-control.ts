/**
 * Cache-Control on the objects themselves (2026-09-21).
 *
 * `@payloadcms/storage-s3` uploads with a Content-Type and nothing else, so an
 * object fetched from the bucket's public hostname arrives with no caching
 * policy: browsers revalidate every time and Cloudflare's edge falls back to
 * its defaults. Upload filenames are randomised on create
 * (payload/hooks/upload-filename.ts) and a Sanity-imported asset carries
 * Sanity's content hash, so a URL never changes bytes underneath a reader: a
 * year-long immutable policy is the right one, and it is stamped here with a
 * self-copy (`CopyObject` with `MetadataDirective: REPLACE`, which is how S3
 * and R2 rewrite metadata without re-uploading the bytes).
 *
 * A file swapped on an existing row is renamed as well (the randomiser runs on
 * update too), so the policy holds there; the hook re-runs whenever
 * `filename` changed.
 *
 * Runs after the row is committed (payload/hooks/after-commit.ts), never
 * throws into the request, and does nothing when R2 is not configured (tests,
 * a laptop without credentials).
 */
import type { CollectionAfterChangeHook } from "payload";
import { runAfterCommit } from "@/payload/hooks/after-commit";

export const UPLOAD_CACHE_CONTROL = "public, max-age=31536000, immutable";

interface UploadSize {
  filename?: string | null;
  mimeType?: string | null;
}

interface UploadLike {
  sanityAssetId?: string | null;
  filename?: string | null;
  mimeType?: string | null;
  prefix?: string | null;
  sizes?: Record<string, UploadSize | null | undefined> | null;
}

export interface UploadObject {
  key: string;
  contentType: string | undefined;
}

/** The original plus every generated size that has a filename, as bucket keys. */
export function uploadObjectKeys(doc: UploadLike): UploadObject[] {
  const prefix = doc.prefix?.replace(/^\/+|\/+$/g, "");
  const key = (filename: string) => (prefix ? `${prefix}/${filename}` : filename);
  const out: UploadObject[] = [];
  if (doc.filename) out.push({ key: key(doc.filename), contentType: doc.mimeType ?? undefined });
  for (const size of Object.values(doc.sizes ?? {})) {
    if (size?.filename) out.push({ key: key(size.filename), contentType: size.mimeType ?? doc.mimeType ?? undefined });
  }
  return out;
}

/**
 * Create, or an update that swapped the file. A caption edit is neither, and
 * neither is a Sanity-imported asset: the import creates hundreds of rows in
 * a burst, twelve copies per row on top of its own uploads exhausted the S3
 * connection pool and stalled it (measured 2026-09-21, stuck at 261/395), and
 * `pnpm r2:cache-control` stamps imported objects afterwards in one pass.
 */
export function uploadNeedsCacheControl(
  operation: string,
  doc: UploadLike,
  previousDoc: UploadLike | undefined,
): boolean {
  if (doc.sanityAssetId) return false;
  if (operation === "create") return true;
  if (operation !== "update") return false;
  return Boolean(doc.filename) && doc.filename !== previousDoc?.filename;
}

function r2Configured(): boolean {
  return Boolean(
    (process.env.R2_ENDPOINT ?? process.env.CLOUDFLARE_R2_ENDPOINT) &&
      (process.env.R2_ACCESS_KEY_ID ?? process.env.CLOUDFLARE_R2_ACCESS_KEY_ID) &&
      (process.env.R2_SECRET_ACCESS_KEY ?? process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY),
  );
}

/** Stamp the policy on each object. Exported for the backfill script. */
export async function applyUploadCacheControl(objects: UploadObject[]): Promise<void> {
  if (objects.length === 0) return;
  const [{ S3Client, CopyObjectCommand }, { payloadR2BucketName, payloadR2ClientConfig }] = await Promise.all([
    import("@aws-sdk/client-s3"),
    import("@/payload/storage/r2"),
  ]);
  const Bucket = payloadR2BucketName();
  const client = new S3Client(payloadR2ClientConfig());
  // One at a time: a row has at most twelve objects, and a burst of parallel
  // copies competes with the upload that just happened for the same pool.
  for (const object of objects) {
    await client.send(
      new CopyObjectCommand({
        Bucket,
        Key: object.key,
        CopySource: `${Bucket}/${object.key.split("/").map(encodeURIComponent).join("/")}`,
        MetadataDirective: "REPLACE",
        CacheControl: UPLOAD_CACHE_CONTROL,
        ContentType: object.contentType,
      }),
    );
  }
}

export const setUploadCacheControl: CollectionAfterChangeHook = ({ doc, previousDoc, operation }) => {
  if (!r2Configured()) return doc;
  if (!uploadNeedsCacheControl(operation, doc as UploadLike, previousDoc as UploadLike | undefined)) return doc;
  const objects = uploadObjectKeys(doc as UploadLike);
  runAfterCommit(() =>
    applyUploadCacheControl(objects).catch((error: unknown) => {
      console.warn(
        `[upload-cache-control] could not stamp Cache-Control on ${objects.length} object(s): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }),
  );
  return doc;
};
