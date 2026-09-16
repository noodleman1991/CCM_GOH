/**
 * Task 11 — import every Sanity asset into Payload's two upload collections.
 *
 * Reads the Phase 0 archive (`backups/sanity-production_2-*.tar.gz`) through
 * `lib/sanity-export.ts` and creates one Payload upload per Sanity asset:
 * 347 images into `media`, 48 files into `files`. Returns a map from the Sanity
 * asset `_id` to the created upload id, which Task 12 uses to rewrite every
 * image and file reference.
 *
 * Usage:
 *   pnpm import:assets              # import (idempotent; safe to re-run)
 *   pnpm import:assets -- --dry-run # report what would be created, write nothing
 *   pnpm import:assets -- --verify-checksum   # sha256 the 634 MB archive first
 *
 * Five properties this script has to have, each one measured rather than
 * assumed:
 *
 * 1. **`lqip` is carried across.** All 347 Sanity images have `metadata.lqip`
 *    and 25 components pass it to `next/image` as `blurDataURL`. Payload
 *    generates no equivalent and nothing regenerates it, so an import that
 *    skipped it would silently strip blur-up placeholders sitewide.
 *    `media.lqip` exists for exactly this.
 *
 * 2. **Idempotent, and therefore resumable.** Every upload stores its source
 *    `sanityAssetId` behind a UNIQUE index. The run begins by reading back the
 *    ids already present (one query per collection) and skips them without so
 *    much as opening the file. A crash at image 300 costs the 300th image, not
 *    the first 299 — and the unpacked archive is cached, so the resumed run
 *    does not re-decompress 634 MB either. Payload writes ~3,800 derivatives
 *    here (11 `imageSizes` x 347 images), which is why that matters.
 *
 * 3. **Two collections, not one.** `media` is `mimeTypes: ["image/*"]`, so the
 *    48 PDFs go to `files`. Three schema fields resolve to `files` ids in Task
 *    12: `agendas.files[].file`, `researchOutputs.files[].file` and
 *    `livedExperiences.videoFile`.
 *
 * 4. **Deterministic filenames.** `media_filename_idx` and `files_filename_idx`
 *    are UNIQUE (confirmed against the live schema), and the dataset has 347
 *    images under 283 distinct `originalFilename`s — 65 of them are all called
 *    `image.png` — plus one duplicated PDF name. Payload's own fallback
 *    (`getSafeFileName` -> `image-1.png`, `image-2.png`, …) is order-dependent,
 *    so a re-run could hand an asset a different name than the first run did
 *    and quietly break idempotency. This script never lets that code path run:
 *    it computes a name that is already unique from the asset id alone, and
 *    passes `overwriteExistingFiles: true` so Payload takes it verbatim.
 *
 * 5. **It writes to R2 and to `payload_cms`, both real.** The run refuses to
 *    start unless `PAYLOAD_DATABASE_URL` names the `payload_cms` database **on
 *    the recorded dev endpoint**; a production run has to say
 *    `--allow-production` (`lib/runtime.ts`). Nothing here ever deletes an R2
 *    object: a re-run is made safe by being idempotent, not by clearing the
 *    bucket.
 *
 * Media's `down()` migration is only valid while `media` is empty. Once this
 * script has run, do not roll it back.
 */

import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  IMPORT_WRITE_CONTEXT,
  assertPayloadDatabase,
  getPayloadInstance,
  loadEnv,
  type PayloadInstance,
} from "./lib/runtime";
import {
  effectiveMimeType,
  loadSanityExport,
  readAssetBytes as readAssetBytesFromDir,
  type SanityExportAsset,
} from "./lib/sanity-export";

export type UploadCollectionSlug = "media" | "files";

/**
 * The slice of Payload's local API this importer uses. Narrow on purpose: it is
 * what lets the import logic be tested against an in-memory store instead of
 * against R2 and Neon.
 */
export interface UploadClient {
  find(args: { collection: UploadCollectionSlug }): Promise<{
    docs: { id: string; sanityAssetId?: string | null }[];
  }>;
  create(args: {
    collection: UploadCollectionSlug;
    data: Record<string, unknown>;
    file: { data: Buffer; mimetype: string; name: string; size: number };
  }): Promise<{ id: string }>;
}

export interface AssetImportResult {
  /** Sanity asset `_id` -> Payload upload id. Complete whether created or skipped. */
  map: Map<string, string>;
  created: number;
  skipped: number;
  byCollection: Record<UploadCollectionSlug, { created: number; skipped: number }>;
}

export interface AssetImportOptions {
  client: UploadClient;
  readBytes: (asset: SanityExportAsset) => Promise<Buffer>;
  /** Total tries per asset, including the first. Default 3. */
  attempts?: number;
  retryDelayMs?: number;
  dryRun?: boolean;
  onProgress?: (progress: {
    index: number;
    total: number;
    asset: SanityExportAsset;
    action: "created" | "skipped";
  }) => void;
}

/** `media` is images-only; every `sanity.fileAsset` goes to `files`. */
export function uploadCollectionForAsset(asset: SanityExportAsset): UploadCollectionSlug {
  return asset.kind === "image" ? "media" : "files";
}

/**
 * A short, stable token for an asset, derived from nothing but its `_id`. The
 * same asset always gets the same token, on every machine and in every run —
 * that is the whole point, and it is why the numeric suffix Payload would
 * otherwise append is unacceptable here.
 *
 * Hashing the full id rather than slicing the embedded sha1 matters: two assets
 * can share a sha1 prefix while differing in their dimensions segment, and a
 * prefix slice would give them the same token.
 */
export function assetImportToken(assetId: string): string {
  return createHash("sha1").update(assetId).digest("hex").slice(0, 8);
}

/**
 * Conservative filename normalisation. All 395 real `originalFilename`s are
 * already ASCII with no filesystem-unsafe characters and at most 91 chars, so
 * this is a no-op for the entire dataset; it exists so a future asset with an
 * awkward name cannot produce something `sanitize-filename` (which Payload runs
 * on every upload) would rewrite behind our back — a rewrite could reintroduce
 * a collision after we had proved uniqueness.
 */
function normalizeFilename(name: string): string {
  const cleaned = name
    // Control characters plus the set `sanitize-filename` strips. Spaces,
    // dots and hyphens are kept: 189 of the 395 real filenames contain a
    // space and Payload preserves them.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f<>:"/\\|?*]+/g, "-")
    .replace(/\s+/g, " ")
    .replace(/^[.\-\s]+/, "")
    .trim();
  const safe = cleaned.length > 0 ? cleaned : "asset";
  return /^(con|prn|aux|nul|com\d|lpt\d)(\..*)?$/i.test(safe) ? `_${safe}` : safe;
}

function splitExtension(name: string): { stem: string; ext: string } {
  const dot = name.lastIndexOf(".");
  if (dot <= 0) return { stem: name, ext: "" };
  return { stem: name.slice(0, dot), ext: name.slice(dot) };
}

/**
 * Sanity asset id -> the filename its Payload upload will carry.
 *
 * Keeps `originalFilename` wherever it is already unique inside its collection,
 * and on collision gives *every* member of the colliding group an id-derived
 * token — including the first, so which one "wins" the bare name never depends
 * on iteration order. `media` and `files` are disambiguated separately because
 * their UNIQUE indexes are separate.
 *
 * Throws rather than returning a duplicate: a duplicate would be rejected by
 * the UNIQUE index anyway, and failing here says why.
 */
export function assignUploadFilenames(
  assets: SanityExportAsset[],
  token: (assetId: string) => string = assetImportToken,
): Map<string, string> {
  const groups = new Map<string, SanityExportAsset[]>();
  for (const asset of assets) {
    const key = `${uploadCollectionForAsset(asset)}:${normalizeFilename(asset.originalFilename)}`;
    const group = groups.get(key);
    if (group) group.push(asset);
    else groups.set(key, [asset]);
  }

  const names = new Map<string, string>();
  const takenPerCollection = new Map<UploadCollectionSlug, Map<string, string>>([
    ["media", new Map()],
    ["files", new Map()],
  ]);

  for (const [key, group] of groups) {
    const normalized = normalizeFilename(group[0].originalFilename);
    const { stem, ext } = splitExtension(normalized);
    for (const asset of group) {
      const collection = uploadCollectionForAsset(asset);
      const filename = group.length === 1 ? normalized : `${stem}-${token(asset.id)}${ext}`;
      const taken = takenPerCollection.get(collection)!;
      const owner = taken.get(filename);
      if (owner) {
        throw new Error(
          `Filename "${filename}" is not unique in ${collection}: ${owner} and ${asset.id} both claim it ` +
            `(group ${key}). ${collection}_filename_idx is UNIQUE, so this import would fail.`,
        );
      }
      taken.set(filename, asset.id);
      names.set(asset.id, filename);
    }
  }
  return names;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The import loop, over an injected client. `importAssets()` wires this to
 * Payload's local API; the tests wire it to an in-memory store.
 */
export async function importAssetRecords(
  assets: SanityExportAsset[],
  options: AssetImportOptions,
): Promise<AssetImportResult> {
  const { client, readBytes, attempts = 3, retryDelayMs = 1000, dryRun = false, onProgress } = options;

  const filenames = assignUploadFilenames(assets);

  // One read-back per collection, before anything is written: this is what
  // makes a re-run a no-op and a crashed run resumable.
  const existing = new Map<string, string>();
  for (const collection of ["media", "files"] as const) {
    const { docs } = await client.find({ collection });
    for (const doc of docs) {
      if (doc.sanityAssetId) existing.set(doc.sanityAssetId, doc.id);
    }
  }

  const result: AssetImportResult = {
    map: new Map(),
    created: 0,
    skipped: 0,
    byCollection: { media: { created: 0, skipped: 0 }, files: { created: 0, skipped: 0 } },
  };

  let index = 0;
  for (const asset of assets) {
    index += 1;
    const collection = uploadCollectionForAsset(asset);

    const already = existing.get(asset.id);
    if (already) {
      result.map.set(asset.id, already);
      result.skipped += 1;
      result.byCollection[collection].skipped += 1;
      onProgress?.({ index, total: assets.length, asset, action: "skipped" });
      continue;
    }

    if (dryRun) {
      result.map.set(asset.id, asset.id);
      result.created += 1;
      result.byCollection[collection].created += 1;
      onProgress?.({ index, total: assets.length, asset, action: "created" });
      continue;
    }

    const data: Record<string, unknown> = {
      // Sanity's `_id`, preserved verbatim as the Payload id — the custom text
      // id field on both collections exists for this.
      id: asset.id,
      sanityAssetId: asset.id,
      ...(asset.createdAt ? { createdAt: asset.createdAt } : {}),
      ...(asset.updatedAt ? { updatedAt: asset.updatedAt } : {}),
      // Images only. `files` has no lqip field and no use for one.
      ...(asset.kind === "image" && asset.lqip ? { lqip: asset.lqip } : {}),
    };

    let lastError: unknown;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        const bytes = await readBytes(asset);
        const created = await client.create({
          collection,
          data,
          file: {
            data: bytes,
            mimetype: effectiveMimeType(asset.mimeType, bytes),
            name: filenames.get(asset.id)!,
            size: bytes.byteLength,
          },
        });
        result.map.set(asset.id, created.id);
        result.created += 1;
        result.byCollection[collection].created += 1;
        lastError = undefined;
        break;
      } catch (error) {
        lastError = error;
        if (attempt < attempts) await sleep(retryDelayMs * attempt);
      }
    }
    if (lastError) {
      throw new Error(
        `Failed to import ${asset.id} (${asset.path}) after ${attempts} attempts. ` +
          `${result.created} assets were created before this one and will be skipped on a re-run.`,
        { cause: lastError },
      );
    }

    onProgress?.({ index, total: assets.length, asset, action: "created" });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Real run
// ---------------------------------------------------------------------------

/** Payload's local API, narrowed to `UploadClient`. */
export function payloadUploadClient(payload: PayloadInstance): UploadClient {
  return {
    async find({ collection }) {
      const found = await payload.find({
        collection,
        depth: 0,
        limit: 0,
        pagination: false,
        overrideAccess: true,
      });
      return {
        docs: found.docs.map((doc) => ({
          id: String(doc.id),
          sanityAssetId: (doc as { sanityAssetId?: string | null }).sanityAssetId ?? null,
        })),
      };
    },
    async create({ collection, data, file }) {
      const created = await payload.create({
        collection,
        data: data as never,
        file,
        overrideAccess: true,
        context: IMPORT_WRITE_CONTEXT,
        // Take our filename verbatim. Without this Payload runs
        // getSafeFileName, whose `-1`/`-2` suffixes are order-dependent and
        // would break the idempotency the whole phase rests on.
        overwriteExistingFiles: true,
      });
      return { id: String(created.id) };
    },
  };
}

export interface ImportAssetsOptions {
  dryRun?: boolean;
  verifyChecksum?: boolean;
  quiet?: boolean;
  /** The run means the production CMS database, and says so. See `assertPayloadDatabase`. */
  allowProduction?: boolean;
  /** Populated with the run's counts, for a caller that wants more than the map. */
  onResult?: (result: AssetImportResult) => void;
}

/**
 * Imports every asset in the Phase 0 archive and returns the Sanity asset `_id`
 * -> Payload upload id map. Idempotent: a second run creates nothing and
 * returns the same map.
 */
export async function importAssets(options: ImportAssetsOptions = {}): Promise<Map<string, string>> {
  await loadEnv();
  const database = assertPayloadDatabase(process.env.PAYLOAD_DATABASE_URL, {
    allowProduction: options.allowProduction,
    action: "write assets to it",
  });

  const { exportDir, assets } = await loadSanityExport({ verifyChecksum: options.verifyChecksum });
  const images = assets.filter((a) => a.kind === "image").length;

  if (!options.quiet) {
    console.log(`database:   ${database}`);
    console.log(`export:     ${exportDir}`);
    console.log(`assets:     ${assets.length} (${images} images, ${assets.length - images} files)`);
    if (options.dryRun) console.log("mode:       DRY RUN — nothing will be written");
  }

  const client = options.dryRun ? dryRunClient() : payloadUploadClient(await getPayloadInstance());

  const result = await importAssetRecords(assets, {
    client,
    readBytes: (asset) => readAssetBytesFromDir(exportDir, asset),
    dryRun: options.dryRun,
    onProgress: options.quiet
      ? undefined
      : ({ index, total, asset, action }) => {
          if (action === "created" || index === total || index % 25 === 0) {
            console.log(`[${String(index).padStart(3)}/${total}] ${action.padEnd(7)} ${asset.id}`);
          }
        },
  });

  if (!options.quiet) {
    console.log(
      `\ncreated: ${result.created}  skipped: ${result.skipped}  ` +
        `(media ${result.byCollection.media.created}/+${result.byCollection.media.skipped}, ` +
        `files ${result.byCollection.files.created}/+${result.byCollection.files.skipped})`,
    );
  }
  options.onResult?.(result);
  return result.map;
}

/** A client that answers "nothing exists yet" and never writes. */
function dryRunClient(): UploadClient {
  return {
    async find() {
      return { docs: [] };
    },
    async create() {
      throw new Error("dryRunClient.create must never be called");
    },
  };
}

const invokedDirectly =
  typeof process !== "undefined" &&
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (invokedDirectly) {
  const argv = process.argv.slice(2);
  importAssets({
    dryRun: argv.includes("--dry-run"),
    verifyChecksum: argv.includes("--verify-checksum"),
    allowProduction: argv.includes("--allow-production"),
  })
    .then((map) => {
      console.log(`asset map: ${map.size} entries`);
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
