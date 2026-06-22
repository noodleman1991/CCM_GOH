import "server-only";
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Cloudflare R2 (S3-compatible) wrapper for collaboration files. Bucket
 * `ccm-collab`, prefix-routed: `members/{id}/…` (private, served only via
 * short-TTL presigned GET) and `public/{id}/…`.
 *
 * Everything fails closed when the R2 env is unset (r2Configured() === false),
 * so the file feature shows a disabled state rather than crashing.
 */

// Canonical names are the short `R2_*` set; the longer `CLOUDFLARE_R2_*`
// names are accepted as a fallback for backward compatibility.
const ENDPOINT = process.env.R2_ENDPOINT ?? process.env.CLOUDFLARE_R2_ENDPOINT;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID ?? process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY ?? process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const BUCKET = process.env.R2_BUCKET ?? process.env.CLOUDFLARE_R2_COLLAB_BUCKET ?? "ccm-collab";
const PUBLIC_URL = process.env.R2_PUBLIC_URL ?? process.env.CLOUDFLARE_R2_COLLAB_PUBLIC_URL;

export function r2Configured(): boolean {
  return !!(ENDPOINT && ACCESS_KEY_ID && SECRET_ACCESS_KEY);
}

let _client: S3Client | null = null;
function client(): S3Client {
  if (!r2Configured()) throw new Error("R2 not configured");
  if (!_client) {
    _client = new S3Client({
      region: "auto",
      endpoint: ENDPOINT,
      forcePathStyle: true,
      credentials: { accessKeyId: ACCESS_KEY_ID!, secretAccessKey: SECRET_ACCESS_KEY! },
    });
  }
  return _client;
}

/** Sanitize a filename for use in an object key. */
export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200) || "file";
}

/** Build the object key for a collaboration file by visibility. */
export function buildFileKey(
  visibility: "PUBLIC" | "MEMBERS",
  collaborationId: string,
  fileName: string
): string {
  const prefix = visibility === "PUBLIC" ? "public" : "members";
  const uuid = crypto.randomUUID();
  return `${prefix}/${collaborationId}/${uuid}/${sanitizeFileName(fileName)}`;
}

/** Presigned PUT for a direct browser upload. Content-type + length are bound. */
export async function presignUpload(params: {
  key: string;
  contentType: string;
  contentLength: number;
  ttlSeconds?: number;
}): Promise<string> {
  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: params.key,
    ContentType: params.contentType,
    ContentLength: params.contentLength,
  });
  return getSignedUrl(client(), cmd, { expiresIn: params.ttlSeconds ?? 300 });
}

/**
 * URL to read an object. PUBLIC-prefixed keys are served from the public
 * hostname; MEMBERS keys get a short-TTL presigned GET (a bearer token — keep
 * the TTL short, never log it, re-issue per request).
 */
export async function fileUrl(key: string, ttlSeconds = 120): Promise<string> {
  if (key.startsWith("public/") && PUBLIC_URL) {
    return `${PUBLIC_URL.replace(/\/$/, "")}/${key}`;
  }
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(client(), cmd, { expiresIn: ttlSeconds });
}

/** Confirm an object exists (called after a presigned PUT, before persisting). */
export async function objectExists(key: string): Promise<boolean> {
  try {
    await client().send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

/** Delete an object (GDPR sweep / file deletion). */
export async function deleteObject(key: string): Promise<void> {
  if (!r2Configured()) return;
  try {
    await client().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch {
    // best-effort
  }
}
