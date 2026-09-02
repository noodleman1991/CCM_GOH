import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/content/internal/sanity-source", () => ({
  query: vi.fn(),
  queryRaw: vi.fn(),
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
  queryRaw,
  uploadFileAsset,
  createDocument,
  updateDocument,
} from "@/lib/content/internal/sanity-source";
import { prisma } from "@/lib/prisma";
import {
  getAgendasByRegion,
  getAgendas,
  getAgendaBySlug,
  trackAgendaDownload,
  trackReportDownload,
  getResearchOutputBySlug,
  getResearchOutputs,
  getResearchOutputSlugs,
  getResearchOutputTags,
  getResearchOutputRegionalCommunities,
  loadEditableResearchOutput,
  submitResearchOutput,
  updateResearchOutput,
  ResearchOutputEditNotAllowedError,
  getPublishedAgendaIndexDocs,
  getAgendaIndexDocsByIds,
  getAgendaIndexDocById,
  getAgendaCount,
  getAgendaSearchRecords,
  getResearchOutputSearchRecords,
} from "@/lib/content/outputs";

const mockQuery = vi.mocked(query);
const mockQueryRaw = vi.mocked(queryRaw);
const mockUploadFileAsset = vi.mocked(uploadFileAsset);
const mockCreateDocument = vi.mocked(createDocument);
const mockUpdateDocument = vi.mocked(updateDocument);
const mockFindFirst = vi.mocked(prisma.workspaceOutput.findFirst);

beforeEach(() => {
  mockQuery.mockReset();
  mockQueryRaw.mockReset();
  mockUploadFileAsset.mockReset();
  mockCreateDocument.mockReset();
  mockUpdateDocument.mockReset();
  mockFindFirst.mockReset();
});
afterEach(() => vi.restoreAllMocks());

describe("getAgendasByRegion", () => {
  it("returns featured agendas first, then recent to fill the limit", async () => {
    mockQuery
      .mockResolvedValueOnce({ _id: "rc1" }) // community lookup
      .mockResolvedValueOnce([{ _id: "a1" }]) // featured
      .mockResolvedValueOnce([{ _id: "a2" }, { _id: "a3" }]); // recent

    const result = await getAgendasByRegion("oceania", 3);

    expect(result).toEqual([{ _id: "a1" }, { _id: "a2" }, { _id: "a3" }]);
    expect(mockQuery).toHaveBeenCalledTimes(3);
  });

  it("skips the recent fetch once featured items already fill the limit", async () => {
    mockQuery
      .mockResolvedValueOnce({ _id: "rc1" })
      .mockResolvedValueOnce([{ _id: "a1" }, { _id: "a2" }]);

    const result = await getAgendasByRegion("oceania", 2);

    expect(result).toEqual([{ _id: "a1" }, { _id: "a2" }]);
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it("returns an empty list when the regional community doesn't exist", async () => {
    mockQuery.mockResolvedValueOnce(null);

    await expect(getAgendasByRegion("missing")).resolves.toEqual([]);
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it("degrades to an empty list when the source fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValue(new Error("402 plan_limit_reached"));

    await expect(getAgendasByRegion("oceania")).resolves.toEqual([]);
  });
});

describe("getAgendas / getAgendaBySlug", () => {
  it("returns agendas from the source, ignoring the inert locale param", async () => {
    mockQuery.mockResolvedValue([{ _id: "a1" }]);
    await expect(getAgendas("en")).resolves.toEqual([{ _id: "a1" }]);
  });

  it("returns [] when the source returns null", async () => {
    mockQuery.mockResolvedValue(null);
    await expect(getAgendas()).resolves.toEqual([]);
  });

  it("returns the agenda by slug", async () => {
    mockQuery.mockResolvedValue({ _id: "a1", slug: { current: "my-agenda" } });
    await expect(getAgendaBySlug("my-agenda")).resolves.toEqual({
      _id: "a1",
      slug: { current: "my-agenda" },
    });
  });

  it("returns null when there's no match", async () => {
    mockQuery.mockResolvedValue(null);
    await expect(getAgendaBySlug("missing")).resolves.toBeNull();
  });

  it("throws (does not degrade) when the source fails", async () => {
    mockQuery.mockRejectedValue(new Error("upstream 500"));
    await expect(getAgendas()).rejects.toThrow("upstream 500");
  });
});

describe("trackAgendaDownload / trackReportDownload", () => {
  it("increments the matching file's download count and the total", async () => {
    mockQuery.mockResolvedValue({
      _id: "a1",
      files: [
        { language: "en", downloadCount: 2 },
        { language: "es", downloadCount: 5 },
      ],
      totalDownloadCount: 7,
    });

    await trackAgendaDownload("a1", "en");

    expect(mockUpdateDocument).toHaveBeenCalledWith("a1", {
      files: [
        expect.objectContaining({ language: "en", downloadCount: 3 }),
        expect.objectContaining({ language: "es", downloadCount: 5 }),
      ],
      totalDownloadCount: 8,
    });
  });

  it("no-ops (does not throw or write) when the agenda doesn't exist", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockResolvedValue(null);

    await expect(trackAgendaDownload("missing", "en")).resolves.toBeUndefined();
    expect(mockUpdateDocument).not.toHaveBeenCalled();
  });

  it("throws (does not swallow) when the write fails — the route keeps its own catch", async () => {
    mockQuery.mockResolvedValue({ _id: "a1", files: [], totalDownloadCount: 0 });
    mockUpdateDocument.mockRejectedValue(new Error("write failed"));

    await expect(trackAgendaDownload("a1", "en")).rejects.toThrow("write failed");
  });

  it("trackReportDownload increments the matching report file", async () => {
    mockQuery.mockResolvedValue({
      _id: "r1",
      files: [{ language: "fr", downloadCount: 0 }],
      totalDownloadCount: 0,
    });

    await trackReportDownload("r1", "fr");

    expect(mockUpdateDocument).toHaveBeenCalledWith("r1", {
      files: [expect.objectContaining({ language: "fr", downloadCount: 1 })],
      totalDownloadCount: 1,
    });
  });
});

describe("getResearchOutputBySlug / getResearchOutputs / getResearchOutputSlugs", () => {
  it("returns the detail doc from the source", async () => {
    mockQuery.mockResolvedValue({ _id: "ro1", title: { en: "My output" } });
    await expect(getResearchOutputBySlug("my-output")).resolves.toEqual({
      _id: "ro1",
      title: { en: "My output" },
    });
  });

  it("returns null when there's no match", async () => {
    mockQuery.mockResolvedValue(null);
    await expect(getResearchOutputBySlug("missing")).resolves.toBeNull();
  });

  it("returns approved outputs, ignoring the inert locale param", async () => {
    mockQuery.mockResolvedValue([{ _id: "ro1" }]);
    await expect(getResearchOutputs("en")).resolves.toEqual([{ _id: "ro1" }]);
  });

  it("returns [] when the source returns null", async () => {
    mockQuery.mockResolvedValue(null);
    await expect(getResearchOutputs()).resolves.toEqual([]);
  });

  it("returns slugs from the source", async () => {
    mockQuery.mockResolvedValue([{ slug: "my-output" }]);
    await expect(getResearchOutputSlugs()).resolves.toEqual([{ slug: "my-output" }]);
  });

  it("throws (does not degrade) when the source fails, as the original unwrapped fetch did", async () => {
    mockQuery.mockRejectedValue(new Error("timeout"));
    await expect(getResearchOutputBySlug("x")).rejects.toThrow("timeout");
  });
});

describe("getResearchOutputTags / getResearchOutputRegionalCommunities", () => {
  it("returns tags from the source", async () => {
    mockQuery.mockResolvedValue([{ _id: "t1", label: { en: "Adaptation" }, value: { current: "adaptation" } }]);
    await expect(getResearchOutputTags()).resolves.toEqual([
      { _id: "t1", label: { en: "Adaptation" }, value: { current: "adaptation" } },
    ]);
  });

  it("returns active regional communities from the source", async () => {
    mockQuery.mockResolvedValue([{ _id: "r1", name: { en: "Oceania" }, slug: { current: "oceania" } }]);
    await expect(getResearchOutputRegionalCommunities()).resolves.toEqual([
      { _id: "r1", name: { en: "Oceania" }, slug: { current: "oceania" } },
    ]);
  });

  it("throws through when the source fails (no local try/catch previously)", async () => {
    mockQuery.mockRejectedValue(new Error("upstream 500"));
    await expect(getResearchOutputTags()).rejects.toThrow("upstream 500");
  });
});

describe("loadEditableResearchOutput", () => {
  it("returns the mapped doc when the submitter matches", async () => {
    mockQueryRaw.mockResolvedValue({
      _id: "ro1",
      title: { en: "My output" },
      outputType: "report",
      excerpt: { en: "Desc" },
      body: [],
      region: "ssa",
      themes: ["adaptation"],
      submittedBy: "user1",
      status: "pending",
      reviewNotes: null,
      tagIds: ["t1"],
      communityIds: ["c1"],
      versions: [],
    });

    const result = await loadEditableResearchOutput("ro1", "user1");

    expect(result?.title).toBe("My output");
    expect(result?.language).toBe("en");
  });

  it("returns null when the doc doesn't exist", async () => {
    mockQueryRaw.mockResolvedValue(null);
    await expect(loadEditableResearchOutput("missing", "user1")).resolves.toBeNull();
  });

  it("returns null when the caller isn't the submitter or a workspace member", async () => {
    mockQueryRaw.mockResolvedValue({ _id: "ro1", submittedBy: "someone-else", status: "pending" });
    mockFindFirst.mockResolvedValue(null);

    await expect(loadEditableResearchOutput("ro1", "user1")).resolves.toBeNull();
  });

  it("throws (does not degrade) when the source fails", async () => {
    mockQueryRaw.mockRejectedValue(new Error("network error"));
    await expect(loadEditableResearchOutput("ro1", "user1")).rejects.toThrow("network error");
  });
});

describe("submitResearchOutput", () => {
  it("creates a pending doc for a fresh submission", async () => {
    mockCreateDocument.mockResolvedValue({ id: "new-id" });

    const result = await submitResearchOutput({
      userId: "user1",
      title: "My output",
      outputType: "report",
      excerpt: "A description",
      language: "en",
    });

    expect(result).toEqual({ id: "new-id" });
    expect(mockCreateDocument).toHaveBeenCalledWith(
      expect.objectContaining({ _type: "researchOutput", status: "pending", submittedBy: "user1" }),
    );
  });

  it("uploads new version documents before creating the document", async () => {
    mockUploadFileAsset.mockResolvedValue({ id: "asset1" });
    mockCreateDocument.mockResolvedValue({ id: "new-id" });

    await submitResearchOutput({
      userId: "user1",
      title: "My output",
      outputType: "report",
      language: "en",
      newVersions: [
        { kind: "full", lang: "en", buffer: Buffer.from("x"), filename: "report.pdf", contentType: "application/pdf" },
      ],
    });

    expect(mockUploadFileAsset).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.objectContaining({ filename: "report.pdf", contentType: "application/pdf" }),
    );
    expect(mockCreateDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        versions: [
          expect.objectContaining({
            kind: "full",
            lang: "en",
            file: { _type: "file", asset: { _type: "reference", _ref: "asset1" } },
          }),
        ],
      }),
    );
  });

  it("patches the existing doc on an allowed edit resubmission, pinning exactly which fields are set vs. nulled", async () => {
    mockQueryRaw.mockResolvedValue({ _id: "ro1", submittedBy: "user1", status: "pending", versions: [] });

    const result = await submitResearchOutput({
      userId: "user1",
      title: "Updated output",
      outputType: "report",
      language: "en",
      editId: "ro1",
    });

    expect(result).toEqual({ id: "ro1" });
    // submittedBy/slug/year are excluded from the patch entirely (preserved
    // from the original doc, not reset by an edit) — everything else the
    // caller didn't provide comes back as explicit null (unset).
    expect(mockUpdateDocument).toHaveBeenCalledWith("ro1", {
      status: "pending",
      title: { en: "Updated output" },
      outputType: "report",
      versions: [],
      excerpt: null,
      region: null,
      themes: null,
      body: null,
      tags: null,
      relatedCommunities: null,
    });
    expect(mockCreateDocument).not.toHaveBeenCalled();
  });

  it("keeps existing versions listed in keptVersionKeys alongside newly uploaded ones", async () => {
    mockQueryRaw.mockResolvedValue({
      _id: "ro1",
      submittedBy: "user1",
      status: "pending",
      versions: [{ _key: "v1", kind: "full", lang: "en" }, { _key: "v2", kind: "summary", lang: "en" }],
    });

    await submitResearchOutput({
      userId: "user1",
      title: "Updated output",
      outputType: "report",
      language: "en",
      editId: "ro1",
      keptVersionKeys: ["v1"],
    });

    const [, patch] = mockUpdateDocument.mock.calls[0];
    expect(patch.versions).toEqual([{ _key: "v1", kind: "full", lang: "en" }]);
  });

  it("throws ResearchOutputEditNotAllowedError when the caller may not edit the doc", async () => {
    mockQueryRaw.mockResolvedValue({ _id: "ro1", submittedBy: "someone-else", status: "pending" });
    mockFindFirst.mockResolvedValue(null);

    await expect(
      submitResearchOutput({ userId: "user1", title: "x", outputType: "report", language: "en", editId: "ro1" }),
    ).rejects.toBeInstanceOf(ResearchOutputEditNotAllowedError);
  });

  it("throws (does not degrade) when the write fails", async () => {
    mockCreateDocument.mockRejectedValue(new Error("Sanity write failed"));
    await expect(
      submitResearchOutput({ userId: "user1", title: "x", outputType: "report", language: "en" }),
    ).rejects.toThrow("Sanity write failed");
  });
});

describe("updateResearchOutput", () => {
  it("patches through updateDocument", async () => {
    await updateResearchOutput("ro1", { title: "New title" });
    expect(mockUpdateDocument).toHaveBeenCalledWith("ro1", { title: "New title" });
  });
});

describe("agenda search-index docs (sync/webhook)", () => {
  it("getPublishedAgendaIndexDocs returns rows from the source", async () => {
    mockQuery.mockResolvedValue([{ _id: "a1" }]);
    await expect(getPublishedAgendaIndexDocs()).resolves.toEqual([{ _id: "a1" }]);
  });

  it("getPublishedAgendaIndexDocs returns [] when the source returns null", async () => {
    mockQuery.mockResolvedValue(null);
    await expect(getPublishedAgendaIndexDocs()).resolves.toEqual([]);
  });

  it("getAgendaIndexDocsByIds passes the ids through as params", async () => {
    mockQuery.mockResolvedValue([{ _id: "a1" }]);
    await getAgendaIndexDocsByIds(["a1", "a2"]);
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), { ids: ["a1", "a2"] });
  });

  it("getAgendaIndexDocById returns a single doc", async () => {
    mockQuery.mockResolvedValue({ _id: "a1" });
    await expect(getAgendaIndexDocById("a1")).resolves.toEqual({ _id: "a1" });
  });

  it("getAgendaIndexDocById returns null when there's no match", async () => {
    mockQuery.mockResolvedValue(null);
    await expect(getAgendaIndexDocById("missing")).resolves.toBeNull();
  });

  it("getAgendaCount returns the count", async () => {
    mockQuery.mockResolvedValue(29);
    await expect(getAgendaCount()).resolves.toBe(29);
  });

  it("throws through when the sync source fails (route keeps its own catch)", async () => {
    mockQuery.mockRejectedValue(new Error("network error"));
    await expect(getPublishedAgendaIndexDocs()).rejects.toThrow("network error");
  });
});

describe("getAgendaSearchRecords / getResearchOutputSearchRecords", () => {
  it("maps agenda docs to search records", async () => {
    mockQuery.mockResolvedValue([{ _id: "a1", title: { en: "My agenda" }, slug: "my-agenda" }]);

    const result = await getAgendaSearchRecords();

    expect(result).toEqual([
      {
        objectID: "a1",
        kind: "agenda",
        title: "My agenda",
        excerpt: undefined,
        url: "/en/research-and-action/agendas/my-agenda",
        locale: "en",
      },
    ]);
  });

  it("degrades to an empty list when the agenda source fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValue(new Error("network error"));
    await expect(getAgendaSearchRecords()).resolves.toEqual([]);
  });

  it("maps research-output docs to search records", async () => {
    mockQuery.mockResolvedValue([{ _id: "ro1", title: { en: "My output" }, excerpt: { en: "Desc" }, slug: "my-output" }]);

    const result = await getResearchOutputSearchRecords();

    expect(result).toEqual([
      {
        objectID: "ro1",
        kind: "researchOutput",
        title: "My output",
        excerpt: "Desc",
        url: "/en/research-and-action/research-outputs/my-output",
        locale: "en",
      },
    ]);
  });

  it("degrades to an empty list when the research-output source fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValue(new Error("network error"));
    await expect(getResearchOutputSearchRecords()).resolves.toEqual([]);
  });
});
