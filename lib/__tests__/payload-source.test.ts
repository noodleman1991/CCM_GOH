import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The Payload half of the seam, tested the way the Sanity half is
 * (lib/__tests__/content-sanity-source.test.ts): the store is mocked, so this
 * file never opens a database connection. That is deliberate and not just
 * about speed — the dev Payload database holds 381 live documents and 21
 * in-flight moderation drafts, and a test suite is the last thing that should
 * be reaching for it.
 *
 * What is under test is the thing Phase 1 kept getting wrong: the four read
 * primitives are NOT interchangeable, and every difference is load-bearing.
 * Six Phase-1 bugs came from merging `query` with `queryPreviewable`; an
 * authorization bypass came from swapping `queryLive` for `queryRaw`. So most
 * of what follows asserts the *differences* rather than the happy path.
 */

const find = vi.fn();
const findByID = vi.fn();
const count = vi.fn();
const findGlobal = vi.fn();
const create = vi.fn();
const update = vi.fn();
const deleteOp = vi.fn();
const getPayload = vi.fn();

vi.mock("payload", () => ({
  getPayload: (...args: unknown[]) => getPayload(...args),
}));

// The real config opens a Postgres pool and resolves an R2 bucket; the seam
// only ever passes it straight through to `getPayload`, so a sentinel proves
// the wiring without any of that.
vi.mock("@payload-config", () => ({ default: { __config: "sentinel" } }));

const draftModeState = vi.fn();
vi.mock("next/headers", () => ({ draftMode: () => draftModeState() }));

/**
 * `unstable_cache` is recorded rather than exercised: outside a Next request
 * there is no incremental cache to hit, and what matters here is *which*
 * primitives route through it and with what revalidate/tags — not whether
 * Next's own cache works.
 */
type CacheCall = { keyParts: string[]; options: { revalidate?: number; tags?: string[] } };
const cacheCalls: CacheCall[] = [];
vi.mock("next/cache", () => ({
  unstable_cache: (
    fn: (...args: never[]) => unknown,
    keyParts: string[],
    options: { revalidate?: number; tags?: string[] },
  ) => {
    cacheCalls.push({ keyParts, options });
    return fn;
  },
}));

// sanity-source is imported for its export *names* only (the mirror check
// below). Its Sanity plumbing is mocked exactly as
// content-sanity-source.test.ts mocks it — importing it for real needs a live
// SANITY_API_READ_TOKEN, which vitest deliberately does not carry.
vi.mock("@/sanity/lib/cached-fetch", () => ({ cachedFetch: vi.fn() }));
vi.mock("@/sanity/lib/client", () => ({ client: { fetch: vi.fn() } }));
vi.mock("@/sanity/lib/write-client", () => ({ writeClient: { fetch: vi.fn() } }));

import * as sanitySource from "@/lib/content/internal/sanity-source";
import {
  CONTENT_CACHE_TAG,
  createDocument,
  deleteDocument,
  deleteDocuments,
  query,
  queryLive,
  queryPreviewable,
  queryRaw,
  updateDocument,
  uploadFileAsset,
  uploadImageAsset,
} from "@/lib/content/internal/payload-source";
import * as payloadSource from "@/lib/content/internal/payload-source";
import { activeBackend } from "@/lib/content/internal/backend";

/** Only the shape the seam reads: which collections carry `_status`. Matches
 *  the real config — tags/caseStudies/authors enable versions.drafts, agendas
 *  and events do not. */
const CONFIG = {
  collections: [
    { slug: "tags", versions: { drafts: true } },
    { slug: "caseStudies", versions: { drafts: true } },
    { slug: "authors", versions: { drafts: true } },
    { slug: "agendas", versions: { drafts: false } },
    { slug: "events", versions: { drafts: false } },
    { slug: "media", versions: { drafts: false } },
    { slug: "files", versions: { drafts: false } },
  ],
};

const PUBLISHED = { _status: { equals: "published" } };

beforeEach(() => {
  cacheCalls.length = 0;
  for (const spy of [find, findByID, count, findGlobal, create, update, deleteOp]) spy.mockReset();
  getPayload.mockReset().mockResolvedValue({
    config: CONFIG,
    find,
    findByID,
    count,
    findGlobal,
    create,
    update,
    delete: deleteOp,
  });
  // Default: no draft session. Individual tests opt in.
  draftModeState.mockReset().mockResolvedValue({ isEnabled: false });
});

afterEach(() => {
  delete process.env.PAYLOAD_REVALIDATE_SECONDS;
  for (const key of Object.keys(process.env)) {
    if (key === "CONTENT_BACKEND" || key.startsWith("CONTENT_BACKEND_")) delete process.env[key];
  }
});

/** The single object the mocked Payload operation was called with. */
const argsOf = (spy: typeof find): Record<string, unknown> => spy.mock.calls[0]![0] as Record<string, unknown>;

describe("payload-source mirrors sanity-source", () => {
  it("exports every read primitive the seam defines", () => {
    for (const name of ["query", "queryPreviewable", "queryRaw", "queryLive"]) {
      expect(typeof (payloadSource as Record<string, unknown>)[name]).toBe("function");
    }
  });

  it("does not drop any export the Sanity source provides", () => {
    const missing = Object.keys(sanitySource).filter((k) => !(k in payloadSource));
    expect(missing).toEqual([]);
  });

  it("reuses one Payload instance across calls rather than initialising per read", async () => {
    find.mockResolvedValue({ docs: [] });

    await queryLive({ type: "find", collection: "tags" });
    await queryLive({ type: "find", collection: "tags" });

    expect(getPayload).toHaveBeenCalledTimes(1);
    expect(getPayload).toHaveBeenCalledWith({ config: { __config: "sentinel" } });
  });
});

describe("query", () => {
  it("reads the published document — never a draft — and caches for an hour", async () => {
    find.mockResolvedValue({ docs: [{ id: "tag-farmers" }] });

    const result = await query({ type: "find", collection: "tags", where: { slug: { equals: "farmers" } } });

    expect(result).toEqual({ docs: [{ id: "tag-farmers" }] });
    expect(argsOf(find)).toMatchObject({
      collection: "tags",
      draft: false,
      // Both halves of "published": no version overlay AND a published row.
      where: { and: [PUBLISHED, { slug: { equals: "farmers" } }] },
    });
    expect(cacheCalls).toHaveLength(1);
    expect(cacheCalls[0]!.options).toEqual({ revalidate: 3600, tags: [CONTENT_CACHE_TAG] });
  });

  it("keys the cache on the descriptor, so two different reads cannot share an entry", async () => {
    find.mockResolvedValue({ docs: [] });

    await query({ type: "find", collection: "tags" });
    await query({ type: "find", collection: "authors" });

    expect(cacheCalls).toHaveLength(2);
    expect(cacheCalls[0]!.keyParts).not.toEqual(cacheCalls[1]!.keyParts);
  });

  it("keys two descriptors written in a different key order to the same entry", async () => {
    find.mockResolvedValue({ docs: [] });

    await query({ type: "find", collection: "tags", limit: 5 });
    await query({ limit: 5, collection: "tags", type: "find" });

    expect(cacheCalls[0]!.keyParts).toEqual(cacheCalls[1]!.keyParts);
  });

  it("honours PAYLOAD_REVALIDATE_SECONDS", async () => {
    process.env.PAYLOAD_REVALIDATE_SECONDS = "60";
    find.mockResolvedValue({ docs: [] });

    await query({ type: "find", collection: "tags" });

    expect(cacheCalls[0]!.options.revalidate).toBe(60);
  });

  it("never consults draftMode() — it must stay callable outside a request scope", async () => {
    find.mockResolvedValue({ docs: [] });

    await query({ type: "find", collection: "tags" });

    expect(draftModeState).not.toHaveBeenCalled();
  });
});

describe("queryPreviewable", () => {
  it("reads published and caches when there is no draft session — identical to query()", async () => {
    find.mockResolvedValue({ docs: [] });

    await queryPreviewable({ type: "find", collection: "caseStudies" });

    expect(argsOf(find)).toMatchObject({ draft: false, where: PUBLISHED });
    expect(cacheCalls).toHaveLength(1);
  });

  it("reads the newest revision and does NOT cache inside draft mode", async () => {
    draftModeState.mockResolvedValue({ isEnabled: true });
    find.mockResolvedValue({ docs: [] });

    await queryPreviewable({ type: "find", collection: "caseStudies" });

    expect(argsOf(find)).toMatchObject({ draft: true });
    // No published-only filter either: an editor previewing must see the
    // unpublished document, which is the whole reason this primitive exists.
    expect("where" in argsOf(find)).toBe(false);
    expect(cacheCalls).toEqual([]);
  });

  it("treats a draftMode() that throws as 'not draft' — static generation has no cookies to read", async () => {
    draftModeState.mockRejectedValue(new Error("draftMode was called outside a request scope"));
    find.mockResolvedValue({ docs: [] });

    await expect(queryPreviewable({ type: "find", collection: "caseStudies" })).resolves.toEqual({ docs: [] });
    expect(argsOf(find)).toMatchObject({ draft: false });
  });
});

describe("queryRaw and queryLive are not interchangeable", () => {
  it("queryRaw sees every version, so a gated read finds the author's own unpublished document", async () => {
    findByID.mockResolvedValue({ id: "cs-1", _status: "draft", moderationStatus: "pending" });

    const doc = await queryRaw({ type: "findByID", collection: "caseStudies", id: "cs-1" });

    expect(argsOf(findByID)).toMatchObject({ draft: true });
    expect(doc).toMatchObject({ id: "cs-1" });
  });

  it("queryLive hands back null for a draft-only document — the Phase-1 bypass, closed", async () => {
    // The exact shape of the bug: a draft that claims to be approved, reached
    // by a client-supplied id, answering an authorization gate.
    findByID.mockResolvedValue({ id: "cs-1", _status: "draft", moderationStatus: "approved" });

    const doc = await queryLive({ type: "findByID", collection: "caseStudies", id: "cs-1" });

    expect(argsOf(findByID)).toMatchObject({ draft: false });
    expect(doc).toBeNull();
  });

  it("queryLive returns a published document untouched", async () => {
    findByID.mockResolvedValue({ id: "cs-1", _status: "published", moderationStatus: "approved" });

    const doc = await queryLive({ type: "findByID", collection: "caseStudies", id: "cs-1" });

    expect(doc).toMatchObject({ id: "cs-1" });
  });

  it("neither is cached — a read feeding a write must not be stale", async () => {
    findByID.mockResolvedValue(null);
    count.mockResolvedValue({ totalDocs: 0 });

    await queryRaw({ type: "findByID", collection: "caseStudies", id: "cs-1" });
    await queryLive({ type: "count", collection: "events" });

    expect(cacheCalls).toEqual([]);
  });
});

describe("the published-only filter", () => {
  it("is added on a collection that enables versions.drafts", async () => {
    count.mockResolvedValue({ totalDocs: 3 });

    await queryLive({ type: "count", collection: "caseStudies", where: { moderationStatus: { equals: "approved" } } });

    expect(argsOf(count)).toMatchObject({
      where: { and: [PUBLISHED, { moderationStatus: { equals: "approved" } }] },
    });
  });

  it("is NOT added on a collection without versions — there is no _status column to query", async () => {
    // Payload's validateQueryPaths rejects a where clause naming a field the
    // collection does not have, so this is a hard error, not a nicety.
    count.mockResolvedValue({ totalDocs: 29 });

    await queryLive({ type: "count", collection: "agendas" });

    expect("where" in argsOf(count)).toBe(false);
  });

  it("is absent from a raw read even on a drafts-enabled collection", async () => {
    find.mockResolvedValue({ docs: [] });

    await queryRaw({ type: "find", collection: "caseStudies", where: { submittedBy: { equals: "user_1" } } });

    expect(argsOf(find)).toMatchObject({ where: { submittedBy: { equals: "user_1" } } });
  });
});

describe("the query descriptor", () => {
  it("findByID returns null instead of throwing when the document is absent", async () => {
    // Payload's findByID throws NotFound by default; GROQ's `[0]` yields null.
    findByID.mockResolvedValue(null);

    const result = await queryLive({ type: "findByID", collection: "caseStudies", id: "nope" });

    expect(result).toBeNull();
    expect(argsOf(findByID)).toMatchObject({ disableErrors: true });
  });

  it("count unwraps totalDocs, matching GROQ's count() returning a number", async () => {
    count.mockResolvedValue({ totalDocs: 29 });

    const result = await queryLive({ type: "count", collection: "agendas" });

    expect(result).toBe(29);
  });

  it("global reads findGlobal", async () => {
    findGlobal.mockResolvedValue({ enabled: true });

    const result = await queryLive({ type: "global", slug: "moderationSettings" });

    expect(result).toEqual({ enabled: true });
    expect(argsOf(findGlobal)).toMatchObject({ slug: "moderationSettings", draft: false });
  });

  it("defaults locale to 'all', the shape lib/content/'s Localized<T> already expects", async () => {
    find.mockResolvedValue({ docs: [] });

    await queryLive({ type: "find", collection: "tags" });

    expect(argsOf(find)).toMatchObject({ locale: "all" });
  });

  it("passes an explicit locale and its fallback through untouched", async () => {
    find.mockResolvedValue({ docs: [] });

    await queryLive({ type: "find", collection: "tags", locale: "ar", fallbackLocale: "en" });

    expect(argsOf(find)).toMatchObject({ locale: "ar", fallbackLocale: "en" });
  });

  it("omits knobs it was not given rather than overriding Payload's defaults with undefined", async () => {
    find.mockResolvedValue({ docs: [] });

    await queryLive({ type: "find", collection: "tags" });

    const args = argsOf(find);
    expect("limit" in args).toBe(false);
    expect("sort" in args).toBe(false);
    expect("depth" in args).toBe(false);
    expect("fallbackLocale" in args).toBe(false);
  });

  it("throws through on failure — no safe() at this layer", async () => {
    find.mockRejectedValue(new Error("connection terminated"));

    await expect(queryLive({ type: "find", collection: "tags" })).rejects.toThrow("connection terminated");
  });
});

describe("the write primitives", () => {
  it("createDocument returns the new document's id", async () => {
    create.mockResolvedValue({ id: "cs-new" });

    const result = await createDocument({ collection: "caseStudies", data: { title: "x" } });

    expect(result).toEqual({ id: "cs-new" });
    expect(argsOf(create)).toMatchObject({ collection: "caseStudies", data: { title: "x" } });
  });

  it("updateDocument passes null straight through — Payload clears a field set to null", async () => {
    update.mockResolvedValue({ id: "cs-1" });

    await updateDocument({ collection: "caseStudies", id: "cs-1", data: { title: "x", reviewNotes: null } });

    expect(argsOf(update)).toMatchObject({ id: "cs-1", data: { title: "x", reviewNotes: null } });
  });

  it("deleteDocument deletes by id", async () => {
    deleteOp.mockResolvedValue({ id: "cs-1" });

    await deleteDocument({ collection: "caseStudies", id: "cs-1" });

    expect(argsOf(deleteOp)).toMatchObject({ collection: "caseStudies", id: "cs-1" });
  });

  it("deleteDocuments erases the batch in one operation", async () => {
    deleteOp.mockResolvedValue({ docs: [], errors: [] });

    await deleteDocuments({ collection: "caseStudies", ids: ["a", "b", "c"] });

    expect(deleteOp).toHaveBeenCalledTimes(1);
    expect(argsOf(deleteOp)).toMatchObject({ collection: "caseStudies", where: { id: { in: ["a", "b", "c"] } } });
  });

  it("deleteDocuments is a no-op for an empty list — no store round-trip", async () => {
    await deleteDocuments({ collection: "caseStudies", ids: [] });

    expect(deleteOp).not.toHaveBeenCalled();
  });

  it("deleteDocuments surfaces a partial failure rather than reporting success", async () => {
    // Payload reports per-document failures in `errors` instead of throwing;
    // a half-finished GDPR erasure must not look like a finished one.
    deleteOp.mockResolvedValue({ docs: [{ id: "a" }], errors: [{ id: "b", message: "nope" }] });

    await expect(deleteDocuments({ collection: "caseStudies", ids: ["a", "b"] })).rejects.toThrow(/b: nope/);
  });

  it("uploadFileAsset creates a files row from the buffer", async () => {
    create.mockResolvedValue({ id: "file-1" });
    const buffer = Buffer.from("pdf-bytes");

    const result = await uploadFileAsset(buffer, { filename: "a.pdf", contentType: "application/pdf" });

    expect(result).toEqual({ id: "file-1" });
    expect(argsOf(create)).toMatchObject({
      collection: "files",
      file: { data: buffer, mimetype: "application/pdf", name: "a.pdf", size: buffer.length },
    });
  });

  it("uploadImageAsset returns the rendered shape and writes a generated lqip", async () => {
    // A real (1x1) PNG: the placeholder is produced by sharp, so a fake
    // buffer would exercise the failure path instead of this one.
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    );
    create.mockResolvedValue({
      id: "media-1",
      url: "/payload-api/media/file/photo.jpg",
      width: 800,
      height: 600,
      lqip: "data:image/webp;base64,AAA",
    });

    const result = await uploadImageAsset(png, { filename: "photo.jpg" });

    expect(result).toEqual({
      id: "media-1",
      url: "/payload-api/media/file/photo.jpg",
      width: 800,
      height: 600,
      lqip: "data:image/webp;base64,AAA",
    });
    // Written on the way in, not invented on the way out: 347/347 imported
    // rows carry `lqip` and 25 components render it as `blurDataURL`.
    const args = argsOf(create) as { collection: string; data: Record<string, unknown>; file: { mimetype: string } };
    expect(args.collection).toBe("media");
    expect(args.file.mimetype).toBe("image/jpeg");
    expect(args.data.lqip as string).toMatch(/^data:image\/webp;base64,/);
  });

  it("uploads without a placeholder rather than failing when one cannot be made", async () => {
    create.mockResolvedValue({ id: "media-2", url: "/payload-api/media/file/x.png" });

    const result = await uploadImageAsset(Buffer.from("not-an-image"), { filename: "x.png" });

    expect(result.lqip).toBeUndefined();
    expect("lqip" in (argsOf(create).data as Record<string, unknown>)).toBe(false);
  });

  it("refuses to guess a content type it cannot infer from the filename", async () => {
    await expect(uploadImageAsset(Buffer.from("x"), { filename: "photo" })).rejects.toThrow(/contentType/);
    expect(create).not.toHaveBeenCalled();
  });

  it("throws when an upload fails (write paths never swallow)", async () => {
    create.mockRejectedValue(new Error("R2 unreachable"));

    await expect(uploadImageAsset(Buffer.from("img"), { filename: "x.jpg" })).rejects.toThrow("R2 unreachable");
  });
});

describe("cleanText", () => {
  it("is the identity function — there is no stega to strip out of Payload", () => {
    const value = { title: "Hello", n: 3, nested: [null] };

    expect(payloadSource.cleanText(value)).toBe(value);
    expect(payloadSource.cleanText(undefined)).toBeUndefined();
  });
});

describe("activeBackend", () => {
  it("defaults to sanity, so an unconfigured deployment keeps reading the live CMS", () => {
    expect(activeBackend()).toBe("sanity");
    expect(activeBackend("case-studies")).toBe("sanity");
  });

  it("follows CONTENT_BACKEND when it is set", () => {
    process.env.CONTENT_BACKEND = "payload";

    expect(activeBackend()).toBe("payload");
    expect(activeBackend("case-studies")).toBe("payload");
  });

  it("lets one domain flip alone, in either direction", () => {
    process.env.CONTENT_BACKEND_TAXONOMY = "payload";
    expect(activeBackend("taxonomy")).toBe("payload");
    expect(activeBackend("news")).toBe("sanity");
    expect(activeBackend()).toBe("sanity");

    process.env.CONTENT_BACKEND = "payload";
    process.env.CONTENT_BACKEND_NEWS = "sanity";
    expect(activeBackend("news")).toBe("sanity");
    expect(activeBackend("taxonomy")).toBe("payload");
  });

  it("derives the variable name from the module's own filename", () => {
    // lib/content/case-studies.ts -> CONTENT_BACKEND_CASE_STUDIES
    process.env.CONTENT_BACKEND_CASE_STUDIES = "payload";

    expect(activeBackend("case-studies")).toBe("payload");
    // and from the other spellings of the same domain
    expect(activeBackend("case_studies")).toBe("payload");
    expect(activeBackend("caseStudies")).toBe("payload");
  });

  it("ignores an empty or whitespace value rather than treating it as a choice", () => {
    process.env.CONTENT_BACKEND = "  ";
    process.env.CONTENT_BACKEND_NEWS = "";

    expect(activeBackend()).toBe("sanity");
    expect(activeBackend("news")).toBe("sanity");
  });

  it("accepts a value whatever its case or padding", () => {
    process.env.CONTENT_BACKEND = " Payload ";

    expect(activeBackend()).toBe("payload");
  });

  it("refuses to guess at a value it does not recognise", () => {
    process.env.CONTENT_BACKEND = "postgres";

    expect(() => activeBackend()).toThrow(/CONTENT_BACKEND/);
    expect(() => activeBackend()).toThrow(/postgres/);
  });

  it("names the per-domain variable in the refusal, not the global one", () => {
    process.env.CONTENT_BACKEND_NEWS = "payl0ad";

    expect(() => activeBackend("news")).toThrow(/CONTENT_BACKEND_NEWS/);
  });
});
