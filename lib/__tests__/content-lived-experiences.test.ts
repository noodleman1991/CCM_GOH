import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/content/internal/sanity-source", () => ({
  query: vi.fn(),
  queryPreviewable: vi.fn(),
  queryRaw: vi.fn(),
  uploadFileAsset: vi.fn(),
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
}));

vi.mock("@/lib/content/internal/payload-source", () => ({
  nowMinute: () => "2026-09-17T10:00:00.000Z",
  escapeContains: (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`),
  query: vi.fn(),
  queryPreviewable: vi.fn(),
  queryRaw: vi.fn(),
  queryLive: vi.fn(),
  uploadFileAsset: vi.fn(),
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
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
  queryPreviewable,
  queryRaw,
  uploadFileAsset,
  createDocument,
  updateDocument,
} from "@/lib/content/internal/sanity-source";
import {
  query as payloadQuery,
  queryPreviewable as payloadQueryPreviewable,
  queryRaw as payloadQueryRaw,
  queryLive as payloadQueryLive,
  uploadFileAsset as payloadUploadFileAsset,
  createDocument as payloadCreateDocument,
  updateDocument as payloadUpdateDocument,
} from "@/lib/content/internal/payload-source";
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
const mockQueryPreviewable = vi.mocked(queryPreviewable);
const mockQueryRaw = vi.mocked(queryRaw);
const mockUploadFileAsset = vi.mocked(uploadFileAsset);
const mockCreateDocument = vi.mocked(createDocument);
const mockUpdateDocument = vi.mocked(updateDocument);
const mockFindFirst = vi.mocked(prisma.workspaceOutput.findFirst);
const mockPayloadQuery = vi.mocked(payloadQuery);
const mockPayloadQueryPreviewable = vi.mocked(payloadQueryPreviewable);
const mockPayloadQueryRaw = vi.mocked(payloadQueryRaw);
const mockPayloadQueryLive = vi.mocked(payloadQueryLive);
const mockPayloadUploadFileAsset = vi.mocked(payloadUploadFileAsset);
const mockPayloadCreateDocument = vi.mocked(payloadCreateDocument);
const mockPayloadUpdateDocument = vi.mocked(payloadUpdateDocument);

beforeEach(() => {
  mockQuery.mockReset();
  mockQueryPreviewable.mockReset();
  mockQueryRaw.mockReset();
  mockUploadFileAsset.mockReset();
  mockCreateDocument.mockReset();
  mockUpdateDocument.mockReset();
  mockFindFirst.mockReset();
  mockPayloadQuery.mockReset();
  mockPayloadQueryPreviewable.mockReset();
  mockPayloadQueryRaw.mockReset();
  mockPayloadQueryLive.mockReset();
  mockPayloadUploadFileAsset.mockReset();
  mockPayloadCreateDocument.mockReset();
  mockPayloadUpdateDocument.mockReset();
  // Every `describe` above the two-backend section is the SANITY contract, and
  // `activeBackend()` reads the environment per call — so an override left
  // behind by the Payload section would silently redirect them and they would
  // pass while proving nothing.
  // Pin the Sanity arm explicitly: these suites assert Sanity behaviour and
  // must not read the ambient CONTENT_BACKEND (184 false failures under
  // `CONTENT_BACKEND=payload` before 2026-09-17). The Payload describes below
  // set the override to "payload" themselves.
  process.env.CONTENT_BACKEND_LIVED_EXPERIENCES = "sanity";
});
afterEach(() => {
  delete process.env.CONTENT_BACKEND_LIVED_EXPERIENCES;
  vi.restoreAllMocks();
});

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
    mockQueryPreviewable.mockResolvedValue([{ _id: "v1", _type: "livedExperience", title: { en: "A story" } }]);

    const result = await getLivedExperiencesCarousel({});

    expect(result).toHaveLength(1);
    expect(mockQueryPreviewable).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ communities: null, tags: null, authors: null, featured: false, maxItems: 10 }),
    );
  });

  it("degrades to an empty list when the source fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQueryPreviewable.mockRejectedValue(new Error("network error"));

    await expect(getLivedExperiencesCarousel({})).resolves.toEqual([]);
  });

  it("uses queryPreviewable, not query — the original inline sanityFetch omitted perspective/stega so draft preview keeps working", async () => {
    mockQueryPreviewable.mockResolvedValue([]);
    await getLivedExperiencesCarousel({});
    expect(mockQueryPreviewable).toHaveBeenCalledTimes(1);
    expect(mockQuery).not.toHaveBeenCalled();
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

  it("refuses to reopen an approved or rejected doc, even for its own submitter", async () => {
    // The gate is inert on today's data — `status` is 0/56 populated on both
    // stores — and this is the property it has the moment an editor sets it.
    // Pinned on Sanity as well as Payload so the two cannot drift.
    for (const status of ["approved", "rejected"]) {
      mockQueryRaw.mockResolvedValue({ _id: "le1", submittedBy: "user1", status });
      await expect(loadEditableLivedExperience("le1", "user1")).resolves.toBeNull();
    }
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

  it("patches the existing doc on an allowed edit resubmission, pinning exactly which fields are set vs. nulled", async () => {
    mockQueryRaw.mockResolvedValue({ _id: "le1", submittedBy: "user1", status: "pending", hasVideoFile: false });

    const result = await submitLivedExperience({
      userId: "user1",
      language: "en",
      title: "Updated story",
      editId: "le1",
    });

    expect(result).toEqual({ id: "le1" });
    // A minimal resubmission (no description/issue/personContext/video/body/
    // region/tags): those fields must come back as explicit null (unset),
    // not be silently dropped from the patch, and everything actually
    // provided must land as a real value, not null.
    expect(mockUpdateDocument).toHaveBeenCalledWith("le1", {
      language: "en",
      status: "pending",
      title: { en: "Updated story" },
      featured: false,
      description: null,
      issue: null,
      personContext: null,
      videoFile: null,
      body: null,
      relatedCommunity: null,
      tags: null,
    });
    expect(mockCreateDocument).not.toHaveBeenCalled();
  });

  it("sets provided edit fields (body, region, tags) instead of nulling them", async () => {
    mockQueryRaw.mockResolvedValue({ _id: "le1", submittedBy: "user1", status: "pending", hasVideoFile: false });

    await submitLivedExperience({
      userId: "user1",
      language: "en",
      title: "Updated story",
      description: "A fuller description",
      body: [{ _type: "block" }],
      regionalCommunityId: "r1",
      tagIds: ["t1", "t2"],
      editId: "le1",
    });

    const [, patch] = mockUpdateDocument.mock.calls[0];
    expect(patch.description).toEqual({ en: "A fuller description" });
    expect(patch.body).toEqual([{ _type: "block" }]);
    expect(patch.relatedCommunity).toEqual({ _type: "reference", _ref: "r1" });
    expect(patch.tags).toEqual([
      { _type: "reference", _ref: "t1", _key: "t1" },
      { _type: "reference", _ref: "t2", _key: "t2" },
    ]);
    // Still unset: nothing was provided for these.
    expect(patch.issue).toBeNull();
    expect(patch.personContext).toBeNull();
  });

  it("keeps the existing upload (does not null videoFile) when switching to upload with no new file", async () => {
    mockQueryRaw.mockResolvedValue({ _id: "le1", submittedBy: "user1", status: "pending", hasVideoFile: true });

    await submitLivedExperience({
      userId: "user1",
      language: "en",
      title: "Updated story",
      videoSource: "upload",
      editId: "le1",
    });

    const [, patch] = mockUpdateDocument.mock.calls[0];
    // videoLink is stale for an upload-sourced doc, so it's nulled...
    expect(patch.videoLink).toBeNull();
    // ...but videoFile must be absent from the patch entirely (kept as-is),
    // not nulled — nulling it would delete the existing upload.
    expect(patch).not.toHaveProperty("videoFile");
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

// ---------------------------------------------------------------------------
// The same contract, on Payload
// ---------------------------------------------------------------------------
//
// Everything above is the Sanity contract and none of it was edited. Every
// assertion in it that describes *behaviour* (rather than a GROQ string) is
// restated here against Payload, plus the assertions that only make sense on a
// store that splits `moderationStatus` from `_status`.
//
// The two write-feeding reads get a class of test nothing else in this suite
// needs: **which primitive was called**. `queryRaw` and `queryLive` return the
// same shape, so a reader that picks the wrong one is invisible to any test
// that inspects only the result — which is exactly how the Phase-1
// authorization bypass survived review. These mock `payload-source` rather than
// the reader, so the real `lib/content/internal/payload/lived-experiences.ts`
// runs and its primitive choice is what is observed.

const onPayload = () => {
  process.env.CONTENT_BACKEND_LIVED_EXPERIENCES = "payload";
};

/** Answer a `find`/`findByID` descriptor by collection. */
const byCollection = (answers: Record<string, unknown>) => async (descriptor: unknown) => {
  const { collection } = descriptor as { collection: string };
  return answers[collection] ?? { docs: [] };
};

describe("getLivedExperienceIndex, on Payload", () => {
  const videos = {
    docs: [
      {
        id: "v1",
        title: { en: "A story", es: null },
        format: null,
        videoUrl: "https://youtube.com/watch?v=x",
        tags: [{ id: "t1", label: { en: "Anxiety" }, value: "anxiety", color: "#fff" }],
        thumbnail: { asset: null },
        region: { id: "r1", name: { en: "Oceania" }, slug: "oceania" },
        createdAt: "2025-11-10T13:10:20.000Z",
      },
    ],
  };
  const communities = { docs: [{ id: "r1", name: { en: "Oceania" }, slug: "oceania" }] };
  const tags = { docs: [{ id: "t1", label: { en: "Anxiety" }, value: "anxiety", color: "#fff" }] };

  it("returns videos, regional communities and tags from Payload", async () => {
    onPayload();
    mockPayloadQuery.mockImplementation(
      byCollection({ livedExperiences: videos, regionalCommunities: communities, tags }) as never,
    );

    const result = await getLivedExperienceIndex();

    expect(result.videos).toHaveLength(1);
    expect(result.videos[0].id).toBe("v1");
    expect(result.regionalCommunities[0].slug).toBe("oceania");
    expect(result.allTags[0].value).toBe("anxiety");
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("carries videoUrl, which is real data the Sanity schema never declared", async () => {
    onPayload();
    mockPayloadQuery.mockImplementation(
      byCollection({ livedExperiences: videos, regionalCommunities: communities, tags }) as never,
    );
    const result = await getLivedExperienceIndex();
    // 56/56 populated and read by five lib/content modules. Dropping it breaks
    // all five silently.
    expect(result.videos[0].videoUrl).toBe("https://youtube.com/watch?v=x");
  });

  it("gives ContentTag.value the flat string the type has always promised", async () => {
    onPayload();
    mockPayloadQuery.mockImplementation(
      byCollection({ livedExperiences: videos, regionalCommunities: communities, tags }) as never,
    );
    const result = await getLivedExperienceIndex();
    // Sanity stored `{_type:"slug", current:"anxiety"}` here until this task
    // flattened the projection. Both backends now answer a string.
    expect(result.videos[0].tags[0].value).toBe("anxiety");
    expect(result.allTags[0].value).toBe("anxiety");
  });

  it("keeps rawRegion in the reference shape the page's legacy fallback reads", async () => {
    onPayload();
    mockPayloadQuery.mockImplementation(
      byCollection({ livedExperiences: videos, regionalCommunities: communities, tags }) as never,
    );
    const result = await getLivedExperienceIndex();
    // It is a prop of a client component, so it reaches the RSC flight payload
    // and is part of the output the parity harness compares.
    expect(result.videos[0].rawRegion).toEqual({ _ref: "r1", _type: "reference" });
    // Key ORDER too: Sanity serializes object keys alphabetically and the
    // flight payload carries the serialized bytes, not the object.
    expect(JSON.stringify(result.videos[0].rawRegion)).toBe('{"_ref":"r1","_type":"reference"}');
  });

  it("uses the loose moderation filter, because an unset status means approved here", async () => {
    onPayload();
    mockPayloadQuery.mockImplementation(
      byCollection({ livedExperiences: videos, regionalCommunities: communities, tags }) as never,
    );
    await getLivedExperienceIndex();
    const [descriptor] = mockPayloadQuery.mock.calls[0] as unknown as [Record<string, unknown>];
    // `publishedAndApproved`'s shape, NOT `moderationApprovedOnly`'s. The
    // strict variant would empty the page: all 35 rows carry a null status.
    expect(descriptor.where).toEqual({
      or: [{ moderationStatus: { equals: "approved" } }, { moderationStatus: { exists: false } }],
    });
    expect(descriptor.sort).toBe("-createdAt");
  });

  it("degrades to an empty index when Payload fails", async () => {
    onPayload();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockPayloadQuery.mockRejectedValue(new Error("connection refused"));

    expect(mockQuery).not.toHaveBeenCalled();
    await expect(getLivedExperienceIndex()).resolves.toEqual({
      videos: [],
      regionalCommunities: [],
      allTags: [],
    });
  });

  it("filters by region through the same index", async () => {
    onPayload();
    mockPayloadQuery.mockImplementation(
      byCollection({ livedExperiences: videos, regionalCommunities: communities, tags }) as never,
    );
    await expect(getLivedExperiencesByRegion("oceania")).resolves.toHaveLength(1);
    await expect(getLivedExperiencesByRegion("sahel")).resolves.toEqual([]);
  });
});

describe("getLivedExperiencesCarousel, on Payload", () => {
  it("uses queryPreviewable, not query, so draft preview keeps working", async () => {
    onPayload();
    mockPayloadQueryPreviewable.mockResolvedValue({ docs: [] });
    await getLivedExperiencesCarousel({});
    expect(mockPayloadQueryPreviewable).toHaveBeenCalledTimes(1);
    expect(mockPayloadQuery).not.toHaveBeenCalled();
    expect(mockQueryPreviewable).not.toHaveBeenCalled();
  });

  it("returns items and applies the maxItems cap", async () => {
    onPayload();
    mockPayloadQueryPreviewable.mockResolvedValue({
      docs: [{ id: "v1", title: { en: "A story" }, tags: [] }],
    });
    const result = await getLivedExperiencesCarousel({ maxItems: 3 });
    expect(result).toHaveLength(1);
    expect(result[0]._id).toBe("v1");
    // The GROQ projects `_type` verbatim; the carousel keys its links off it.
    expect(result[0]._type).toBe("livedExperience");
    const [descriptor] = mockPayloadQueryPreviewable.mock.calls[0] as unknown as [Record<string, unknown>];
    expect(descriptor.limit).toBe(3);
    expect(descriptor.sort).toBe("-publishedAt");
  });

  it("adds a featured filter only when featured is true", async () => {
    onPayload();
    mockPayloadQueryPreviewable.mockResolvedValue({ docs: [] });
    await getLivedExperiencesCarousel({ featured: false });
    expect(JSON.stringify(mockPayloadQueryPreviewable.mock.calls[0][0])).not.toContain("featured");
    mockPayloadQueryPreviewable.mockClear();
    await getLivedExperiencesCarousel({ featured: true });
    expect(JSON.stringify(mockPayloadQueryPreviewable.mock.calls[0][0])).toContain('"featured"');
  });

  it("degrades to an empty list when Payload fails", async () => {
    onPayload();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockPayloadQueryPreviewable.mockRejectedValue(new Error("connection refused"));
    await expect(getLivedExperiencesCarousel({})).resolves.toEqual([]);
    expect(mockPayloadQueryPreviewable).toHaveBeenCalledTimes(1);
    expect(mockQueryPreviewable).not.toHaveBeenCalled();
  });
});

describe("the submit-form option lists, on Payload", () => {
  it("returns tags ordered by the English label, with a flat value", async () => {
    onPayload();
    mockPayloadQuery.mockResolvedValue({
      docs: [
        { id: "t2", label: { en: "Drought" }, value: "drought" },
        { id: "t1", label: { en: "Anxiety" }, value: "anxiety" },
      ],
    });
    await expect(getAvailableLivedExperienceTags()).resolves.toEqual([
      { _id: "t1", label: { en: "Anxiety" }, value: "anxiety" },
      { _id: "t2", label: { en: "Drought" }, value: "drought" },
    ]);
  });

  it("returns only active regional communities", async () => {
    onPayload();
    mockPayloadQuery.mockResolvedValue({ docs: [{ id: "r1", name: { en: "Oceania" }, slug: "oceania" }] });
    await expect(getActiveRegionalCommunities()).resolves.toEqual([
      { _id: "r1", name: { en: "Oceania" }, slug: { current: "oceania" } },
    ]);
    const [descriptor] = mockPayloadQuery.mock.calls[0] as unknown as [Record<string, unknown>];
    expect(descriptor.where).toEqual({ active: { equals: true } });
  });

  it("throws through when Payload fails, as the Sanity path does", async () => {
    onPayload();
    mockPayloadQuery.mockRejectedValue(new Error("connection refused"));
    await expect(getAvailableLivedExperienceTags()).rejects.toThrow("connection refused");
  });
});

describe("loadEditableLivedExperience, on Payload — the authorization gate", () => {
  const doc = (over: Record<string, unknown> = {}) => ({
    id: "le1",
    title: { en: "My story", es: null, fr: null, ar: null },
    description: { en: "Desc" },
    issue: { en: null },
    personContext: { en: null },
    videoSource: "youtube",
    videoLink: "https://youtube.com/watch?v=abc",
    body: null,
    submittedBy: "user1",
    moderationStatus: null,
    reviewNotes: null,
    relatedCommunity: "r1",
    tags: ["t1"],
    videoFile: null,
    ...over,
  });

  it("reads through queryRaw — not queryLive, not query", async () => {
    onPayload();
    mockPayloadQueryRaw.mockResolvedValue(doc());
    await loadEditableLivedExperience("le1", "user1");
    // The whole point of this test: the three primitives return the same
    // shape, so only the CHOICE distinguishes a correct reader from the
    // Phase-1 bypass. `queryLive` would make reopening your own unpublished
    // submission impossible; `query` would answer a permission question from
    // an hour-old cache.
    expect(mockPayloadQueryRaw).toHaveBeenCalledTimes(1);
    expect(mockPayloadQueryLive).not.toHaveBeenCalled();
    expect(mockPayloadQuery).not.toHaveBeenCalled();
    expect(mockQueryRaw).not.toHaveBeenCalled();
  });

  it("looks the document up once, by id, with no drafts. prefix to match", async () => {
    onPayload();
    mockPayloadQueryRaw.mockResolvedValue(doc());
    await loadEditableLivedExperience("drafts.le1", "user1");
    expect(mockPayloadQueryRaw).toHaveBeenCalledTimes(1);
    const [descriptor] = mockPayloadQueryRaw.mock.calls[0] as unknown as [Record<string, unknown>];
    // In Payload a draft is a version of the same document, so Sanity's
    // `_id == $id || _id == "drafts." + $id` collapses to one findByID. The
    // prefix is still stripped, for ids minted while Sanity was the backend.
    expect(descriptor).toMatchObject({ type: "findByID", collection: "livedExperiences", id: "le1" });
    // Without this, Payload's `fallback: true` fills every locale from `en`
    // and the submission language can never be read back off the content.
    expect(descriptor.fallbackLocale).toBe(false);
  });

  it("returns the mapped doc when the submitter matches", async () => {
    onPayload();
    mockPayloadQueryRaw.mockResolvedValue(doc());
    const result = await loadEditableLivedExperience("le1", "user1");
    expect(result?.title).toBe("My story");
    expect(result?.language).toBe("en");
    expect(result?.regionalCommunityId).toBe("r1");
    expect(result?.tagIds).toEqual(["t1"]);
    expect(result?.hasVideoFile).toBe(false);
    // Sanity's `status` conflates moderation and draft state; Payload's
    // `moderationStatus` is null on all 56 real documents, and the mapped
    // value falls back to "draft" exactly as it does on Sanity.
    expect(result?.status).toBe("draft");
  });

  it("reads the submission language off the locale that carries the title", async () => {
    onPayload();
    mockPayloadQueryRaw.mockResolvedValue(
      doc({ title: { en: null, es: "Mi historia", fr: null, ar: null } }),
    );
    const result = await loadEditableLivedExperience("le1", "user1");
    // Payload models no `language` column — its locale mechanism IS that fact.
    expect(result?.language).toBe("es");
    expect(result?.title).toBe("Mi historia");
  });

  it("returns null when the document does not exist", async () => {
    onPayload();
    mockPayloadQueryRaw.mockResolvedValue(null);
    await expect(loadEditableLivedExperience("missing", "user1")).resolves.toBeNull();
    expect(mockQueryRaw).not.toHaveBeenCalled();
  });

  it("returns null when the caller is neither the submitter nor a workspace member", async () => {
    onPayload();
    mockPayloadQueryRaw.mockResolvedValue(doc({ submittedBy: "someone-else" }));
    mockFindFirst.mockResolvedValue(null);
    await expect(loadEditableLivedExperience("le1", "user1")).resolves.toBeNull();
    expect(mockQueryRaw).not.toHaveBeenCalled();
  });

  it("refuses to reopen an approved document, even for its own submitter", async () => {
    onPayload();
    mockPayloadQueryRaw.mockResolvedValue(doc({ moderationStatus: "approved" }));
    // The gate is inert on today's data (0/56 populated, no defaultValue
    // imported) and this is the property it has the moment an editor sets the
    // field. Approved content changes go through the editorial team.
    await expect(loadEditableLivedExperience("le1", "user1")).resolves.toBeNull();
    mockPayloadQueryRaw.mockResolvedValue(doc({ moderationStatus: "rejected" }));
    await expect(loadEditableLivedExperience("le1", "user1")).resolves.toBeNull();
    expect(mockQueryRaw).not.toHaveBeenCalled();
    expect(mockPayloadQueryRaw).toHaveBeenCalledTimes(2);
  });

  it("still admits pending and revision", async () => {
    onPayload();
    for (const moderationStatus of ["pending", "revision"]) {
      mockPayloadQueryRaw.mockResolvedValue(doc({ moderationStatus }));
      await expect(loadEditableLivedExperience("le1", "user1")).resolves.not.toBeNull();
    }
  });

  it("does not read Payload's _status as the moderation status", async () => {
    onPayload();
    // A published document with no moderation decision is reopenable; if
    // `_status` were mistaken for the gate's `status`, "published" would fail
    // the list and lock every submitter out of their own work.
    mockPayloadQueryRaw.mockResolvedValue(doc({ _status: "published", moderationStatus: null }));
    await expect(loadEditableLivedExperience("le1", "user1")).resolves.not.toBeNull();
  });

  it("throws (does not degrade) when Payload fails", async () => {
    onPayload();
    mockPayloadQueryRaw.mockRejectedValue(new Error("connection refused"));
    await expect(loadEditableLivedExperience("le1", "user1")).rejects.toThrow("connection refused");
  });
});

describe("submitLivedExperience, on Payload", () => {
  it("creates a pending document in the livedExperiences collection", async () => {
    onPayload();
    mockPayloadCreateDocument.mockResolvedValue({ id: "new-id" });

    const result = await submitLivedExperience({
      userId: "user1",
      language: "en",
      title: "My story",
      description: "A description long enough",
      issue: "An issue",
    });

    expect(result).toEqual({ id: "new-id" });
    const [input] = mockPayloadCreateDocument.mock.calls[0] as unknown as [Record<string, unknown>];
    expect(input.collection).toBe("livedExperiences");
    expect(input.locale).toBe("en");
    // Published, not a draft: the Sanity original creates a live document whose
    // invisibility comes entirely from the moderation filter.
    expect(input.draft).toBe(false);
    expect(input.data).toMatchObject({
      moderationStatus: "pending",
      submittedBy: "user1",
      title: "My story",
      description: "A description long enough",
      issue: "An issue",
      featured: false,
    });
    expect(mockCreateDocument).not.toHaveBeenCalled();
  });

  it("uploads the video to files, not media, and references it", async () => {
    onPayload();
    mockPayloadUploadFileAsset.mockResolvedValue({ id: "asset1" });
    mockPayloadCreateDocument.mockResolvedValue({ id: "new-id" });

    await submitLivedExperience({
      userId: "user1",
      language: "en",
      title: "My story",
      videoSource: "upload",
      videoFile: { buffer: Buffer.from("x"), filename: "clip.mp4", contentType: "video/mp4" },
    });

    // `media` is images-only; the Payload primitive targets `files`.
    expect(mockPayloadUploadFileAsset).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.objectContaining({ filename: "clip.mp4", contentType: "video/mp4" }),
    );
    expect(mockUploadFileAsset).not.toHaveBeenCalled();
    const [input] = mockPayloadCreateDocument.mock.calls[0] as unknown as [{ data: Record<string, unknown> }];
    expect(input.data.videoFile).toBe("asset1");
  });

  it("reads the existing document through queryRaw before allowing an edit", async () => {
    onPayload();
    mockPayloadQueryRaw.mockResolvedValue({ id: "le1", submittedBy: "user1", moderationStatus: null, videoFile: null });
    await submitLivedExperience({ userId: "user1", language: "en", title: "Updated story", editId: "le1" });
    expect(mockPayloadQueryRaw).toHaveBeenCalledTimes(1);
    expect(mockPayloadQueryLive).not.toHaveBeenCalled();
    expect(mockPayloadQuery).not.toHaveBeenCalled();
  });

  it("patches the existing document, pinning exactly which fields are set and which are nulled", async () => {
    onPayload();
    mockPayloadQueryRaw.mockResolvedValue({ id: "le1", submittedBy: "user1", moderationStatus: null, videoFile: null });

    const result = await submitLivedExperience({
      userId: "user1",
      language: "en",
      title: "Updated story",
      editId: "le1",
    });

    expect(result).toEqual({ id: "le1" });
    const [input] = mockPayloadUpdateDocument.mock.calls[0] as unknown as [Record<string, unknown>];
    expect(input).toMatchObject({ collection: "livedExperiences", id: "le1", locale: "en", draft: true });
    // The same decision the Sanity arm makes, in Payload's field names — one
    // computation of "set vs cleared", two namings of it.
    expect(input.data).toEqual({
      title: "Updated story",
      featured: false,
      moderationStatus: "pending",
      description: null,
      issue: null,
      personContext: null,
      videoFile: null,
      body: null,
      relatedCommunity: null,
      tags: null,
    });
  });

  it("sets provided edit fields instead of nulling them", async () => {
    onPayload();
    mockPayloadQueryRaw.mockResolvedValue({ id: "le1", submittedBy: "user1", moderationStatus: null, videoFile: null });

    await submitLivedExperience({
      userId: "user1",
      language: "en",
      title: "Updated story",
      description: "A fuller description",
      regionalCommunityId: "r1",
      tagIds: ["t1", "t2"],
      editId: "le1",
    });

    const [input] = mockPayloadUpdateDocument.mock.calls[0] as unknown as [{ data: Record<string, unknown> }];
    expect(input.data.description).toBe("A fuller description");
    // Relationships are ids in Payload, not `{_type:"reference"}` wrappers.
    expect(input.data.relatedCommunity).toBe("r1");
    expect(input.data.tags).toEqual(["t1", "t2"]);
    expect(input.data.issue).toBeNull();
  });

  it("keeps the existing upload rather than deleting it", async () => {
    onPayload();
    mockPayloadQueryRaw.mockResolvedValue({ id: "le1", submittedBy: "user1", moderationStatus: null, videoFile: "asset1" });

    await submitLivedExperience({
      userId: "user1",
      language: "en",
      title: "Updated story",
      videoSource: "upload",
      editId: "le1",
    });

    const [input] = mockPayloadUpdateDocument.mock.calls[0] as unknown as [{ data: Record<string, unknown> }];
    // videoLink is stale for an upload-sourced document, so it is nulled...
    expect(input.data.videoLink).toBeNull();
    // ...and videoFile must be absent entirely, not nulled.
    expect(input.data).not.toHaveProperty("videoFile");
  });

  it("refuses an edit the caller may not make", async () => {
    onPayload();
    mockPayloadQueryRaw.mockResolvedValue({ id: "le1", submittedBy: "someone-else", moderationStatus: null });
    mockFindFirst.mockResolvedValue(null);
    await expect(
      submitLivedExperience({ userId: "user1", language: "en", title: "x", editId: "le1" }),
    ).rejects.toBeInstanceOf(LivedExperienceEditNotAllowedError);
    expect(mockPayloadUpdateDocument).not.toHaveBeenCalled();
    expect(mockQueryRaw).not.toHaveBeenCalled();
  });

  it("refuses to reopen an approved document", async () => {
    onPayload();
    mockPayloadQueryRaw.mockResolvedValue({ id: "le1", submittedBy: "user1", moderationStatus: "approved" });
    await expect(
      submitLivedExperience({ userId: "user1", language: "en", title: "x", editId: "le1" }),
    ).rejects.toBeInstanceOf(LivedExperienceEditNotAllowedError);
    expect(mockPayloadQueryRaw).toHaveBeenCalledTimes(1);
    expect(mockQueryRaw).not.toHaveBeenCalled();
  });

  it("refuses an upload edit with no file and no existing upload", async () => {
    onPayload();
    mockPayloadQueryRaw.mockResolvedValue({ id: "le1", submittedBy: "user1", moderationStatus: null, videoFile: null });
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
    onPayload();
    mockPayloadCreateDocument.mockRejectedValue(new Error("Payload write failed"));
    await expect(
      submitLivedExperience({ userId: "user1", language: "en", title: "x" }),
    ).rejects.toThrow("Payload write failed");
  });
});

describe("the detail, slugs and OG reads, on Payload", () => {
  it("returns the detail document for a published, approved slug", async () => {
    onPayload();
    mockPayloadQuery.mockResolvedValue({
      docs: [
        {
          id: "le1",
          title: { en: "My story" },
          slug: "my-story",
          videoLink: "https://youtube.com/watch?v=x",
          tags: [{ id: "t1", label: { en: "Anxiety" }, value: "anxiety", color: "#fff" }],
          thumbnail: null,
          author: null,
          relatedCommunity: null,
        },
      ],
    });
    const result = await getLivedExperienceBySlug("my-story");
    expect(result?._id).toBe("le1");
    expect(result?.tags?.[0].value).toBe("anxiety");
    // No Payload field and 0/56 populated in Sanity — answered as `null`,
    // which is what `relatedContent[]{…}` projects on a document that has
    // none, rather than reconstructed. `null` and not `undefined` because an
    // explicit GROQ projection emits every key it names, and React writes an
    // absent prop into the flight payload as "$undefined".
    expect(result?.relatedContent).toBeNull();
  });

  it("returns null when there is no match", async () => {
    onPayload();
    mockPayloadQuery.mockResolvedValue({ docs: [] });
    await expect(getLivedExperienceBySlug("missing")).resolves.toBeNull();
  });

  it("returns slugs, filtered by the same loose moderation rule", async () => {
    onPayload();
    mockPayloadQuery.mockResolvedValue({ docs: [{ slug: "my-story" }, { slug: null }] });
    await expect(getLivedExperienceSlugs()).resolves.toEqual([{ slug: "my-story" }]);
    const [descriptor] = mockPayloadQuery.mock.calls[0] as unknown as [Record<string, unknown>];
    expect(JSON.stringify(descriptor.where)).toContain('"exists":false');
  });

  it("throws (does not degrade) when the detail read fails", async () => {
    onPayload();
    mockPayloadQuery.mockRejectedValue(new Error("connection refused"));
    await expect(getLivedExperienceBySlug("x")).rejects.toThrow("connection refused");
  });

  it("answers the OG card from relatedCommunity, which is the field the GROQ names", async () => {
    onPayload();
    mockPayloadQuery.mockResolvedValue({
      docs: [{ title: { en: "My story" }, relatedCommunity: { id: "r1", name: { en: "Oceania" } } }],
    });
    await expect(getLivedExperienceOgData("my-story")).resolves.toEqual({
      title: { en: "My story" },
      region: "Oceania",
    });
  });

  it("degrades the OG card to null when Payload fails", async () => {
    onPayload();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockPayloadQuery.mockRejectedValue(new Error("connection refused"));
    await expect(getLivedExperienceOgData("x")).resolves.toBeNull();
    expect(mockPayloadQuery).toHaveBeenCalledTimes(1);
    expect(mockQuery).not.toHaveBeenCalled();
  });
});
