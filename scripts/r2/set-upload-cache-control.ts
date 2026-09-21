/**
 * Backfill: stamp the one-year immutable Cache-Control on every CMS object
 * already in the bucket. New uploads get it from
 * payload/hooks/upload-cache-control.ts; the 395 imported assets and their
 * derivatives predate the hook.
 *
 *   pnpm r2:cache-control                 # dry run: counts what would change
 *   pnpm r2:cache-control -- --execute    # apply
 *   pnpm r2:cache-control -- --env=.env.local --execute
 *
 * Reads the bucket the same way payload.config.ts does (PAYLOAD_R2_BUCKET,
 * then R2_BUCKET). A self-copy with MetadataDirective REPLACE rewrites the
 * metadata in place; bytes are not re-uploaded. Content-Type is read first
 * and written back, because REPLACE would otherwise reset it.
 */
import { config as loadDotenv } from "dotenv";

const args = process.argv.slice(2);
const envArg = args.find((a) => a.startsWith("--env="))?.slice("--env=".length);
loadDotenv({ path: envArg ?? ".env" });

const EXECUTE = args.includes("--execute");
const PREFIXES = ["cms/media/", "cms/files/"];
const CONCURRENCY = 8;

async function main() {
  const { S3Client, ListObjectsV2Command, HeadObjectCommand, CopyObjectCommand } = await import("@aws-sdk/client-s3");
  const { payloadR2BucketName, payloadR2ClientConfig } = await import("@/payload/storage/r2");
  const { UPLOAD_CACHE_CONTROL } = await import("@/payload/hooks/upload-cache-control");

  const Bucket = payloadR2BucketName();
  const client = new S3Client(payloadR2ClientConfig());
  console.log(`${envArg ?? ".env"} | bucket ${Bucket} | ${EXECUTE ? "EXECUTE" : "dry run"}`);

  const keys: string[] = [];
  for (const Prefix of PREFIXES) {
    let ContinuationToken: string | undefined;
    do {
      const page = await client.send(new ListObjectsV2Command({ Bucket, Prefix, ContinuationToken }));
      for (const o of page.Contents ?? []) if (o.Key) keys.push(o.Key);
      ContinuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (ContinuationToken);
  }
  console.log(`${keys.length} objects under ${PREFIXES.join(", ")}`);

  let already = 0;
  let changed = 0;
  let failed = 0;
  const queue = [...keys];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (let Key = queue.shift(); Key; Key = queue.shift()) {
        try {
          const head = await client.send(new HeadObjectCommand({ Bucket, Key }));
          if (head.CacheControl === UPLOAD_CACHE_CONTROL) {
            already += 1;
            continue;
          }
          if (EXECUTE) {
            await client.send(
              new CopyObjectCommand({
                Bucket,
                Key,
                CopySource: `${Bucket}/${Key.split("/").map(encodeURIComponent).join("/")}`,
                MetadataDirective: "REPLACE",
                CacheControl: UPLOAD_CACHE_CONTROL,
                ContentType: head.ContentType,
              }),
            );
          }
          changed += 1;
        } catch (error) {
          failed += 1;
          console.error(`  ${Key}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }),
  );
  console.log(
    `${already} already carried the policy, ${changed} ${EXECUTE ? "updated" : "would be updated"}, ${failed} failed`,
  );
  if (!EXECUTE && changed > 0) console.log("Re-run with --execute to apply.");
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
