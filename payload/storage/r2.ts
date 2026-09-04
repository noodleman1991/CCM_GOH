import type { S3ClientConfig } from "@aws-sdk/client-s3";

/**
 * Where Payload's CMS uploads live: Cloudflare R2, reached over its
 * S3-compatible API — the same account, credentials and transport this app
 * already uses for collaboration files (`lib/r2.ts`).
 *
 * This module holds only the two values `s3Storage()` needs in
 * `payload.config.ts` (a bucket name and an S3 client config). It deliberately
 * does not import `lib/r2.ts`: that module starts with `import "server-only"`,
 * which throws outside a React Server Component build, and the root
 * `payload.config.ts` must load standalone under the Payload CLI
 * (`payload migrate`, `payload generate:types`). It also hard-codes the
 * collaboration bucket's `public/` / `members/` key layout, which is not the
 * CMS layout.
 *
 * Nothing here touches the network. `s3Storage()` builds its `AWS.S3` client
 * lazily on the first upload/read/delete, so absent R2 *credentials* (CI, the
 * migration CLI, vitest) cost nothing at config load and surface as a loud
 * error on the first real upload rather than a silent fallback to local disk.
 * The bucket *name* is the exception and is resolved eagerly — see
 * `payloadR2BucketName`, which throws rather than defaulting: a missing
 * credential is a failed upload, a wrong destination is 618 MB written
 * somewhere nobody chose.
 */

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
 * The bucket Payload's CMS uploads live in.
 *
 * `PAYLOAD_R2_BUCKET` is checked first so CMS assets can be given their own
 * bucket; falling back to `R2_BUCKET` (the collaboration bucket `lib/r2.ts`
 * uses) is safe, because every key this adapter writes is namespaced under the
 * `cms/` prefixes declared in `payload.config.ts`, which cannot collide with
 * the collaboration layout's `public/` and `members/` prefixes. That is how
 * 618 MB of CMS media came to live inside `ccm-collab` under `cms/` — safe,
 * and now documented in `.env.example` rather than only in a code comment.
 *
 * **No hard-coded final fallback.** It used to end `?? "ccm-collab"`, so an
 * environment that set no bucket at all still wrote to a live production
 * bucket — the one accident that cannot be undone by re-running an idempotent
 * import. An unset bucket is now a loud failure at config load, which is where
 * a missing deployment variable should surface. Credentials stay lazy by
 * design (see the module header): a wrong *key* fails on the first upload,
 * while a wrong *destination* must fail before any upload happens.
 */
export function payloadR2BucketName(): string {
  const bucket =
    process.env.PAYLOAD_R2_BUCKET || process.env.R2_BUCKET || process.env.CLOUDFLARE_R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error(
      "No R2 bucket configured for Payload uploads. Set PAYLOAD_R2_BUCKET (preferred for a " +
        "CMS-only bucket) or R2_BUCKET. See .env.example.",
    );
  }
  return bucket;
}

/**
 * The S3 client configuration for R2, identical in shape to the working one in
 * `lib/r2.ts`: `region: "auto"` (R2 has no regions), the account's R2 S3
 * endpoint, and path-style addressing.
 *
 * Credentials are omitted entirely when they are not both set, rather than
 * passed as `undefined` — an explicit `credentials` object with empty members
 * would suppress the AWS SDK's own provider chain and turn a missing
 * credential into a confusing signing error instead of a plain
 * "could not load credentials".
 */
export function payloadR2ClientConfig(): S3ClientConfig {
  const id = accessKeyId();
  const secret = secretAccessKey();
  return {
    region: "auto",
    endpoint: endpoint(),
    forcePathStyle: true,
    ...(id && secret ? { credentials: { accessKeyId: id, secretAccessKey: secret } } : {}),
  };
}
