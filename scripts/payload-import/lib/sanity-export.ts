/**
 * Reader for the Phase 0 Sanity archive.
 *
 * The import sources every byte from `backups/sanity-production_2-*.tar.gz`
 * (634 MB, sha256 recorded in `docs/migration/sanity-archive-manifest.json`)
 * rather than re-downloading from Sanity. The archive is already verified, and
 * sourcing from it means the import does not depend on Sanity's API being up —
 * which matters here, because that API has gone over quota before
 * (`sanity-api-quota-outage`).
 *
 * Three properties of the archive are load-bearing and were measured on
 * 2026-09-04 against `production_2` (every GROQ query carried
 * `count(*[_type=="agenda"]) == 29` as a known-nonzero control, because an
 * untokened Sanity query returns HTTP 200 with a zero result rather than a 401):
 *
 * 1. **`assets.json` is keyed by `<kind>-<sha1hash>`, which is NOT the Sanity
 *    `_id`.** The real `_id` carries the dimensions and extension too
 *    (`image-<sha1>-<w>x<h>-<ext>`, `file-<sha1>-<ext>`), and the only place it
 *    survives in the archive is the tar member name
 *    (`images/<sha1>-<w>x<h>.<ext>`, `files/<sha1>.<ext>`). Reconstructing the
 *    id from the member name and diffing against the live dataset's 395 asset
 *    `_id`s produced a zero-difference match in both directions.
 *
 * 2. **`assets.json` carries no `mimeType`.** It has `originalFilename`, `size`,
 *    `sha1hash`, the timestamps, and — for images — the whole `metadata` object
 *    including `lqip`. The mime type has to come from the extension; the map
 *    below was read back off the live dataset rather than assumed.
 *
 * 3. **`data.ndjson` contains no `asset._ref` at all.** `@sanity/export` rewrote
 *    every asset reference into `_sanityAsset: "<kind>@file://./<dir>/<member>"`
 *    — 759 occurrences, 284 distinct. Task 12 resolves references through
 *    `assetIdFromSanityAssetRef`, not by looking for `_ref`.
 */

import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type SanityAssetKind = "image" | "file";

export interface SanityExportAsset {
  /** The Sanity `_id`, verbatim — `image-<sha1>-<w>x<h>-<ext>` / `file-<sha1>-<ext>`. */
  id: string;
  kind: SanityAssetKind;
  /** Archive-relative member path, e.g. `images/<sha1>-810x873.png`. */
  path: string;
  originalFilename: string;
  extension: string;
  mimeType: string;
  size: number;
  sha1hash: string;
  createdAt?: string;
  updatedAt?: string;
  /** Images only: Sanity's `metadata.lqip` base64 data URI. Payload has no equivalent. */
  lqip?: string;
  width?: number;
  height?: number;
}

/**
 * Extension -> mime type, read back off `production_2` rather than assumed:
 * `png -> image/png` (266 assets), `jpg -> image/jpeg` (42),
 * `webp -> image/webp` (38), `heif -> image/heif` (1), `pdf -> application/pdf`
 * (48). Those five are the entire archive. The rest of the table covers the
 * types the two upload collections declare, so a future asset does not land
 * here as `application/octet-stream`.
 */
const MIME_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  heif: "image/heif",
  heic: "image/heic",
  gif: "image/gif",
  tif: "image/tiff",
  tiff: "image/tiff",
  avif: "image/avif",
  svg: "image/svg+xml",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  csv: "text/csv",
  txt: "text/plain",
  mp4: "video/mp4",
  webm: "video/webm",
};

export function mimeTypeForExtension(extension: string): string {
  return MIME_TYPES[extension.toLowerCase()] ?? "application/octet-stream";
}

/**
 * `images/<sha1>-<w>x<h>.<ext>` -> `image-<sha1>-<w>x<h>-<ext>`
 * `files/<sha1>.<ext>`          -> `file-<sha1>-<ext>`
 *
 * Leading `./` and any parent directories are ignored, so this accepts both a
 * raw member name and the path embedded in a `_sanityAsset` reference.
 */
export function sanityAssetIdFromExportPath(memberPath: string): string {
  const normalized = memberPath.replace(/\\/g, "/");
  const parts = normalized.split("/").filter((p) => p && p !== ".");
  const base = parts.pop();
  const dir = parts.pop();
  if (!base || (dir !== "images" && dir !== "files")) {
    throw new Error(`Not a Sanity export asset path: ${memberPath}`);
  }
  const dot = base.lastIndexOf(".");
  if (dot <= 0) throw new Error(`Sanity export asset has no extension: ${memberPath}`);
  const stem = base.slice(0, dot);
  const extension = base.slice(dot + 1);
  return `${dir === "images" ? "image" : "file"}-${stem}-${extension}`;
}

/**
 * Resolves the `_sanityAsset` strings the export writes in place of
 * `asset._ref` — `"image@file://./images/<sha1>-<w>x<h>.png"`. Returns
 * `undefined` for anything that is not one, so a caller can walk arbitrary
 * document values without guarding every string itself.
 */
export function assetIdFromSanityAssetRef(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const match = /^(image|file)@file:\/\/(.+)$/.exec(value);
  if (!match) return undefined;
  try {
    return sanityAssetIdFromExportPath(match[2]);
  } catch {
    return undefined;
  }
}

/** The `assets.json` key for an asset id — it drops the dimensions and extension. */
export function assetsJsonKey(assetId: string): string {
  const [kind, sha1] = assetId.split("-");
  return `${kind}-${sha1}`;
}

interface AssetsJsonEntry {
  originalFilename?: string;
  size?: number;
  sha1hash?: string;
  _createdAt?: string;
  _updatedAt?: string;
  metadata?: {
    lqip?: string;
    dimensions?: { width?: number; height?: number };
  };
}

/**
 * Joins `assets.json`'s metadata onto the archive's member paths. The member
 * paths are the authority on *which* assets exist and on their true `_id`;
 * `assets.json` supplies everything else. A member with no `assets.json` entry
 * is a corrupt archive and throws rather than importing a nameless asset.
 */
export function parseExportAssets(
  assetsJson: Record<string, unknown>,
  memberPaths: string[],
): SanityExportAsset[] {
  return memberPaths
    .map((memberPath) => {
      const id = sanityAssetIdFromExportPath(memberPath);
      const entry = assetsJson[assetsJsonKey(id)] as AssetsJsonEntry | undefined;
      if (!entry) {
        throw new Error(`Archive member ${memberPath} has no assets.json entry (key ${assetsJsonKey(id)})`);
      }
      const kind: SanityAssetKind = id.startsWith("image-") ? "image" : "file";
      const extension = id.slice(id.lastIndexOf("-") + 1);
      const dimensions = entry.metadata?.dimensions;
      return {
        id,
        kind,
        path: memberPath,
        originalFilename: entry.originalFilename ?? path.basename(memberPath),
        extension,
        mimeType: mimeTypeForExtension(extension),
        size: entry.size ?? 0,
        sha1hash: entry.sha1hash ?? id.split("-")[1],
        createdAt: entry._createdAt,
        updatedAt: entry._updatedAt,
        ...(kind === "image" && entry.metadata?.lqip ? { lqip: entry.metadata.lqip } : {}),
        ...(dimensions?.width ? { width: dimensions.width } : {}),
        ...(dimensions?.height ? { height: dimensions.height } : {}),
      } satisfies SanityExportAsset;
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

// ---------------------------------------------------------------------------
// Archive location, verification and extraction
// ---------------------------------------------------------------------------

export const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");

/** Where the archive is unpacked. Gitignored; safe to delete, it re-extracts. */
export function exportCacheRoot(): string {
  return process.env.SANITY_EXPORT_CACHE ?? path.join(REPO_ROOT, ".sanity-export-cache");
}

/** The newest `backups/sanity-production_2-*.tar.gz`. */
export async function resolveArchivePath(): Promise<string> {
  if (process.env.SANITY_EXPORT_ARCHIVE) return path.resolve(process.env.SANITY_EXPORT_ARCHIVE);
  const dir = path.join(REPO_ROOT, "backups");
  const entries = await readdir(dir);
  const archives = entries.filter((e) => /^sanity-production_2-.*\.tar\.gz$/.test(e)).sort();
  if (archives.length === 0) {
    throw new Error(`No sanity-production_2-*.tar.gz found in ${dir}. The Phase 0 archive is the import source.`);
  }
  return path.join(dir, archives[archives.length - 1]);
}

interface ArchiveManifest {
  archive?: { file?: string; bytes?: number; sha256?: string };
}

/**
 * Checks the archive against `docs/migration/sanity-archive-manifest.json`.
 * The byte length is free; the sha256 costs a full read of 634 MB, so it is
 * opt-in (`verifyChecksum`) and off by default for a resumed run.
 */
export async function verifyArchive(archivePath: string, verifyChecksum = false): Promise<void> {
  const manifestPath = path.join(REPO_ROOT, "docs/migration/sanity-archive-manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as ArchiveManifest;
  const expected = manifest.archive;
  if (!expected) return;

  if (expected.bytes) {
    const actual = (await stat(archivePath)).size;
    if (actual !== expected.bytes) {
      throw new Error(`Archive size mismatch: ${archivePath} is ${actual} bytes, manifest says ${expected.bytes}`);
    }
  }
  if (verifyChecksum && expected.sha256) {
    const hash = createHash("sha256");
    await new Promise<void>((resolve, reject) => {
      createReadStream(archivePath).on("data", (c) => hash.update(c)).on("end", resolve).on("error", reject);
    });
    const actual = hash.digest("hex");
    if (actual !== expected.sha256) {
      throw new Error(`Archive sha256 mismatch: got ${actual}, manifest says ${expected.sha256}`);
    }
  }
}

/**
 * Unpacks the archive into the cache directory and returns the export
 * directory inside it. Extraction is skipped when a previous run already
 * unpacked it — this is what makes a resumed import cheap rather than a second
 * 634 MB decompression.
 */
export async function extractArchive(options: { verifyChecksum?: boolean } = {}): Promise<string> {
  if (process.env.SANITY_EXPORT_DIR) return path.resolve(process.env.SANITY_EXPORT_DIR);

  const archivePath = await resolveArchivePath();
  const cacheRoot = exportCacheRoot();
  const existing = await findExportDir(cacheRoot);
  if (existing) return existing;

  await verifyArchive(archivePath, options.verifyChecksum ?? true);
  await mkdir(cacheRoot, { recursive: true });
  await execFileAsync("tar", ["-xzf", archivePath, "-C", cacheRoot], { maxBuffer: 1024 * 1024 });
  const extracted = await findExportDir(cacheRoot);
  if (!extracted) throw new Error(`Extracting ${archivePath} produced no export directory in ${cacheRoot}`);
  return extracted;
}

async function findExportDir(cacheRoot: string): Promise<string | undefined> {
  let entries: string[];
  try {
    entries = await readdir(cacheRoot);
  } catch {
    return undefined;
  }
  for (const entry of entries) {
    const candidate = path.join(cacheRoot, entry);
    try {
      await stat(path.join(candidate, "assets.json"));
      await stat(path.join(candidate, "data.ndjson"));
      return candidate;
    } catch {
      /* not an export directory */
    }
  }
  return undefined;
}

/** Every asset in an unpacked export directory, sorted by id. */
export async function readExportAssets(exportDir: string): Promise<SanityExportAsset[]> {
  const assetsJson = JSON.parse(await readFile(path.join(exportDir, "assets.json"), "utf8")) as Record<
    string,
    unknown
  >;
  const memberPaths: string[] = [];
  for (const dir of ["images", "files"] as const) {
    let names: string[];
    try {
      names = await readdir(path.join(exportDir, dir));
    } catch {
      continue;
    }
    for (const name of names) {
      if (name.startsWith(".")) continue;
      memberPaths.push(`${dir}/${name}`);
    }
  }
  return parseExportAssets(assetsJson, memberPaths);
}

/** The bytes of one asset, straight off the unpacked archive. */
export async function readAssetBytes(exportDir: string, asset: SanityExportAsset): Promise<Buffer> {
  return readFile(path.join(exportDir, asset.path));
}

/**
 * Every document line of `data.ndjson`. Task 12's entry point into the archive;
 * exported here so both importers read the export through one module.
 */
export async function readExportDocuments(exportDir: string): Promise<Record<string, unknown>[]> {
  const raw = await readFile(path.join(exportDir, "data.ndjson"), "utf8");
  return raw
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

/** Unpacks (or reuses) the archive and reads its asset list in one call. */
export async function loadSanityExport(options: { verifyChecksum?: boolean } = {}): Promise<{
  exportDir: string;
  assets: SanityExportAsset[];
}> {
  const exportDir = await extractArchive(options);
  return { exportDir, assets: await readExportAssets(exportDir) };
}
