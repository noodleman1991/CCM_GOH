import { describe, expect, it, vi, beforeEach } from "vitest";

const mockCommit = vi.fn();
const mockUnset = vi.fn();
const mockSet = vi.fn();
const mockPatch = vi.fn();

vi.mock("@/sanity/lib/cached-fetch", () => ({
  cachedFetch: vi.fn(),
}));

vi.mock("@/sanity/lib/write-client", () => ({
  writeClient: {
    patch: (...args: unknown[]) => mockPatch(...args),
  },
}));

import { updateDocument } from "@/lib/content/internal/sanity-source";

beforeEach(() => {
  mockCommit.mockReset().mockResolvedValue(undefined);
  mockUnset.mockReset().mockReturnValue({ commit: mockCommit });
  mockSet.mockReset().mockReturnValue({ unset: mockUnset, commit: mockCommit });
  mockPatch.mockReset().mockReturnValue({ set: mockSet, unset: mockUnset, commit: mockCommit });
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
