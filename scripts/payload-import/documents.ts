/**
 * Task 12 — import every published Sanity document into Payload.
 *
 * Reads the Phase 0 archive through `lib/sanity-export.ts`, maps each document
 * with `lib/transform.ts`, and writes it through Payload's local API.
 *
 * Usage:
 *   pnpm import:documents                 # import (idempotent; safe to re-run)
 *   pnpm import:documents -- --dry-run    # transform everything, write nothing
 *   pnpm import:documents -- --resume     # skip documents that already exist
 *   pnpm import:documents -- --only tag,agenda
 *
 * ## The four properties, and how each is obtained
 *
 * 1. **ID-preserving.** Every document is created with `data.id` set to its
 *    Sanity `_id` — the custom text `id` field every collection declares
 *    exists for this. It is what keeps Prisma's cross-system references
 *    (`Person.sanityPersonId`, `CollaborationContentLink.sanityId`, …) valid
 *    across the swap, and it is what makes the run idempotent.
 * 2. **Idempotent.** The run opens by reading back the ids already present,
 *    one query per collection, and upserts: an existing id is updated, never
 *    created a second time. Array and block row ids are derived from the
 *    source document rather than minted, so a second run rewrites the same
 *    rows instead of replacing them with content-identical copies.
 * 3. **Reference-order aware.** `IMPORT_ORDER` in `lib/transform.ts` puts
 *    taxonomy before authors before content before pages, and every target is
 *    built up-front in that order with `ctx.known` growing as it goes — so a
 *    forward reference throws during the transform, before a single row is
 *    written, rather than becoming a null nobody notices.
 * 4. **Locale-collapsing.** The 36 `page` documents become 9, the 28
 *    `regionalCommunityPage` documents become 7, and the two 4-document
 *    globals become one each. Payload's local API takes a `locale` on both
 *    `create` and `update` (verified against 3.88.0's own types), so a
 *    document is created in `en` and then updated once per further locale.
 *
 * ## Hazards this script is written against
 *
 * - **It writes to `payload_cms`.** The run refuses to start unless
 *   `PAYLOAD_DATABASE_URL` names that database. It never touches Prisma's.
 * - **It deletes nothing.** Re-runnability comes from the upsert, not from
 *   clearing tables; the 395 uploads Task 11 created are only ever read.
 * - **Progress is printed per document**, because a long run behind a
 *   no-output watchdog looks like a hang.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

import { assertPayloadDatabase } from "./assets";
import { extractArchive, readExportDocuments, REPO_ROOT } from "./lib/sanity-export";
import {
  documentTargets,
  LOCALES,
  type DocumentTarget,
  type Locale,
  type PayloadData,
  type SanityDoc,
  type TransformContext,
} from "./lib/transform";

export interface ImportSummary {
  created: number;
  updated: number;
  skipped: number;
  /** Sanity `_type` -> Payload documents written for it. */
  byType: Record<string, number>;
}

/**
 * The slice of Payload's local API this importer uses. Narrow on purpose: it
 * is what lets the whole loop be tested against an in-memory store instead of
 * against Neon.
 */
export interface DocumentClient {
  /** Every id already present in a collection. One query, for resumability. */
  existingIds(collection: string): Promise<Set<string>>;
  /** Whether a global has ever been written. */
  globalExists(slug: string): Promise<boolean>;
  create(args: { collection: string; data: PayloadData; locale: Locale }): Promise<void>;
  update(args: { collection: string; id: string; data: PayloadData; locale: Locale }): Promise<void>;
  updateGlobal(args: { slug: string; data: PayloadData; locale: Locale }): Promise<void>;
}

export interface DocumentImportOptions {
  client: DocumentClient;
  /** Skip documents that already exist instead of updating them. */
  resume?: boolean;
  /** Total tries per document, including the first. Default 3. */
  attempts?: number;
  retryDelayMs?: number;
  /**
   * Documents written at once **within one Sanity type**. Types stay
   * barriered, so dependency order is untouched; only siblings overlap.
   *
   * Measured: writing serially against the Neon pooler costs ~5-7s per
   * document — a create with drafts enabled is a transaction of dozens of
   * round trips, and a four-locale document is four of them. Serial, the full
   * import runs well over an hour, which is long enough to lose to a dropped
   * connection. Default 4; `1` restores the serial order.
   */
  concurrency?: number;
  /**
   * Abort early once this many documents have failed. A handful of broken
   * documents is worth finishing the run for; a systematic failure is not
   * worth grinding through 384 of them three times. Default 5.
   */
  maxFailures?: number;
  onProgress?: (progress: {
    index: number;
    total: number;
    target: DocumentTarget;
    action: "created" | "updated" | "skipped";
    locales: Locale[];
  }) => void;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The write loop, over an injected client.
 *
 * A document is written once per locale that carries distinct content: the
 * first write creates (or updates) it, each later one fills that locale's
 * lane. `en` is always first, because it is the default locale and the one
 * every other falls back to.
 */
export async function importDocumentTargets(
  targets: DocumentTarget[],
  options: DocumentImportOptions,
): Promise<ImportSummary> {
  const { client, resume = false, attempts = 3, retryDelayMs = 1000, concurrency = 4, onProgress } = options;

  // One read-back per collection before anything is written. This is what
  // makes a re-run an upsert rather than a duplicate-key crash, and what makes
  // a killed run cost one document rather than the whole run.
  const existing = new Map<string, Set<string>>();
  for (const collection of new Set(targets.filter((t) => t.kind === "collection").map((t) => t.slug))) {
    existing.set(collection, await client.existingIds(collection));
  }
  const globalsPresent = new Map<string, boolean>();
  for (const slug of new Set(targets.filter((t) => t.kind === "global").map((t) => t.slug))) {
    // Tolerant on purpose. `onboardingContent` currently cannot be READ at all
    // — its locales table has 197 columns and Payload's Postgres adapter
    // selects them through `json_build_array(...)`, which Postgres caps at 100
    // arguments (SQLSTATE 54023). A probe that threw here would abort the run
    // before a single one of the other 383 documents was written.
    try {
      globalsPresent.set(slug, await client.globalExists(slug));
    } catch {
      globalsPresent.set(slug, false);
    }
  }

  const summary: ImportSummary = { created: 0, updated: 0, skipped: 0, byType: {} };
  const failures: { target: DocumentTarget; error: unknown }[] = [];
  const maxFailures = options.maxFailures ?? 5;
  let index = 0;

  const one = async (target: DocumentTarget): Promise<void> => {
    const locales = LOCALES.filter((locale) => target.data[locale] !== undefined);
    const present =
      target.kind === "global"
        ? globalsPresent.get(target.slug) === true
        : existing.get(target.slug)?.has(target.id) === true;

    if (present && resume) {
      summary.skipped += 1;
      onProgress?.({ index: ++index, total: targets.length, target, action: "skipped", locales });
      return;
    }

    let lastError: unknown;
    // A retry must not re-create: an attempt that created the document in `en`
    // and then failed on `es` would otherwise hit the id's unique index and
    // fail forever. `exists` latches once the create lands.
    let exists = present;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        await writeTarget(client, target, locales, exists, () => {
          exists = true;
        });
        lastError = undefined;
        break;
      } catch (error) {
        lastError = error;
        if (attempt < attempts) await sleep(retryDelayMs * attempt);
      }
    }
    if (lastError) {
      // Recorded, not thrown here: a single unimportable document must not
      // discard the 383 that would have followed it. The run finishes and then
      // throws an aggregate naming every failure — loud, but late enough that
      // everything importable is already durable and a re-run is a no-op for it.
      failures.push({ target, error: lastError });
      if (failures.length > maxFailures) {
        throw new ImportFailure(failures, summary, `more than ${maxFailures} documents failed; stopping early`);
      }
      return;
    }

    if (present) summary.updated += 1;
    else summary.created += 1;
    if (target.kind === "collection") existing.get(target.slug)?.add(target.id);
    else globalsPresent.set(target.slug, true);
    summary.byType[target.sanityType] = (summary.byType[target.sanityType] ?? 0) + 1;
    onProgress?.({
      index: ++index,
      total: targets.length,
      target,
      action: present ? "updated" : "created",
      locales,
    });
  };

  // One barrier per Sanity type. Siblings inside a type have no dependency on
  // each other — every cross-document reference points at an EARLIER type, and
  // `IMPORT_ORDER` is what guarantees that — so they can overlap, while the
  // barrier keeps a page from being written before the agendas it links to.
  for (const run of runsByType(targets)) {
    const limit = run[0].kind === "global" ? 1 : Math.max(1, concurrency);
    await inPool(run, limit, one);
  }

  if (failures.length > 0) throw new ImportFailure(failures, summary);
  return summary;
}

/**
 * Every document the run could not write, thrown once at the end.
 *
 * `summary` carries what DID land, so a caller (and the log) can tell the
 * difference between "the import failed" and "the import wrote 383 of 384 and
 * here is the one that is broken".
 */
export class ImportFailure extends Error {
  constructor(
    readonly failures: { target: DocumentTarget; error: unknown }[],
    readonly summary: ImportSummary,
    reason = "some documents could not be imported",
  ) {
    super(
      `${reason}. ${summary.created} created, ${summary.updated} updated, ${failures.length} failed:\n` +
        failures
          .map(
            ({ target, error }) =>
              `  - ${target.sanityType} ${target.id || `global:${target.slug}`}: ` +
              `${error instanceof Error ? error.message : String(error)}`,
          )
          .join("\n"),
    );
    this.name = "ImportFailure";
  }
}

function runsByType(targets: DocumentTarget[]): DocumentTarget[][] {
  const runs: DocumentTarget[][] = [];
  for (const target of targets) {
    const last = runs[runs.length - 1];
    if (last && last[0].sanityType === target.sanityType) last.push(target);
    else runs.push([target]);
  }
  return runs;
}

async function inPool<T>(items: T[], limit: number, work: (item: T) => Promise<void>): Promise<void> {
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const item = items[next++];
      await work(item);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

async function writeTarget(
  client: DocumentClient,
  target: DocumentTarget,
  locales: Locale[],
  present: boolean,
  onCreated: () => void,
): Promise<void> {
  let exists = present;
  for (const locale of locales) {
    const data = target.data[locale]!;
    if (target.kind === "global") {
      await client.updateGlobal({ slug: target.slug, data, locale });
      continue;
    }
    if (!exists) {
      // The Sanity `_id`, preserved verbatim as the Payload id.
      await client.create({ collection: target.slug, data: { ...data, id: target.id }, locale });
      exists = true;
      onCreated();
    } else {
      await client.update({ collection: target.slug, id: target.id, data, locale });
    }
  }
}

// ---------------------------------------------------------------------------
// Real run
// ---------------------------------------------------------------------------

async function loadEnv(): Promise<void> {
  const { default: dotenv } = await import("dotenv");
  // `.env.local` first: dotenv does not overwrite an already-set variable, so
  // its PAYLOAD_DATABASE_URL (the dev CMS database) wins.
  dotenv.config({ path: path.join(REPO_ROOT, ".env.local"), quiet: true });
  dotenv.config({ path: path.join(REPO_ROOT, ".env"), quiet: true });
}

type PayloadInstance = Awaited<ReturnType<typeof import("payload").getPayload>>;

async function getPayloadInstance(): Promise<PayloadInstance> {
  const [{ getPayload }, { default: config }] = await Promise.all([
    import("payload"),
    import("@payload-config"),
  ]);
  return getPayload({ config });
}

/**
 * The asset map Task 11 produced, read back off Payload rather than by
 * re-running the asset import: every upload stores its source `sanityAssetId`,
 * and the map is what `transform.ts` resolves `_sanityAsset` strings through.
 * A missing asset becomes a named error, not a null image.
 */
async function readAssetMap(payload: PayloadInstance): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const collection of ["media", "files"] as const) {
    const found = await payload.find({
      collection,
      depth: 0,
      limit: 0,
      pagination: false,
      overrideAccess: true,
      select: { sanityAssetId: true },
    });
    for (const doc of found.docs) {
      const sanityAssetId = (doc as { sanityAssetId?: string | null }).sanityAssetId;
      if (sanityAssetId) map.set(sanityAssetId, String(doc.id));
    }
  }
  return map;
}

function payloadDocumentClient(payload: PayloadInstance): DocumentClient {
  return {
    async existingIds(collection) {
      const found = await payload.find({
        collection: collection as Parameters<typeof payload.find>[0]["collection"],
        depth: 0,
        limit: 0,
        pagination: false,
        overrideAccess: true,
        // Drafts included: a document whose only version is a draft still owns
        // its id, and creating over it would collide.
        draft: true,
        select: {},
      });
      return new Set(found.docs.map((doc) => String(doc.id)));
    },
    async globalExists(slug) {
      const found = (await payload.findGlobal({
        slug: slug as Parameters<typeof payload.findGlobal>[0]["slug"],
        depth: 0,
        overrideAccess: true,
      })) as { id?: unknown; updatedAt?: unknown } | null;
      return Boolean(found && (found.id !== undefined || found.updatedAt !== undefined));
    },
    async create({ collection, data, locale }) {
      await payload.create({
        collection: collection as Parameters<typeof payload.create>[0]["collection"],
        data: data as never,
        locale,
        depth: 0,
        overrideAccess: true,
      });
    },
    async update({ collection, id, data, locale }) {
      await payload.update({
        collection: collection as Parameters<typeof payload.update>[0]["collection"],
        id,
        data: data as never,
        locale,
        depth: 0,
        overrideAccess: true,
      });
    },
    async updateGlobal({ slug, data, locale }) {
      await payload.updateGlobal({
        slug: slug as Parameters<typeof payload.updateGlobal>[0]["slug"],
        data: data as never,
        locale,
        depth: 0,
        overrideAccess: true,
      });
    },
  };
}

/** A client that answers "nothing exists yet" and never writes. */
function dryRunClient(): DocumentClient {
  return {
    async existingIds() {
      return new Set();
    },
    async globalExists() {
      return false;
    },
    async create() {},
    async update() {},
    async updateGlobal() {},
  };
}

export interface ImportDocumentsOptions {
  dryRun?: boolean;
  resume?: boolean;
  quiet?: boolean;
  /** Restrict the run to these Sanity `_type`s. */
  only?: string[];
  /** Documents written at once within one type. Default 4. */
  concurrency?: number;
}

/**
 * Imports every published Sanity document. Idempotent: a second run updates
 * in place and creates nothing.
 */
export async function importDocuments(options: ImportDocumentsOptions = {}): Promise<ImportSummary> {
  await loadEnv();
  const database = assertPayloadDatabase(process.env.PAYLOAD_DATABASE_URL);

  const exportDir = await extractArchive({ verifyChecksum: false });
  const docs = (await readExportDocuments(exportDir)) as SanityDoc[];

  const payload = options.dryRun ? undefined : await getPayloadInstance();
  const assets = payload ? await readAssetMap(payload) : await dryRunAssetMap(docs);

  const ctx: TransformContext = { assets, known: new Set() };
  const { targets, skipped } = documentTargets(docs, ctx);
  const selected = options.only?.length ? targets.filter((t) => options.only!.includes(t.sanityType)) : targets;

  if (!options.quiet) {
    console.log(`database:   ${database}`);
    console.log(`export:     ${exportDir}`);
    console.log(`assets:     ${assets.size} uploads available`);
    console.log(`documents:  ${docs.length} lines -> ${targets.length} Payload documents (${skipped.length} skipped)`);
    if (options.only?.length) console.log(`only:       ${options.only.join(", ")} (${selected.length} documents)`);
    if (options.dryRun) console.log("mode:       DRY RUN — nothing will be written");
    if (options.resume) console.log("mode:       RESUME — existing documents are skipped, not updated");
  }

  const client = payload ? payloadDocumentClient(payload) : dryRunClient();
  let failure: ImportFailure | undefined;
  let summary: ImportSummary;
  try {
    summary = await importDocumentTargets(selected, {
    client,
      resume: options.resume,
      concurrency: options.concurrency,
      onProgress: options.quiet
        ? undefined
        : ({ index, total, target, action, locales }) => {
            console.log(
              `[${String(index).padStart(3)}/${total}] ${action.padEnd(7)} ${target.sanityType.padEnd(22)} ` +
                `${(target.id || `global:${target.slug}`).padEnd(56)} ${locales.join(",")}`,
            );
          },
    });
  } catch (error) {
    if (!(error instanceof ImportFailure)) throw error;
    // The summary is still worth printing — and so is the list of what failed.
    failure = error;
    summary = error.summary;
  }
  summary.skipped += skipped.length;

  const unplaced = new Map<string, number>();
  for (const target of selected) {
    for (const entry of target.unplaced) unplaced.set(entry, (unplaced.get(entry) ?? 0) + 1);
  }

  if (!options.quiet) {
    console.log(
      `\ncreated: ${summary.created}  updated: ${summary.updated}  skipped: ${summary.skipped}` +
        `\nby type: ${Object.entries(summary.byType)
          .map(([k, v]) => `${k} ${v}`)
          .join(", ")}`,
    );
    if (unplaced.size > 0) {
      console.log(`\nfields with no declared Payload home (${unplaced.size} distinct):`);
      for (const [entry, count] of [...unplaced].sort()) console.log(`  x${count} ${entry}`);
    }
  }
  if (failure) throw failure;
  return summary;
}

/**
 * In a dry run there is no Payload to read the asset map from, so it is
 * reconstructed from the archive's own asset directory. Enough to prove every
 * `_sanityAsset` string resolves; it writes nothing.
 */
async function dryRunAssetMap(docs: SanityDoc[]): Promise<Map<string, string>> {
  const { loadSanityExport } = await import("./lib/sanity-export");
  const { assets } = await loadSanityExport({ verifyChecksum: false });
  void docs;
  return new Map(assets.map((asset) => [asset.id, asset.id]));
}

const invokedDirectly =
  typeof process !== "undefined" &&
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (invokedDirectly) {
  const argv = process.argv.slice(2);
  const onlyFlag = argv.find((a) => a.startsWith("--only="));
  const concurrencyFlag = argv.find((a) => a.startsWith("--concurrency="));
  importDocuments({
    dryRun: argv.includes("--dry-run"),
    resume: argv.includes("--resume"),
    only: onlyFlag ? onlyFlag.slice("--only=".length).split(",").filter(Boolean) : undefined,
    concurrency: concurrencyFlag ? Number(concurrencyFlag.slice("--concurrency=".length)) : undefined,
  })
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
