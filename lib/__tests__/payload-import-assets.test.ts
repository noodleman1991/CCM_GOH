import { describe, expect, it } from "vitest";
import {
  assetIdFromSanityAssetRef,
  effectiveMimeType,
  mimeTypeForExtension,
  parseExportAssets,
  sanityAssetIdFromExportPath,
  type SanityExportAsset,
} from "@/scripts/payload-import/lib/sanity-export";
import {
  assetImportToken,
  assignUploadFilenames,
  importAssetRecords,
  uploadCollectionForAsset,
  type UploadClient,
} from "@/scripts/payload-import/assets";

/**
 * Every fixture here is measured against `production_2` (2026-09-04, GROQ with
 * `count(*[_type=="agenda"]) == 29` as the non-zero control) and against the
 * Phase 0 archive `backups/sanity-production_2-2026-09-02.tar.gz`. The archive's
 * 395 reconstructed asset ids match the dataset's 395 asset `_id`s exactly, in
 * both directions.
 */

function asset(partial: Partial<SanityExportAsset> & { id: string }): SanityExportAsset {
  const kind = partial.id.startsWith("image-") ? "image" : "file";
  const extension = partial.id.split("-").pop() as string;
  return {
    kind,
    path: `${kind === "image" ? "images" : "files"}/x.${extension}`,
    originalFilename: "image.png",
    extension,
    mimeType: mimeTypeForExtension(extension),
    size: 1234,
    sha1hash: partial.id.split("-")[1] ?? "",
    ...partial,
  };
}

const IMAGE_A = "image-261fa3551e22bb1f3827967b8f351239d99eef88-1200x630-png";
const IMAGE_B = "image-3836aebee8df8eb58edabc26575ffee2885fbc71-810x873-png";
const FILE_A = "file-b42924478654a42741fbd251cf976701bbfb8531-pdf";
const FILE_B = "file-2aa901733d0a00e3e05c5140676c041236b3dbea-pdf";

describe("sanity export archive reader", () => {
  it("reconstructs the real Sanity asset _id from an archive member path", () => {
    // `assets.json` is keyed by `<kind>-<sha1>` and drops the dimensions and
    // extension, so the only place the true `_id` survives in the archive is
    // the member name. Both of these were confirmed against the live dataset.
    expect(sanityAssetIdFromExportPath("images/00336d924f7337fed2c5b3794365a8d158926dd7-810x873.png")).toBe(
      "image-00336d924f7337fed2c5b3794365a8d158926dd7-810x873-png",
    );
    expect(sanityAssetIdFromExportPath("files/00013d9224464321cd79f415710fc71369586292.pdf")).toBe(
      "file-00013d9224464321cd79f415710fc71369586292-pdf",
    );
  });

  it("resolves the `_sanityAsset` strings the export writes in place of asset._ref", () => {
    // `data.ndjson` carries zero `asset._ref`s: @sanity/export rewrote all 759
    // of them to this form. Task 12 resolves references through here.
    expect(assetIdFromSanityAssetRef("image@file://./images/290f089871640f6a99056f413801842f9a3b3ba5-810x873.png")).toBe(
      "image-290f089871640f6a99056f413801842f9a3b3ba5-810x873-png",
    );
    expect(assetIdFromSanityAssetRef("file@file://./files/00013d9224464321cd79f415710fc71369586292.pdf")).toBe(
      "file-00013d9224464321cd79f415710fc71369586292-pdf",
    );
    expect(assetIdFromSanityAssetRef("not-an-asset-ref")).toBeUndefined();
  });

  it("derives the mime type from the extension — `assets.json` carries none", () => {
    // The five extensions in the archive, each mapped to the mimeType the live
    // dataset reports for it.
    expect(mimeTypeForExtension("png")).toBe("image/png");
    expect(mimeTypeForExtension("jpg")).toBe("image/jpeg");
    expect(mimeTypeForExtension("webp")).toBe("image/webp");
    expect(mimeTypeForExtension("heif")).toBe("image/heif");
    expect(mimeTypeForExtension("pdf")).toBe("application/pdf");
  });

  it("joins assets.json metadata onto the member paths, carrying lqip", () => {
    const assetsJson = {
      "image-aaaa": {
        originalFilename: "hero.png",
        size: 42,
        sha1hash: "aaaa",
        _createdAt: "2025-10-21T12:19:34Z",
        _updatedAt: "2025-10-21T12:19:35Z",
        metadata: {
          lqip: "data:image/png;base64,AAAA",
          dimensions: { width: 500, height: 307 },
        },
      },
      "file-bbbb": { originalFilename: "report.pdf", size: 99, sha1hash: "bbbb" },
    };
    const parsed = parseExportAssets(assetsJson, ["images/aaaa-500x307.png", "files/bbbb.pdf"]);

    expect(parsed).toHaveLength(2);
    const image = parsed.find((a) => a.kind === "image");
    expect(image).toMatchObject({
      id: "image-aaaa-500x307-png",
      originalFilename: "hero.png",
      mimeType: "image/png",
      size: 42,
      lqip: "data:image/png;base64,AAAA",
      width: 500,
      height: 307,
    });
    expect(parsed.find((a) => a.kind === "file")).toMatchObject({
      id: "file-bbbb-pdf",
      mimeType: "application/pdf",
      size: 99,
    });
    expect(parsed.find((a) => a.kind === "file")?.lqip).toBeUndefined();
  });

  it("fails loudly when a member path has no assets.json entry", () => {
    expect(() => parseExportAssets({}, ["images/aaaa-1x1.png"])).toThrow(/assets\.json/i);
  });
});

describe("upload collection routing", () => {
  it("routes images to `media` and files to `files`", () => {
    // `media` is mimeTypes: ["image/*"]; a PDF cannot live there. The three
    // schema fields that carry file assets (agendas.files[].file,
    // researchOutputs.files[].file, livedExperiences.videoFile) resolve here.
    expect(uploadCollectionForAsset(asset({ id: IMAGE_A }))).toBe("media");
    expect(uploadCollectionForAsset(asset({ id: FILE_A }))).toBe("files");
  });
});

describe("deterministic filename disambiguation", () => {
  it("keeps originalFilename untouched when it is already unique", () => {
    const names = assignUploadFilenames([
      asset({ id: IMAGE_A, originalFilename: "hero banner.png" }),
      asset({ id: IMAGE_B, originalFilename: "logo.png" }),
    ]);
    expect(names.get(IMAGE_A)).toBe("hero banner.png");
    expect(names.get(IMAGE_B)).toBe("logo.png");
  });

  it("appends a stable, asset-id-derived token to EVERY member of a colliding group", () => {
    // 65 of the 347 images are called `image.png`. Payload's own fallback
    // (getSafeFileName -> `image-1.png`, `image-2.png`, …) is order-dependent
    // and would break idempotency on a re-run, so the importer never lets it
    // run: it hands Payload a name that is already unique.
    const names = assignUploadFilenames([
      asset({ id: IMAGE_A, originalFilename: "image.png" }),
      asset({ id: IMAGE_B, originalFilename: "image.png" }),
    ]);
    expect(names.get(IMAGE_A)).toBe(`image-${assetImportToken(IMAGE_A)}.png`);
    expect(names.get(IMAGE_B)).toBe(`image-${assetImportToken(IMAGE_B)}.png`);
    expect(names.get(IMAGE_A)).not.toBe(names.get(IMAGE_B));
    // No numeric suffix anywhere — that is the order-dependent shape.
    expect(names.get(IMAGE_A)).not.toMatch(/-\d+\.png$/);
  });

  it("is order-independent — the same input set always yields the same names", () => {
    const assets = [
      asset({ id: IMAGE_A, originalFilename: "image.png" }),
      asset({ id: IMAGE_B, originalFilename: "image.png" }),
      asset({ id: FILE_A, originalFilename: "Full TRAA Indigenous 18-03.pdf" }),
      asset({ id: FILE_B, originalFilename: "Full TRAA Indigenous 18-03.pdf" }),
    ];
    const forward = assignUploadFilenames(assets);
    const reversed = assignUploadFilenames([...assets].reverse());
    expect(Object.fromEntries(reversed)).toEqual(Object.fromEntries(forward));
  });

  it("disambiguates within a collection, not across — `media` and `files` have separate unique indexes", () => {
    const names = assignUploadFilenames([
      asset({ id: IMAGE_A, originalFilename: "same.png" }),
      asset({ id: FILE_A, originalFilename: "same.png" }),
    ]);
    expect(names.get(IMAGE_A)).toBe("same.png");
    expect(names.get(FILE_A)).toBe("same.png");
  });

  it("throws rather than emitting a duplicate name the UNIQUE index would reject", () => {
    expect(() =>
      assignUploadFilenames(
        [
          asset({ id: IMAGE_A, originalFilename: "image.png" }),
          asset({ id: IMAGE_B, originalFilename: "image.png" }),
        ],
        // A degenerate token function, standing in for the (astronomically
        // unlikely) case of two asset ids hashing to the same token.
        () => "collide",
      ),
    ).toThrow(/unique/i);
  });

  it("produces a token derived only from the asset id, so it never moves", () => {
    expect(assetImportToken(IMAGE_A)).toBe(assetImportToken(IMAGE_A));
    expect(assetImportToken(IMAGE_A)).not.toBe(assetImportToken(IMAGE_B));
    expect(assetImportToken(IMAGE_A)).toMatch(/^[0-9a-f]{8}$/);
  });
});

/** An in-memory stand-in for Payload's local API, one row store per collection. */
function fakeClient(seed: { collection: string; id: string; sanityAssetId: string }[] = []) {
  const rows = new Map<string, { id: string; sanityAssetId: string; data: Record<string, unknown> }[]>([
    ["media", []],
    ["files", []],
  ]);
  for (const s of seed) {
    rows.get(s.collection)!.push({ id: s.id, sanityAssetId: s.sanityAssetId, data: {} });
  }
  const created: { collection: string; data: Record<string, unknown>; file: { name: string; size: number } }[] = [];
  const client: UploadClient = {
    async find({ collection }) {
      return { docs: rows.get(collection)!.map((r) => ({ id: r.id, sanityAssetId: r.sanityAssetId })) };
    },
    async create({ collection, data, file }) {
      const store = rows.get(collection)!;
      const sanityAssetId = String(data.sanityAssetId);
      if (store.some((r) => r.sanityAssetId === sanityAssetId)) {
        throw new Error(`duplicate sanityAssetId ${sanityAssetId}`);
      }
      if (store.some((r) => r.data.filename === file.name)) {
        throw new Error(`duplicate filename ${file.name}`);
      }
      const id = String(data.id);
      store.push({ id, sanityAssetId, data: { ...data, filename: file.name } });
      created.push({ collection, data, file: { name: file.name, size: file.size } });
      return { id };
    },
  };
  return { client, created, rows };
}

const TWO_IMAGES_ONE_FILE = [
  asset({ id: IMAGE_A, originalFilename: "image.png", size: 10, lqip: "data:image/png;base64,AAA" }),
  asset({ id: IMAGE_B, originalFilename: "logo.png", size: 20, lqip: "data:image/png;base64,BBB" }),
  asset({ id: FILE_A, originalFilename: "report.pdf", size: 30 }),
];

const readBytes = async (a: SanityExportAsset) => Buffer.alloc(a.size, 1);

describe("importAssetRecords", () => {
  it("creates one upload per asset and returns the Sanity id -> upload id map", async () => {
    const { client, created } = fakeClient();
    const result = await importAssetRecords(TWO_IMAGES_ONE_FILE, { client, readBytes });

    expect(result.created).toBe(3);
    expect(result.skipped).toBe(0);
    expect(result.map.size).toBe(3);
    // The Sanity `_id` is preserved verbatim as the Payload upload id.
    expect(result.map.get(IMAGE_A)).toBe(IMAGE_A);
    expect(result.map.get(FILE_A)).toBe(FILE_A);
    expect(created.map((c) => c.collection).sort()).toEqual(["files", "media", "media"]);
  });

  it("carries lqip onto images and never onto files", async () => {
    const { client, created } = fakeClient();
    await importAssetRecords(TWO_IMAGES_ONE_FILE, { client, readBytes });

    const image = created.find((c) => c.data.id === IMAGE_A)!;
    expect(image.data.lqip).toBe("data:image/png;base64,AAA");
    expect(image.data.sanityAssetId).toBe(IMAGE_A);
    const file = created.find((c) => c.data.id === FILE_A)!;
    expect(file.data).not.toHaveProperty("lqip");
  });

  it("hands Payload the deterministic filename and the real byte count", async () => {
    const { client, created } = fakeClient();
    await importAssetRecords(TWO_IMAGES_ONE_FILE, { client, readBytes });
    expect(created.find((c) => c.data.id === IMAGE_A)!.file).toEqual({ name: "image.png", size: 10 });
    expect(created.find((c) => c.data.id === FILE_A)!.file).toEqual({ name: "report.pdf", size: 30 });
  });

  it("skips assets already imported — a second run creates nothing", async () => {
    const { client, created } = fakeClient();
    const first = await importAssetRecords(TWO_IMAGES_ONE_FILE, { client, readBytes });
    expect(first.created).toBe(3);

    const second = await importAssetRecords(TWO_IMAGES_ONE_FILE, { client, readBytes });
    expect(second.created).toBe(0);
    expect(second.skipped).toBe(3);
    // The map is complete either way — Task 12 gets the same answer.
    expect(Object.fromEntries(second.map)).toEqual(Object.fromEntries(first.map));
    expect(created).toHaveLength(3);
  });

  it("resumes: a run that died partway re-creates only what is missing", async () => {
    // Simulate a crash after the first two assets landed.
    const { client, created } = fakeClient([
      { collection: "media", id: IMAGE_A, sanityAssetId: IMAGE_A },
      { collection: "media", id: IMAGE_B, sanityAssetId: IMAGE_B },
    ]);
    const result = await importAssetRecords(TWO_IMAGES_ONE_FILE, { client, readBytes });

    expect(result.skipped).toBe(2);
    expect(result.created).toBe(1);
    expect(created.map((c) => c.data.id)).toEqual([FILE_A]);
    expect(result.map.size).toBe(3);
  });

  it("does not read an asset's bytes at all when it is being skipped", async () => {
    const { client } = fakeClient([{ collection: "media", id: IMAGE_A, sanityAssetId: IMAGE_A }]);
    const read: string[] = [];
    await importAssetRecords(TWO_IMAGES_ONE_FILE, {
      client,
      readBytes: async (a) => {
        read.push(a.id);
        return Buffer.alloc(a.size, 1);
      },
    });
    expect(read).not.toContain(IMAGE_A);
    expect(read.sort()).toEqual([FILE_A, IMAGE_B].sort());
  });

  it("retries a transient failure, then gives up loudly so the run can be resumed", async () => {
    const { client } = fakeClient();
    let attempts = 0;
    const flaky: UploadClient = {
      find: client.find,
      create: async (args) => {
        if (args.data.id === FILE_A) {
          attempts += 1;
          throw new Error("R2 socket hang up");
        }
        return client.create(args);
      },
    };
    const failure = await importAssetRecords(TWO_IMAGES_ONE_FILE, {
      client: flaky,
      readBytes,
      attempts: 3,
      retryDelayMs: 0,
    }).catch((error: Error) => error);

    expect(failure).toBeInstanceOf(Error);
    // Names the asset it died on and says the run is resumable...
    expect((failure as Error).message).toMatch(new RegExp(`${FILE_A}.*after 3 attempts`));
    // ...without swallowing what actually went wrong.
    expect(((failure as Error).cause as Error).message).toBe("R2 socket hang up");
    expect(attempts).toBe(3);
    // The two that succeeded are already in the store, so a resume skips them.
    const resumed = await importAssetRecords(TWO_IMAGES_ONE_FILE, { client, readBytes });
    expect(resumed.skipped).toBe(2);
  });

  it("reports progress in a stable order so a partial run is legible", async () => {
    const { client } = fakeClient();
    const seen: number[] = [];
    await importAssetRecords(TWO_IMAGES_ONE_FILE, {
      client,
      readBytes,
      onProgress: (p) => seen.push(p.index),
    });
    expect(seen).toEqual([1, 2, 3]);
  });
});

describe("effectiveMimeType", () => {
  /**
   * ISO-BMFF: 4-byte box size, "ftyp", then the brand at bytes 8..12.
   * The archive holds one asset named `.heif` whose bytes are AVIF; Payload's
   * canResizeImage accepts image/avif but not image/heif, so trusting the
   * extension silently costs that asset every derivative and its dimensions.
   */
  const isoBmff = (brand: string): Buffer =>
    Buffer.concat([
      Buffer.from([0, 0, 0, 32]),
      Buffer.from("ftyp", "ascii"),
      Buffer.from(brand, "ascii"),
      Buffer.alloc(20),
    ]);

  it("upgrades a mislabelled heif to avif when the brand says avif", () => {
    expect(effectiveMimeType("image/heif", isoBmff("avif"))).toBe("image/avif");
    expect(effectiveMimeType("image/heic", isoBmff("avis"))).toBe("image/avif");
  });

  it("leaves a genuine heif alone", () => {
    expect(effectiveMimeType("image/heif", isoBmff("heic"))).toBe("image/heif");
    expect(effectiveMimeType("image/heif", isoBmff("mif1"))).toBe("image/heif");
  });

  it("never touches a non-heif declaration, even if the bytes look like avif", () => {
    expect(effectiveMimeType("image/png", isoBmff("avif"))).toBe("image/png");
    expect(effectiveMimeType("application/pdf", isoBmff("avif"))).toBe("application/pdf");
  });

  it("falls back to the declaration on short or non-ftyp input", () => {
    expect(effectiveMimeType("image/heif", Buffer.alloc(4))).toBe("image/heif");
    expect(effectiveMimeType("image/heif", Buffer.from("not an iso bmff header"))).toBe("image/heif");
  });
});
