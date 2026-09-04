/**
 * Task 13 — verify the whole import against the archive it came from.
 *
 * Usage:
 *   pnpm verify:import            # every check, exits 1 on any failure
 *   pnpm verify:import -- --json  # machine-readable report on stdout
 *
 * `verifyImport()` reads Payload back and compares it, check by check, against
 * the Phase 0 archive and `docs/migration/sanity-archive-manifest.json`. It
 * fails loudly: every mismatch becomes a named check with the first failures
 * listed, and the CLI exits non-zero.
 *
 * ## The two numbers that must be reconciled before anything is compared
 *
 * **446 vs 438.** The manifest counts **446** published documents; the plan's
 * exit criteria say **438**. The difference is exactly the **8
 * `translation.metadata`** documents — Sanity's own cross-language link table,
 * deliberately not imported because the import collapses locales by slug
 * instead. Comparing the wrong pair fails a correct import, so
 * `reconcileManifest` subtracts them explicitly and reports both figures.
 *
 * **Draft versions are counted by status, never by row.** The `_*_v` tables
 * already held 1,323 rows before a single draft existed — all `published`,
 * because every idempotent re-run of Task 12 writes a fresh published version
 * snapshot (`_tags_v` alone is at 740 rows for 67 documents). A verifier that
 * counted rows would report four figures instead of 30. What is counted here is
 * the number of **documents that carry at least one draft version**, which is
 * stable across re-runs of both importers.
 *
 * ## What the transform output is used for
 *
 * The archive is re-transformed in memory and the result is the oracle: the
 * expected id set, the expected per-collection counts, the expected upload
 * references and the expected non-empty rich text all come from it. That is
 * deliberate — it makes this a check of *the database*, using the same pure
 * function Task 12's unit tests pin down, rather than a second hand-written
 * model of the schema that could drift.
 */

import path from "node:path";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { assertPayloadDatabase } from "./assets";
import { readAssetMap } from "./documents";
import { draftTargets, getPayloadInstance, type DraftTarget } from "./drafts";
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

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

export interface VerificationCheck {
  name: string;
  ok: boolean;
  expected: string;
  actual: string;
  /** The first few concrete mismatches, for a report that can be acted on. */
  failures: string[];
}

export interface VerificationReport {
  ok: boolean;
  database: string;
  checks: VerificationCheck[];
}

const MAX_FAILURES_LISTED = 12;

function check(
  name: string,
  expected: string | number,
  actual: string | number,
  failures: string[] = [],
): VerificationCheck {
  return {
    name,
    ok: String(expected) === String(actual) && failures.length === 0,
    expected: String(expected),
    actual: String(actual),
    failures: failures.slice(0, MAX_FAILURES_LISTED),
  };
}

// ---------------------------------------------------------------------------
// Pure comparators
// ---------------------------------------------------------------------------

export interface ArchiveManifest {
  totals?: { documents?: number; published?: number; drafts?: number };
  byType?: Record<string, { published?: number; drafts?: number }>;
}

/**
 * Sanity types present in the archive that are deliberately never imported.
 *
 * `translation.metadata` is the whole of the 446/438 gap. It links languages
 * for 1 of the 9 page groups (2 of its 4 languages), which is exactly why the
 * import groups by slug instead.
 */
export const NOT_IMPORTED_TYPES = ["translation.metadata"] as const;

export interface ManifestExpectations {
  /** What the manifest says, unmodified: 446. */
  publishedInManifest: number;
  /** What must actually land: 438. */
  publishedImported: number;
  /** Type -> published count, for the types that are excluded. */
  excluded: Record<string, number>;
  /** Type -> published count, for the types that are imported. */
  publishedByType: Record<string, number>;
  /** 30 — the manifest already excludes `sanity.*`. */
  drafts: number;
  draftsByType: Record<string, number>;
}

export function reconcileManifest(manifest: ArchiveManifest): ManifestExpectations {
  const byType = manifest.byType ?? {};
  const excluded: Record<string, number> = {};
  const publishedByType: Record<string, number> = {};
  const draftsByType: Record<string, number> = {};
  let publishedImported = 0;
  let drafts = 0;

  for (const [type, counts] of Object.entries(byType)) {
    const published = counts.published ?? 0;
    if ((NOT_IMPORTED_TYPES as readonly string[]).includes(type)) {
      excluded[type] = published;
      continue;
    }
    publishedByType[type] = published;
    publishedImported += published;
    if (counts.drafts) {
      draftsByType[type] = counts.drafts;
      drafts += counts.drafts;
    }
  }

  return {
    publishedInManifest: manifest.totals?.published ?? 0,
    publishedImported,
    excluded,
    publishedByType,
    drafts,
    draftsByType,
  };
}

/** Per-type published and draft counts straight off the archive, `sanity.*` filtered. */
export function archiveCounts(docs: SanityDoc[]): {
  published: Record<string, number>;
  drafts: Record<string, number>;
  system: number;
} {
  const published: Record<string, number> = {};
  const drafts: Record<string, number> = {};
  let system = 0;
  for (const doc of docs) {
    const id = String(doc._id ?? "");
    const type = String(doc._type ?? "");
    if (type.startsWith("sanity.")) {
      system += 1;
      continue;
    }
    const bucket = id.startsWith("drafts.") ? drafts : published;
    bucket[type] = (bucket[type] ?? 0) + 1;
  }
  return { published, drafts, system };
}

/**
 * How many *documents* carry a draft version.
 *
 * Deliberately not a row count. See the module comment: the version tables
 * accumulate one published snapshot per document per import run, and the draft
 * writes accumulate the same way (one row per locale written, per run), so the
 * only stable measure is the distinct parent.
 */
export function countDraftDocuments(rows: DraftVersionRow[]): Set<string> {
  const parents = new Set<string>();
  for (const row of rows) if (row.status === "draft") parents.add(row.parent);
  return parents;
}

export interface DraftVersionRow {
  parent: string;
  status: string;
  /** Payload's own marker for the version a further edit will be based on. */
  latest: boolean;
}

/**
 * The documents whose *newest* version is the draft.
 *
 * This is the sharper of the two draft measures, and it is the one that
 * protects the 21 lived experiences. `getLatestCollectionVersion` bases every
 * subsequent edit on the `latest: true` version, and a published save takes
 * that flag — so re-running the **document** import after the draft import
 * buries every pending edit behind a published snapshot. The rows survive, and
 * `countDraftDocuments` would still report 30, but the moderation work is no
 * longer what an editor opening the document sees.
 *
 * The rule this encodes: `pnpm import:documents` runs *before*
 * `pnpm import:drafts`, never after.
 */
export function latestIsDraft(rows: DraftVersionRow[]): Set<string> {
  const parents = new Set<string>();
  for (const row of rows) if (row.status === "draft" && row.latest) parents.add(row.parent);
  return parents;
}

interface CollectedValues {
  /** path -> non-empty string. */
  text: Map<string, string>;
  /** path -> number of children in a non-empty Lexical root. */
  richText: Map<string, number>;
  /** path -> upload id. */
  uploads: Map<string, string>;
}

const SKIPPED_KEYS = new Set(["id", "createdAt", "updatedAt", "_status", "sanityAssetId", "blockType"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** A Lexical editor state, i.e. `{ root: { children: [...] } }`. */
export function lexicalChildCount(value: unknown): number | undefined {
  if (!isRecord(value)) return undefined;
  const root = value.root;
  if (!isRecord(root) || !Array.isArray(root.children)) return undefined;
  return root.children.length;
}

/**
 * Walks a document and pulls out the three things worth comparing: non-empty
 * strings, non-empty rich text and upload references, each keyed by its path.
 *
 * Paths, not values, are the comparison key — an array row keeps its index, so
 * a reordered or dropped row shows up as a missing path rather than as a
 * silently different document.
 */
export function collectValues(value: unknown, uploads: ReadonlySet<string>): CollectedValues {
  const out: CollectedValues = { text: new Map(), richText: new Map(), uploads: new Map() };

  const walk = (node: unknown, at: string): void => {
    if (typeof node === "string") {
      if (node.length === 0) return;
      if (uploads.has(node)) out.uploads.set(at, node);
      else out.text.set(at, node);
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((item, i) => walk(item, `${at}[${i}]`));
      return;
    }
    if (!isRecord(node)) return;
    const children = lexicalChildCount(node);
    if (children !== undefined) {
      if (children > 0) out.richText.set(at, children);
      return;
    }
    for (const [key, child] of Object.entries(node)) {
      if (SKIPPED_KEYS.has(key)) continue;
      walk(child, at ? `${at}.${key}` : key);
    }
  };

  walk(value, "");
  return out;
}

/**
 * Portable Text arrays in a Sanity document, counted per locale lane.
 *
 * The shapes in the dataset are a bare array of blocks and an `{en, es, …}`
 * object of them; both are counted once per lane that holds content, which is
 * what the Payload side has after locale collapsing.
 */
export function countPortableTextFields(doc: SanityDoc, locale: Locale): number {
  let count = 0;
  const isPortableText = (value: unknown): boolean =>
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((node) => isRecord(node) && typeof node._type === "string");

  const walk = (node: unknown): void => {
    if (Array.isArray(node)) {
      if (isPortableText(node) && node.some((n) => isRecord(n) && n._type === "block")) {
        count += 1;
        return;
      }
      node.forEach(walk);
      return;
    }
    if (!isRecord(node)) return;
    // An `{en, es, fr, ar}` lane object: exactly one of its lanes reaches
    // Payload for a given locale, and `en` is what the others fall back to —
    // so it contributes one field, not four.
    const keys = Object.keys(node).filter((key) => !key.startsWith("_"));
    if (keys.length > 0 && keys.every((key) => (LOCALES as readonly string[]).includes(key))) {
      walk(node[locale] ?? node.en);
      return;
    }
    for (const key of keys) walk(node[key]);
  };

  walk(doc);
  return count;
}

// ---------------------------------------------------------------------------
// The client this verifier reads Payload through
// ---------------------------------------------------------------------------

export interface VerifyClient {
  /** Every id in a collection, drafts included. */
  ids(collection: string): Promise<Set<string>>;
  /** Every document in a collection, read in one locale with `en` fallback. */
  docs(collection: string, locale: Locale): Promise<Record<string, unknown>[]>;
  /** Version rows with `_status: 'draft'`. */
  draftVersions(collection: string): Promise<DraftVersionRow[]>;
  countUploads(collection: "media" | "files"): Promise<number>;
  uploadIds(): Promise<Set<string>>;
  global(slug: string, locale: Locale): Promise<Record<string, unknown> | null>;
}

export interface VerifyOptions {
  client?: VerifyClient;
  quiet?: boolean;
}

/** Globals that have a Sanity source and must therefore read back populated. */
export const SOURCED_GLOBALS = [
  "homepage",
  "siteAnnouncement",
  "onboardingContent",
  "onboardingBasicInfo",
  "onboardingWorkInfo",
  "onboardingRecentWork",
  "onboardingPrivacy",
  "onboardingReview",
] as const;

/** Task 11's measured asset counts. Nothing in Task 12 or 13 may change them. */
export const EXPECTED_UPLOADS = { media: 347, files: 48 } as const;

/**
 * Rich text that Sanity holds and Payload has no field for — by decision, and
 * on the record.
 *
 * `author.bio` is Portable Text on exactly 2 of 95 authors.
 * `payload/collections/authors.ts` has no rich-text field, because Task 4
 * modelled the collection on the other 93, and `transform.ts` names it in
 * `AUTHOR_DROPPED` rather than dropping it quietly. Adding an `authors.bio`
 * field is a schema change with its own migration, not something an importer
 * invents; the two bodies survive in the Phase 0 archive either way.
 *
 * This is an allowance for **these two documents by id**, not a rule about
 * `author.bio` — a third author growing a bio still fails `richtext/sanity-coverage`,
 * which is the point of writing it out rather than special-casing the field.
 */
export const RICH_TEXT_NOT_MODELLED: Readonly<Record<string, number>> = {
  "authors/author-ccm-community": 1,
  "authors/author-ccm-case-studies": 1,
};

export async function verifyImport(options: VerifyOptions = {}): Promise<VerificationReport> {
  await loadEnv();
  const database = assertPayloadDatabase(process.env.PAYLOAD_DATABASE_URL);
  const log = options.quiet ? () => {} : (msg: string) => console.log(msg);

  const exportDir = await extractArchive({ verifyChecksum: false });
  const docs = (await readExportDocuments(exportDir)) as SanityDoc[];
  const manifest = JSON.parse(
    await readFile(path.join(REPO_ROOT, "docs/migration/sanity-archive-manifest.json"), "utf8"),
  ) as ArchiveManifest;

  const payload = options.client ? undefined : await getPayloadInstance();
  const client = options.client ?? payloadVerifyClient(payload!);

  const uploads = await client.uploadIds();
  const assets = payload ? await readAssetMap(payload) : new Map([...uploads].map((id) => [id, id]));

  // The oracle: the same pure transform Task 12 wrote through.
  const published = documentTargets(docs, { assets, known: new Set() });
  const drafts = draftTargets(docs, { assets, known: new Set() });

  const checks: VerificationCheck[] = [];
  const push = (c: VerificationCheck) => {
    checks.push(c);
    log(`${c.ok ? "PASS" : "FAIL"}  ${c.name.padEnd(38)} expected ${c.expected} · actual ${c.actual}`);
    for (const failure of c.failures) log(`        ${failure}`);
  };

  // ---- 1. the archive against the manifest, reconciled -------------------
  const expectations = reconcileManifest(manifest);
  const counted = archiveCounts(docs);

  const perTypeFailures: string[] = [];
  for (const [type, expected] of Object.entries(expectations.publishedByType)) {
    const actual = counted.published[type] ?? 0;
    if (actual !== expected) perTypeFailures.push(`${type}: manifest ${expected}, archive ${actual}`);
  }
  for (const type of Object.keys(counted.published)) {
    if (!(type in expectations.publishedByType) && !(type in expectations.excluded)) {
      perTypeFailures.push(`${type}: in the archive but not in the manifest`);
    }
  }
  const typeCount = Object.keys(expectations.publishedByType).length;
  push(check("manifest/published-by-type", typeCount, typeCount - perTypeFailures.length, perTypeFailures));
  // 446 - 8 translation.metadata = 438. This is the reconciliation itself: if
  // the manifest's own total and its per-type breakdown ever disagree, every
  // count below is measured against the wrong number.
  const excludedTotal = Object.values(expectations.excluded).reduce((a, b) => a + b, 0);
  push(
    check(
      "manifest/438-reconciles-with-446",
      expectations.publishedInManifest - excludedTotal,
      expectations.publishedImported,
    ),
  );
  push(
    check(
      "manifest/published-total",
      expectations.publishedImported,
      Object.values(counted.published).reduce((a, b) => a + b, 0) - excludedTotal,
    ),
  );
  push(check("manifest/content-drafts", expectations.drafts, drafts.targets.length));
  push(check("manifest/system-drafts-filtered", 3, drafts.system.length));

  // ---- 2. uploads survived ----------------------------------------------
  for (const collection of ["media", "files"] as const) {
    push(check(`uploads/${collection}`, EXPECTED_UPLOADS[collection], await client.countUploads(collection)));
  }

  // ---- 3. every Sanity id is a Payload id --------------------------------
  const expectedIds = new Map<string, Set<string>>();
  for (const target of published.targets) {
    if (target.kind !== "collection") continue;
    if (!expectedIds.has(target.slug)) expectedIds.set(target.slug, new Set());
    expectedIds.get(target.slug)!.add(target.id);
  }
  for (const target of drafts.targets) {
    if (target.overPublished) continue;
    if (!expectedIds.has(target.slug)) expectedIds.set(target.slug, new Set());
    expectedIds.get(target.slug)!.add(target.id);
  }

  const actualIds = new Map<string, Set<string>>();
  for (const slug of expectedIds.keys()) actualIds.set(slug, await client.ids(slug));

  const idFailures: string[] = [];
  let expectedTotal = 0;
  let actualTotal = 0;
  for (const [slug, expected] of expectedIds) {
    const actual = actualIds.get(slug)!;
    expectedTotal += expected.size;
    actualTotal += actual.size;
    for (const id of expected) if (!actual.has(id)) idFailures.push(`${slug}: missing ${id}`);
    for (const id of actual) if (!expected.has(id)) idFailures.push(`${slug}: unexpected ${id}`);
  }
  push(check("documents/ids", expectedTotal, actualTotal, idFailures));

  const countFailures: string[] = [];
  for (const [slug, expected] of expectedIds) {
    const actual = actualIds.get(slug)!.size;
    if (actual !== expected.size) countFailures.push(`${slug}: expected ${expected.size}, got ${actual}`);
  }
  push(
    check("documents/per-collection", expectedIds.size, expectedIds.size - countFailures.length, countFailures),
  );

  // Every published Sanity `_id` must be accounted for — either as a Payload
  // id or as one of the further-language documents that collapsed into one.
  const accounted = new Set<string>();
  for (const target of published.targets) for (const source of target.sources) accounted.add(source);
  const unaccounted = docs
    .map((d) => String(d._id ?? ""))
    .filter(
      (id) =>
        !id.startsWith("drafts.") &&
        !accounted.has(id) &&
        !(NOT_IMPORTED_TYPES as readonly string[]).includes(
          String(docs.find((d) => d._id === id)?._type ?? ""),
        ),
    );
  push(check("documents/every-sanity-id-accounted", 0, unaccounted.length, unaccounted.map((id) => `orphan ${id}`)));

  // ---- 4. draft versions, by status --------------------------------------
  const draftParents = new Map<string, Set<string>>();
  const latestDraftParents = new Map<string, Set<string>>();
  for (const slug of new Set(drafts.targets.map((t) => t.slug))) {
    const rows = await client.draftVersions(slug);
    draftParents.set(slug, countDraftDocuments(rows));
    latestDraftParents.set(slug, latestIsDraft(rows));
  }
  const draftFailures: string[] = [];
  const latestFailures: string[] = [];
  let draftTotal = 0;
  const draftsByType: Record<string, number> = {};
  for (const target of drafts.targets) {
    if (!draftParents.get(target.slug)?.has(target.id)) {
      draftFailures.push(`${target.sanityType} ${target.draftId} -> ${target.slug}/${target.id}: no draft version`);
    } else {
      draftsByType[target.sanityType] = (draftsByType[target.sanityType] ?? 0) + 1;
    }
    if (!latestDraftParents.get(target.slug)?.has(target.id)) {
      latestFailures.push(
        `${target.sanityType} ${target.slug}/${target.id}: a published version is newer than the draft — ` +
          `re-run \`pnpm import:drafts\` (documents first, drafts last)`,
      );
    }
  }
  for (const set of draftParents.values()) draftTotal += set.size;
  push(check("drafts/documents-with-a-draft-version", drafts.targets.length, draftTotal, draftFailures));
  push(
    check(
      "drafts/draft-is-the-newest-version",
      drafts.targets.length,
      drafts.targets.length - latestFailures.length,
      latestFailures,
    ),
  );
  push(
    check(
      "drafts/lived-experiences",
      expectations.draftsByType.livedExperience ?? 21,
      draftsByType.livedExperience ?? 0,
    ),
  );
  push(
    check(
      "drafts/by-type",
      Object.entries(expectations.draftsByType)
        .sort()
        .map(([t, n]) => `${t} ${n}`)
        .join(", "),
      Object.entries(draftsByType)
        .sort()
        .map(([t, n]) => `${t} ${n}`)
        .join(", "),
    ),
  );

  // ---- 5-7. content, per locale ------------------------------------------
  const byTarget = new Map<string, DocumentTarget | DraftTarget>();
  for (const target of published.targets) {
    if (target.kind === "collection") byTarget.set(`${target.slug}/${target.id}`, target);
  }
  const sanityById = new Map(docs.map((doc) => [String(doc._id ?? ""), doc]));
  const localeFailures: string[] = [];
  const uploadFailures: string[] = [];
  const richTextFailures: string[] = [];
  const coverageFailures: string[] = [];
  let localeChecked = 0;
  let uploadChecked = 0;
  let richTextChecked = 0;
  let coverageChecked = 0;

  for (const slug of expectedIds.keys()) {
    for (const locale of LOCALES) {
      const readBack = await client.docs(slug, locale);
      const found = new Map(readBack.map((doc) => [String(doc.id), doc]));
      for (const id of expectedIds.get(slug)!) {
        const target = byTarget.get(`${slug}/${id}`);
        // Never-published drafts have no published target; their content is
        // checked by the draft-version check above, not here.
        if (!target) continue;
        const expectedData = (target.data[locale] ?? target.data.en) as PayloadData | undefined;
        const actualDoc = found.get(id);
        if (!expectedData || !actualDoc) continue;

        const want = collectValues(expectedData, uploads);
        const got = collectValues(actualDoc, uploads);

        for (const [at, value] of want.text) {
          localeChecked += 1;
          const actual = got.text.get(at);
          if (actual === undefined) {
            localeFailures.push(`${slug}/${id} [${locale}] ${at}: expected ${JSON.stringify(value.slice(0, 40))}, empty`);
          }
        }
        for (const [at, assetId] of want.uploads) {
          uploadChecked += 1;
          if (!uploads.has(assetId)) uploadFailures.push(`${slug}/${id} ${at}: ${assetId} is not an upload`);
          else if (got.uploads.get(at) !== assetId) {
            uploadFailures.push(`${slug}/${id} [${locale}] ${at}: expected ${assetId}, got ${got.uploads.get(at) ?? "nothing"}`);
          }
        }
        for (const [at, children] of want.richText) {
          richTextChecked += 1;
          const actual = got.richText.get(at);
          if (actual === undefined || actual === 0) {
            richTextFailures.push(`${slug}/${id} [${locale}] ${at}: ${children} blocks in Sanity, empty in Payload`);
          }
        }

        // The transform is the oracle for the three checks above, which means
        // a rich-text field it never mapped would be invisible to all three.
        // This one goes back to the archive: count the Portable Text arrays in
        // the source document and require at least as many non-empty Lexical
        // roots in Payload.
        if (locale === "en") {
          const source = target.sources.map((s) => sanityById.get(s)).find((d) => d !== undefined);
          if (source) {
            coverageChecked += 1;
            const allowed = RICH_TEXT_NOT_MODELLED[`${slug}/${id}`] ?? 0;
            const inSanity = countPortableTextFields(source, "en") - allowed;
            const inPayload = got.richText.size;
            if (inPayload < inSanity) {
              coverageFailures.push(
                `${slug}/${id}: ${inSanity} Portable Text fields in Sanity` +
                  `${allowed ? ` (${allowed} not modelled)` : ""}, ${inPayload} in Payload`,
              );
            }
          }
        }
      }
    }
    log(`      read back ${slug} in 4 locales`);
  }

  push(check("locales/all-four-populated", localeChecked, localeChecked - localeFailures.length, localeFailures));
  push(check("uploads/references-resolve", uploadChecked, uploadChecked - uploadFailures.length, uploadFailures));
  push(check("richtext/non-empty", richTextChecked, richTextChecked - richTextFailures.length, richTextFailures));
  push(
    check(
      "richtext/sanity-coverage",
      coverageChecked,
      coverageChecked - coverageFailures.length,
      coverageFailures,
    ),
  );

  // ---- 8. globals --------------------------------------------------------
  const globalFailures: string[] = [];
  for (const slug of SOURCED_GLOBALS) {
    for (const locale of LOCALES) {
      let value: Record<string, unknown> | null = null;
      try {
        value = await client.global(slug, locale);
      } catch (error) {
        globalFailures.push(`${slug} [${locale}]: ${error instanceof Error ? error.message : String(error)}`);
        continue;
      }
      const collected = value ? collectValues(value, uploads) : undefined;
      const populated =
        collected !== undefined &&
        collected.text.size + collected.richText.size + collected.uploads.size > 0;
      if (!populated) globalFailures.push(`${slug} [${locale}]: empty`);
    }
  }
  push(
    check(
      "globals/populated-in-four-locales",
      SOURCED_GLOBALS.length * LOCALES.length,
      SOURCED_GLOBALS.length * LOCALES.length - globalFailures.length,
      globalFailures,
    ),
  );

  const report: VerificationReport = { ok: checks.every((c) => c.ok), database, checks };
  if (!options.quiet) {
    const failed = checks.filter((c) => !c.ok);
    log(
      `\n${checks.length - failed.length}/${checks.length} checks passed` +
        (failed.length ? `\nFAILED: ${failed.map((c) => c.name).join(", ")}` : ""),
    );
  }
  return report;
}

// ---------------------------------------------------------------------------
// Payload-backed client
// ---------------------------------------------------------------------------

type PayloadInstance = Awaited<ReturnType<typeof import("payload").getPayload>>;

function payloadVerifyClient(payload: PayloadInstance): VerifyClient {
  type Collection = Parameters<typeof payload.find>[0]["collection"];
  return {
    async ids(collection) {
      const found = await payload.find({
        collection: collection as Collection,
        depth: 0,
        limit: 0,
        pagination: false,
        overrideAccess: true,
        draft: true,
        select: {},
      });
      return new Set(found.docs.map((doc) => String(doc.id)));
    },
    async docs(collection, locale) {
      const found = await payload.find({
        collection: collection as Collection,
        depth: 0,
        limit: 0,
        pagination: false,
        overrideAccess: true,
        locale,
        fallbackLocale: "en",
      });
      return found.docs as unknown as Record<string, unknown>[];
    },
    async draftVersions(collection) {
      const found = await payload.findVersions({
        collection: collection as Collection,
        depth: 0,
        limit: 0,
        pagination: false,
        overrideAccess: true,
        where: { "version._status": { equals: "draft" } },
      });
      return found.docs.map((row) => ({
        parent: String((row as { parent?: unknown }).parent ?? ""),
        status: String((row as { version?: { _status?: unknown } }).version?._status ?? ""),
        latest: (row as { latest?: unknown }).latest === true,
      }));
    },
    async countUploads(collection) {
      const found = await payload.count({ collection, overrideAccess: true });
      return found.totalDocs;
    },
    async uploadIds() {
      const ids = new Set<string>();
      for (const collection of ["media", "files"] as const) {
        const found = await payload.find({
          collection,
          depth: 0,
          limit: 0,
          pagination: false,
          overrideAccess: true,
          select: {},
        });
        for (const doc of found.docs) ids.add(String(doc.id));
      }
      return ids;
    },
    async global(slug, locale) {
      const found = await payload.findGlobal({
        slug: slug as Parameters<typeof payload.findGlobal>[0]["slug"],
        depth: 0,
        overrideAccess: true,
        locale,
        fallbackLocale: "en",
      });
      return found as unknown as Record<string, unknown> | null;
    },
  };
}

async function loadEnv(): Promise<void> {
  const { default: dotenv } = await import("dotenv");
  dotenv.config({ path: path.join(REPO_ROOT, ".env.local"), quiet: true });
  dotenv.config({ path: path.join(REPO_ROOT, ".env"), quiet: true });
}

const invokedDirectly =
  typeof process !== "undefined" &&
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (invokedDirectly) {
  const json = process.argv.slice(2).includes("--json");
  verifyImport({ quiet: json })
    .then((report) => {
      if (json) console.log(JSON.stringify(report, null, 2));
      process.exit(report.ok ? 0 : 1);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
