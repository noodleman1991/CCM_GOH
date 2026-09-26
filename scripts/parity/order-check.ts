/**
 * Ordering oracle for the list-reader push-down (2026-09-17). READ ONLY.
 *
 * Until the push-down, every Payload list reader fetched a whole collection
 * and ordered it in JavaScript: newest date first (compared as an instant,
 * undated rows last), ties broken by code-point order of the id. After it,
 * the readers ask Payload for `sort: ["-<date>", "id"]`, which the Postgres
 * adapter emits as `ORDER BY <date> DESC, id ASC`. The two agree only if
 * (a) no admitted row has a NULL date (Postgres puts NULLs FIRST on DESC),
 * and (b) `ORDER BY id` is code-point order, which depends on the database
 * collation (`C`/`C.UTF-8`: yes; `en_US.UTF-8`: no, once ids mix case).
 *
 * This script proves both on the database it is pointed at, per collection:
 * it prints the collation, the NULL-date count among admitted rows, and
 * whether the SQL order equals the old JavaScript order for every row. Run it
 * against production before `CONTENT_BACKEND` flips there.
 *
 *   pnpm exec tsx --tsconfig scripts/tsconfig.scripts.json scripts/parity/order-check.ts
 *
 * Reads `PAYLOAD_DATABASE_URL` from `.env.local` (dev) unless the shell sets
 * one. Every statement runs inside `BEGIN READ ONLY … ROLLBACK`.
 */
import { loadEnv, assertPayloadDatabase, describeDatabase, getPayloadInstance } from "../payload-import/lib/runtime";

type Check = {
  label: string;
  table: string;
  date: string;
  /** SQL predicate selecting the rows the reader admits. */
  where: string;
  direction?: "asc" | "desc";
  /** A table that may legitimately have no admitted rows (events: none approved in dev). */
  optional?: boolean;
};

const CHECKS: Check[] = [
  { label: "case studies (approved, published)", table: "case_studies", date: "published_at", where: `_status = 'published' AND moderation_status = 'approved'` },
  { label: "news posts (published)", table: "news_posts", date: "published_at", where: `_status = 'published'` },
  { label: "lived experiences (published, approved or unset)", table: "lived_experiences", date: "published_at", where: `_status = 'published' AND (moderation_status = 'approved' OR moderation_status IS NULL)` },
  { label: "agendas", table: "agendas", date: "publish_date", where: `TRUE` },
  { label: "research outputs (approved)", table: "research_outputs", date: "publish_date", where: `moderation_status = 'approved'` },
  { label: "events (approved), ascending", table: "events", date: "start_at", where: `moderation_status = 'approved'`, direction: "asc", optional: true },
];

function byCodePoint(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** The comparator every reader used before the push-down. */
function jsOrder(rows: { id: string; date: string | null }[], direction: "asc" | "desc"): string[] {
  return [...rows]
    .sort((a, b) => {
      const left = a.date ? Date.parse(a.date) : Number.NaN;
      const right = b.date ? Date.parse(b.date) : Number.NaN;
      if (!Number.isNaN(left) || !Number.isNaN(right)) {
        if (Number.isNaN(left)) return 1;
        if (Number.isNaN(right)) return -1;
        if (right !== left) return direction === "desc" ? right - left : left - right;
      }
      return byCodePoint(a.id, b.id);
    })
    .map((r) => r.id);
}

async function main(): Promise<void> {
  await loadEnv();
  const url = process.env.PAYLOAD_DATABASE_URL;
  assertPayloadDatabase(url, { action: "read ordering from it", allowProduction: process.argv.includes("--allow-production") });
  console.log("target:", describeDatabase(url!));

  const payload = await getPayloadInstance();
  const pool = (payload.db as unknown as { pool?: { connect(): Promise<PgClient> } }).pool;
  if (!pool) throw new Error("The Payload database adapter exposes no pg pool; cannot run raw read-only SQL.");

  const client = await pool.connect();
  let failures = 0;
  try {
    await client.query("BEGIN READ ONLY");
    const coll = await client.query<{ datcollate: string; datctype: string }>(
      "SELECT datcollate, datctype FROM pg_database WHERE datname = current_database()",
    );
    const collation = coll.rows[0];
    const cIsCodePoint = /^C(\.UTF-?8)?$|^POSIX$/i.test(collation?.datcollate ?? "");
    console.log(`collation: ${collation?.datcollate} / ${collation?.datctype} -> ORDER BY id is code-point order: ${cIsCodePoint ? "YES" : "NO"}`);
    if (!cIsCodePoint) failures += 1;

    for (const check of CHECKS) {
      const direction = check.direction ?? "desc";
      const total = await client.query<{ n: string; nulls: string }>(
        `SELECT count(*)::text AS n, count(*) FILTER (WHERE ${check.date} IS NULL)::text AS nulls FROM ${check.table} WHERE ${check.where}`,
      );
      const n = Number(total.rows[0]?.n ?? 0);
      const nulls = Number(total.rows[0]?.nulls ?? 0);
      // The order Payload's adapter emits for sort ["-date","id"] / ["date","id"].
      const sql = await client.query<{ id: string }>(
        `SELECT id FROM ${check.table} WHERE ${check.where} ORDER BY ${check.date} ${direction.toUpperCase()}, id ASC`,
      );
      const raw = await client.query<{ id: string; date: string | null }>(
        `SELECT id, to_char(${check.date} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS date FROM ${check.table} WHERE ${check.where}`,
      );
      const sqlIds = sql.rows.map((r) => r.id);
      const jsIds = jsOrder(raw.rows, direction);
      const same = JSON.stringify(sqlIds) === JSON.stringify(jsIds);
      const firstDiff = same ? -1 : sqlIds.findIndex((id, i) => id !== jsIds[i]);
      // A zero-row result is a failed control (the repo's rule: pair every
      // count with a known-nonzero one) unless the table is marked optional.
      const status =
        n === 0 ? (check.optional ? "EMPTY (nothing to compare)" : "EMPTY (control failed)") : same && nulls === 0 ? "OK" : "MISMATCH";
      if (status === "MISMATCH" || status === "EMPTY (control failed)") failures += 1;
      console.log(
        `${status.padEnd(22)} ${check.label}: rows=${n} null_${check.date}=${nulls} sql==js=${same}` +
          (firstDiff >= 0 ? ` first difference at #${firstDiff}: sql=${sqlIds[firstDiff]} js=${jsIds[firstDiff]}` : ""),
      );
    }
    await client.query("ROLLBACK");
  } finally {
    client.release();
  }
  console.log(failures === 0 ? "\nAll ordering checks passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

type PgClient = {
  query<T = Record<string, unknown>>(sql: string): Promise<{ rows: T[] }>;
  release(): void;
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
