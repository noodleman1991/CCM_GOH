import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { urlForMock } = vi.hoisted(() => ({
  urlForMock: vi.fn(),
}));

vi.mock("@/lib/content/internal/sanity-source", () => ({
  query: vi.fn(),
}));
vi.mock("@/lib/content/internal/payload-source", () => ({
  query: vi.fn(),
}));
vi.mock("@/sanity/lib/image", () => ({
  urlFor: urlForMock,
}));

import { query } from "@/lib/content/internal/sanity-source";
import { query as payloadQuery } from "@/lib/content/internal/payload-source";
import { getHubIllustrations } from "@/lib/content/illustrations";

const mockQuery = vi.mocked(query);
const mockPayloadQuery = vi.mocked(payloadQuery);

function stubUrlForBuilder(url: string) {
  const builder = {
    width: vi.fn(() => builder),
    height: vi.fn(() => builder),
    url: vi.fn(() => url),
  };
  return builder;
}

describe("getHubIllustrations", () => {
  beforeEach(() => {
    mockQuery.mockReset();
    mockPayloadQuery.mockReset();
    urlForMock.mockReset();
    // `activeBackend()` reads the environment per call, so an override left
    // behind by the Payload section below would silently redirect these.
    // Pin the Sanity arm explicitly: these suites assert Sanity behaviour and
  // must not read the ambient CONTENT_BACKEND (184 false failures under
  // `CONTENT_BACKEND=payload` before 2026-09-17). The Payload describes below
  // set the override to "payload" themselves.
  process.env.CONTENT_BACKEND_ILLUSTRATIONS = "sanity";
  });
  afterEach(() => {
    delete process.env.CONTENT_BACKEND_ILLUSTRATIONS;
    vi.restoreAllMocks();
  });

  it("maps configured slots to {url, alt, width, height}, reading via query", async () => {
    // GROQ's `asset->{...}` dereferences the reference into the asset
    // document, whose id field is `_id` (not `_ref` — that only exists on
    // the un-dereferenced reference). Mirrors the real query shape.
    urlForMock.mockImplementation((source: unknown) => {
      const asset = (source as { asset?: { _id?: string } })?.asset;
      return stubUrlForBuilder(`https://cdn.sanity.io/images/${asset?._id ?? "unknown"}.webp`);
    });

    mockQuery.mockResolvedValue({
      atlasHeader: {
        asset: {
          _id: "image-atlas",
          metadata: { dimensions: { width: 800, height: 600 } },
        },
        alt: "Atlas illustration",
      },
      searchHeader: null,
      collaborateHeader: undefined,
      emptyState: {
        asset: {
          _id: "image-empty",
          metadata: { dimensions: { width: 400, height: 300 } },
        },
        alt: "",
      },
    });

    const result = await getHubIllustrations();

    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(result.atlasHeader).toEqual({
      url: "https://cdn.sanity.io/images/image-atlas.webp",
      alt: "Atlas illustration",
      width: 800,
      height: 600,
    });
    expect(result.emptyState).toEqual({
      url: "https://cdn.sanity.io/images/image-empty.webp",
      alt: "",
      width: 400,
      height: 300,
    });
    expect(result.searchHeader).toBeUndefined();
    expect(result.collaborateHeader).toBeUndefined();
  });

  it("returns {} when the singleton document does not exist", async () => {
    mockQuery.mockResolvedValue(null);
    const result = await getHubIllustrations();
    expect(result).toEqual({});
  });

  it("returns {} when the fetch throws — never throws into the page", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValue(new Error("network down"));
    await expect(getHubIllustrations()).resolves.toEqual({});
  });

  it("omits a slot whose image has no asset (unresolved reference)", async () => {
    mockQuery.mockResolvedValue({
      atlasHeader: { alt: "Missing asset" },
    });
    const result = await getHubIllustrations();
    expect(result.atlasHeader).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// The same contract, answered by Payload
// ---------------------------------------------------------------------------
//
// Each assertion here is one already made above against Sanity, made again
// against Payload. What differs is only the raw row, because the two stores
// hold this singleton differently: the pixel dimensions live on the `media`
// row rather than under `asset.metadata.dimensions`, and `alt` is localized
// (`payload/blocks/shared.ts`'s `imageField()`) where Sanity declares a bare
// string.
//
// The singleton has **zero documents in Sanity and no upload in Payload**, so
// there is no stored instance to verify this against and these tests are the
// whole of its coverage. Said plainly rather than implied.
// ---------------------------------------------------------------------------

describe("getHubIllustrations, answered by Payload", () => {
  beforeEach(() => {
    mockQuery.mockReset();
    mockPayloadQuery.mockReset();
    process.env.CONTENT_BACKEND_ILLUSTRATIONS = "payload";
  });
  afterEach(() => {
    delete process.env.CONTENT_BACKEND_ILLUSTRATIONS;
    vi.restoreAllMocks();
  });

  it("maps configured slots to {url, alt, width, height}", async () => {
    mockPayloadQuery.mockResolvedValue({
      atlasHeader: {
        asset: { id: "image-atlas", url: "/payload-api/media/file/atlas.png", width: 800, height: 600 },
        alt: { en: "Atlas illustration", es: null, fr: null, ar: null },
      },
      searchHeader: null,
      collaborateHeader: {},
      emptyState: {
        asset: { id: "image-empty", url: "/payload-api/media/file/empty.png", width: 400, height: 300 },
        alt: { en: null, es: null, fr: null, ar: null },
      },
    });

    const result = await getHubIllustrations();

    expect(mockPayloadQuery).toHaveBeenCalledTimes(1);
    expect(mockQuery).not.toHaveBeenCalled();
    expect(result.atlasHeader).toEqual({
      url: "/payload-api/media/file/atlas.png",
      alt: "Atlas illustration",
      width: 800,
      height: 600,
    });
    // An unset alt is `""` on both backends — Sanity's `image.alt ?? ""`.
    expect(result.emptyState).toEqual({
      url: "/payload-api/media/file/empty.png",
      alt: "",
      width: 400,
      height: 300,
    });
    expect(result.searchHeader).toBeUndefined();
    expect(result.collaborateHeader).toBeUndefined();
  });

  it("falls back through the locales for alt, en first — the slot carries no locale of its own", async () => {
    mockPayloadQuery.mockResolvedValue({
      atlasHeader: {
        asset: { id: "i", url: "/payload-api/media/file/a.png", width: 10, height: 10 },
        alt: { en: null, es: "Ilustración", fr: "Illustration", ar: null },
      },
    });
    const result = await getHubIllustrations();
    expect(result.atlasHeader?.alt).toBe("Ilustración");
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("returns {} when the singleton document does not exist", async () => {
    mockPayloadQuery.mockResolvedValue(null);
    await expect(getHubIllustrations()).resolves.toEqual({});
    expect(mockPayloadQuery).toHaveBeenCalledTimes(1);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("returns {} when the fetch throws — never throws into the page", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockPayloadQuery.mockRejectedValue(new Error("network down"));
    await expect(getHubIllustrations()).resolves.toEqual({});
    expect(mockPayloadQuery).toHaveBeenCalledTimes(1);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("omits a slot whose upload is unresolved", async () => {
    mockPayloadQuery.mockResolvedValue({ atlasHeader: { alt: { en: "Missing asset" } } });
    const result = await getHubIllustrations();
    expect(result.atlasHeader).toBeUndefined();
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("omits a slot at depth 0, where `asset` is a bare id string with no dimensions", async () => {
    mockPayloadQuery.mockResolvedValue({ atlasHeader: { asset: "image-atlas", alt: { en: "A" } } });
    const result = await getHubIllustrations();
    expect(result.atlasHeader).toBeUndefined();
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("omits a slot whose media row carries no pixel dimensions, as the Sanity path does", async () => {
    mockPayloadQuery.mockResolvedValue({
      atlasHeader: { asset: { id: "i", url: "/payload-api/media/file/a.svg" }, alt: { en: "A" } },
    });
    const result = await getHubIllustrations();
    expect(result.atlasHeader).toBeUndefined();
    expect(mockQuery).not.toHaveBeenCalled();
  });
});
