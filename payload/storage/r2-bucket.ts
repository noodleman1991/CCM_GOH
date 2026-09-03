import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { R2StorageOptions } from "@payloadcms/storage-r2";

/**
 * An `R2Bucket` implementation backed by the S3 API, so `@payloadcms/storage-r2`
 * can run on this app's existing Cloudflare R2 credentials.
 *
 * Why this file exists at all: `r2Storage()` takes `bucket: R2Bucket` — the
 * Cloudflare *Workers binding* object (`env.MY_BUCKET`), which only exists
 * inside a Worker. This app deploys to Vercel on Node and already talks to the
 * same R2 account over the S3-compatible API (`lib/r2.ts`: `@aws-sdk/client-s3`
 * against `R2_ENDPOINT` with `region: "auto"`, `forcePathStyle: true`). The
 * plugin's own type file says the interface is deliberately loosened —
 * "R2 API types compatible with both Node (Miniflare) and Cloudflare Workers"
 * (`@payloadcms/storage-r2/dist/types.d.ts`) — and its adapter only ever calls
 * `put`, `head`, `get` and `delete` (`dist/{uploadFile,getFile,deleteFile}.js`);
 * multipart is reached only when `clientUploads` is enabled, which it is not.
 * So an S3-backed object satisfying that surface is the supported way to use
 * this plugin outside Workers.
 *
 * Why it does not import `lib/r2.ts`: that module starts with `import
 * "server-only"`, which throws outside a React Server Component build — and
 * the root `payload.config.ts` must load standalone under the Payload CLI
 * (`payload migrate`, `payload generate:types`). It also hard-codes the
 * collaboration bucket's `public/` / `members/` key layout. The env variable
 * names are the same `R2_*` set `lib/r2.ts` reads, with the same
 * `CLOUDFLARE_R2_*` fallbacks, so no new credentials are needed.
 *
 * The client is built lazily on first call: `payload.config.ts` constructs the
 * bucket at module load, where R2 env may legitimately be absent (CI, the
 * migration CLI, vitest). Nothing here touches the network until an upload,
 * read or delete actually happens.
 */

type R2BucketLike = R2StorageOptions["bucket"];
type R2ObjectLike = NonNullable<Awaited<ReturnType<R2BucketLike["head"]>>>;
type R2ObjectBodyLike = NonNullable<Awaited<ReturnType<R2BucketLike["get"]>>>;
type R2GetOptionsLike = NonNullable<Parameters<R2BucketLike["get"]>[1]>;
type R2PutValue = Parameters<R2BucketLike["put"]>[1];

// Canonical names are the short `R2_*` set, matching lib/r2.ts; the longer
// `CLOUDFLARE_R2_*` names are accepted as a fallback for backward compatibility.
function endpoint(): string | undefined {
  return process.env.R2_ENDPOINT ?? process.env.CLOUDFLARE_R2_ENDPOINT;
}
function accessKeyId(): string | undefined {
  return process.env.R2_ACCESS_KEY_ID ?? process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
}
function secretAccessKey(): string | undefined {
  return process.env.R2_SECRET_ACCESS_KEY ?? process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
}

/**
 * The bucket Payload's CMS uploads live in. Separate variable from `R2_BUCKET`
 * (the collaboration bucket `lib/r2.ts` uses) so CMS assets can be given their
 * own bucket, but falling back to the same one is safe: every key this adapter
 * writes is namespaced under the `cms/` prefixes declared in
 * `payload.config.ts`, which cannot collide with the collaboration layout's
 * `public/` and `members/` prefixes.
 */
export function payloadR2BucketName(): string {
  return (
    process.env.PAYLOAD_R2_BUCKET ??
    process.env.R2_BUCKET ??
    process.env.CLOUDFLARE_R2_BUCKET_NAME ??
    "ccm-collab"
  );
}

/** True when the R2 credentials this adapter needs are present. */
export function payloadR2Configured(): boolean {
  return Boolean(endpoint() && accessKeyId() && secretAccessKey());
}

let _client: S3Client | null = null;
function client(): S3Client {
  if (!payloadR2Configured()) {
    throw new Error(
      "R2 is not configured — set R2_ENDPOINT, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY.",
    );
  }
  if (!_client) {
    _client = new S3Client({
      region: "auto",
      endpoint: endpoint(),
      forcePathStyle: true,
      credentials: { accessKeyId: accessKeyId()!, secretAccessKey: secretAccessKey()! },
    });
  }
  return _client;
}

/** Cloudflare's `R2Range` in either of its two shapes -> an HTTP Range header. */
function rangeHeader(range: R2GetOptionsLike["range"]): string | undefined {
  if (!range) {
    return undefined;
  }
  if ("suffix" in range && typeof range.suffix === "number") {
    return `bytes=-${range.suffix}`;
  }
  const offset = "offset" in range && typeof range.offset === "number" ? range.offset : 0;
  const length = "length" in range && typeof range.length === "number" ? range.length : undefined;
  return length === undefined ? `bytes=${offset}-` : `bytes=${offset}-${offset + length - 1}`;
}

/**
 * The plugin passes a Buffer in production and, when NODE_ENV is
 * "development", a Blob (its workaround for a Miniflare bug —
 * `dist/uploadFile.js`). The S3 client handles Buffer/Uint8Array/string
 * directly; Blob and ArrayBuffer are materialised here rather than left to the
 * SDK, which cannot infer a content length from them.
 */
async function toS3Body(value: R2PutValue): Promise<Buffer | string | Uint8Array> {
  if (value === null) {
    return Buffer.alloc(0);
  }
  if (typeof value === "string" || value instanceof Uint8Array) {
    return value;
  }
  if (value instanceof ArrayBuffer) {
    return Buffer.from(value);
  }
  if (ArrayBuffer.isView(value)) {
    return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  }
  if (typeof Blob !== "undefined" && value instanceof Blob) {
    return Buffer.from(await value.arrayBuffer());
  }
  // A web ReadableStream — buffered rather than streamed so the PUT carries a
  // Content-Length. Nothing in the plugin's own upload path reaches this.
  const chunks: Uint8Array[] = [];
  for await (const chunk of value as unknown as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

type S3HeadLike = {
  ContentType?: string;
  ContentLength?: number;
  ETag?: string;
  CacheControl?: string;
  ContentDisposition?: string;
  ContentEncoding?: string;
  ContentLanguage?: string;
};

/**
 * Build the R2Object surface the plugin reads. `httpMetadata` is populated for
 * the plugin's Miniflare branch (`NODE_ENV === "development"`, which is every
 * `next dev` run) and `writeHttpMetadata` for its production branch — see
 * `@payloadcms/storage-r2/dist/getFile.js`, which uses one or the other.
 */
function toR2Object(key: string, head: S3HeadLike): R2ObjectLike {
  const httpMetadata = {
    cacheControl: head.CacheControl,
    contentDisposition: head.ContentDisposition,
    contentEncoding: head.ContentEncoding,
    contentLanguage: head.ContentLanguage,
    contentType: head.ContentType,
  };
  return {
    etag: head.ETag ? head.ETag.replace(/"/g, "") : "",
    httpMetadata,
    key,
    size: head.ContentLength ?? 0,
    writeHttpMetadata(headers: Headers) {
      if (httpMetadata.cacheControl) headers.set("Cache-Control", httpMetadata.cacheControl);
      if (httpMetadata.contentDisposition)
        headers.set("Content-Disposition", httpMetadata.contentDisposition);
      if (httpMetadata.contentEncoding)
        headers.set("Content-Encoding", httpMetadata.contentEncoding);
      if (httpMetadata.contentLanguage)
        headers.set("Content-Language", httpMetadata.contentLanguage);
      if (httpMetadata.contentType) headers.set("Content-Type", httpMetadata.contentType);
    },
  };
}

function isNotFound(err: unknown): boolean {
  const name = (err as { name?: string })?.name;
  const status = (err as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode;
  return name === "NotFound" || name === "NoSuchKey" || status === 404;
}

/**
 * The S3-backed `R2Bucket`. Structurally typed against the plugin's own
 * `bucket` parameter, so a signature change in a future `@payloadcms/storage-r2`
 * is a `tsc` failure here rather than a runtime surprise.
 */
export function payloadR2Bucket(bucketName: string = payloadR2BucketName()): R2BucketLike {
  return {
    async delete(keys: string | string[]): Promise<void> {
      const list = Array.isArray(keys) ? keys : [keys];
      await Promise.all(
        list.map((Key) => client().send(new DeleteObjectCommand({ Bucket: bucketName, Key }))),
      );
    },

    async get(key, options) {
      try {
        const res = await client().send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: key,
            Range: rangeHeader(options?.range),
          }),
        );
        if (!res.Body) {
          return null;
        }
        const body = res.Body as { transformToWebStream: () => ReadableStream };
        return {
          ...toR2Object(key, res),
          body: body.transformToWebStream(),
        } as R2ObjectBodyLike;
      } catch (err) {
        if (isNotFound(err)) {
          return null;
        }
        throw err;
      }
    },

    async head(key) {
      try {
        const res = await client().send(
          new HeadObjectCommand({ Bucket: bucketName, Key: key }),
        );
        return toR2Object(key, res);
      } catch (err) {
        if (isNotFound(err)) {
          return null;
        }
        throw err;
      }
    },

    async list(options?: { prefix?: string; limit?: number; cursor?: string }) {
      const res = await client().send(
        new ListObjectsV2Command({
          Bucket: bucketName,
          ContinuationToken: options?.cursor,
          MaxKeys: options?.limit,
          Prefix: options?.prefix,
        }),
      );
      return {
        cursor: res.NextContinuationToken,
        objects: (res.Contents ?? []).map((o) =>
          toR2Object(o.Key ?? "", { ContentLength: o.Size, ETag: o.ETag }),
        ),
        truncated: Boolean(res.IsTruncated),
      };
    },

    async put(key, value, options?: { httpMetadata?: { contentType?: string } }) {
      const res = await client().send(
        new PutObjectCommand({
          Body: await toS3Body(value),
          Bucket: bucketName,
          ContentType: options?.httpMetadata?.contentType,
          Key: key,
        }),
      );
      return toR2Object(key, { ETag: res.ETag, ContentType: options?.httpMetadata?.contentType });
    },

    // Multipart is only reached through `clientUploads`, which this config does
    // not enable (server-side uploads only). Throwing is better than a partial
    // implementation that silently corrupts a large file.
    createMultipartUpload(): never {
      throw new Error(
        "Multipart upload is not implemented for the S3-backed R2 bucket — enable it only alongside a real implementation.",
      );
    },
    resumeMultipartUpload(): never {
      throw new Error(
        "Multipart upload is not implemented for the S3-backed R2 bucket — enable it only alongside a real implementation.",
      );
    },
  };
}
