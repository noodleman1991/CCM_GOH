import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/content/internal/sanity-source", () => ({
  query: vi.fn(),
  queryRaw: vi.fn(),
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
  queryRaw,
  uploadFileAsset,
  createDocument,
  updateDocument,
  deleteDocument,
} from "@/lib/content/internal/sanity-source";
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
  saveCaseStudyDraft,
  deleteCaseStudyDraft,
  getCaseStudySearchRecords,
  CaseStudyEditNotAllowedError,
  CaseStudyDraftNotFoundError,
} from "@/lib/content/case-studies";

const mockQuery = vi.mocked(query);
const mockQueryRaw = vi.mocked(queryRaw);
const mockUploadFileAsset = vi.mocked(uploadFileAsset);
const mockCreateDocument = vi.mocked(createDocument);
const mockUpdateDocument = vi.mocked(updateDocument);
const mockDeleteDocument = vi.mocked(deleteDocument);
const mockFindFirst = vi.mocked(prisma.workspaceOutput.findFirst);

beforeEach(() => {
  mockQuery.mockReset();
  mockQueryRaw.mockReset();
  mockUploadFileAsset.mockReset();
  mockCreateDocument.mockReset();
  mockUpdateDocument.mockReset();
  mockDeleteDocument.mockReset();
  mockFindFirst.mockReset();
});
afterEach(() => vi.restoreAllMocks());

describe("getCaseStudyBySlug", () => {
  it("returns the detail doc from the source", async () => {
    mockQuery.mockResolvedValue({ _id: "cs1", title: { en: "My Study" } });
    await expect(getCaseStudyBySlug("my-study")).resolves.toEqual({ _id: "cs1", title: { en: "My Study" } });
  });

  it("returns null when there's no match", async () => {
    mockQuery.mockResolvedValue(null);
    await expect(getCaseStudyBySlug("missing")).resolves.toBeNull();
  });

  it("throws (does not degrade) when the source fails, as the original unwrapped fetch did", async () => {
    mockQuery.mockRejectedValue(new Error("timeout"));
    await expect(getCaseStudyBySlug("x")).rejects.toThrow("timeout");
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
    mockQuery.mockResolvedValue([{ _id: "cs1", submittedBy: "user1" }]);
    await expect(getCaseStudiesByUser("user1")).resolves.toEqual([{ _id: "cs1", submittedBy: "user1" }]);
  });

  it("returns case studies by status from the source", async () => {
    mockQuery.mockResolvedValue([{ _id: "cs1", status: "pending" }]);
    await expect(getCaseStudiesByStatus("pending")).resolves.toEqual([{ _id: "cs1", status: "pending" }]);
  });

  it("throws (does not degrade) when the source fails", async () => {
    mockQuery.mockRejectedValue(new Error("boom"));
    await expect(getCaseStudiesByUser("user1")).rejects.toThrow("boom");
    await expect(getCaseStudiesByStatus("approved")).rejects.toThrow("boom");
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
    mockQuery.mockResolvedValue({
      submissions: [{ _id: "cs1", title: { en: "A study" } }],
      drafts: [{ _id: "d1", title: { en: "A draft" } }],
    });
    const result = await getUserSubmissionsAndDrafts("user1");
    expect(result.submissions).toHaveLength(1);
    expect(result.drafts).toHaveLength(1);
  });

  it("degrades to empty lists when the source fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValue(new Error("402 plan_limit_reached"));
    await expect(getUserSubmissionsAndDrafts("user1")).resolves.toEqual({ submissions: [], drafts: [] });
  });

  it("degrades when the source returns null rather than an object", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockResolvedValue(null);
    await expect(getUserSubmissionsAndDrafts("user1")).resolves.toEqual({ submissions: [], drafts: [] });
  });
});

describe("getCaseStudyRevisions", () => {
  it("returns revision-status submissions from the source", async () => {
    mockQuery.mockResolvedValue([{ _id: "cs1", status: "revision" }]);
    await expect(getCaseStudyRevisions("user1")).resolves.toEqual([{ _id: "cs1", status: "revision" }]);
  });

  it("throws (matching the original's un-degraded try/catch, which mapped failures to an explicit 500)", async () => {
    mockQuery.mockRejectedValue(new Error("network error"));
    await expect(getCaseStudyRevisions("user1")).rejects.toThrow("network error");
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
