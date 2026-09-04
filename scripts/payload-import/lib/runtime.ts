/**
 * The three things every `scripts/payload-import/*` entry point needs before
 * it can touch anything: the environment, a Payload instance, and the guard
 * that says which database it is allowed to write to.
 *
 * Each of the four scripts grew its own copy — `loadEnv()` four times with
 * three different comments, `getPayloadInstance()` twice (once private in
 * `documents.ts`, once exported from `drafts.ts` and re-imported by
 * `verify.ts`), and `assertPayloadDatabase` living in `assets.ts`, so the
 * verifier imported the asset **importer** to borrow a guard. Every copy was
 * right when it was written and the accumulation was only visible across all
 * four; this module is where they live now.
 */

import { createHash } from "node:crypto";
import path from "node:path";

import { REPO_ROOT } from "./sanity-export";

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

/**
 * `.env.local` first, then `.env`.
 *
 * dotenv does not overwrite an already-set variable, so `.env.local`'s
 * `PAYLOAD_DATABASE_URL` — the **dev** CMS database — wins over anything `.env`
 * declares. `.env` then supplies the R2 credentials, which live only there.
 * This ordering is itself part of the production guard below: `.env` is this
 * repo's production environment file (see the production-environment ledger
 * note), so a `PAYLOAD_DATABASE_URL` that can only have come from `.env` is a
 * production URL.
 */
export async function loadEnv(): Promise<void> {
  const { default: dotenv } = await import("dotenv");
  dotenv.config({ path: path.join(REPO_ROOT, ".env.local"), quiet: true });
  dotenv.config({ path: path.join(REPO_ROOT, ".env"), quiet: true });
}

// ---------------------------------------------------------------------------
// Payload
// ---------------------------------------------------------------------------

export type PayloadInstance = Awaited<ReturnType<typeof import("payload").getPayload>>;

/**
 * Payload's Local API. Both imports are dynamic: `@payload-config` pulls in
 * the whole config (and, through it, `@clerk/nextjs/server` lazily), which
 * must not be evaluated at module load in a plain Node process.
 */
export async function getPayloadInstance(): Promise<PayloadInstance> {
  const [{ getPayload }, { default: config }] = await Promise.all([
    import("payload"),
    import("@payload-config"),
  ]);
  return getPayload({ config });
}

// ---------------------------------------------------------------------------
// The database guard
// ---------------------------------------------------------------------------

/**
 * The dev CMS database's Neon endpoint, recorded as a SHA-256 digest.
 *
 * A digest rather than the hostname itself: the endpoint id is infrastructure
 * detail that belongs in `.env.local`, not in the repository, and the guard
 * only ever needs to answer "is this the same host I was told about". The
 * `-pooler` suffix is stripped before hashing, so the pooled and direct URLs
 * for one Neon branch are the same endpoint here.
 *
 * To re-record it (a new Neon branch for dev, say):
 *
 *   node -e 'const{createHash}=require("crypto");
 *     const h=new URL(process.env.PAYLOAD_DATABASE_URL).hostname.split(".")[0];
 *     console.log(createHash("sha256").update(h.replace(/-pooler$/,"")).digest("hex"))'
 */
export const DEV_ENDPOINT_DIGEST =
  "f50d506b1d6db86e706d974bac628e25aa17463aff890d5970a735b6edbd8558";

/** The only database name these scripts will write to. */
export const PAYLOAD_DATABASE_NAME = "payload_cms";

export interface DatabaseGuardOptions {
  /**
   * The caller means production, and says so. Modelled on `--allow-after-
   * drafts`: a flag that has to be typed, not a default that has to be
   * remembered.
   */
  allowProduction?: boolean;
  /** What the run will do, for the refusal message ("write assets", …). */
  action?: string;
  /**
   * The digest to recognise as the dev endpoint. **Tests only** — the four
   * import scripts never pass it, so a real run always measures against
   * `DEV_ENDPOINT_DIGEST`. It exists because the recorded digest has no
   * preimage in the repository (that is the point of recording a digest), so
   * a test cannot otherwise construct a URL the guard will accept.
   */
  devEndpointDigest?: string;
}

export interface DatabaseTarget {
  database: string;
  endpoint: string;
  isDevEndpoint: boolean;
}

/** Neon's endpoint label, `-pooler` normalised away. */
function endpointLabel(hostname: string): string {
  return hostname.split(".")[0]!.replace(/-pooler$/, "");
}

export function describeDatabase(
  connectionString: string,
  devEndpointDigest: string = DEV_ENDPOINT_DIGEST,
): DatabaseTarget {
  const url = new URL(connectionString);
  const database = url.pathname.replace(/^\//, "").split("?")[0]!;
  const endpoint = endpointLabel(url.hostname);
  const digest = createHash("sha256").update(endpoint).digest("hex");
  return { database, endpoint, isDevEndpoint: digest === devEndpointDigest };
}

/**
 * Refuses to run against anything but the CMS database the caller means.
 *
 * **The name alone is not enough.** The original guard asserted only that
 * `new URL(...).pathname` was `payload_cms`, which correctly blocks Prisma's
 * `goh` — the accident the spec's §4 database separation exists to prevent —
 * but the Phase 3 plan schedules re-running this same import against a
 * *production* Payload database in the same Neon project, and the natural name
 * for that one is also `payload_cms`. The one safety rail on a 395-asset,
 * 384-document write path stopped being a rail at exactly the moment it
 * mattered most.
 *
 * So two things are checked, not one:
 *
 * 1. the database name is `payload_cms` (Prisma's database is still refused
 *    outright, flag or no flag — no flag can turn `goh` into a CMS database);
 * 2. the **host** is the recorded dev endpoint, unless the caller passed
 *    `--allow-production`, which it must type deliberately.
 *
 * A production run is not silently permitted and a dev run needs no flag, so
 * the default is the safe one and the dangerous one is explicit. Passing the
 * flag while pointed at the dev endpoint is also refused: the flag is a
 * statement about the target, and a wrong statement is a mistake worth
 * stopping for rather than a harmless no-op.
 */
export function assertPayloadDatabase(
  connectionString: string | undefined,
  options: DatabaseGuardOptions = {},
): string {
  const action = options.action ?? "write to it";
  if (!connectionString) {
    throw new Error("PAYLOAD_DATABASE_URL is not set. Refusing to guess which database to write to.");
  }
  const target = describeDatabase(connectionString, options.devEndpointDigest);

  if (target.database !== PAYLOAD_DATABASE_NAME) {
    throw new Error(
      `PAYLOAD_DATABASE_URL points at "${target.database}", not "${PAYLOAD_DATABASE_NAME}". Refusing to ${action}.`,
    );
  }

  if (!target.isDevEndpoint && !options.allowProduction) {
    throw new Error(
      `PAYLOAD_DATABASE_URL points at "${PAYLOAD_DATABASE_NAME}" on host "${target.endpoint}", which is not the ` +
        `recorded dev endpoint. Every Payload database in this Neon project is named "${PAYLOAD_DATABASE_NAME}", ` +
        `so the name alone cannot tell dev from production. Refusing to ${action}. ` +
        `If you mean production, re-run with --allow-production; if you meant dev, check .env.local. ` +
        `(If dev has moved to a new Neon branch, re-record DEV_ENDPOINT_DIGEST in ` +
        `scripts/payload-import/lib/runtime.ts — the command is in its docstring.)`,
    );
  }

  if (target.isDevEndpoint && options.allowProduction) {
    throw new Error(
      `--allow-production was passed, but PAYLOAD_DATABASE_URL points at the dev endpoint. ` +
        `Refusing to ${action} on a claim that is not true of the target.`,
    );
  }

  return target.database;
}
