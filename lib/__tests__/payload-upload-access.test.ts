import { describe, expect, it } from "vitest";
import type { Access, CollectionBeforeOperationHook } from "payload";
import { Media } from "@/payload/collections/media";
import { Files } from "@/payload/collections/files";
import { randomizeUploadFilename } from "@/payload/hooks/upload-filename";

const req = (role?: string) => ({ user: role ? { role } : null }) as never;

const uploadCollections = [Media, Files];

/**
 * Both upload collections used to be `read: isAnyone`, on the reasoning that
 * an asset has no moderation state to gate on and Sanity's asset URLs were
 * public anyway. That reasoning missed two things Payload changes:
 *
 *   1. `/payload-api/media` and `/payload-api/files` are LIST endpoints, and
 *      `?limit=0` returns every row. Sanity's CDN never offered a listing.
 *   2. Payload stores the sanitised ORIGINAL filename; Sanity stored a
 *      content hash. A URL like `/payload-api/files/file/board-minutes.pdf`
 *      is guessable in a way `file-9bac9301…-pdf` never was.
 *
 * So an anonymous caller could enumerate and download every PDF, video and
 * image — including assets whose parent document is hidden as pending or
 * rejected, and images uploaded into private collaboration workspaces.
 *
 * The fix keeps the static file route open (a rendered page still needs its
 * images without a session) but closes the listing and the metadata reads,
 * and gives every new upload an unguessable name.
 */
describe("upload collections: read access", () => {
  it.each(uploadCollections)("$slug refuses an anonymous list/metadata read", async (collection) => {
    const read = collection.access?.read as Access;
    expect(await read({ req: req() })).toBe(false);
  });

  it.each(uploadCollections)("$slug still serves the static file to an anonymous caller", async (collection) => {
    // Payload's checkFileAccess passes `isReadingStaticFile: true` when the
    // request is `/payload-api/<slug>/file/<name>`. `true` here means "serve
    // it without a DB lookup", exactly what `isAnyone` did for that route.
    const read = collection.access?.read as Access;
    expect(await read({ req: req(), isReadingStaticFile: true } as never)).toBe(true);
  });

  it.each(uploadCollections)("$slug lets editors list and read metadata", async (collection) => {
    const read = collection.access?.read as Access;
    expect(await read({ req: req("team_editor") })).toBe(true);
    expect(await read({ req: req("admin") })).toBe(true);
  });

  it.each(uploadCollections)("$slug does not admit community roles to the listing", async (collection) => {
    const read = collection.access?.read as Access;
    expect(await read({ req: req("community_member") })).toBe(false);
    expect(await read({ req: req("community_editor") })).toBe(false);
  });
});

type HookArgs = Parameters<CollectionBeforeOperationHook>[0];

function hookArgs(opts: {
  operation: "create" | "update";
  filename?: string;
  data?: Record<string, unknown>;
}): HookArgs {
  const file = opts.filename ? { name: opts.filename, data: Buffer.alloc(0), mimetype: "image/png", size: 0 } : undefined;
  return {
    operation: opts.operation,
    args: { data: opts.data ?? {} },
    req: { file } as never,
    context: {},
    collection: Media,
  } as never;
}

describe("upload filename randomisation", () => {
  it.each(uploadCollections)("$slug registers the hook before any create runs", (collection) => {
    expect(collection.hooks?.beforeOperation).toContain(randomizeUploadFilename);
  });

  it("gives a new upload an unguessable name, keeping the stem and extension", async () => {
    const args = hookArgs({ operation: "create", filename: "board minutes.pdf" });
    await randomizeUploadFilename(args);
    const name = (args.req.file as { name: string }).name;
    expect(name).toMatch(/^board minutes-[0-9a-f]{16}\.pdf$/);
  });

  it("uses a fresh token per upload", async () => {
    const a = hookArgs({ operation: "create", filename: "logo.png" });
    const b = hookArgs({ operation: "create", filename: "logo.png" });
    await randomizeUploadFilename(a);
    await randomizeUploadFilename(b);
    expect((a.req.file as { name: string }).name).not.toBe((b.req.file as { name: string }).name);
  });

  it("handles a name with no extension", async () => {
    const args = hookArgs({ operation: "create", filename: "README" });
    await randomizeUploadFilename(args);
    expect((args.req.file as { name: string }).name).toMatch(/^README-[0-9a-f]{16}$/);
  });

  it("leaves a Sanity-imported asset's filename exactly as the import assigned it", async () => {
    // scripts/payload-import/assets.ts assigns deterministic names so the
    // import is idempotent and `verify:import` can compare against the archive.
    // It always sends `sanityAssetId`; a live upload never does.
    const args = hookArgs({
      operation: "create",
      filename: "oceania.jpg",
      data: { sanityAssetId: "image-abc-800x600-jpg" },
    });
    await randomizeUploadFilename(args);
    expect((args.req.file as { name: string }).name).toBe("oceania.jpg");
  });

  it("does nothing on update, or when no file is attached", async () => {
    const update = hookArgs({ operation: "update", filename: "logo.png" });
    await randomizeUploadFilename(update);
    expect((update.req.file as { name: string }).name).toBe("logo.png");

    const noFile = hookArgs({ operation: "create" });
    await expect(randomizeUploadFilename(noFile)).resolves.toBeUndefined();
  });
});
