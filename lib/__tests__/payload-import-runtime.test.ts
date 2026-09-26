import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  assertPayloadDatabase,
  describeDatabase,
  DEV_ENDPOINT_DIGEST,
  PAYLOAD_DATABASE_NAME,
} from "@/scripts/payload-import/lib/runtime";

/**
 * The one safety rail on a 395-asset, 384-document write path.
 *
 * It used to check the database *name* only, which blocks Prisma's `goh` — the
 * accident the spec's §4 database separation exists to prevent — but not the
 * thing the Phase 3 plan actually schedules: re-running this same import
 * against a **production** Payload database in the same Neon project, whose
 * natural name is also `payload_cms`. The guard now reads the host too, and a
 * production run has to say so.
 *
 * The recorded dev digest has no preimage in the repository (the point of
 * recording a digest rather than a hostname), so these tests hash their own
 * fake host and hand it in through the test-only `devEndpointDigest` option.
 */

const DEV_HOST = "ep-dev-branch-a1b2c3";
const PROD_HOST = "ep-prod-branch-z9y8x7";
const devDigest = createHash("sha256").update(DEV_HOST).digest("hex");

const url = (host: string, database = PAYLOAD_DATABASE_NAME) =>
  `postgresql://u:p@${host}.eu-central-1.aws.neon.tech/${database}?sslmode=require`;

const guard = (connectionString: string | undefined, allowProduction = false) =>
  assertPayloadDatabase(connectionString, { devEndpointDigest: devDigest, allowProduction });

describe("describeDatabase", () => {
  it("reads the database name and the Neon endpoint out of the URL", () => {
    const target = describeDatabase(url(DEV_HOST), devDigest);
    expect(target).toEqual({ database: "payload_cms", endpoint: DEV_HOST, isDevEndpoint: true });
  });

  it("treats the pooled and direct URLs for one branch as the same endpoint", () => {
    // Neon serves the same branch on `<endpoint>` and `<endpoint>-pooler`.
    // Without normalising, switching a connection string between them would
    // read as a different database and refuse a legitimate dev run.
    expect(describeDatabase(url(`${DEV_HOST}-pooler`), devDigest).isDevEndpoint).toBe(true);
  });

  it("records a real digest, so the shipped default is not an empty string", () => {
    expect(DEV_ENDPOINT_DIGEST).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("assertPayloadDatabase", () => {
  it("accepts the dev CMS database with no flag", () => {
    expect(guard(url(DEV_HOST))).toBe("payload_cms");
  });

  it("refuses a database that is not payload_cms, whatever the host", () => {
    // Prisma's `goh` holds 8,500 rows and `prisma migrate reset` drops the
    // schema it manages; this is the separation the whole phase rests on.
    expect(() => guard(url(DEV_HOST, "goh"))).toThrow(/payload_cms/);
    expect(() => guard(url(PROD_HOST, "goh"), true)).toThrow(/payload_cms/);
  });

  it("refuses an unset PAYLOAD_DATABASE_URL rather than guessing", () => {
    expect(() => guard(undefined)).toThrow(/PAYLOAD_DATABASE_URL/);
  });

  it("refuses a correctly-named payload_cms on an unrecognised host — the finding", () => {
    // The production Payload database is `payload_cms` too. Under the old
    // name-only guard this call was a pass, and the run would have written 395
    // assets and 384 documents into production believing it was in dev.
    expect(() => guard(url(PROD_HOST))).toThrow(/not the recorded dev endpoint/);
    expect(() => guard(url(PROD_HOST))).toThrow(/--allow-production/);
  });

  it("allows production when the caller says so, and only then", () => {
    expect(guard(url(PROD_HOST), true)).toBe("payload_cms");
  });

  it("refuses --allow-production aimed at the dev database", () => {
    // The flag is a statement about the target. A false statement means the
    // operator believes they are somewhere they are not, which is worth
    // stopping for even though the write itself would be harmless.
    expect(() => guard(url(DEV_HOST), true)).toThrow(/dev endpoint/);
  });

  it("names the action it is refusing, so the message says which script stopped", () => {
    expect(() =>
      assertPayloadDatabase(url(PROD_HOST), {
        devEndpointDigest: devDigest,
        action: "write assets to it",
      }),
    ).toThrow(/write assets to it/);
  });
});
