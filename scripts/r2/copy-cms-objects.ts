/**
 * Copy the CMS objects (`cms/media/*`, `cms/files/*`) from one R2 bucket to
 * another, server-side, keeping Content-Type and stamping the immutable
 * Cache-Control on the way. For moving CMS uploads out of the shared
 * `ccm-collab` bucket into a bucket that can be made public on its own.
 *
 *   pnpm r2:copy-cms -- --to=ccm-cms                      # dry run
 *   pnpm r2:copy-cms -- --to=ccm-cms --execute
 *   pnpm r2:copy-cms -- --from=ccm-collab --to=ccm-cms --env=.env --execute
 *
 * `--from` defaults to the bucket payload.config.ts currently writes to. The
 * API token must be allowed on both buckets. Objects already present in the
 * target with the same size are skipped, so the script can be re-run. Nothing
 * is deleted from the source; drop the old prefix by hand once Payload has
 * been pointed at the new bucket (PAYLOAD_R2_BUCKET) and verified.
 */
import { config as loadDotenv } from "dotenv";

const args = process.argv.slice(2);
const arg = (name: string) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
loadDotenv({ path: arg("env") ?? ".env" });

const EXECUTE = args.includes("--execute");
const PREFIXES = ["cms/media/", "cms/files/"];
const CONCURRENCY = 8;

async function main() {
  const to = arg("to");
  if (!to) {
    console.error("Usage: pnpm r2:copy-cms -- --to=<bucket> [--from=<bucket>] [--env=<file>] [--execute]");
    process.exit(2);
  }
  const { S3Client, ListObjectsV2Command, HeadObjectCommand, CopyObjectCommand } = await import("@aws-sdk/client-s3");
  const { payloadR2BucketName, payloadR2ClientConfig } = await import("@/payload/storage/r2");
  const { UPLOAD_CACHE_CONTROL } = await import("@/payload/hooks/upload-cache-control");

  const from = arg("from") ?? payloadR2BucketName();
  if (from === to) {
    console.error(`--from and --to are both ${to}; nothing to do.`);
    process.exit(2);
  }
  const client = new S3Client(payloadR2ClientConfig());
  console.log(`${arg("env") ?? ".env"} | ${from} to ${to} | ${EXECUTE ? "EXECUTE" : "dry run"}`);

  const list = async (Bucket: string) => {
    const sizes = new Map<string, number>();
    for (const Prefix of PREFIXES) {
      let ContinuationToken: string | undefined;
      do {
        const page = await client.send(new ListObjectsV2Command({ Bucket, Prefix, ContinuationToken }));
        for (const o of page.Contents ?? []) if (o.Key) sizes.set(o.Key, o.Size ?? -1);
        ContinuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
      } while (ContinuationToken);
    }
    return sizes;
  };
  const [source, target] = await Promise.all([list(from), list(to)]);
  const todo = [...source].filter(([key, size]) => target.get(key) !== size).map(([key]) => key);
  console.log(`${source.size} objects in ${from}; ${source.size - todo.length} already in ${to}; ${todo.length} to copy`);

  let copied = 0;
  let failed = 0;
  const queue = [...todo];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (let Key = queue.shift(); Key; Key = queue.shift()) {
        try {
          if (EXECUTE) {
            const head = await client.send(new HeadObjectCommand({ Bucket: from, Key }));
            await client.send(
              new CopyObjectCommand({
                Bucket: to,
                Key,
                CopySource: `${from}/${Key.split("/").map(encodeURIComponent).join("/")}`,
                MetadataDirective: "REPLACE",
                CacheControl: UPLOAD_CACHE_CONTROL,
                ContentType: head.ContentType,
              }),
            );
          }
          copied += 1;
        } catch (error) {
          failed += 1;
          console.error(`  ${Key}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }),
  );
  console.log(`${copied} ${EXECUTE ? "copied" : "would be copied"}, ${failed} failed`);
  if (!EXECUTE && copied > 0) console.log("Re-run with --execute to apply.");
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
