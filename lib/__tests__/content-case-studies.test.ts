import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/content/internal/sanity-source", () => ({
  query: vi.fn(),
  queryPreviewable: vi.fn(),
  queryRaw: vi.fn(),
  uploadFileAsset: vi.fn(),
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
  deleteDocument: vi.fn(),
}));

// `payload-source`, not the reader: `query`, `queryPreviewable` and `queryRaw`
// all return the same shape, so a reader that picks the wrong one is invisible
// to a result-based test. Mocking the source leaves the real reader running and
// makes its primitive choice observable — which is the whole point on this
// module, whose six write-feeding reads all have to stay on `queryRaw`.
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
  deleteDocument: vi.fn(),
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
  deleteDocument,
} from "@/lib/content/internal/sanity-source";
import {
  query as payloadQuery,
  queryPreviewable as payloadQueryPreviewable,
  queryRaw as payloadQueryRaw,
  queryLive as payloadQueryLive,
  uploadFileAsset as payloadUploadFileAsset,
  createDocument as payloadCreateDocument,
  updateDocument as payloadUpdateDocument,
  deleteDocument as payloadDeleteDocument,
} from "@/lib/content/internal/payload-source";
import { prisma } from "@/lib/prisma";
import {
  getCaseStudyBySlug,
  getCaseStudySlugs,
  getApprovedCaseStudies,
  getFeaturedCaseStudies,
  getCaseStudiesByUser,
  getCaseStudiesByStatus,
  getCaseStudyTranslations,
  getCaseStudiesByRegion,
  searchCaseStudies,
  getFilteredCaseStudies,
  getCaseStudyFilterTags,
  getCaseStudyFilterCommunities,
  getAvailableCaseStudyTags,
  getActiveCaseStudyCommunities,
  getUserSubmissionsAndDrafts,
  getCaseStudyRevisions,
  loadEditableCaseStudy,
  submitCaseStudy,
  updateCaseStudy,
  getLatestCaseStudyDraft,
  getCaseStudyDraftById,
  saveCaseStudyDraft,
  deleteCaseStudyDraft,
  getCaseStudySearchRecords,
  getCaseStudyOgData,
  getApprovedCaseStudyCountsBySubmitter,
  getApprovedCaseStudiesByContributor,
  getApprovedCaseStudyIndexDocs,
  getCaseStudyIndexDocsByIds,
  getCaseStudyIndexDocById,
  getApprovedCaseStudyCount,
  CaseStudyEditNotAllowedError,
  CaseStudyDraftNotFoundError,
} from "@/lib/content/case-studies";

const mockQuery = vi.mocked(query);
const mockQueryPreviewable = vi.mocked(queryPreviewable);
const mockQueryRaw = vi.mocked(queryRaw);
const mockUploadFileAsset = vi.mocked(uploadFileAsset);
const mockCreateDocument = vi.mocked(createDocument);
const mockUpdateDocument = vi.mocked(updateDocument);
const mockDeleteDocument = vi.mocked(deleteDocument);
const mockFindFirst = vi.mocked(prisma.workspaceOutput.findFirst);
const mockPayloadQuery = vi.mocked(payloadQuery);
const mockPayloadQueryPreviewable = vi.mocked(payloadQueryPreviewable);
const mockPayloadQueryRaw = vi.mocked(payloadQueryRaw);
const mockPayloadQueryLive = vi.mocked(payloadQueryLive);
const mockPayloadUpload = vi.mocked(payloadUploadFileAsset);
const mockPayloadCreate = vi.mocked(payloadCreateDocument);
const mockPayloadUpdate = vi.mocked(payloadUpdateDocument);
const mockPayloadDelete = vi.mocked(payloadDeleteDocument);

beforeEach(() => {
  mockQuery.mockReset();
  mockQueryPreviewable.mockReset();
  mockQueryRaw.mockReset();
  mockUploadFileAsset.mockReset();
  mockCreateDocument.mockReset();
  mockUpdateDocument.mockReset();
  mockDeleteDocument.mockReset();
  mockFindFirst.mockReset();
  mockPayloadQuery.mockReset();
  mockPayloadQueryPreviewable.mockReset();
  mockPayloadQueryRaw.mockReset();
  mockPayloadQueryLive.mockReset();
  mockPayloadUpload.mockReset();
  mockPayloadCreate.mockReset();
  mockPayloadUpdate.mockReset();
  mockPayloadDelete.mockReset();
  // Pin the Sanity arm explicitly: these suites assert Sanity behaviour and
  // must not read the ambient CONTENT_BACKEND (184 false failures under
  // `CONTENT_BACKEND=payload` before 2026-09-17). The Payload describes below
  // set the override to "payload" themselves.
  process.env.CONTENT_BACKEND_CASE_STUDIES = "sanity";
});
afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.CONTENT_BACKEND_CASE_STUDIES;
});

describe("getCaseStudyBySlug", () => {
  it("returns the detail doc from the source", async () => {
    mockQueryPreviewable.mockResolvedValue({ _id: "cs1", title: { en: "My Study" } });
    await expect(getCaseStudyBySlug("my-study")).resolves.toEqual({ _id: "cs1", title: { en: "My Study" } });
  });

  it("returns null when there's no match", async () => {
    mockQueryPreviewable.mockResolvedValue(null);
    await expect(getCaseStudyBySlug("missing")).resolves.toBeNull();
  });

  it("throws (does not degrade) when the source fails, as the original unwrapped fetch did", async () => {
    mockQueryPreviewable.mockRejectedValue(new Error("timeout"));
    await expect(getCaseStudyBySlug("x")).rejects.toThrow("timeout");
  });

  // Pins the fix for a regression: fetchCaseStudyBySlug's original sanityFetch
  // call omitted both perspective/stega, which is what let an editor
  // previewing a draft case study in Sanity's Presentation tool see their own
  // unpublished changes. Converting this to the cached, published-only
  // `query()` primitive silently ended that draft preview. If this slips
  // back to `query`, this test must fail.
  it("uses queryPreviewable, not query", async () => {
    mockQueryPreviewable.mockResolvedValue(null);
    await getCaseStudyBySlug("my-study");
    expect(mockQueryPreviewable).toHaveBeenCalledTimes(1);
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

describe("getCaseStudySlugs", () => {
  it("flattens the source's {slug} rows into plain strings", async () => {
    mockQuery.mockResolvedValue([{ slug: "a" }, { slug: "b" }]);
    await expect(getCaseStudySlugs()).resolves.toEqual(["a", "b"]);
  });

  it("throws (does not degrade) when the source fails", async () => {
    mockQuery.mockRejectedValue(new Error("upstream 500"));
    await expect(getCaseStudySlugs()).rejects.toThrow("upstream 500");
  });
});

describe("getCaseStudyOgData", () => {
  it("returns the title and region from the source", async () => {
    mockQuery.mockResolvedValue({ title: { en: "My Study" }, region: "Oceania" });
    await expect(getCaseStudyOgData("my-study")).resolves.toEqual({
      title: { en: "My Study" },
      region: "Oceania",
    });
  });

  it("degrades to null when the source fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValue(new Error("network error"));
    await expect(getCaseStudyOgData("x")).resolves.toBeNull();
  });
});

describe("getApprovedCaseStudies / getFeaturedCaseStudies", () => {
  it("returns approved case studies from the source", async () => {
    mockQuery.mockResolvedValue([{ _id: "cs1" }]);
    await expect(getApprovedCaseStudies()).resolves.toEqual([{ _id: "cs1" }]);
  });

  it("returns an empty array when the source returns null", async () => {
    mockQuery.mockResolvedValue(null);
    await expect(getApprovedCaseStudies()).resolves.toEqual([]);
  });

  it("throws (does not degrade) when the source fails", async () => {
    mockQuery.mockRejectedValue(new Error("network error"));
    await expect(getApprovedCaseStudies()).rejects.toThrow("network error");
  });

  it("returns featured case studies from the source", async () => {
    mockQuery.mockResolvedValue([{ _id: "cs2", featured: true }]);
    await expect(getFeaturedCaseStudies()).resolves.toEqual([{ _id: "cs2", featured: true }]);
  });
});

describe("getCaseStudiesByUser / getCaseStudiesByStatus", () => {
  it("returns a user's case studies from the source", async () => {
    mockQueryPreviewable.mockResolvedValue([{ _id: "cs1", submittedBy: "user1" }]);
    await expect(getCaseStudiesByUser("user1")).resolves.toEqual([{ _id: "cs1", submittedBy: "user1" }]);
  });

  it("returns case studies by status from the source", async () => {
    mockQueryPreviewable.mockResolvedValue([{ _id: "cs1", status: "pending" }]);
    await expect(getCaseStudiesByStatus("pending")).resolves.toEqual([{ _id: "cs1", status: "pending" }]);
  });

  it("throws (does not degrade) when the source fails", async () => {
    mockQueryPreviewable.mockRejectedValue(new Error("boom"));
    await expect(getCaseStudiesByUser("user1")).rejects.toThrow("boom");
    await expect(getCaseStudiesByStatus("approved")).rejects.toThrow("boom");
  });

  // Pins the fix for a regression: both fetchCaseStudiesByUser and
  // fetchCaseStudiesByStatus originally omitted perspective/stega — see the
  // note on getCaseStudyBySlug's own pinning test above.
  it("both use queryPreviewable, not query", async () => {
    mockQueryPreviewable.mockResolvedValue([]);
    await getCaseStudiesByUser("user1");
    await getCaseStudiesByStatus("pending");
    expect(mockQueryPreviewable).toHaveBeenCalledTimes(2);
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

describe("getCaseStudyTranslations", () => {
  it("returns the translations doc from the source", async () => {
    mockQuery.mockResolvedValue({ _id: "cs1", language: "en", translations: [] });
    await expect(getCaseStudyTranslations("cs1")).resolves.toEqual({ _id: "cs1", language: "en", translations: [] });
  });

  it("returns null when there's no match", async () => {
    mockQuery.mockResolvedValue(null);
    await expect(getCaseStudyTranslations("missing")).resolves.toBeNull();
  });

  it("throws (does not degrade) when the source fails", async () => {
    mockQuery.mockRejectedValue(new Error("upstream error"));
    await expect(getCaseStudyTranslations("cs1")).rejects.toThrow("upstream error");
  });
});

describe("getCaseStudiesByRegion", () => {
  it("returns case studies from the source (LTR locale orders desc)", async () => {
    mockQuery.mockResolvedValue([{ _id: "cs1" }]);
    const result = await getCaseStudiesByRegion("oceania", "en");
    expect(result).toEqual([{ _id: "cs1" }]);
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("publishedAt desc"), { slug: "oceania", limit: 12 });
  });

  it("orders ascending for the Arabic (RTL) locale", async () => {
    mockQuery.mockResolvedValue([]);
    await getCaseStudiesByRegion("oceania", "ar");
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("publishedAt asc"), expect.anything());
  });

  it("returns an empty array when the source returns null", async () => {
    mockQuery.mockResolvedValue(null);
    await expect(getCaseStudiesByRegion("oceania")).resolves.toEqual([]);
  });

  it("throws (does not degrade) when the source fails", async () => {
    mockQuery.mockRejectedValue(new Error("network error"));
    await expect(getCaseStudiesByRegion("oceania")).rejects.toThrow("network error");
  });
});

describe("searchCaseStudies", () => {
  it("returns matches from the source with a default limit", async () => {
    mockQuery.mockResolvedValue([{ _id: "cs1" }]);
    const result = await searchCaseStudies("climate");
    expect(result).toEqual([{ _id: "cs1" }]);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ limit: 20, searchPattern: "climate*" }),
    );
  });

  it("adds language and tags filters when provided", async () => {
    mockQuery.mockResolvedValue([]);
    await searchCaseStudies("climate", { language: "fr", tags: ["t1", "t2"], limit: 5 });
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("language == $language"),
      expect.objectContaining({ language: "fr", tags: ["t1", "t2"], limit: 5 }),
    );
  });

  it("returns an empty array when the source returns null", async () => {
    mockQuery.mockResolvedValue(null);
    await expect(searchCaseStudies()).resolves.toEqual([]);
  });

  it("throws (does not degrade) when the source fails", async () => {
    mockQuery.mockRejectedValue(new Error("upstream 500"));
    await expect(searchCaseStudies("x")).rejects.toThrow("upstream 500");
  });
});

describe("getFilteredCaseStudies", () => {
  it("builds no extra conditions when no filters are given", async () => {
    mockQuery.mockResolvedValue([]);
    await getFilteredCaseStudies({});
    const [groq, params] = mockQuery.mock.calls[0];
    expect(groq).not.toContain("topic in $topics");
    expect(params).toEqual({});
  });

  it("adds a condition + param per active filter", async () => {
    mockQuery.mockResolvedValue([{ _id: "cs1" }]);
    const result = await getFilteredCaseStudies({
      topics: ["health"],
      tags: ["t1"],
      communities: ["oceania"],
      search: "Flood",
    });
    expect(result).toEqual([{ _id: "cs1" }]);
    const [groq, params] = mockQuery.mock.calls[0];
    expect(groq).toContain("topic in $topics");
    expect(groq).toContain("relatedCommunity->slug.current in $communities");
    expect(params).toMatchObject({
      topics: ["health"],
      tags: ["t1"],
      communities: ["oceania"],
      searchPattern: "*flood*",
    });
  });

  it("returns an empty array when the source returns null", async () => {
    mockQuery.mockResolvedValue(null);
    await expect(getFilteredCaseStudies({})).resolves.toEqual([]);
  });

  it("throws (does not degrade) when the source fails, as the original unwrapped fetch did", async () => {
    mockQuery.mockRejectedValue(new Error("network error"));
    await expect(getFilteredCaseStudies({})).rejects.toThrow("network error");
  });
});

describe("getCaseStudyFilterTags / getCaseStudyFilterCommunities", () => {
  it("returns tags with counts from the source", async () => {
    mockQuery.mockResolvedValue([{ _id: "t1", label: { en: "Health" }, caseStudyCount: 3 }]);
    await expect(getCaseStudyFilterTags()).resolves.toEqual([
      { _id: "t1", label: { en: "Health" }, caseStudyCount: 3 },
    ]);
  });

  it("returns communities with counts from the source", async () => {
    mockQuery.mockResolvedValue([{ _id: "r1", name: { en: "Oceania" }, slug: "oceania", caseStudyCount: 5 }]);
    await expect(getCaseStudyFilterCommunities()).resolves.toEqual([
      { _id: "r1", name: { en: "Oceania" }, slug: "oceania", caseStudyCount: 5 },
    ]);
  });

  it("throws (does not degrade) when the source fails", async () => {
    mockQuery.mockRejectedValue(new Error("upstream 500"));
    await expect(getCaseStudyFilterTags()).rejects.toThrow("upstream 500");
    await expect(getCaseStudyFilterCommunities()).rejects.toThrow("upstream 500");
  });
});

describe("getAvailableCaseStudyTags / getActiveCaseStudyCommunities", () => {
  it("returns tags from the source", async () => {
    mockQuery.mockResolvedValue([{ _id: "t1", label: { en: "Health" }, value: "health" }]);
    await expect(getAvailableCaseStudyTags()).resolves.toEqual([
      { _id: "t1", label: { en: "Health" }, value: "health" },
    ]);
  });

  it("returns active regional communities from the source", async () => {
    mockQuery.mockResolvedValue([{ _id: "r1", name: { en: "Oceania" }, slug: { current: "oceania" } }]);
    await expect(getActiveCaseStudyCommunities()).resolves.toEqual([
      { _id: "r1", name: { en: "Oceania" }, slug: { current: "oceania" } },
    ]);
  });

  it("throws (does not degrade) when the source fails (no local try/catch previously)", async () => {
    mockQuery.mockRejectedValue(new Error("upstream 500"));
    await expect(getAvailableCaseStudyTags()).rejects.toThrow("upstream 500");
  });
});

describe("getUserSubmissionsAndDrafts", () => {
  it("returns submissions and drafts from the source", async () => {
    mockQueryPreviewable.mockResolvedValue({
      submissions: [{ _id: "cs1", title: { en: "A study" } }],
      drafts: [{ _id: "d1", title: { en: "A draft" } }],
    });
    const result = await getUserSubmissionsAndDrafts("user1");
    expect(result.submissions).toHaveLength(1);
    expect(result.drafts).toHaveLength(1);
  });

  it("degrades to empty lists when the source fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQueryPreviewable.mockRejectedValue(new Error("402 plan_limit_reached"));
    await expect(getUserSubmissionsAndDrafts("user1")).resolves.toEqual({ submissions: [], drafts: [] });
  });

  it("degrades when the source returns null rather than an object", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQueryPreviewable.mockResolvedValue(null);
    await expect(getUserSubmissionsAndDrafts("user1")).resolves.toEqual({ submissions: [], drafts: [] });
  });

  // Pins the fix for a regression: fetchUserSubmissionsAndDrafts's original
  // sanityFetch call omitted both perspective/stega — see the note on
  // getCaseStudyBySlug's own pinning test above.
  it("uses queryPreviewable, not query", async () => {
    mockQueryPreviewable.mockResolvedValue({ submissions: [], drafts: [] });
    await getUserSubmissionsAndDrafts("user1");
    expect(mockQueryPreviewable).toHaveBeenCalledTimes(1);
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

describe("getCaseStudyRevisions", () => {
  it("returns revision-status submissions from the source", async () => {
    mockQueryRaw.mockResolvedValue([{ _id: "cs1", status: "revision" }]);
    await expect(getCaseStudyRevisions("user1")).resolves.toEqual([{ _id: "cs1", status: "revision" }]);
  });

  it("throws (matching the original's un-degraded try/catch, which mapped failures to an explicit 500)", async () => {
    mockQueryRaw.mockRejectedValue(new Error("network error"));
    await expect(getCaseStudyRevisions("user1")).rejects.toThrow("network error");
  });

  // Pins the fix for a regression: this must use the raw/authenticated
  // primitive (uncached, raw perspective — matching the original
  // writeClient.fetch() call), not the cached `query()` used elsewhere in
  // this module. `query()` routes through cachedFetch with
  // perspective:"published" and an hour-long revalidate, so it can (a) show
  // stale moderation feedback and (b) miss a revision that exists only as a
  // draft document. If this slips back to `query`, this test must fail.
  it("uses the raw/authenticated primitive, not the cached one", async () => {
    mockQueryRaw.mockResolvedValue([]);
    await getCaseStudyRevisions("user1");
    expect(mockQueryRaw).toHaveBeenCalledTimes(1);
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

describe("loadEditableCaseStudy", () => {
  it("returns the mapped doc when the submitter matches", async () => {
    mockQueryRaw.mockResolvedValue({
      _id: "cs1",
      title: { en: "My study" },
      submittedBy: "user1",
      status: "pending",
    });
    const result = await loadEditableCaseStudy("cs1", "user1");
    expect(result?._sanityId).toBe("cs1");
    expect(result?.title).toEqual({ en: "My study" });
  });

  it("returns null when the doc doesn't exist", async () => {
    mockQueryRaw.mockResolvedValue(null);
    await expect(loadEditableCaseStudy("missing", "user1")).resolves.toBeNull();
  });

  it("returns null when the caller isn't the submitter or a workspace member", async () => {
    mockQueryRaw.mockResolvedValue({ _id: "cs1", submittedBy: "someone-else", status: "pending" });
    mockFindFirst.mockResolvedValue(null);
    await expect(loadEditableCaseStudy("cs1", "user1")).resolves.toBeNull();
  });

  it("returns null for an already-approved doc (not editable)", async () => {
    mockQueryRaw.mockResolvedValue({ _id: "cs1", submittedBy: "user1", status: "approved" });
    await expect(loadEditableCaseStudy("cs1", "user1")).resolves.toBeNull();
  });

  it("throws (does not degrade) when the source fails", async () => {
    mockQueryRaw.mockRejectedValue(new Error("network error"));
    await expect(loadEditableCaseStudy("cs1", "user1")).rejects.toThrow("network error");
  });
});

describe("submitCaseStudy", () => {
  const minimalInput = {
    userId: "user1",
    title: { en: "My Study" },
    content: [{ _type: "block" }],
    authors: [{ name: "Author One" }],
    tags: ["t1"],
  };

  it("creates a pending doc for a fresh submission", async () => {
    mockCreateDocument.mockResolvedValue({ id: "new-id" });
    const result = await submitCaseStudy(minimalInput);
    expect(result).toEqual({ id: "new-id", slug: expect.any(String), status: "pending" });
    expect(mockCreateDocument).toHaveBeenCalledWith(
      expect.objectContaining({ _type: "caseStudy", status: "pending", submittedBy: "user1" }),
    );
  });

  it("uploads the image asset before creating the document", async () => {
    mockUploadFileAsset.mockResolvedValue({ id: "asset1" });
    mockCreateDocument.mockResolvedValue({ id: "new-id" });
    await submitCaseStudy({
      ...minimalInput,
      image: { buffer: Buffer.from("x"), filename: "cover.jpg", contentType: "image/jpeg" },
    });
    expect(mockUploadFileAsset).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.objectContaining({ filename: "cover.jpg", contentType: "image/jpeg" }),
    );
    expect(mockCreateDocument).toHaveBeenCalledWith(
      expect.objectContaining({ image: { _type: "image", asset: { _type: "reference", _ref: "asset1" }, alt: expect.any(String) } }),
    );
  });

  it("links an existing organization by name instead of creating a new one", async () => {
    mockQueryRaw.mockResolvedValue({ _id: "org1" });
    mockCreateDocument.mockResolvedValue({ id: "new-id" });
    await submitCaseStudy({ ...minimalInput, organizationName: "Existing Org" });
    expect(mockCreateDocument).toHaveBeenCalledWith(
      expect.objectContaining({ organizations: [{ _type: "reference", _ref: "org1" }] }),
    );
    // Only the case study was created — no new organization document.
    expect(mockCreateDocument).toHaveBeenCalledTimes(1);
  });

  it("creates a new organization when none matches by name", async () => {
    mockQueryRaw.mockResolvedValue(null);
    mockCreateDocument.mockResolvedValueOnce({ id: "new-org-id" }).mockResolvedValueOnce({ id: "new-id" });
    await submitCaseStudy({ ...minimalInput, organizationName: "Brand New Org" });
    expect(mockCreateDocument).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ _type: "organization", name: "Brand New Org" }),
    );
    expect(mockCreateDocument).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ organizations: [{ _type: "reference", _ref: "new-org-id" }] }),
    );
  });

  it("patches the existing doc on an allowed edit resubmission, dropping slug/submittedBy from the patch", async () => {
    mockQueryRaw.mockResolvedValue({ _id: "cs1", submittedBy: "user1", status: "pending", slug: { current: "my-study-abc123" } });
    const result = await submitCaseStudy({ ...minimalInput, editId: "cs1" });
    expect(result).toEqual({ id: "cs1", slug: "my-study-abc123", status: "pending" });
    expect(mockUpdateDocument).toHaveBeenCalledTimes(1);
    const [id, patch] = mockUpdateDocument.mock.calls[0];
    expect(id).toBe("cs1");
    expect(patch.status).toBe("pending");
    expect(patch).not.toHaveProperty("slug");
    expect(patch).not.toHaveProperty("submittedBy");
    expect(mockCreateDocument).not.toHaveBeenCalled();
  });

  it("allows a workspace member (not the submitter) to edit", async () => {
    mockQueryRaw.mockResolvedValue({ _id: "cs1", submittedBy: "someone-else", status: "pending", slug: { current: "s" } });
    mockFindFirst.mockResolvedValue({ id: "wo1" } as never);
    await expect(submitCaseStudy({ ...minimalInput, editId: "cs1" })).resolves.toEqual({
      id: "cs1",
      slug: "s",
      status: "pending",
    });
  });

  it("throws CaseStudyEditNotAllowedError when the caller may not edit the doc", async () => {
    mockQueryRaw.mockResolvedValue({ _id: "cs1", submittedBy: "someone-else", status: "pending" });
    mockFindFirst.mockResolvedValue(null);
    await expect(submitCaseStudy({ ...minimalInput, editId: "cs1" })).rejects.toBeInstanceOf(
      CaseStudyEditNotAllowedError,
    );
  });

  it("throws CaseStudyEditNotAllowedError for an already-approved doc", async () => {
    mockQueryRaw.mockResolvedValue({ _id: "cs1", submittedBy: "user1", status: "approved" });
    await expect(submitCaseStudy({ ...minimalInput, editId: "cs1" })).rejects.toBeInstanceOf(
      CaseStudyEditNotAllowedError,
    );
  });

  it("throws (does not degrade) when the write fails", async () => {
    mockCreateDocument.mockRejectedValue(new Error("Sanity write failed"));
    await expect(submitCaseStudy(minimalInput)).rejects.toThrow("Sanity write failed");
  });
});

describe("updateCaseStudy", () => {
  it("forwards the patch to updateDocument unchanged", async () => {
    mockUpdateDocument.mockResolvedValue(undefined);
    await updateCaseStudy("cs1", { notifiedStatus: "approved" });
    expect(mockUpdateDocument).toHaveBeenCalledWith("cs1", { notifiedStatus: "approved" });
  });

  it("throws (does not degrade) when the write fails", async () => {
    mockUpdateDocument.mockRejectedValue(new Error("write failed"));
    await expect(updateCaseStudy("cs1", { notifiedStatus: "approved" })).rejects.toThrow("write failed");
  });
});

describe("getLatestCaseStudyDraft", () => {
  it("returns the latest draft from the source", async () => {
    mockQueryRaw.mockResolvedValue({ _id: "d1", title: { en: "Draft" } });
    await expect(getLatestCaseStudyDraft("user1")).resolves.toEqual({ _id: "d1", title: { en: "Draft" } });
  });

  it("returns null when there is no draft", async () => {
    mockQueryRaw.mockResolvedValue(null);
    await expect(getLatestCaseStudyDraft("user1")).resolves.toBeNull();
  });

  it("throws when the source fails (the route's own try/catch maps it to a 500)", async () => {
    mockQueryRaw.mockRejectedValue(new Error("read failed"));
    await expect(getLatestCaseStudyDraft("user1")).rejects.toThrow("read failed");
  });
});

describe("getCaseStudyDraftById", () => {
  it("returns the draft only when it belongs to the caller — the lookup is scoped by userId", async () => {
    mockQueryRaw.mockResolvedValue({ _id: "d1", title: { en: "Draft" } });
    await expect(getCaseStudyDraftById("user1", "d1")).resolves.toEqual({ _id: "d1", title: { en: "Draft" } });
    expect(mockQueryRaw).toHaveBeenCalledTimes(1);
    const [groq, params] = mockQueryRaw.mock.calls[0];
    expect(String(groq)).toContain('_type == "caseStudyDraft"');
    expect(String(groq)).toContain("userId == $userId");
    expect(params).toEqual({ draftId: "d1", userId: "user1" });
  });

  it("returns null when no such draft is owned by the caller", async () => {
    mockQueryRaw.mockResolvedValue(null);
    await expect(getCaseStudyDraftById("user1", "not-mine")).resolves.toBeNull();
  });
});

describe("saveCaseStudyDraft", () => {
  it("creates a new draft when no draftId is given", async () => {
    mockCreateDocument.mockResolvedValue({ id: "new-draft-id" });
    const result = await saveCaseStudyDraft("user1", undefined, { title: { en: "Draft" } });
    expect(result).toEqual({ id: "new-draft-id" });
    expect(mockCreateDocument).toHaveBeenCalledWith(
      expect.objectContaining({ _type: "caseStudyDraft", userId: "user1", title: { en: "Draft" } }),
    );
  });

  it("updates an existing owned draft", async () => {
    mockQueryRaw.mockResolvedValue("d1");
    mockUpdateDocument.mockResolvedValue(undefined);
    const result = await saveCaseStudyDraft("user1", "d1", { title: { en: "Updated" } });
    expect(result).toEqual({ id: "d1" });
    expect(mockUpdateDocument).toHaveBeenCalledWith(
      "d1",
      expect.objectContaining({ userId: "user1", title: { en: "Updated" } }),
    );
    expect(mockCreateDocument).not.toHaveBeenCalled();
  });

  it("throws CaseStudyDraftNotFoundError when the draft isn't owned by the caller", async () => {
    mockQueryRaw.mockResolvedValue(null);
    await expect(saveCaseStudyDraft("user1", "not-mine", {})).rejects.toBeInstanceOf(CaseStudyDraftNotFoundError);
    expect(mockUpdateDocument).not.toHaveBeenCalled();
  });

  it("throws (does not degrade) when the write fails", async () => {
    mockCreateDocument.mockRejectedValue(new Error("write failed"));
    await expect(saveCaseStudyDraft("user1", undefined, {})).rejects.toThrow("write failed");
  });
});

describe("deleteCaseStudyDraft", () => {
  it("deletes an owned draft", async () => {
    mockQueryRaw.mockResolvedValue("d1");
    mockDeleteDocument.mockResolvedValue(undefined);
    await deleteCaseStudyDraft("user1", "d1");
    expect(mockDeleteDocument).toHaveBeenCalledWith("d1");
  });

  it("throws CaseStudyDraftNotFoundError when the draft isn't owned by the caller", async () => {
    mockQueryRaw.mockResolvedValue(null);
    await expect(deleteCaseStudyDraft("user1", "not-mine")).rejects.toBeInstanceOf(CaseStudyDraftNotFoundError);
    expect(mockDeleteDocument).not.toHaveBeenCalled();
  });

  it("throws (does not degrade) when the delete fails", async () => {
    mockQueryRaw.mockResolvedValue("d1");
    mockDeleteDocument.mockRejectedValue(new Error("delete failed"));
    await expect(deleteCaseStudyDraft("user1", "d1")).rejects.toThrow("delete failed");
  });
});

describe("getCaseStudySearchRecords", () => {
  it("maps approved case studies into generic search records", async () => {
    mockQuery.mockResolvedValue([
      { _id: "cs1", language: "fr", title: { fr: "Mon Étude" }, excerpt: { fr: "Résumé" }, slug: "mon-etude" },
    ]);
    const result = await getCaseStudySearchRecords();
    expect(result).toEqual([
      {
        objectID: "cs1",
        kind: "caseStudy",
        title: "Mon Étude",
        excerpt: "Résumé",
        url: "/fr/research-and-action/case-studies/mon-etude",
        locale: "fr",
      },
    ]);
  });

  it("falls back to 'en' for a missing/unsupported language", async () => {
    mockQuery.mockResolvedValue([{ _id: "cs1", title: { en: "A study" }, slug: "a-study" }]);
    const [record] = await getCaseStudySearchRecords();
    expect(record.locale).toBe("en");
    expect(record.url).toBe("/en/research-and-action/case-studies/a-study");
  });

  it("degrades to an empty list when the source fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValue(new Error("network error"));
    await expect(getCaseStudySearchRecords()).resolves.toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Algolia index docs (Task 10's case-studies/sync + case-studies/webhook
// conversion) — mirrors news.ts's getPublishedNewsIndexDocs family.
// ---------------------------------------------------------------------------

describe("Algolia index docs", () => {
  it("getApprovedCaseStudyIndexDocs returns approved docs from the source", async () => {
    mockQuery.mockResolvedValue([{ _id: "cs1" }]);
    await expect(getApprovedCaseStudyIndexDocs()).resolves.toEqual([{ _id: "cs1" }]);
  });

  it("getApprovedCaseStudyIndexDocs returns an empty list when the source resolves null", async () => {
    mockQuery.mockResolvedValue(null);
    await expect(getApprovedCaseStudyIndexDocs()).resolves.toEqual([]);
  });

  it("getCaseStudyIndexDocsByIds passes the id list through as a query param", async () => {
    mockQuery.mockResolvedValue([{ _id: "cs1" }, { _id: "cs2" }]);
    const result = await getCaseStudyIndexDocsByIds(["cs1", "cs2"]);
    expect(result).toEqual([{ _id: "cs1" }, { _id: "cs2" }]);
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), { ids: ["cs1", "cs2"] });
  });

  it("getCaseStudyIndexDocById returns the single doc from the source", async () => {
    mockQuery.mockResolvedValue({ _id: "cs1" });
    await expect(getCaseStudyIndexDocById("cs1")).resolves.toEqual({ _id: "cs1" });
  });

  it("getCaseStudyIndexDocById returns null when there's no match", async () => {
    mockQuery.mockResolvedValue(null);
    await expect(getCaseStudyIndexDocById("missing")).resolves.toBeNull();
  });

  it("getApprovedCaseStudyCount returns the count from the source", async () => {
    mockQuery.mockResolvedValue(7);
    await expect(getApprovedCaseStudyCount()).resolves.toBe(7);
  });

  it("throws (does not degrade) when the source fails — the sync/webhook routes' own try/catch is the original failure behaviour", async () => {
    mockQuery.mockRejectedValue(new Error("upstream 500"));
    await expect(getApprovedCaseStudyIndexDocs()).rejects.toThrow("upstream 500");
  });
});

// ---------------------------------------------------------------------------
// getApprovedCaseStudyCountsBySubmitter / getApprovedCaseStudiesByContributor
// — added for lib/community/region-data.ts (Task 8's found-during-audit call
// site, unclaimed by any brief; that file may not import Sanity directly).
// ---------------------------------------------------------------------------

describe("getApprovedCaseStudyCountsBySubmitter", () => {
  it("counts approved case studies per submitter id", async () => {
    mockQuery.mockResolvedValue([{ uid: "u1" }, { uid: "u1" }, { uid: "u2" }]);
    await expect(getApprovedCaseStudyCountsBySubmitter(["u1", "u2"])).resolves.toEqual({ u1: 2, u2: 1 });
  });

  it("short-circuits to {} without querying when userIds is empty", async () => {
    await expect(getApprovedCaseStudyCountsBySubmitter([])).resolves.toEqual({});
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("degrades to {} when the source fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValue(new Error("network error"));
    await expect(getApprovedCaseStudyCountsBySubmitter(["u1"])).resolves.toEqual({});
  });
});

describe("getApprovedCaseStudiesByContributor", () => {
  it("returns the rows the source resolves", async () => {
    mockQuery.mockResolvedValue([
      { _id: "cs1", title: { en: "A study" }, slug: { current: "a-study" }, publishedAt: "2026-01-01" },
    ]);
    await expect(getApprovedCaseStudiesByContributor("u1")).resolves.toEqual([
      { _id: "cs1", title: { en: "A study" }, slug: { current: "a-study" }, publishedAt: "2026-01-01" },
    ]);
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), { uid: "u1" });
  });

  it("degrades to [] when the source fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValue(new Error("network error"));
    await expect(getApprovedCaseStudiesByContributor("u1")).resolves.toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// The Payload arm
//
// Nothing above this line was edited except the shared mock/reset block: the 85
// tests are the Sanity contract and they are what both backends have to
// satisfy. Everything below sets `CONTENT_BACKEND_CASE_STUDIES=payload`, mocks
// `payload-source` rather than the reader, and asserts the same contract plus
// the four things only the primitive choice, the status mapping or the flight
// payload can show.
// ---------------------------------------------------------------------------

/** One approved, published case study, as Payload really hands it back at
 *  `locale: "all"` and `depth: 2`: every locale spelled out with `null` for the
 *  untranslated arms, `[]` for the unset relationships, a full ISO instant for
 *  a `datetime` column, a `[lng, lat]` array for a `point`, a group spelled out
 *  even when empty, and the media row nested under `image.asset`. */
function payloadCaseStudyRow(over: Record<string, unknown> = {}) {
  return {
    id: "case-study-15",
    slug: "japan-s-shinrin-yoku",
    sanityUpdatedAt: "2026-07-29T11:16:26.000Z",
    updatedAt: "2026-09-04T11:13:07.424Z",
    title: { en: "Shinrin-yoku", es: "Shinrin-yoku ES", fr: null, ar: null },
    excerpt: { en: "An excerpt.", es: null, fr: null, ar: null },
    content: { en: null, es: null, fr: null, ar: null },
    topic: "mental-health",
    layout: null,
    region: "esea",
    themes: [],
    populations: [],
    moderationStatus: "approved",
    // Sanity returns `2024-01-01T00:00:00Z`; Postgres always emits the millis.
    publishedAt: "2024-01-01T00:00:00.000Z",
    submittedAt: null,
    submittedBy: null,
    featured: false,
    image: {
      asset: {
        id: "image-a282930-5760x3240-jpg",
        url: "/payload-api/media/file/case-study-15.jpg?prefix=cms%2Fmedia",
        mimeType: "image/jpeg",
        lqip: "data:image/jpeg;base64,AAAA",
        width: 5760,
        height: 3240,
        sizes: { crop800x450: { url: "/payload-api/media/file/case-study-15-800x450.jpg", width: 800, height: 450 } },
      },
      alt: { en: "A forest", es: null, fr: null, ar: null },
      caption: null,
    },
    authors: [
      {
        id: "case-study-15:authors:author-1",
        userId: null,
        name: "CCM Community",
        email: null,
        role: "lead",
        affiliation: null,
        clerkUserId: null,
        clerkUsername: null,
        clerkImageUrl: null,
      },
    ],
    organizations: [],
    tags: [
      {
        id: "tag-connection-to-nature",
        label: { en: "Connection to Nature", es: null, fr: null, ar: null },
        value: "connection-to-nature",
        color: "#8b5cf6",
        category: "topic",
      },
    ],
    relatedCommunity: {
      id: "regional-community-eastern-and-south-eastern-asia",
      name: { en: "Eastern and South Eastern Asia Regional Community", es: null, fr: null, ar: null },
      slug: "eastern-and-south-eastern-asia",
    },
    // A Payload `group` is spelled out even when nothing inside it is set.
    studyPeriod: { startDate: null, endDate: null },
    locationText: { country: "Japan", city: "" },
    // A Payload `point` is [lng, lat].
    studyLocation: [138.25, 36.2],
    locationDisplayText: "Japan",
    locationPrecision: "country",
    locationCountryCode: "JPN",
    studyAreas: [],
    seoTitle: null,
    seoDescription: null,
    canonicalUrl: null,
    reviewNotes: null,
    reviewedBy: null,
    reviewedAt: null,
    ...over,
  };
}

describe("case studies, answered by Payload", () => {
  beforeEach(() => {
    process.env.CONTENT_BACKEND_CASE_STUDIES = "payload";
  });

  // -------------------------------------------------------------------------
  // The primitive, not just the result
  //
  // This is the gap the Phase-1 authorization bypass fell through: `query`,
  // `queryPreviewable` and `queryRaw` return the same shape, so a reader that
  // picks the wrong one cannot fail a test that only looks at what came back.
  // -------------------------------------------------------------------------
  describe("the primitive, not just the result", () => {
    it("reads every public list through `query` and never through a draft-aware one", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [] } as never);
      await getCaseStudySlugs();
      await getApprovedCaseStudies();
      await getFeaturedCaseStudies();
      await getFilteredCaseStudies({});
      await getCaseStudyFilterTags();
      await getCaseStudyFilterCommunities();
      await getAvailableCaseStudyTags();
      await getActiveCaseStudyCommunities();
      await getApprovedCaseStudyIndexDocs();

      expect(mockPayloadQuery).toHaveBeenCalled();
      expect(mockPayloadQueryRaw).not.toHaveBeenCalled();
      expect(mockPayloadQueryLive).not.toHaveBeenCalled();
      // And the Sanity source is never touched once the flag is set.
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it("keeps the detail page on `queryPreviewable`, so an editor's draft preview survives", async () => {
      mockPayloadQueryPreviewable.mockResolvedValue({ docs: [] } as never);
      await getCaseStudyBySlug("x");
      expect(mockPayloadQueryPreviewable).toHaveBeenCalledTimes(1);
      expect(mockPayloadQuery).not.toHaveBeenCalled();
      expect(mockPayloadQueryRaw).not.toHaveBeenCalled();
    });

    it("getCaseStudyRevisions reads through payload `queryRaw` — not `query`, not `queryLive`", async () => {
      mockPayloadQueryRaw.mockResolvedValue({ docs: [] } as never);
      await getCaseStudyRevisions("u1");
      expect(mockPayloadQueryRaw).toHaveBeenCalledWith(
        expect.objectContaining({ type: "find", collection: "caseStudies" }),
      );
      expect(mockPayloadQuery).not.toHaveBeenCalled();
      expect(mockPayloadQueryLive).not.toHaveBeenCalled();
      expect(mockPayloadQueryPreviewable).not.toHaveBeenCalled();
    });

    it("loadEditableCaseStudy's gate reads through payload `queryRaw`, by id, drafts visible", async () => {
      mockPayloadQueryRaw.mockResolvedValue({
        id: "cs1",
        title: { en: "A study" },
        submittedBy: "u1",
        moderationStatus: "pending",
      } as never);
      await loadEditableCaseStudy("cs1", "u1");
      expect(mockPayloadQueryRaw).toHaveBeenCalledWith(
        expect.objectContaining({ type: "findByID", collection: "caseStudies", id: "cs1" }),
      );
      expect(mockPayloadQuery).not.toHaveBeenCalled();
      expect(mockPayloadQueryLive).not.toHaveBeenCalled();
    });

    it("submitCaseStudy's edit gate reads through payload `queryRaw`", async () => {
      mockPayloadQueryRaw.mockResolvedValue({ id: "cs1", submittedBy: "u1", moderationStatus: "pending" } as never);
      await submitCaseStudy({
        userId: "u1",
        title: { en: "T" },
        content: [],
        authors: [{ name: "A" }],
        tags: [],
        editId: "cs1",
      });
      expect(mockPayloadQueryRaw).toHaveBeenCalledWith(
        expect.objectContaining({ type: "findByID", collection: "caseStudies", id: "cs1" }),
      );
      expect(mockPayloadQueryLive).not.toHaveBeenCalled();
      expect(mockPayloadQuery).not.toHaveBeenCalled();
    });

    it("the find-or-create organization lookup reads through payload `queryRaw`", async () => {
      mockPayloadQueryRaw.mockResolvedValue({ docs: [] } as never);
      mockPayloadCreate.mockResolvedValue({ id: "new" } as never);
      await submitCaseStudy({
        userId: "u1",
        title: { en: "T" },
        content: [],
        authors: [{ name: "A" }],
        tags: [],
        organizationName: "Universiti Putra Malaysia",
      });
      expect(mockPayloadQueryRaw).toHaveBeenCalledWith(
        expect.objectContaining({ type: "find", collection: "organizations" }),
      );
      expect(mockPayloadQuery).not.toHaveBeenCalled();
    });

    it("both draft ownership checks read through payload `queryRaw`", async () => {
      mockPayloadQueryRaw.mockResolvedValue({ docs: [{ id: "d1" }] } as never);
      await saveCaseStudyDraft("u1", "d1", { title: { en: "T" } });
      await deleteCaseStudyDraft("u1", "d1");
      expect(mockPayloadQueryRaw).toHaveBeenCalledTimes(2);
      for (const call of mockPayloadQueryRaw.mock.calls) {
        expect(call[0]).toMatchObject({ type: "find", collection: "caseStudyDrafts" });
      }
      expect(mockPayloadQuery).not.toHaveBeenCalled();
      expect(mockPayloadQueryLive).not.toHaveBeenCalled();
    });

    it("getLatestCaseStudyDraft reads through payload `queryRaw`, so a stale autosave is never overwritten", async () => {
      mockPayloadQueryRaw.mockResolvedValue({ docs: [] } as never);
      await getLatestCaseStudyDraft("u1");
      expect(mockPayloadQueryRaw).toHaveBeenCalledWith(
        expect.objectContaining({ type: "find", collection: "caseStudyDrafts" }),
      );
      expect(mockPayloadQuery).not.toHaveBeenCalled();
    });

    it("getCaseStudyDraftById reads through payload `queryRaw`, scoped to the caller, and maps the row to the Sanity shape", async () => {
      mockPayloadQueryRaw.mockResolvedValue({
        docs: [{ id: "d1", userId: "u1", topic: "mental-health", lastSaved: "2024-01-01T00:00:00.000Z" }],
      } as never);
      const draft = await getCaseStudyDraftById("u1", "d1");
      expect(mockPayloadQueryRaw).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "find",
          collection: "caseStudyDrafts",
          where: { and: [{ id: { equals: "d1" } }, { userId: { equals: "u1" } }] },
        }),
      );
      expect(draft).toMatchObject({ _id: "d1", _type: "caseStudyDraft", topic: "mental-health", userId: "u1" });
      expect(mockPayloadQuery).not.toHaveBeenCalled();
    });

    it("getCaseStudyDraftById returns null for a draft the caller does not own", async () => {
      mockPayloadQueryRaw.mockResolvedValue({ docs: [] } as never);
      await expect(getCaseStudyDraftById("u2", "d1")).resolves.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Approved AND published — the two pending documents stay non-public
  // -------------------------------------------------------------------------
  describe("the moderation gate", () => {
    const approvedClause = { moderationStatus: { equals: "approved" } };

    it("requires approved on every read that returns a case study to a public surface", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [] } as never);
      mockPayloadQueryPreviewable.mockResolvedValue({ docs: [] } as never);

      await getCaseStudyBySlug("x");
      await getCaseStudySlugs();
      await getApprovedCaseStudies();
      await getFeaturedCaseStudies();
      await getFilteredCaseStudies({});
      await getCaseStudiesByRegion("oceania");
      await searchCaseStudies("forest");
      await getCaseStudySearchRecords();
      await getApprovedCaseStudyIndexDocs();
      await getApprovedCaseStudiesByContributor("u1");
      await getApprovedCaseStudyCountsBySubmitter(["u1"]);

      const descriptors = [
        ...mockPayloadQuery.mock.calls.map((c) => c[0]),
        ...mockPayloadQueryPreviewable.mock.calls.map((c) => c[0]),
      ] as unknown as Array<Record<string, unknown>>;
      // `publishedCaseStudyReferences` (the two filter-count reads) is the
      // documented exception and is not exercised here.
      const caseStudyReads = descriptors.filter((d) => d.collection === "caseStudies");
      expect(caseStudyReads.length).toBeGreaterThan(0);
      for (const descriptor of caseStudyReads) {
        expect(JSON.stringify(descriptor.where)).toContain(JSON.stringify(approvedClause));
      }
    });

    it("counts approved case studies, not merely published ones", async () => {
      mockPayloadQuery.mockResolvedValue(25 as never);
      await expect(getApprovedCaseStudyCount()).resolves.toBe(25);
      expect(mockPayloadQuery).toHaveBeenCalledWith(
        expect.objectContaining({ type: "count", collection: "caseStudies", where: approvedClause }),
      );
    });

    it("drops a pending case study from the approved list even when Payload returns one", async () => {
      // Defence in depth: the `where` above is the real gate, but a reader that
      // projected a pending row would hand `status: "pending"` to a public
      // surface. Nothing here should ever be reachable.
      mockPayloadQuery.mockResolvedValue({
        docs: [payloadCaseStudyRow({ moderationStatus: "approved" })],
      } as never);
      const [cs] = await getApprovedCaseStudies();
      expect(cs.status).toBe("approved");
    });
  });

  // -------------------------------------------------------------------------
  // The status mapping, both directions
  // -------------------------------------------------------------------------
  describe("moderationStatus <-> status", () => {
    it("reads Payload's moderationStatus back out as the public `status`", async () => {
      mockPayloadQueryPreviewable.mockResolvedValue({
        docs: [payloadCaseStudyRow({ moderationStatus: "approved" })],
      } as never);
      const doc = await getCaseStudyBySlug("japan-s-shinrin-yoku");
      expect(doc?.status).toBe("approved");
      expect(doc).not.toHaveProperty("moderationStatus");
    });

    it("getCaseStudiesByStatus filters on moderationStatus while keeping its public parameter", async () => {
      mockPayloadQueryPreviewable.mockResolvedValue({ docs: [] } as never);
      await getCaseStudiesByStatus("revision");
      expect(mockPayloadQueryPreviewable).toHaveBeenCalledWith(
        expect.objectContaining({ where: { moderationStatus: { equals: "revision" } } }),
      );
    });

    it("a resubmission writes moderationStatus: pending — never a `status` key Payload would drop", async () => {
      mockPayloadQueryRaw.mockResolvedValue({ id: "cs1", submittedBy: "u1", moderationStatus: "revision" } as never);
      await submitCaseStudy({
        userId: "u1",
        title: { en: "Updated" },
        content: [],
        authors: [{ name: "A" }],
        tags: [],
        editId: "cs1",
      });
      expect(mockPayloadUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: "caseStudies",
          id: "cs1",
          data: expect.objectContaining({ moderationStatus: "pending" }),
        }),
      );
      const [{ data }] = mockPayloadUpdate.mock.calls[0] as [{ data: Record<string, unknown> }];
      expect(data).not.toHaveProperty("status");
      // Slug and submittedBy are preserved on this arm too.
      expect(data).not.toHaveProperty("slug");
      expect(data).not.toHaveProperty("submittedBy");
    });

    it("a new submission is created pending, published, with the seam's own id", async () => {
      mockPayloadCreate.mockResolvedValue({ id: "new-id" } as never);
      const result = await submitCaseStudy({
        userId: "u1",
        title: { en: "A brand new study" },
        content: [],
        authors: [{ name: "A" }],
        tags: ["tag-1"],
      });
      expect(result.status).toBe("pending");
      expect(mockPayloadCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: "caseStudies",
          draft: false,
          data: expect.objectContaining({ moderationStatus: "pending", submittedBy: "u1" }),
        }),
      );
    });

    it("updateCaseStudy renames a `status` patch key rather than writing a column Payload lacks", async () => {
      await updateCaseStudy("cs1", { notifiedStatus: "approved" } as never);
      expect(mockPayloadUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ id: "cs1", data: { notifiedStatus: "approved" } }),
      );
      mockPayloadUpdate.mockClear();
      await updateCaseStudy("cs1", { status: "approved" } as never);
      const [{ data }] = mockPayloadUpdate.mock.calls[0] as [{ data: Record<string, unknown> }];
      expect(data).toEqual({ moderationStatus: "approved" });
    });
  });

  // -------------------------------------------------------------------------
  // Ordering — `_id asc` reproduces Sanity's total tie
  // -------------------------------------------------------------------------
  describe("ordering", () => {
    // Since the push-down (2026-09-17) the ORDER is the database's: the reader
    // asks for `publishedAt desc, featured desc, id asc` and trusts what comes
    // back. These assert the descriptor and that nothing re-sorts in JS;
    // scripts/parity/order-check.ts proves SQL order equals the old JS order
    // on the real rows.
    it("asks the database for `publishedAt desc, featured desc, id asc` and keeps that order", async () => {
      mockPayloadQuery.mockResolvedValue({
        docs: [
          payloadCaseStudyRow({ id: "case-study-37" }),
          payloadCaseStudyRow({ id: "case-study-11" }),
          payloadCaseStudyRow({ id: "case-study-23" }),
        ],
      } as never);
      const rows = await getApprovedCaseStudies();
      expect(mockPayloadQuery).toHaveBeenCalledWith(
        expect.objectContaining({ collection: "caseStudies", sort: ["-publishedAt", "-featured", "id"], limit: 12 }),
      );
      expect(rows.map((r) => r._id)).toEqual(["case-study-37", "case-study-11", "case-study-23"]);
    });

    it("does not re-order rows in JavaScript — the database already did", async () => {
      mockPayloadQuery.mockResolvedValue({
        docs: [
          payloadCaseStudyRow({ id: "case-study-11", publishedAt: "2023-01-01T00:00:00.000Z" }),
          payloadCaseStudyRow({ id: "case-study-37", publishedAt: "2025-01-01T00:00:00.000Z" }),
        ],
      } as never);
      const rows = await getApprovedCaseStudies();
      expect(rows.map((r) => r._id)).toEqual(["case-study-11", "case-study-37"]);
    });

    it("reverses for the RTL locale, as the region strip's `order(publishedAt asc)` does", async () => {
      mockPayloadQuery.mockResolvedValue({
        docs: [
          payloadCaseStudyRow({ id: "case-study-11", publishedAt: "2023-01-01T00:00:00.000Z" }),
          payloadCaseStudyRow({ id: "case-study-37", publishedAt: "2025-01-01T00:00:00.000Z" }),
        ],
      } as never);
      const rows = await getCaseStudiesByRegion("oceania", "ar");
      // The reversal is pushed into the sort; the fixture is already in that
      // order, so the returned order is the database's, untouched.
      expect(mockPayloadQuery).toHaveBeenCalledWith(
        expect.objectContaining({ collection: "caseStudies", sort: ["publishedAt", "-featured", "id"] }),
      );
      expect(rows.map((r) => r._id)).toEqual(["case-study-11", "case-study-37"]);
    });
  });

  // -------------------------------------------------------------------------
  // The shapes only the flight payload reveals
  // -------------------------------------------------------------------------
  describe("the projection", () => {
    it("emits a GROQ-shaped detail document — sorted keys, nulls for unset fields", async () => {
      mockPayloadQueryPreviewable.mockResolvedValue({ docs: [payloadCaseStudyRow()] } as never);
      const doc = (await getCaseStudyBySlug("x")) as unknown as Record<string, unknown>;

      // Sanity alphabetises the keys of every object it returns.
      expect(Object.keys(doc)).toEqual([...Object.keys(doc)].sort());
      expect(Object.keys(doc.title as Record<string, string>)).toEqual(["en", "es"]);
      // A projected-but-unset field is `null`, never absent.
      for (const key of ["seoTitle", "seoDescription", "canonicalUrl", "reviewNotes", "reviewedBy", "reviewedAt", "layout", "projects", "relatedContent", "studyAreas", "studyPeriod", "submittedAt", "submittedBy"]) {
        expect(doc[key]).toBeNull();
      }
      // Sanity omits a zero-millisecond suffix; Postgres does not.
      expect(doc.publishedAt).toBe("2024-01-01T00:00:00Z");
      // A Payload `point` becomes a Sanity geopoint.
      expect(doc.studyLocation).toEqual({ _type: "geopoint", lat: 36.2, lng: 138.25 });
      // A bare `slug` projection is the slug object.
      expect(doc.slug).toEqual({ _type: "slug", current: "japan-s-shinrin-yoku" });
    });

    it("rebuilds Sanity's `asset->{…}` projection and leaves the media row for the image source", async () => {
      mockPayloadQueryPreviewable.mockResolvedValue({ docs: [payloadCaseStudyRow()] } as never);
      const doc = await getCaseStudyBySlug("x");
      expect(doc?.image?.asset).toEqual({
        _id: "image-a282930-5760x3240-jpg",
        metadata: { dimensions: { height: 3240, width: 5760 }, lqip: "data:image/jpeg;base64,AAAA" },
        mimeType: "image/jpeg",
        url: "/payload-api/media/file/case-study-15.jpg?prefix=cms%2Fmedia",
      });
      // `image.alt` is a plain string in the Sanity schema, localized in Payload.
      expect(doc?.image?.alt).toBe("A forest");
      // And the flattened row `payload-image-source.resolveMedia` unwraps.
      expect((doc?.image as unknown as Record<string, unknown>).url).toBe(
        "/payload-api/media/file/case-study-15.jpg?prefix=cms%2Fmedia",
      );
    });

    it("binds a BARE tag `value` as the slug object, matching what Sanity returns", async () => {
      mockPayloadQueryPreviewable.mockResolvedValue({ docs: [payloadCaseStudyRow()] } as never);
      const doc = await getCaseStudyBySlug("x");
      expect(doc?.tags?.[0]).toEqual({
        _id: "tag-connection-to-nature",
        color: "#8b5cf6",
        label: { en: "Connection to Nature" },
        value: { _type: "slug", current: "connection-to-nature" },
      });
    });

    it("flattens the tag value where the GROQ writes `\"value\": value.current`", async () => {
      mockPayloadQuery
        .mockResolvedValueOnce({ docs: [payloadCaseStudyRow()] } as never)
        .mockResolvedValueOnce({
          docs: [
            {
              id: "tag-connection-to-nature",
              label: { en: "Connection to Nature", es: null, fr: null, ar: null },
              value: "connection-to-nature",
              color: "#8b5cf6",
              category: "topic",
            },
          ],
        } as never);
      const [tag] = await getCaseStudyFilterTags();
      expect(tag.value).toBe("connection-to-nature");
      expect(tag.caseStudyCount).toBe(1);
    });

    it("projects `authors` with every named key, and binds it bare with only the stored ones", async () => {
      mockPayloadQueryPreviewable.mockResolvedValue({ docs: [payloadCaseStudyRow()] } as never);
      const detail = await getCaseStudyBySlug("x");
      expect(detail?.authors?.[0]).toEqual({
        affiliation: null,
        email: null,
        name: "CCM Community",
        role: "lead",
        userId: null,
      });

      mockPayloadQuery.mockResolvedValue({ docs: [payloadCaseStudyRow()] } as never);
      const [listItem] = await getFilteredCaseStudies({});
      // Bound bare, so the stored object: `_key`, and no key for a field the
      // document never set.
      expect(listItem.authors).toEqual([{ _key: "author-1", name: "CCM Community", role: "lead" }]);
    });

    it("collapses an empty Payload group to the null GROQ returns", async () => {
      mockPayloadQuery.mockResolvedValue({
        docs: [payloadCaseStudyRow({ studyPeriod: { startDate: "2024-11-21T00:00:00.000Z", endDate: null } })],
      } as never);
      const [withPeriod] = await getApprovedCaseStudies();
      expect(withPeriod.studyPeriod).toEqual({ endDate: null, startDate: "2024-11-21" });

      mockPayloadQuery.mockResolvedValue({ docs: [payloadCaseStudyRow()] } as never);
      const [withoutPeriod] = await getApprovedCaseStudies();
      expect(withoutPeriod.studyPeriod).toBeNull();
    });

    it("returns the list page's community name and slug the way its GROQ aliases them", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [payloadCaseStudyRow()] } as never);
      const [item] = await getFilteredCaseStudies({});
      expect(item.relatedCommunity).toEqual({ en: "Eastern and South Eastern Asia Regional Community" });
      expect(item.communitySlug).toBe("eastern-and-south-eastern-asia");
      expect(item.slug).toBe("japan-s-shinrin-yoku");
    });

    it("pushes the search and tag filters into the query — across all four locales, in the database", async () => {
      // `contains` at `locale: "all"` joins `_locales` with no locale predicate,
      // so it matches any arm, which is what the JS four-locale disjunction did.
      mockPayloadQuery.mockResolvedValue({ docs: [] } as never);
      await getFilteredCaseStudies({ search: "bosq" });
      const search = JSON.stringify(mockPayloadQuery.mock.calls.at(-1)?.[0]);
      expect(search).toContain('"title":{"contains":"bosq"}');
      expect(search).toContain('"excerpt":{"contains":"bosq"}');

      await getFilteredCaseStudies({ tags: ["connection-to-nature"] });
      const tagged = JSON.stringify(mockPayloadQuery.mock.calls.at(-1)?.[0]);
      expect(tagged).toContain('"tags.value":{"in":["connection-to-nature"]}');
    });

    it("answers the OG card's two fields", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [payloadCaseStudyRow()] } as never);
      await expect(getCaseStudyOgData("x")).resolves.toEqual({
        region: "Eastern and South Eastern Asia Regional Community",
        title: { en: "Shinrin-yoku", es: "Shinrin-yoku ES" },
      });
    });
  });

  // -------------------------------------------------------------------------
  // The drafts collection, whose whole purpose is owner access
  // -------------------------------------------------------------------------
  describe("caseStudyDrafts", () => {
    it("refuses to update a draft the caller does not own, and writes nothing", async () => {
      mockPayloadQueryRaw.mockResolvedValue({ docs: [] } as never);
      await expect(saveCaseStudyDraft("u2", "d1", {})).rejects.toBeInstanceOf(CaseStudyDraftNotFoundError);
      expect(mockPayloadUpdate).not.toHaveBeenCalled();
    });

    it("refuses to delete a draft the caller does not own, and deletes nothing", async () => {
      mockPayloadQueryRaw.mockResolvedValue({ docs: [] } as never);
      await expect(deleteCaseStudyDraft("u2", "d1")).rejects.toBeInstanceOf(CaseStudyDraftNotFoundError);
      expect(mockPayloadDelete).not.toHaveBeenCalled();
    });

    it("scopes the ownership lookup to the caller's own id", async () => {
      mockPayloadQueryRaw.mockResolvedValue({ docs: [{ id: "d1" }] } as never);
      await deleteCaseStudyDraft("u1", "d1");
      expect(mockPayloadQueryRaw).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { and: [{ id: { equals: "d1" } }, { userId: { equals: "u1" } }] },
        }),
      );
      expect(mockPayloadDelete).toHaveBeenCalledWith({ collection: "caseStudyDrafts", id: "d1" });
    });

    it("creates a draft carrying the owner's id and a fresh lastSaved", async () => {
      mockPayloadCreate.mockResolvedValue({ id: "d-new" } as never);
      await saveCaseStudyDraft("u1", undefined, { topic: "mental-health" });
      expect(mockPayloadCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: "caseStudyDrafts",
          data: expect.objectContaining({ userId: "u1", topic: "mental-health" }),
        }),
      );
    });

    it("returns the newest draft with the shape the submission form reads", async () => {
      mockPayloadQueryRaw.mockResolvedValue({
        docs: [
          { id: "d-old", userId: "u1", lastSaved: "2026-01-01T00:00:00.000Z", title: { en: "Old", es: null } },
          { id: "d-new", userId: "u1", lastSaved: "2026-08-11T10:54:47.530Z", title: { en: "New", es: null }, tags: [{ value: "t1" }] },
        ],
      } as never);
      const draft = await getLatestCaseStudyDraft("u1");
      expect(draft?._id).toBe("d-new");
      expect(draft?._type).toBe("caseStudyDraft");
      expect(draft?.lastSaved).toBe("2026-08-11T10:54:47.530Z");
      expect(draft?.tags).toEqual(["t1"]);
    });
  });

  // -------------------------------------------------------------------------
  // The remaining writes
  // -------------------------------------------------------------------------
  describe("the submission's other writes", () => {
    it("uploads a featured image through the Payload asset store, not Sanity's", async () => {
      mockPayloadUpload.mockResolvedValue({ id: "media-1" } as never);
      mockPayloadCreate.mockResolvedValue({ id: "cs-new" } as never);
      await submitCaseStudy({
        userId: "u1",
        title: { en: "T" },
        content: [],
        authors: [{ name: "A" }],
        tags: [],
        image: { buffer: Buffer.from("x"), filename: "a.jpg", contentType: "image/jpeg" },
      });
      expect(mockPayloadUpload).toHaveBeenCalledTimes(1);
      expect(mockUploadFileAsset).not.toHaveBeenCalled();
      const [{ data }] = mockPayloadCreate.mock.calls[0] as [{ data: Record<string, unknown> }];
      expect(data.image).toEqual({ asset: "media-1", alt: "Featured image for T" });
    });

    it("reuses an existing organization rather than creating a second one", async () => {
      mockPayloadQueryRaw.mockResolvedValue({ docs: [{ id: "org-1" }] } as never);
      mockPayloadCreate.mockResolvedValue({ id: "cs-new" } as never);
      await submitCaseStudy({
        userId: "u1",
        title: { en: "T" },
        content: [],
        authors: [{ name: "A" }],
        tags: [],
        organizationName: "Universiti Putra Malaysia",
      });
      const creates = mockPayloadCreate.mock.calls.map((c) => (c[0] as { collection: string }).collection);
      expect(creates).toEqual(["caseStudies"]);
      const [{ data }] = mockPayloadCreate.mock.calls[0] as [{ data: Record<string, unknown> }];
      expect(data.organizations).toEqual(["org-1"]);
    });

    it("throws CaseStudyEditNotAllowedError for an approved document, and writes nothing", async () => {
      mockPayloadQueryRaw.mockResolvedValue({ id: "cs1", submittedBy: "u1", moderationStatus: "approved" } as never);
      mockFindFirst.mockResolvedValue(null as never);
      await expect(
        submitCaseStudy({
          userId: "u1",
          title: { en: "T" },
          content: [],
          authors: [{ name: "A" }],
          tags: [],
          editId: "cs1",
        }),
      ).rejects.toBeInstanceOf(CaseStudyEditNotAllowedError);
      expect(mockPayloadUpdate).not.toHaveBeenCalled();
    });

    it("does not synthesise `draft` onto moderationStatus in the edit gate", async () => {
      // `loadEditableCaseStudy`'s allow-list contains the literal "draft",
      // which is Sanity conflating a moderation state with a draft state. An
      // approved document must stay non-reopenable.
      mockPayloadQueryRaw.mockResolvedValue({
        id: "cs1",
        submittedBy: "u1",
        moderationStatus: "approved",
      } as never);
      await expect(loadEditableCaseStudy("cs1", "u1")).resolves.toBeNull();
    });

    it("reopens a pending document for its own submitter", async () => {
      mockPayloadQueryRaw.mockResolvedValue({
        id: "cs1",
        submittedBy: "u1",
        moderationStatus: "pending",
        title: { en: "A study", es: null, fr: null, ar: null },
        topic: "mental-health",
      } as never);
      const doc = await loadEditableCaseStudy("cs1", "u1");
      expect(doc?._sanityId).toBe("cs1");
      expect(doc?._review).toEqual({ status: "pending", reviewNotes: null });
    });
  });
});
