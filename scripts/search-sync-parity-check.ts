/**
 * Task 17 — prove the records the Payload hooks produce are the records the
 * live Algolia index already holds, **without writing to the live index**.
 *
 *   pnpm exec tsx --tsconfig scripts/tsconfig.scripts.json \
 *     scripts/search-sync-parity-check.ts
 *
 *   # and, to prove the Algolia round trip itself, against a scratch index:
 *   ALGOLIA_INDEX_PREFIX=t17_ pnpm exec tsx --tsconfig scripts/tsconfig.scripts.json \
 *     scripts/search-sync-parity-check.ts --scratch
 *
 * ## What it does, and what it refuses to do
 *
 * 1. **Reads** the three live indices (`case_studies`, `news`, `agendas`) with
 *    `browse`, using the admin key. Read-only: `browse` cannot mutate.
 * 2. **Builds** the records `payload/hooks/search-sync.ts` would produce, from
 *    the **Payload** database, through the same readers and the same three
 *    transform functions the hooks and the sync routes now share.
 * 3. **Diffs** them field for field and prints every difference.
 * 4. With `--scratch` **and** a non-empty `ALGOLIA_INDEX_PREFIX`, pushes those
 *    records to `<prefix><index>`, reads them back, and asserts the round trip
 *    is lossless. Without a prefix `--scratch` refuses to run — the guard that
 *    makes it impossible for this script to write to `case_studies`.
 *
 * It never writes to Postgres and never writes to an unprefixed index.
 *
 * ## Why `--tsconfig scripts/tsconfig.scripts.json`
 *
 * `lib/content/**` carries `import "server-only"`, which resolves from the Next
 * bundler and nowhere else. That tsconfig aliases the marker to the same no-op
 * stub vitest uses, and exists only for this. See its comments.
 */
import { createHash } from "node:crypto";

import { algoliasearch } from "algoliasearch";

import { ALGOLIA_INDICES, writeIndexName } from "@/lib/algolia-indices";
import {
  transformAgendaForIndex,
  transformCaseStudyForIndex,
  transformNewsForIndex,
  type SearchIndexRecord,
} from "@/payload/hooks/search-sync";

import { assertPayloadDatabase, describeDatabase, loadEnv } from "./payload-import/lib/runtime";

const SCRATCH = process.argv.includes("--scratch");
/**
 * There is deliberately no `--source=sanity` control here, and the reason is
 * worth recording: building the same records from Sanity in a plain Node
 * process is impossible. `lib/content/news.ts` reaches `sanity/lib/live.ts`,
 * whose `defineLive()` throws `defineLive can only be used in React Server
 * Components` at import. The Sanity control is therefore done two other ways —
 * `git show HEAD:app/api/search/case-studies/sync/route.ts` for what the
 * pre-change transform emitted, and a raw GROQ probe for what the Sanity
 * documents hold. Both are in the task report.
 */

type IndexKey = "case_studies" | "news" | "agendas";

interface Group {
  index: IndexKey;
  label: string;
  build: () => Promise<SearchIndexRecord[]>;
}

const failures: string[] = [];

function check(ok: boolean, message: string): void {
  console.log(`${ok ? "  ok  " : " FAIL "} ${message}`);
  if (!ok) failures.push(message);
}

/**
 * Algolia drops `undefined` on the way in and adds `_highlightResult` /
 * `_snippetResult` on the way out of a `search`; `browse` returns the stored
 * object, but normalising both sides is what makes the comparison honest rather
 * than lucky.
 */
function normalise(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalise);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined) continue;
      if (k === "_highlightResult" || k === "_snippetResult") continue;
      out[k] = normalise(v);
    }
    return Object.fromEntries(Object.entries(out).sort(([a], [b]) => (a < b ? -1 : 1)));
  }
  return value;
}

function digest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(normalise(value))).digest("hex").slice(0, 12);
}

/** Every leaf path where two objects disagree, as `path: live → built`. */
function differences(live: unknown, built: unknown, path = ""): string[] {
  const a = normalise(live);
  const b = normalise(built);
  if (JSON.stringify(a) === JSON.stringify(b)) return [];
  const bothObjects =
    a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b);
  if (!bothObjects) {
    return [`${path || "<root>"}: ${JSON.stringify(a)} → ${JSON.stringify(b)}`];
  }
  const keys = new Set([
    ...Object.keys(a as Record<string, unknown>),
    ...Object.keys(b as Record<string, unknown>),
  ]);
  const out: string[] = [];
  for (const key of [...keys].sort()) {
    out.push(
      ...differences(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
        path ? `${path}.${key}` : key,
      ),
    );
  }
  return out;
}

async function browseAll(
  client: ReturnType<typeof algoliasearch>,
  indexName: string,
): Promise<Map<string, Record<string, unknown>>> {
  const objects = new Map<string, Record<string, unknown>>();
  let cursor: string | undefined;
  do {
    const page = (await client.browse({
      indexName,
      browseParams: { hitsPerPage: 1000, ...(cursor ? { cursor } : {}) },
    })) as { hits: Record<string, unknown>[]; cursor?: string };
    for (const hit of page.hits) objects.set(String(hit.objectID), hit);
    cursor = page.cursor;
  } while (cursor);
  return objects;
}

async function main(): Promise<void> {
  await loadEnv();
  // The same guard every payload-import script uses: refuse anything but the
  // recorded dev endpoint. This script only reads Postgres, but the guard is
  // also what proves *which* database the records were built from.
  assertPayloadDatabase(process.env.PAYLOAD_DATABASE_URL, { action: "read from it" });
  const target = describeDatabase(process.env.PAYLOAD_DATABASE_URL!);
  console.log(`database: ${target.database} on ${target.endpoint} (dev endpoint: ${target.isDevEndpoint})`);

  const appId = process.env.ALGOLIA_APP_ID || process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
  const adminKey = process.env.ALGOLIA_API_KEY;
  if (!appId || !adminKey) throw new Error("ALGOLIA_APP_ID / ALGOLIA_API_KEY are required");
  const client = algoliasearch(appId, adminKey);

  const prefix = process.env.ALGOLIA_INDEX_PREFIX ?? "";
  if (SCRATCH && prefix.length === 0) {
    throw new Error(
      "--scratch requires ALGOLIA_INDEX_PREFIX to be set. Without it this would write to the live index.",
    );
  }
  console.log(`scratch: ${SCRATCH ? `on, prefix "${prefix}"` : "off (read-only against the live index)"}`);

  // The Payload arm **directly**, not the CONTENT_BACKEND seam — a Payload hook
  // reads Payload whatever a flag says. Dynamic so the server-only alias is in
  // place before the module graph is touched.
  const [caseStudies, news, outputs] = await Promise.all([
    import("@/lib/content/internal/payload/case-studies"),
    import("@/lib/content/internal/payload/news"),
    import("@/lib/content/internal/payload/outputs"),
  ]);
  const fresh = { fresh: true };

  const groups: Group[] = [
    {
      index: ALGOLIA_INDICES.CASE_STUDIES,
      label: "case studies",
      build: async () =>
        (await caseStudies.getApprovedCaseStudyIndexDocs(fresh))
          .map(transformCaseStudyForIndex)
          .filter((r) => r !== null) as SearchIndexRecord[],
    },
    {
      index: ALGOLIA_INDICES.NEWS,
      label: "news posts",
      build: async () =>
        (await news.getPublishedNewsIndexDocs(fresh))
          .map(transformNewsForIndex)
          .filter((r) => r !== null) as SearchIndexRecord[],
    },
    {
      index: ALGOLIA_INDICES.AGENDAS,
      label: "agendas",
      build: async () =>
        (await outputs.getPublishedAgendaIndexDocs(fresh))
          .map(transformAgendaForIndex)
          .filter((r) => r !== null) as SearchIndexRecord[],
    },
  ];

  for (const group of groups) {
    console.log(`\n=== ${group.label} (${group.index}) ===`);
    const built = await group.build();
    const live = await browseAll(client, group.index);
    console.log(`  built ${built.length} records from Payload; live index holds ${live.size}`);

    const builtIds = new Set(built.map((r) => String(r.objectID)));
    const missing = [...live.keys()].filter((id) => !builtIds.has(id));
    const extra = built.filter((r) => !live.has(String(r.objectID))).map((r) => String(r.objectID));

    check(missing.length === 0, `${group.label}: every live objectID is still produced (${missing.length} would be dropped)`);
    if (missing.length) console.log(`        dropped: ${missing.slice(0, 10).join(", ")}`);
    check(extra.length === 0, `${group.label}: no objectID is produced that the live index lacks (${extra.length} would be added)`);
    if (extra.length) console.log(`        added: ${extra.slice(0, 10).join(", ")}`);

    let identical = 0;
    const drifted: string[] = [];
    for (const record of built) {
      const id = String(record.objectID);
      const liveObject = live.get(id);
      if (!liveObject) continue;
      const diff = differences(liveObject, record);
      if (diff.length === 0) {
        identical += 1;
      } else {
        drifted.push(id);
        console.log(`        ${id}`);
        for (const line of diff.slice(0, 12)) console.log(`          ${line}`);
        if (diff.length > 12) console.log(`          …and ${diff.length - 12} more`);
      }
    }
    check(
      drifted.length === 0,
      `${group.label}: ${identical}/${built.length - extra.length} records match the live index field for field`,
    );

    if (SCRATCH) {
      const scratchIndex = writeIndexName(group.index);
      if (scratchIndex === group.index) throw new Error("refusing to write to the live index");
      const response = await client.saveObjects({ indexName: scratchIndex, objects: built });
      const taskID = Array.isArray(response) ? response[0]?.taskID : undefined;
      if (taskID) await client.waitForTask({ indexName: scratchIndex, taskID });
      const roundTripped = await browseAll(client, scratchIndex);
      const lossless = built.every(
        (record) => digest(record) === digest(roundTripped.get(String(record.objectID))),
      );
      check(
        lossless && roundTripped.size === built.length,
        `${group.label}: ${built.length} records survive an Algolia round trip through ${scratchIndex} unchanged`,
      );
    }
  }

  console.log(`\n${failures.length === 0 ? "ALL CHECKS PASSED" : `${failures.length} FAILED`}`);
  for (const failure of failures) console.log(`  - ${failure}`);
  process.exit(failures.length === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
