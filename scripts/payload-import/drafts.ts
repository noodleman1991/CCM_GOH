/**
 * Task 13 — import Sanity's unpublished edits as Payload **draft versions**.
 *
 * Usage:
 *   pnpm import:drafts                 # import (idempotent; safe to re-run)
 *   pnpm import:drafts -- --dry-run    # transform everything, write nothing
 *
 * **Run this AFTER `pnpm import:documents`, never before or between.** A draft
 * is a version on top of a published document, and Payload bases the next edit
 * on whichever version carries `latest: true`. A published save takes that flag,
 * so re-running the document import afterwards buries all 30 pending edits
 * behind a published snapshot — the rows survive, but an editor opening the
 * document no longer sees the moderation work. `verifyImport`'s
 * `drafts/draft-is-the-newest-version` check exists to catch exactly that.
 *
 * ## Drafts are not documents
 *
 * A `drafts.<id>` record in Sanity is an *unpublished edit of* `<id>`, not a
 * second document. 27 of the 30 have a published counterpart, and for those the
 * published document is already in Payload (Task 12 wrote it) — so the edit is
 * applied on top with `update({ draft: true })`, which leaves the published row
 * untouched and writes a version row with `_status: 'draft'`. The three with no
 * published counterpart are created directly as `_status: 'draft'`.
 *
 * **The 21 lived-experience drafts are in-flight moderation work.** Losing them
 * is the single most damaging thing this phase could do, and it would be
 * invisible: every published document would still look correct.
 *
 * ## Measured facts this file is written against
 *
 * Counted on 2026-09-04 over the Phase 0 archive's 479 ndjson lines, and
 * cross-checked against `docs/migration/sanity-archive-manifest.json`:
 *
 * 1. **The raw `drafts.*` count is 33, not 30.** Three are
 *    `sanity.previewUrlSecret` — a system type, not content. `contentDrafts`
 *    filters `sanity.*` first, so the run neither fails its own count check nor
 *    imports three junk documents.
 * 2. The 30 split `livedExperience` 21, `author` 4, and one each of `caseStudy`,
 *    `newsPost`, `regionalCommunityPage`, `tag`, `testimonial`. All seven of
 *    those collections declare `versions: { drafts: true }`, so every draft has
 *    somewhere to land — checked, not assumed.
 * 3. Exactly 3 have no published counterpart: one `testimonial`, one `tag`, one
 *    `author`. The `author` one carries nothing but an `orderRank`, which is
 *    fine — Payload skips required-field validation for a draft save.
 * 4. **`_status` must be overwritten.** `buildTarget` stamps
 *    `_status: 'published'` on every drafts-enabled collection, and Payload's
 *    update operation disables the draft save when it sees that
 *    (`isSavingDraft = draftArg && … && data._status !== 'published'`). A draft
 *    import that forgot this would silently *publish* all 30 edits.
 * 5. **The Payload id is not always `drafts.<id>` minus the prefix.** The Lane-A
 *    types collapse four language documents into one Payload document keyed by
 *    the English id, so a draft of a non-English `regionalCommunityPage` has to
 *    resolve through the published source index. The one that exists today is
 *    English, but resolving is what makes that a fact rather than a bet.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

import { readAssetMap } from "./documents";
import { assertPayloadDatabase, getPayloadInstance, loadEnv, type PayloadInstance } from "./lib/runtime";
import { extractArchive, readExportDocuments } from "./lib/sanity-export";
import {
  buildTarget,
  documentTargets,
  groupSources,
  IMPORT_ORDER,
  LOCALES,
  type DocumentTarget,
  type Locale,
  type PayloadData,
  type SanityDoc,
  type SourceGroup,
  type TransformContext,
} from "./lib/transform";

export const DRAFT_PREFIX = "drafts.";

export interface DraftTarget extends DocumentTarget {
  /** The `drafts.<id>` record this was built from. */
  draftId: string;
  /**
   * True when the `_id` document is published in Sanity and therefore already
   * in Payload — 27 of 30. Those become a draft version *over* a published
   * document; the other 3 become a document whose only status is `draft`.
   */
  overPublished: boolean;
}

/**
 * The `drafts.*` records that are content.
 *
 * `sanity.*` is Sanity's own namespace — `sanity.previewUrlSecret` here — and
 * it is filtered before anything else so that every count downstream is 30.
 */
export function contentDrafts(docs: SanityDoc[]): { drafts: SanityDoc[]; system: string[] } {
  const drafts: SanityDoc[] = [];
  const system: string[] = [];
  for (const doc of docs) {
    const id = String(doc._id ?? "");
    if (!id.startsWith(DRAFT_PREFIX)) continue;
    const type = String(doc._type ?? "");
    if (type.startsWith("sanity.") || type === "translation.metadata") {
      system.push(id);
      continue;
    }
    drafts.push(doc);
  }
  return { drafts, system };
}

/**
 * Builds one `DraftTarget` per content draft.
 *
 * The published side is transformed first — not because its output is used,
 * but because that is what fills `ctx.known` (so a reference out of a draft
 * resolves) and what produces the source index that maps a Sanity `_id` to the
 * Payload document and locale it ended up in.
 */
export function draftTargets(
  docs: SanityDoc[],
  ctx: TransformContext,
): { targets: DraftTarget[]; system: string[] } {
  const { targets: published } = documentTargets(docs, ctx);
  const { groups } = groupSources(docs);

  // Lane per type, taken from the published grouping rather than re-declared.
  const laneOf = new Map<string, SourceGroup["kind"]>();
  for (const [type, list] of groups) if (list[0]) laneOf.set(type, list[0].kind);

  const byId = new Map(docs.map((doc) => [String(doc._id ?? ""), doc]));
  const index = new Map<string, { target: DocumentTarget; locale: Locale }>();
  for (const target of published) {
    if (target.kind !== "collection") continue;
    for (const source of target.sources) {
      const language = byId.get(source)?.language;
      const locale =
        typeof language === "string" && (LOCALES as readonly string[]).includes(language)
          ? (language as Locale)
          : "en";
      index.set(source, { target, locale });
    }
  }

  const { drafts, system } = contentDrafts(docs);

  // Every id the drafts will occupy, known before any is built: a draft that
  // references another draft's never-published document must resolve, and
  // `reference()` only consults `ctx.known`.
  for (const doc of drafts) {
    const baseId = String(doc._id).slice(DRAFT_PREFIX.length);
    ctx.known.add(index.get(baseId)?.target.id ?? baseId);
  }

  const targets: DraftTarget[] = [];
  for (const doc of drafts) {
    const draftId = String(doc._id);
    const type = String(doc._type ?? "");
    const baseId = draftId.slice(DRAFT_PREFIX.length);
    const entry = index.get(baseId);
    const lane = laneOf.get(type) ?? "single";
    const locale = entry?.locale ?? "en";

    const group: SourceGroup =
      lane === "perLocale"
        ? { kind: "perLocale", canonical: doc, docs: { [locale]: doc } }
        : { kind: "single", canonical: doc };
    const built = buildTarget(type, group, ctx);

    // Obligation 4: `published` here would turn the whole import into a
    // publish of 30 unreviewed edits.
    const data: Partial<Record<Locale, PayloadData>> = {};
    for (const l of LOCALES) {
      const value = built.data[l];
      if (value !== undefined) data[l] = { ...value, _status: "draft" };
    }

    targets.push({
      ...built,
      slug: entry?.target.slug ?? built.slug,
      id: entry?.target.id ?? baseId,
      sources: [draftId],
      data,
      draftId,
      overPublished: entry !== undefined,
    });
  }

  const order = new Map(IMPORT_ORDER.map((type, i) => [type, i]));
  targets.sort(
    (a, b) =>
      (order.get(a.sanityType) ?? 99) - (order.get(b.sanityType) ?? 99) || a.draftId.localeCompare(b.draftId),
  );
  return { targets, system };
}

// ---------------------------------------------------------------------------
// Write loop
// ---------------------------------------------------------------------------

/**
 * The slice of Payload's local API the draft import uses. Narrow on purpose,
 * so the loop is testable against an in-memory store.
 *
 * Both writers save a draft: `create` for a document Payload has never seen,
 * `update` for a draft version over a published document.
 */
export interface DraftClient {
  existingIds(collection: string): Promise<Set<string>>;
  createDraft(args: { collection: string; id: string; data: PayloadData; locale: Locale }): Promise<void>;
  updateDraft(args: { collection: string; id: string; data: PayloadData; locale: Locale }): Promise<void>;
}

export interface DraftImportSummary {
  /** Never-published drafts created as `_status: 'draft'` documents. */
  created: number;
  /** Draft versions applied over an already-published document. */
  updated: number;
  /** `drafts.*` records that are not content (`sanity.*`). */
  skipped: number;
  byType: Record<string, number>;
}

export interface DraftImportOptions {
  client: DraftClient;
  attempts?: number;
  retryDelayMs?: number;
  onProgress?: (progress: {
    index: number;
    total: number;
    target: DraftTarget;
    action: "created" | "updated";
    locales: Locale[];
  }) => void;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A draft whose published counterpart is missing from Payload, thrown before
 * anything is written.
 *
 * Applying it as a *new* document would put an unreviewed edit into the
 * published table under the published document's own id — which is worse than
 * failing, because it looks like success.
 */
export class MissingPublishedCounterpart extends Error {
  constructor(readonly targets: DraftTarget[]) {
    super(
      `${targets.length} draft(s) have no published document in Payload to sit on top of. ` +
        `Run \`pnpm import:documents\` first.\n` +
        targets.map((t) => `  - ${t.sanityType} ${t.draftId} -> ${t.slug}/${t.id}`).join("\n"),
    );
    this.name = "MissingPublishedCounterpart";
  }
}

export class DraftImportFailure extends Error {
  constructor(
    readonly failures: { target: DraftTarget; error: unknown }[],
    readonly summary: DraftImportSummary,
  ) {
    super(
      `${failures.length} draft(s) could not be imported ` +
        `(${summary.created} created, ${summary.updated} updated):\n` +
        failures
          .map(
            ({ target, error }) =>
              `  - ${target.sanityType} ${target.draftId}: ` +
              `${error instanceof Error ? error.message : String(error)}`,
          )
          .join("\n"),
    );
    this.name = "DraftImportFailure";
  }
}

/**
 * Writes every draft target. Serial by design: there are 30 of them, progress
 * is printed per document, and a kill costs one document rather than the run
 * (a re-run re-applies the same draft on top, which is a no-op in content
 * terms).
 */
export async function importDraftTargets(
  targets: DraftTarget[],
  options: DraftImportOptions,
): Promise<DraftImportSummary> {
  const { client, attempts = 3, retryDelayMs = 1000, onProgress } = options;

  const existing = new Map<string, Set<string>>();
  for (const collection of new Set(targets.map((t) => t.slug))) {
    existing.set(collection, await client.existingIds(collection));
  }

  const orphans = targets.filter((t) => t.overPublished && !existing.get(t.slug)?.has(t.id));
  if (orphans.length > 0) throw new MissingPublishedCounterpart(orphans);

  const summary: DraftImportSummary = { created: 0, updated: 0, skipped: 0, byType: {} };
  const failures: { target: DraftTarget; error: unknown }[] = [];
  let index = 0;

  for (const target of targets) {
    const locales = LOCALES.filter((locale) => target.data[locale] !== undefined);
    // `present` decides create-vs-update, and it latches inside the retry loop
    // so a second attempt after a partial write does not collide on the id.
    let present = existing.get(target.slug)?.has(target.id) === true;
    const action: "created" | "updated" = present ? "updated" : "created";

    let lastError: unknown;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        for (const locale of locales) {
          const data = target.data[locale]!;
          if (present) {
            await client.updateDraft({ collection: target.slug, id: target.id, data, locale });
          } else {
            await client.createDraft({ collection: target.slug, id: target.id, data, locale });
            present = true;
          }
        }
        lastError = undefined;
        break;
      } catch (error) {
        lastError = error;
        if (attempt < attempts) await sleep(retryDelayMs * attempt);
      }
    }

    if (lastError) {
      failures.push({ target, error: lastError });
      continue;
    }

    if (action === "created") summary.created += 1;
    else summary.updated += 1;
    existing.get(target.slug)?.add(target.id);
    summary.byType[target.sanityType] = (summary.byType[target.sanityType] ?? 0) + 1;
    onProgress?.({ index: ++index, total: targets.length, target, action, locales });
  }

  if (failures.length > 0) throw new DraftImportFailure(failures, summary);
  return summary;
}

// ---------------------------------------------------------------------------
// Real run
// ---------------------------------------------------------------------------

function payloadDraftClient(payload: PayloadInstance): DraftClient {
  type Collection = Parameters<typeof payload.find>[0]["collection"];
  return {
    async existingIds(collection) {
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
    async createDraft({ collection, id, data, locale }) {
      await payload.create({
        collection: collection as Parameters<typeof payload.create>[0]["collection"],
        data: { ...data, id } as never,
        locale,
        depth: 0,
        draft: true,
        overrideAccess: true,
      });
    },
    async updateDraft({ collection, id, data, locale }) {
      await payload.update({
        collection: collection as Parameters<typeof payload.update>[0]["collection"],
        id,
        data: data as never,
        locale,
        depth: 0,
        draft: true,
        overrideAccess: true,
      });
    },
  };
}

function dryRunClient(present: Set<string>): DraftClient {
  return {
    async existingIds() {
      return present;
    },
    async createDraft() {},
    async updateDraft() {},
  };
}

export interface ImportDraftsOptions {
  dryRun?: boolean;
  quiet?: boolean;
  /** The run means the production CMS database, and says so. See `assertPayloadDatabase`. */
  allowProduction?: boolean;
}

/**
 * Imports Sanity's 30 unpublished edits as Payload draft versions. Idempotent:
 * a second run re-applies the same content, so the set of documents carrying a
 * draft is unchanged.
 */
export async function importDrafts(options: ImportDraftsOptions = {}): Promise<DraftImportSummary> {
  await loadEnv();
  const database = assertPayloadDatabase(process.env.PAYLOAD_DATABASE_URL, {
    allowProduction: options.allowProduction,
    action: "write drafts to it",
  });

  const exportDir = await extractArchive({ verifyChecksum: false });
  const docs = (await readExportDocuments(exportDir)) as SanityDoc[];

  const payload = options.dryRun ? undefined : await getPayloadInstance();
  const assets = payload ? await readAssetMap(payload) : await dryRunAssetMap();

  const ctx: TransformContext = { assets, known: new Set() };
  const { targets, system } = draftTargets(docs, ctx);

  if (!options.quiet) {
    console.log(`database:   ${database}`);
    console.log(`export:     ${exportDir}`);
    console.log(
      `drafts:     ${targets.length} content drafts ` +
        `(${targets.filter((t) => t.overPublished).length} over a published document, ` +
        `${targets.filter((t) => !t.overPublished).length} never published); ` +
        `${system.length} sanity.* records skipped`,
    );
    if (options.dryRun) console.log("mode:       DRY RUN — nothing will be written");
  }

  const client = payload
    ? payloadDraftClient(payload)
    : dryRunClient(new Set(targets.filter((t) => t.overPublished).map((t) => t.id)));

  const summary = await importDraftTargets(targets, {
    client,
    onProgress: options.quiet
      ? undefined
      : ({ index, total, target, action, locales }) => {
          console.log(
            `[${String(index).padStart(2)}/${total}] ${action.padEnd(7)} ${target.sanityType.padEnd(22)} ` +
              `${target.id.padEnd(50)} ${locales.join(",")}`,
          );
        },
  });
  summary.skipped += system.length;

  if (!options.quiet) {
    console.log(
      `\ncreated: ${summary.created}  updated: ${summary.updated}  skipped: ${summary.skipped}` +
        `\nby type: ${Object.entries(summary.byType)
          .map(([k, v]) => `${k} ${v}`)
          .join(", ")}`,
    );
  }
  return summary;
}

async function dryRunAssetMap(): Promise<Map<string, string>> {
  const { loadSanityExport } = await import("./lib/sanity-export");
  const { assets } = await loadSanityExport({ verifyChecksum: false });
  return new Map(assets.map((asset) => [asset.id, asset.id]));
}

const invokedDirectly =
  typeof process !== "undefined" &&
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (invokedDirectly) {
  const argv = process.argv.slice(2);
  importDrafts({
    dryRun: argv.includes("--dry-run"),
    allowProduction: argv.includes("--allow-production"),
  })
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
