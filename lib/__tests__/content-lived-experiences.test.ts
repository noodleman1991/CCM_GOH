import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/content/internal/sanity-source", () => ({
  query: vi.fn(),
  queryRaw: vi.fn(),
  uploadFileAsset: vi.fn(),
  createDocument: vi.fn(),
  patchDocument: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workspaceOutput: {
      findFirst: vi.fn(),
    },
  },
  safeQuery: vi.fn(async (fn: () => unknown) => {
    try {
      return { success: true, data: await fn() };
    } catch (error) {
      return { success: false, error };
    }
  }),
}));

import {
  query,
  queryRaw,
  uploadFileAsset,
  createDocument,
  patchDocument,
} from "@/lib/content/internal/sanity-source";
import { prisma } from "@/lib/prisma";
import {
  getLivedExperienceIndex,
  getLivedExperiencesByRegion,
  getLivedExperiencesCarousel,
  getAvailableLivedExperienceTags,
  getActiveRegionalCommunities,
  loadEditableLivedExperience,
  submitLivedExperience,
  getLivedExperienceBySlug,
  getLivedExperienceSlugs,
  getLivedExperienceOgData,
  LivedExperienceEditNotAllowedError,
  LivedExperienceMissingVideoError,
} from "@/lib/content/lived-experiences";

const mockQuery = vi.mocked(query);
const mockQueryRaw = vi.mocked(queryRaw);
const mockUploadFileAsset = vi.mocked(uploadFileAsset);
const mockCreateDocument = vi.mocked(createDocument);
const mockPatchDocument = vi.mocked(patchDocument);
const mockFindFirst = vi.mocked(prisma.workspaceOutput.findFirst);

beforeEach(() => {
  mockQuery.mockReset();
  mockQueryRaw.mockReset();
  mockUploadFileAsset.mockReset();
  mockCreateDocument.mockReset();
  mockPatchDocument.mockReset();
  mockFindFirst.mockReset();
});
afterEach(() => vi.restoreAllMocks());

describe("getLivedExperienceIndex", () => {
  it("returns videos, regional communities and tags from the source", async () => {
    mockQuery.mockResolvedValue({
      videos: [{ _id: "v1", title: { en: "A story" }, tags: [], region: null }],
      regionalCommunities: [{ _id: "r1", name: { en: "Oceania" }, slug: "oceania" }],
      allTags: [{ _id: "t1", label: { en: "Anxiety" }, value: "anxiety" }],
    });

    const result = await getLivedExperienceIndex();

    expect(result.videos).toHaveLength(1);
    expect(result.videos[0].id).toBe("v1");
    expect(result.regionalCommunities[0].slug).toBe("oceania");
    expect(result.allTags[0].value).toBe("anxiety");
  });

  it("degrades to an empty index when the source fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValue(new Error("402 plan_limit_reached"));

    await expect(getLivedExperienceIndex()).resolves.toEqual({
      videos: [],
      regionalCommunities: [],
      allTags: [],
    });
  });

  it("degrades when the source returns null rather than an object", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockResolvedValue(null);

    const result = await getLivedExperienceIndex();
    expect(result.videos).toEqual([]);
  });
});

describe("getLivedExperiencesByRegion", () => {
  it("filters the index to videos in the given region", async () => {
    mockQuery.mockResolvedValue({
      videos: [
        { _id: "v1", title: { en: "In region" }, tags: [], region: { _id: "r1", name: { en: "Oceania" }, slug: "oceania" } },
        { _id: "v2", title: { en: "Elsewhere" }, tags: [], region: { _id: "r2", name: { en: "Sahel" }, slug: "sahel" } },
      ],
      regionalCommunities: [],
      allTags: [],
    });

    const result = await getLivedExperiencesByRegion("oceania");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("v1");
  });
});

describe("getLivedExperiencesCarousel", () => {
  it("returns items from the source, defaulting unset filters", async () => {
    mockQuery.mockResolvedValue([{ _id: "v1", _type: "livedExperience", title: { en: "A story" } }]);

    const result = await getLivedExperiencesCarousel({});

    expect(result).toHaveLength(1);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ communities: null, tags: null, authors: null, featured: false, maxItems: 10 }),
    );
  });

  it("degrades to an empty list when the source fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValue(new Error("network error"));

    await expect(getLivedExperiencesCarousel({})).resolves.toEqual([]);
  });
});

describe("getAvailableLivedExperienceTags / getActiveRegionalCommunities", () => {
  it("returns tags from the source", async () => {
    mockQuery.mockResolvedValue([{ _id: "t1", label: { en: "Anxiety" }, value: "anxiety" }]);
    await expect(getAvailableLivedExperienceTags()).resolves.toEqual([
      { _id: "t1", label: { en: "Anxiety" }, value: "anxiety" },
    ]);
  });

  it("returns active regional communities from the source", async () => {
    mockQuery.mockResolvedValue([{ _id: "r1", name: { en: "Oceania" }, slug: { current: "oceania" } }]);
    await expect(getActiveRegionalCommunities()).resolves.toEqual([
      { _id: "r1", name: { en: "Oceania" }, slug: { current: "oceania" } },
    ]);
  });

  it("throws through when the source fails (no local try/catch previously)", async () => {
    mockQuery.mockRejectedValue(new Error("upstream 500"));
    await expect(getAvailableLivedExperienceTags()).rejects.toThrow("upstream 500");
  });
});

describe("loadEditableLivedExperience", () => {
  it("returns the mapped doc when the submitter matches", async () => {
    mockQueryRaw.mockResolvedValue({
      _id: "le1",
      language: "en",
      title: { en: "My story" },
      description: { en: "Desc" },
      issue: { en: "Issue" },
      personContext: { en: "Context" },
      videoSource: "youtube",
      videoLink: "https://youtube.com/watch?v=abc",
      body: [],
      submittedBy: "user1",
      status: "pending",
      reviewNotes: null,
      regionalCommunityId: "r1",
      tagIds: ["t1"],
      hasVideoFile: false,
    });

    const result = await loadEditableLivedExperience("le1", "user1");

    expect(result?.title).toBe("My story");
    expect(result?.language).toBe("en");
  });

  it("returns null when the doc doesn't exist", async () => {
    mockQueryRaw.mockResolvedValue(null);
    await expect(loadEditableLivedExperience("missing", "user1")).resolves.toBeNull();
  });

  it("returns null when the caller isn't the submitter or a workspace member", async () => {
    mockQueryRaw.mockResolvedValue({
      _id: "le1",
      submittedBy: "someone-else",
      status: "pending",
    });
    mockFindFirst.mockResolvedValue(null);

    await expect(loadEditableLivedExperience("le1", "user1")).resolves.toBeNull();
  });

  it("throws (does not degrade) when the source fails", async () => {
    mockQueryRaw.mockRejectedValue(new Error("network error"));
    await expect(loadEditableLivedExperience("le1", "user1")).rejects.toThrow("network error");
  });
});

describe("submitLivedExperience", () => {
  it("creates a pending doc for a fresh submission", async () => {
    mockCreateDocument.mockResolvedValue({ id: "new-id" });

    const result = await submitLivedExperience({
      userId: "user1",
      language: "en",
      title: "My story",
      description: "A description long enough",
      issue: "An issue",
    });

    expect(result).toEqual({ id: "new-id" });
    expect(mockCreateDocument).toHaveBeenCalledWith(
      expect.objectContaining({ _type: "livedExperience", status: "pending", submittedBy: "user1" }),
    );
  });

  it("uploads the video asset before creating the document", async () => {
    mockUploadFileAsset.mockResolvedValue({ id: "asset1" });
    mockCreateDocument.mockResolvedValue({ id: "new-id" });

    await submitLivedExperience({
      userId: "user1",
      language: "en",
      title: "My story",
      videoSource: "upload",
      videoFile: { buffer: Buffer.from("x"), filename: "clip.mp4", contentType: "video/mp4" },
    });

    expect(mockUploadFileAsset).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.objectContaining({ filename: "clip.mp4", contentType: "video/mp4" }),
    );
    expect(mockCreateDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        videoFile: { _type: "file", asset: { _type: "reference", _ref: "asset1" } },
      }),
    );
  });

  it("patches the existing doc on an allowed edit resubmission", async () => {
    mockQueryRaw.mockResolvedValue({ _id: "le1", submittedBy: "user1", status: "pending", hasVideoFile: false });

    const result = await submitLivedExperience({
      userId: "user1",
      language: "en",
      title: "Updated story",
      editId: "le1",
    });

    expect(result).toEqual({ id: "le1" });
    expect(mockPatchDocument).toHaveBeenCalledWith(
      "le1",
      expect.objectContaining({ set: expect.objectContaining({ status: "pending" }) }),
    );
    expect(mockCreateDocument).not.toHaveBeenCalled();
  });

  it("throws LivedExperienceEditNotAllowedError when the caller may not edit the doc", async () => {
    mockQueryRaw.mockResolvedValue({ _id: "le1", submittedBy: "someone-else", status: "pending" });
    mockFindFirst.mockResolvedValue(null);

    await expect(
      submitLivedExperience({ userId: "user1", language: "en", title: "x", editId: "le1" }),
    ).rejects.toBeInstanceOf(LivedExperienceEditNotAllowedError);
  });

  it("throws LivedExperienceMissingVideoError when an upload edit has no file and none exists", async () => {
    mockQueryRaw.mockResolvedValue({ _id: "le1", submittedBy: "user1", status: "pending", hasVideoFile: false });

    await expect(
      submitLivedExperience({
        userId: "user1",
        language: "en",
        title: "x",
        editId: "le1",
        videoSource: "upload",
        videoFile: null,
      }),
    ).rejects.toBeInstanceOf(LivedExperienceMissingVideoError);
  });

  it("throws (does not degrade) when the write fails", async () => {
    mockCreateDocument.mockRejectedValue(new Error("Sanity write failed"));
    await expect(
      submitLivedExperience({ userId: "user1", language: "en", title: "x" }),
    ).rejects.toThrow("Sanity write failed");
  });
});

describe("getLivedExperienceBySlug / getLivedExperienceSlugs", () => {
  it("returns the detail doc from the source", async () => {
    mockQuery.mockResolvedValue({ _id: "le1", title: { en: "My story" } });
    await expect(getLivedExperienceBySlug("my-story")).resolves.toEqual({ _id: "le1", title: { en: "My story" } });
  });

  it("returns null when there's no match", async () => {
    mockQuery.mockResolvedValue(null);
    await expect(getLivedExperienceBySlug("missing")).resolves.toBeNull();
  });

  it("returns slugs from the source", async () => {
    mockQuery.mockResolvedValue([{ slug: "my-story" }]);
    await expect(getLivedExperienceSlugs()).resolves.toEqual([{ slug: "my-story" }]);
  });

  it("throws (does not degrade) when the source fails, as the original unwrapped fetch did", async () => {
    mockQuery.mockRejectedValue(new Error("timeout"));
    await expect(getLivedExperienceBySlug("x")).rejects.toThrow("timeout");
  });
});

describe("getLivedExperienceOgData", () => {
  it("returns the title and region from the source", async () => {
    mockQuery.mockResolvedValue({ title: { en: "My story" }, region: "Oceania" });
    await expect(getLivedExperienceOgData("my-story")).resolves.toEqual({
      title: { en: "My story" },
      region: "Oceania",
    });
  });

  it("degrades to null when the source fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValue(new Error("network error"));
    await expect(getLivedExperienceOgData("x")).resolves.toBeNull();
  });
});
