import { describe, it, expect, vi, beforeEach } from "vitest";

const { fetchMock, urlForMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  urlForMock: vi.fn(),
}));
vi.mock("@/sanity/lib/client", () => ({ client: { fetch: fetchMock } }));
vi.mock("@/sanity/lib/image", () => ({
  urlFor: urlForMock,
}));

import { getHubIllustrations } from "../hub-illustrations";

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
    vi.clearAllMocks();
  });

  it("maps configured slots to {url, alt, width, height}", async () => {
    urlForMock.mockImplementation((source: unknown) => {
      const asset = (source as { asset?: { _ref?: string } })?.asset;
      return stubUrlForBuilder(`https://cdn.sanity.io/images/${asset?._ref ?? "unknown"}.webp`);
    });

    fetchMock.mockResolvedValue({
      atlasHeader: {
        asset: {
          _ref: "image-atlas",
          metadata: { dimensions: { width: 800, height: 600 } },
        },
        alt: "Atlas illustration",
      },
      searchHeader: null,
      collaborateHeader: undefined,
      emptyState: {
        asset: {
          _ref: "image-empty",
          metadata: { dimensions: { width: 400, height: 300 } },
        },
        alt: "",
      },
    });

    const result = await getHubIllustrations();

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
    fetchMock.mockResolvedValue(null);
    const result = await getHubIllustrations();
    expect(result).toEqual({});
  });

  it("returns {} when the fetch throws — never throws into the page", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    await expect(getHubIllustrations()).resolves.toEqual({});
  });

  it("omits a slot whose image has no asset (unresolved reference)", async () => {
    fetchMock.mockResolvedValue({
      atlasHeader: { alt: "Missing asset" },
    });
    const result = await getHubIllustrations();
    expect(result.atlasHeader).toBeUndefined();
  });
});
