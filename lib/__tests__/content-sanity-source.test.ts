import { describe, expect, it, vi, beforeEach } from "vitest";

const mockCommit = vi.fn();
const mockUnset = vi.fn();
const mockSet = vi.fn();
const mockPatch = vi.fn();
const mockAssetsUpload = vi.fn();
const mockTxDelete = vi.fn();
const mockTxCommit = vi.fn();
const mockTransaction = vi.fn();

vi.mock("@/sanity/lib/cached-fetch", () => ({
  cachedFetch: vi.fn(),
}));

vi.mock("@/sanity/lib/write-client", () => ({
  writeClient: {
    patch: (...args: unknown[]) => mockPatch(...args),
    assets: { upload: (...args: unknown[]) => mockAssetsUpload(...args) },
    transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

import { updateDocument, uploadImageAsset, deleteDocuments } from "@/lib/content/internal/sanity-source";

beforeEach(() => {
  mockCommit.mockReset().mockResolvedValue(undefined);
  mockUnset.mockReset().mockReturnValue({ commit: mockCommit });
  mockSet.mockReset().mockReturnValue({ unset: mockUnset, commit: mockCommit });
  mockPatch.mockReset().mockReturnValue({ set: mockSet, unset: mockUnset, commit: mockCommit });
  mockAssetsUpload.mockReset();
  mockTxDelete.mockReset();
  mockTxCommit.mockReset().mockResolvedValue(undefined);
  mockTransaction.mockReset().mockImplementation(() => {
    const tx = { delete: mockTxDelete, commit: mockTxCommit };
    mockTxDelete.mockReturnValue(tx);
    return tx;
  });
});

describe("updateDocument", () => {
  it("routes non-null entries to set and null entries to unset", async () => {
    await updateDocument("doc1", { title: "Hello", status: "pending", reviewNotes: null, tags: null });

    expect(mockPatch).toHaveBeenCalledWith("doc1");
    expect(mockSet).toHaveBeenCalledWith({ title: "Hello", status: "pending" });
    expect(mockUnset).toHaveBeenCalledWith(["reviewNotes", "tags"]);
    expect(mockCommit).toHaveBeenCalledTimes(1);
  });

  it("skips .set() when every entry is null", async () => {
    await updateDocument("doc1", { videoLink: null, body: null });

    expect(mockSet).not.toHaveBeenCalled();
    expect(mockUnset).toHaveBeenCalledWith(["videoLink", "body"]);
    expect(mockCommit).toHaveBeenCalledTimes(1);
  });

  it("skips .unset() when every entry is non-null", async () => {
    await updateDocument("doc1", { title: "Hello", featured: false });

    expect(mockSet).toHaveBeenCalledWith({ title: "Hello", featured: false });
    expect(mockUnset).not.toHaveBeenCalled();
    expect(mockCommit).toHaveBeenCalledTimes(1);
  });

  it("commits with neither set nor unset for an empty data object", async () => {
    await updateDocument("doc1", {});

    expect(mockSet).not.toHaveBeenCalled();
    expect(mockUnset).not.toHaveBeenCalled();
    expect(mockCommit).toHaveBeenCalledTimes(1);
  });
});

describe("uploadImageAsset", () => {
  it("uploads as an image asset and returns id/url/dimensions/lqip", async () => {
    mockAssetsUpload.mockResolvedValueOnce({
      _id: "image-abc123",
      url: "https://cdn.sanity.io/images/proj/ds/abc123.jpg",
      metadata: { dimensions: { width: 800, height: 600 }, lqip: "data:image/png;base64,..." },
    });

    const buffer = Buffer.from("fake-image-bytes");
    const result = await uploadImageAsset(buffer, { filename: "photo.jpg" });

    expect(mockAssetsUpload).toHaveBeenCalledWith("image", buffer, { filename: "photo.jpg" });
    expect(result).toEqual({
      id: "image-abc123",
      url: "https://cdn.sanity.io/images/proj/ds/abc123.jpg",
      width: 800,
      height: 600,
      lqip: "data:image/png;base64,...",
    });
  });

  it("tolerates a response with no dimensions/lqip metadata", async () => {
    mockAssetsUpload.mockResolvedValueOnce({ _id: "image-xyz", url: "https://cdn.sanity.io/images/proj/ds/xyz.jpg" });

    const result = await uploadImageAsset(Buffer.from("x"), { filename: "x.jpg" });

    expect(result).toEqual({
      id: "image-xyz",
      url: "https://cdn.sanity.io/images/proj/ds/xyz.jpg",
      width: undefined,
      height: undefined,
      lqip: undefined,
    });
  });

  it("throws when the upload fails (write paths never swallow)", async () => {
    mockAssetsUpload.mockRejectedValueOnce(new Error("network error"));

    await expect(uploadImageAsset(Buffer.from("x"), { filename: "x.jpg" })).rejects.toThrow("network error");
  });
});

describe("deleteDocuments", () => {
  it("deletes every id in a single transaction commit", async () => {
    await deleteDocuments(["a", "b", "c"]);

    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockTxDelete).toHaveBeenCalledWith("a");
    expect(mockTxDelete).toHaveBeenCalledWith("b");
    expect(mockTxDelete).toHaveBeenCalledWith("c");
    expect(mockTxCommit).toHaveBeenCalledWith({ visibility: "async" });
    expect(mockTxCommit).toHaveBeenCalledTimes(1);
  });

  it("is a no-op — no transaction, no commit — for an empty list", async () => {
    await deleteDocuments([]);

    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockTxCommit).not.toHaveBeenCalled();
  });

  it("throws when the commit fails (write paths never swallow)", async () => {
    mockTxCommit.mockRejectedValueOnce(new Error("commit failed"));

    await expect(deleteDocuments(["a"])).rejects.toThrow("commit failed");
  });
});
