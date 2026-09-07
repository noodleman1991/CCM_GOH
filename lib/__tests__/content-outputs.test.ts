import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/content/internal/sanity-source", () => ({
  query: vi.fn(),
  queryLive: vi.fn(),
  queryRaw: vi.fn(),
  uploadFileAsset: vi.fn(),
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
}));

// `payload-source`, not the reader: `query`, `queryRaw` and `queryLive` all
// return the same shape, so a reader that picks the wrong one is invisible to
// a result-based test. Mocking the source leaves the real reader running and
// makes its primitive choice observable — which is the whole point on this
// module, whose two `queryLive` sites are the two download trackers.
vi.mock("@/lib/content/internal/payload-source", () => ({
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
  queryLive,
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
const mockQueryLive = vi.mocked(queryLive);
const mockQueryRaw = vi.mocked(queryRaw);
const mockUploadFileAsset = vi.mocked(uploadFileAsset);
const mockCreateDocument = vi.mocked(createDocument);
const mockUpdateDocument = vi.mocked(updateDocument);
const mockFindFirst = vi.mocked(prisma.workspaceOutput.findFirst);
const mockPayloadQuery = vi.mocked(payloadQuery);
const mockPayloadQueryPreviewable = vi.mocked(payloadQueryPreviewable);
const mockPayloadQueryRaw = vi.mocked(payloadQueryRaw);
const mockPayloadQueryLive = vi.mocked(payloadQueryLive);
const mockPayloadUpload = vi.mocked(payloadUploadFileAsset);
const mockPayloadCreate = vi.mocked(payloadCreateDocument);
const mockPayloadUpdate = vi.mocked(payloadUpdateDocument);

beforeEach(() => {
  mockQuery.mockReset();
  mockQueryLive.mockReset();
  mockQueryRaw.mockReset();
  mockUploadFileAsset.mockReset();
  mockCreateDocument.mockReset();
  mockUpdateDocument.mockReset();
  mockFindFirst.mockReset();
  mockPayloadQuery.mockReset();
  mockPayloadQueryPreviewable.mockReset();
  mockPayloadQueryRaw.mockReset();
  mockPayloadQueryLive.mockReset();
  mockPayloadUpload.mockReset();
  mockPayloadCreate.mockReset();
  mockPayloadUpdate.mockReset();
  // An override left behind by the Payload section below must not silently
  // redirect the Sanity contract tests above it.
  delete process.env.CONTENT_BACKEND_OUTPUTS;
  delete process.env.CONTENT_BACKEND;
});
afterEach(() => {
  delete process.env.CONTENT_BACKEND_OUTPUTS;
  delete process.env.CONTENT_BACKEND;
  vi.restoreAllMocks();
});

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
    mockQueryLive.mockResolvedValue({
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
    mockQueryLive.mockResolvedValue(null);

    await expect(trackAgendaDownload("missing", "en")).resolves.toBeUndefined();
    expect(mockUpdateDocument).not.toHaveBeenCalled();
  });

  it("throws (does not swallow) when the write fails — the route keeps its own catch", async () => {
    mockQueryLive.mockResolvedValue({ _id: "a1", files: [], totalDownloadCount: 0 });
    mockUpdateDocument.mockRejectedValue(new Error("write failed"));

    await expect(trackAgendaDownload("a1", "en")).rejects.toThrow("write failed");
  });

  it("trackReportDownload increments the matching report file", async () => {
    mockQueryLive.mockResolvedValue({
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

  // Pins the fix for a regression: the read inside a read-modify-write
  // counter must use the live/uncached-but-published-perspective primitive
  // (matching the original bare client.fetch(), which has no caching on
  // Next 16.3.4 and never saw drafts), not the cached `query()` used
  // elsewhere in this module. `query()` routes through cachedFetch with an
  // hour-long revalidate — every download inside the same hour would then
  // read identical stale counts and write back identical numbers, silently
  // undoing the write-side fix (client -> writeClient) right next to it.
  // NOT `queryRaw` either: `agendaId`/`reportId` come straight from the
  // request body (client-supplied), and queryRaw's raw perspective would
  // let a caller increment the counter — and read back fields — of an
  // unpublished draft agenda/report with no published counterpart. If
  // either function slips to `query` or `queryRaw`, these tests must fail.
  it("trackAgendaDownload uses queryLive, not query or queryRaw", async () => {
    mockQueryLive.mockResolvedValue({ _id: "a1", files: [], totalDownloadCount: 0 });
    await trackAgendaDownload("a1", "en");
    expect(mockQueryLive).toHaveBeenCalledTimes(1);
    expect(mockQuery).not.toHaveBeenCalled();
    expect(mockQueryRaw).not.toHaveBeenCalled();
  });

  it("trackReportDownload uses queryLive, not query or queryRaw", async () => {
    mockQueryLive.mockResolvedValue({ _id: "r1", files: [], totalDownloadCount: 0 });
    await trackReportDownload("r1", "en");
    expect(mockQueryLive).toHaveBeenCalledTimes(1);
    expect(mockQuery).not.toHaveBeenCalled();
    expect(mockQueryRaw).not.toHaveBeenCalled();
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

// ---------------------------------------------------------------------------
// The Payload arm
//
// Nothing above this line was edited except the shared mock/reset block: the
// 59 tests are the Sanity contract and they are what both backends have to
// satisfy. Everything below sets `CONTENT_BACKEND_OUTPUTS=payload`, mocks
// `payload-source` rather than the reader, and asserts the same contract plus
// the four things only the primitive choice or the flight payload can show.
// ---------------------------------------------------------------------------

/** One published agenda, as Payload really hands it back at `locale: "all"`
 *  and `depth: 2`: every locale spelled out with `null` for the untranslated
 *  arms, `[]` for the unset relationships, a full ISO instant for a `dateOnly`
 *  column, and the media row nested under `coverImage.asset`. */
function payloadAgendaRow(over: Record<string, unknown> = {}) {
  return {
    id: "agenda-central-and-southern-asia-regional-agenda-full",
    slug: "central-and-southern-asia-regional-agenda",
    title: { en: "Central and Southern Asia Regional Agenda", es: null, fr: null, ar: null },
    subtitle: { en: "Regional priorities", es: null, fr: null, ar: null },
    description: { en: "A regional agenda.", es: null, fr: null, ar: null },
    agendaType: "research",
    // A `dateOnly` field in Sanity, which returns "2024-03-18"; Postgres
    // always hands back the full instant.
    publishDate: "2024-03-18T00:00:00.000Z",
    year: 2024,
    totalDownloadCount: 0,
    featured: false,
    accessLevel: "public",
    sanityUpdatedAt: "2025-11-13T03:39:37.000Z",
    coverImage: {
      asset: {
        id: "image-7971b68f-1920x1080-jpg",
        url: "/payload-api/media/file/csa.jpg?prefix=cms%2Fmedia",
        mimeType: "image/jpeg",
        lqip: "data:image/jpeg;base64,AAAA",
        width: 1920,
        height: 1080,
        sizes: { crop800x533: { url: "/payload-api/media/file/csa-800x533.jpg", width: 800, height: 533 } },
      },
      alt: { en: "Central and Southern Asia Region", es: null, fr: null, ar: null },
    },
    files: [
      {
        id: "agenda-central-and-southern-asia-regional-agenda-full:files:qkardxslt",
        language: "en",
        file: {
          id: "file-35a0ad7c-pdf",
          url: "/payload-api/files/file/Full%20RRAA.pdf?prefix=cms%2Ffiles",
          filename: "Full RRAA Central and Southern Asia 18-03.pdf",
          filesize: 1940131,
          mimeType: "application/pdf",
        },
        downloadCount: 0,
        lastDownloaded: null,
      },
    ],
    organizations: [],
    tags: [],
    regionalCommunities: [
      {
        id: "regional-community-central-and-southern-asia",
        name: { en: "Central and Southern Asia Regional Community", es: null, fr: null, ar: null },
        slug: "central-and-southern-asia",
        region: "csa",
      },
    ],
    ...over,
  };
}

/** One approved research output, likewise. */
function payloadResearchOutputRow(over: Record<string, unknown> = {}) {
  return {
    id: "researchOutput-from-agenda-oceania-regional-agenda-summary",
    slug: "oceania-regional-agenda-summary",
    title: { en: "Oceania Regional Agenda - Summary", es: null, fr: null, ar: null },
    excerpt: { en: "An executive summary.", es: null, fr: null, ar: null },
    outputType: "report",
    layout: "report",
    moderationStatus: "approved",
    featured: false,
    // A full ISO instant in Sanity too, unlike the agenda's.
    publishDate: "2024-03-18T00:00:00.000Z",
    createdAt: "2025-11-11T22:04:11.000Z",
    year: 2024,
    region: "oce",
    themes: [],
    populations: [],
    coverImage: {
      asset: { id: "image-3d2ca683-1920x1080-jpg", url: "/payload-api/media/file/oceania.jpg", width: 1920, height: 1080, mimeType: "image/jpeg", lqip: null, sizes: {} },
      alt: { en: "Oceania Region", es: null, fr: null, ar: null },
    },
    body: { en: null, es: null, fr: null, ar: null },
    organizations: [],
    relatedCommunities: [
      { id: "regional-community-oceania", name: { en: "Oceania Regional Community", es: null, fr: null, ar: null }, slug: "oceania" },
    ],
    tags: [],
    versions: [
      {
        id: "researchOutput-from-agenda-oceania-regional-agenda-summary:versions:v0",
        kind: "full",
        lang: "en",
        label: null,
        pages: null,
        downloadCount: 0,
        body: null,
        file: { id: "file-00013d92-pdf", url: "/payload-api/files/file/Oceania.pdf", filename: "Oceania (summary)_compressed.pdf", filesize: 21987892, mimeType: "application/pdf" },
      },
    ],
    ...over,
  };
}

describe("outputs, answered by Payload", () => {
  beforeEach(() => {
    process.env.CONTENT_BACKEND_OUTPUTS = "payload";
  });

  // -------------------------------------------------------------------------
  // The primitive, not just the result
  //
  // This is the gap the Phase-1 authorization bypass fell through: `query`,
  // `queryLive` and `queryRaw` return the same shape, so a reader that picks
  // the wrong one cannot fail a test that only looks at what came back.
  // -------------------------------------------------------------------------
  describe("the primitive, not just the result", () => {
    it("reads every public list through `query` and never through an uncached or draft-aware one", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [] } as never);
      await getAgendas();
      await getAgendaBySlug("x");
      await getAgendasByRegion("oceania", 6);
      await getResearchOutputs();
      await getResearchOutputBySlug("x");
      await getResearchOutputSlugs();
      await getResearchOutputTags();
      await getResearchOutputRegionalCommunities();

      expect(mockPayloadQuery).toHaveBeenCalled();
      expect(mockPayloadQueryPreviewable).not.toHaveBeenCalled();
      expect(mockPayloadQueryRaw).not.toHaveBeenCalled();
      expect(mockPayloadQueryLive).not.toHaveBeenCalled();
      // And the Sanity source is never touched once the flag is set.
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it("trackAgendaDownload reads through payload `queryLive` — not `query`, not `queryRaw`", async () => {
      mockPayloadQueryLive.mockResolvedValue({ id: "a1", files: [], totalDownloadCount: 0 } as never);

      await trackAgendaDownload("a1", "en");

      expect(mockPayloadQueryLive).toHaveBeenCalledTimes(1);
      // `query` would serve an hour-stale count into a read-modify-write and
      // silently freeze the counter; `queryRaw` would let a client-supplied id
      // reach an unpublished document.
      expect(mockPayloadQuery).not.toHaveBeenCalled();
      expect(mockPayloadQueryRaw).not.toHaveBeenCalled();
      expect(mockPayloadQueryPreviewable).not.toHaveBeenCalled();
      expect(mockQueryLive).not.toHaveBeenCalled();
    });

    it("the tracker's `queryLive` descriptor is a published, uncached read of `agendas` by id", async () => {
      mockPayloadQueryLive.mockResolvedValue({ id: "a1", files: [], totalDownloadCount: 0 } as never);

      await trackAgendaDownload("a1", "en");

      expect(mockPayloadQueryLive).toHaveBeenCalledWith(
        expect.objectContaining({ type: "findByID", collection: "agendas", id: "a1" }),
      );
    });

    it("loadEditableResearchOutput reads through payload `queryRaw` — not `queryLive`", async () => {
      mockPayloadQueryRaw.mockResolvedValue({
        id: "ro1",
        title: { en: "My output" },
        submittedBy: "user1",
        moderationStatus: "pending",
      } as never);

      await loadEditableResearchOutput("ro1", "user1");

      expect(mockPayloadQueryRaw).toHaveBeenCalledTimes(1);
      expect(mockPayloadQueryLive).not.toHaveBeenCalled();
      expect(mockPayloadQuery).not.toHaveBeenCalled();
    });

    it("submitResearchOutput's edit gate reads through payload `queryRaw`", async () => {
      mockPayloadQueryRaw.mockResolvedValue({ id: "ro1", submittedBy: "user1", moderationStatus: "pending", versions: [] } as never);

      await submitResearchOutput({
        userId: "user1",
        title: "Updated output",
        outputType: "report",
        language: "en",
        editId: "ro1",
      });

      expect(mockPayloadQueryRaw).toHaveBeenCalledWith(
        expect.objectContaining({ type: "findByID", collection: "researchOutputs", id: "ro1" }),
      );
      expect(mockPayloadQueryLive).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // `report` is a dead end
  // -------------------------------------------------------------------------
  describe("trackReportDownload", () => {
    it("refuses out loud rather than pretending to have written something", async () => {
      await expect(trackReportDownload("r1", "en")).rejects.toThrow(/not modelled in Payload/);
    });

    it("touches no read primitive and writes nothing", async () => {
      await expect(trackReportDownload("r1", "en")).rejects.toThrow();
      expect(mockPayloadQueryLive).not.toHaveBeenCalled();
      expect(mockPayloadQuery).not.toHaveBeenCalled();
      expect(mockPayloadUpdate).not.toHaveBeenCalled();
      expect(mockUpdateDocument).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // The download counter
  // -------------------------------------------------------------------------
  describe("trackAgendaDownload", () => {
    it("increments the matching file and the total, and really writes them", async () => {
      mockPayloadQueryLive.mockResolvedValue({
        id: "a1",
        files: [
          { id: "a1:files:k1", language: "en", downloadCount: 2 },
          { id: "a1:files:k2", language: "es", downloadCount: 5 },
        ],
        totalDownloadCount: 7,
      } as never);

      await trackAgendaDownload("a1", "en");

      expect(mockPayloadUpdate).toHaveBeenCalledWith({
        collection: "agendas",
        id: "a1",
        data: {
          files: [
            expect.objectContaining({ id: "a1:files:k1", language: "en", downloadCount: 3 }),
            expect.objectContaining({ id: "a1:files:k2", language: "es", downloadCount: 5 }),
          ],
          totalDownloadCount: 8,
        },
      });
    });

    it("no-ops (does not throw or write) when the agenda doesn't exist", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      mockPayloadQueryLive.mockResolvedValue(null as never);

      await expect(trackAgendaDownload("missing", "en")).resolves.toBeUndefined();
      expect(mockPayloadUpdate).not.toHaveBeenCalled();
    });

    it("throws (does not swallow) when the write fails — the route keeps its own catch", async () => {
      mockPayloadQueryLive.mockResolvedValue({ id: "a1", files: [], totalDownloadCount: 0 } as never);
      mockPayloadUpdate.mockRejectedValue(new Error("write failed"));

      await expect(trackAgendaDownload("a1", "en")).rejects.toThrow("write failed");
    });
  });

  // -------------------------------------------------------------------------
  // Agendas
  // -------------------------------------------------------------------------
  describe("getAgendas / getAgendaBySlug", () => {
    it("reproduces AGENDA_FIELDS key for key, with Sanity's alphabetical key order", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [payloadAgendaRow()] } as never);

      const [agenda] = await getAgendas();

      expect(Object.keys(agenda)).toEqual([
        "_id",
        "accessLevel",
        "agendaType",
        "coverImage",
        "description",
        "featured",
        "files",
        "organizations",
        "publishDate",
        "regionalCommunities",
        "slug",
        "subtitle",
        "tags",
        "title",
        "totalDownloadCount",
        "year",
      ]);
    });

    it("truncates `publishDate` to the bare day Sanity stores for an agenda", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [payloadAgendaRow()] } as never);
      const [agenda] = await getAgendas();
      expect(agenda.publishDate).toBe("2024-03-18");
    });

    it("drops Payload's empty locale arms and emits the survivors alphabetically", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [payloadAgendaRow()] } as never);
      const [agenda] = await getAgendas();
      expect(agenda.title).toEqual({ en: "Central and Southern Asia Regional Agenda" });
    });

    it("collapses Payload's `[]` relationships back to the `null` GROQ returns", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [payloadAgendaRow()] } as never);
      const [agenda] = await getAgendas();
      expect(agenda.tags).toBeNull();
      expect(agenda.organizations).toBeNull();
    });

    it("emits `code: null` on a regional community — the field is declared and 0/7 populated in Sanity, and absent in Payload", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [payloadAgendaRow()] } as never);
      const [agenda] = await getAgendas();
      expect(agenda.regionalCommunities).toEqual([
        {
          _id: "regional-community-central-and-southern-asia",
          code: null,
          name: { en: "Central and Southern Asia Regional Community" },
          slug: { _type: "slug", current: "central-and-southern-asia" },
        },
      ]);
    });

    it("renames Payload's `filename`/`filesize` to Sanity's `originalFilename`/`size`", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [payloadAgendaRow()] } as never);
      const [agenda] = await getAgendas();
      expect(agenda.files).toEqual([
        {
          downloadCount: 0,
          file: {
            asset: {
              _id: "file-35a0ad7c-pdf",
              mimeType: "application/pdf",
              originalFilename: "Full RRAA Central and Southern Asia 18-03.pdf",
              size: 1940131,
              url: "/payload-api/files/file/Full%20RRAA.pdf?prefix=cms%2Ffiles",
            },
          },
          language: "en",
          lastDownloaded: null,
        },
      ]);
    });

    it("carries the media row alongside the Sanity-shaped asset, so `imageUrl` resolves without falling through to Sanity", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [payloadAgendaRow()] } as never);
      const [agenda] = await getAgendas();
      const cover = agenda.coverImage as Record<string, unknown>;
      // What `grid-agenda.tsx` gates on and what `resolveMedia` unwraps.
      expect((cover.asset as Record<string, unknown>).url).toBe("/payload-api/media/file/csa.jpg?prefix=cms%2Fmedia");
      expect(cover.url).toBe("/payload-api/media/file/csa.jpg?prefix=cms%2Fmedia");
      expect(cover.sizes).toBeTruthy();
      // Projected by the GROQ, unset on every document in both stores.
      expect(cover.crop).toBeNull();
      expect(cover.hotspot).toBeNull();
      // `alt` is a Sanity `string`, not a locale map.
      expect(cover.alt).toBe("Central and Southern Asia Region");
    });

    it("orders by publishDate desc then `_id` asc — the tie-break that reproduces Sanity on a total tie", async () => {
      mockPayloadQuery.mockResolvedValue({
        docs: [
          payloadAgendaRow({ id: "zzz" }),
          payloadAgendaRow({ id: "aaa" }),
          payloadAgendaRow({ id: "mmm" }),
        ],
      } as never);

      const agendas = await getAgendas();
      expect(agendas.map((a) => a._id)).toEqual(["aaa", "mmm", "zzz"]);
    });

    it("puts a newer publishDate first, ahead of the id tie-break", async () => {
      mockPayloadQuery.mockResolvedValue({
        docs: [
          payloadAgendaRow({ id: "aaa", publishDate: "2023-01-01T00:00:00.000Z" }),
          payloadAgendaRow({ id: "zzz", publishDate: "2025-01-01T00:00:00.000Z" }),
        ],
      } as never);

      const agendas = await getAgendas();
      expect(agendas.map((a) => a._id)).toEqual(["zzz", "aaa"]);
    });

    it("returns null when there's no agenda with that slug", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [] } as never);
      await expect(getAgendaBySlug("missing")).resolves.toBeNull();
    });
  });

  describe("getAgendasByRegion", () => {
    it("returns featured first, then recent to fill the limit — three reads, as on Sanity", async () => {
      mockPayloadQuery
        .mockResolvedValueOnce({ docs: [{ id: "rc1" }] } as never)
        .mockResolvedValueOnce({ docs: [payloadAgendaRow({ id: "a1", featured: true })] } as never)
        .mockResolvedValueOnce({ docs: [payloadAgendaRow({ id: "a2" }), payloadAgendaRow({ id: "a3" })] } as never);

      const result = await getAgendasByRegion("oceania", 3);

      expect(result.map((a) => a._id)).toEqual(["a1", "a2", "a3"]);
      expect(mockPayloadQuery).toHaveBeenCalledTimes(3);
    });

    it("skips the recent fetch once featured items already fill the limit", async () => {
      mockPayloadQuery
        .mockResolvedValueOnce({ docs: [{ id: "rc1" }] } as never)
        .mockResolvedValueOnce({
          docs: [payloadAgendaRow({ id: "a1", featured: true }), payloadAgendaRow({ id: "a2", featured: true })],
        } as never);

      const result = await getAgendasByRegion("oceania", 2);

      expect(result.map((a) => a._id)).toEqual(["a1", "a2"]);
      expect(mockPayloadQuery).toHaveBeenCalledTimes(2);
    });

    it("returns an empty list when the regional community doesn't exist", async () => {
      mockPayloadQuery.mockResolvedValueOnce({ docs: [] } as never);
      await expect(getAgendasByRegion("missing", 6)).resolves.toEqual([]);
      expect(mockPayloadQuery).toHaveBeenCalledTimes(1);
    });

    it("degrades to an empty list when the source fails", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      mockPayloadQuery.mockRejectedValue(new Error("pool exhausted"));
      await expect(getAgendasByRegion("oceania", 6)).resolves.toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // Research outputs
  // -------------------------------------------------------------------------
  describe("getResearchOutputs / getResearchOutputBySlug", () => {
    it("filters on `moderationStatus == approved` strictly, never on publish state alone", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [] } as never);
      await getResearchOutputs();
      expect(mockPayloadQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: "researchOutputs",
          where: { moderationStatus: { equals: "approved" } },
        }),
      );
    });

    it("maps Payload's `moderationStatus` back onto the public `status` the type declares", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [payloadResearchOutputRow()] } as never);
      const [output] = await getResearchOutputs();
      expect(output.status).toBe("approved");
    });

    it("keeps the full ISO instant for a research output's publishDate, unlike an agenda's", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [payloadResearchOutputRow()] } as never);
      const [output] = await getResearchOutputs();
      expect(output.publishDate).toBe("2024-03-18T00:00:00.000Z");
    });

    it("reproduces RESEARCH_OUTPUT_FRAGMENT key for key, alphabetically", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [payloadResearchOutputRow()] } as never);
      const [output] = await getResearchOutputs();
      expect(Object.keys(output)).toEqual([
        "_id",
        "excerpt",
        "featured",
        "image",
        "layout",
        "organizations",
        "outputType",
        "populations",
        "publishDate",
        "region",
        "relatedCommunities",
        "slug",
        "status",
        "tags",
        "themes",
        "title",
        "versions",
        "year",
      ]);
    });

    it("adds `content` and `relatedContent` on the detail read, and both are null on this data", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [payloadResearchOutputRow()] } as never);
      const output = await getResearchOutputBySlug("oceania-regional-agenda-summary");
      expect(output?.content).toBeNull();
      expect(output?.relatedContent).toBeNull();
    });

    it("turns Payload's array-row id into Sanity's `_key`, and flattens the version's file", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [payloadResearchOutputRow()] } as never);
      const [output] = await getResearchOutputs();
      expect(output.versions).toEqual([
        {
          _key: "v0",
          body: null,
          downloadCount: 0,
          fileName: "Oceania (summary)_compressed.pdf",
          fileUrl: "/payload-api/files/file/Oceania.pdf",
          kind: "full",
          label: null,
          lang: "en",
          pages: null,
        },
      ]);
    });

    it("projects `relatedCommunities.slug` as a plain string, matching `\"slug\": slug.current`", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [payloadResearchOutputRow()] } as never);
      const [output] = await getResearchOutputs();
      expect(output.relatedCommunities).toEqual([
        { _id: "regional-community-oceania", name: { en: "Oceania Regional Community" }, slug: "oceania" },
      ]);
    });

    it("orders by publishDate desc then `_id` asc, the same tie-break as agendas", async () => {
      mockPayloadQuery.mockResolvedValue({
        docs: [
          payloadResearchOutputRow({ id: "ro-z" }),
          payloadResearchOutputRow({ id: "ro-a" }),
        ],
      } as never);
      const outputs = await getResearchOutputs();
      expect(outputs.map((o) => o._id)).toEqual(["ro-a", "ro-z"]);
    });

    it("returns null when there's no approved output with that slug", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [] } as never);
      await expect(getResearchOutputBySlug("missing")).resolves.toBeNull();
    });

    it("throws (does not degrade) when the source fails", async () => {
      mockPayloadQuery.mockRejectedValue(new Error("timeout"));
      await expect(getResearchOutputBySlug("x")).rejects.toThrow("timeout");
    });

    it("getResearchOutputSlugs returns approved slugs only", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [{ slug: "a" }, { slug: null }, { slug: "b" }] } as never);
      await expect(getResearchOutputSlugs()).resolves.toEqual([{ slug: "a" }, { slug: "b" }]);
    });
  });

  describe("the submit-form option lists", () => {
    it("rebuilds `tag.value` as the raw slug object the undereferenced projection returns", async () => {
      mockPayloadQuery.mockResolvedValue({
        docs: [{ id: "t1", label: { en: "Adaptation", es: null }, value: "adaptation" }],
      } as never);

      await expect(getResearchOutputTags()).resolves.toEqual([
        { _id: "t1", label: { en: "Adaptation" }, value: { _type: "slug", current: "adaptation" } },
      ]);
    });

    it("orders tags by `label.en` ascending, as the GROQ does", async () => {
      mockPayloadQuery.mockResolvedValue({
        docs: [
          { id: "t2", label: { en: "Zoonoses" }, value: "zoonoses" },
          { id: "t1", label: { en: "Adaptation" }, value: "adaptation" },
        ],
      } as never);
      const tags = await getResearchOutputTags();
      expect(tags.map((t) => t._id)).toEqual(["t1", "t2"]);
    });

    it("returns only active regional communities", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [] } as never);
      await getResearchOutputRegionalCommunities();
      expect(mockPayloadQuery).toHaveBeenCalledWith(
        expect.objectContaining({ collection: "regionalCommunities", where: { active: { equals: true } } }),
      );
    });

    it("throws through when the source fails (no local try/catch on either arm)", async () => {
      mockPayloadQuery.mockRejectedValue(new Error("upstream 500"));
      await expect(getResearchOutputTags()).rejects.toThrow("upstream 500");
    });
  });

  describe("loadEditableResearchOutput", () => {
    it("returns the mapped doc when the submitter matches", async () => {
      mockPayloadQueryRaw.mockResolvedValue({
        id: "ro1",
        title: { en: "My output", es: null },
        outputType: "report",
        excerpt: { en: "Desc" },
        region: "ssa",
        themes: ["adaptation"],
        submittedBy: "user1",
        moderationStatus: "pending",
        reviewNotes: null,
        tags: [{ id: "t1" }],
        relatedCommunities: [{ id: "c1" }],
        versions: [],
      } as never);

      const result = await loadEditableResearchOutput("ro1", "user1");

      expect(result?.title).toBe("My output");
      expect(result?.status).toBe("pending");
      expect(result?.tagIds).toEqual(["t1"]);
      expect(result?.communityIds).toEqual(["c1"]);
      expect(result?.language).toBe("en");
    });

    it("strips a `drafts.` prefix and looks the id up once — Payload has no such ids", async () => {
      mockPayloadQueryRaw.mockResolvedValue(null as never);
      await loadEditableResearchOutput("drafts.ro1", "user1");
      expect(mockPayloadQueryRaw).toHaveBeenCalledWith(expect.objectContaining({ id: "ro1" }));
    });

    it("refuses an approved document, exactly as on Sanity", async () => {
      mockPayloadQueryRaw.mockResolvedValue({
        id: "ro1",
        submittedBy: "user1",
        moderationStatus: "approved",
      } as never);
      await expect(loadEditableResearchOutput("ro1", "user1")).resolves.toBeNull();
    });

    it("returns null when the caller isn't the submitter or a workspace member", async () => {
      mockPayloadQueryRaw.mockResolvedValue({
        id: "ro1",
        submittedBy: "someone-else",
        moderationStatus: "pending",
      } as never);
      mockFindFirst.mockResolvedValue(null);
      await expect(loadEditableResearchOutput("ro1", "user1")).resolves.toBeNull();
    });

    it("throws (does not degrade) when the source fails", async () => {
      mockPayloadQueryRaw.mockRejectedValue(new Error("network error"));
      await expect(loadEditableResearchOutput("ro1", "user1")).rejects.toThrow("network error");
    });
  });

  describe("submitResearchOutput", () => {
    it("creates a pending document, naming `moderationStatus` and never `status`", async () => {
      mockPayloadCreate.mockResolvedValue({ id: "new-id" } as never);

      const result = await submitResearchOutput({
        userId: "user1",
        title: "My output",
        outputType: "report",
        excerpt: "A description",
        language: "en",
      });

      expect(result).toEqual({ id: "new-id" });
      const [call] = mockPayloadCreate.mock.calls;
      expect(call[0].collection).toBe("researchOutputs");
      expect(call[0].data).toEqual(
        expect.objectContaining({ moderationStatus: "pending", submittedBy: "user1", outputType: "report" }),
      );
      expect(call[0].data).not.toHaveProperty("status");
      expect(call[0].data).not.toHaveProperty("_type");
    });

    it("mints the document id and the slug from one call, so both stores would agree", async () => {
      mockPayloadCreate.mockResolvedValue({ id: "new-id" } as never);
      await submitResearchOutput({ userId: "user1", title: "My output", outputType: "report", language: "en" });
      const data = mockPayloadCreate.mock.calls[0][0].data as Record<string, unknown>;
      expect(data.id).toBe(data.slug);
      expect(String(data.slug)).toMatch(/^my-output-[0-9a-f]{6}$/);
    });

    it("uploads through the Payload asset store, into `files`, before creating the document", async () => {
      mockPayloadUpload.mockResolvedValue({ id: "asset1" } as never);
      mockPayloadCreate.mockResolvedValue({ id: "new-id" } as never);

      await submitResearchOutput({
        userId: "user1",
        title: "My output",
        outputType: "report",
        language: "en",
        newVersions: [
          { kind: "full", lang: "en", buffer: Buffer.from("x"), filename: "report.pdf", contentType: "application/pdf" },
        ],
      });

      expect(mockPayloadUpload).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.objectContaining({ filename: "report.pdf", contentType: "application/pdf" }),
      );
      // The Sanity uploader must not be reached once the flag is set.
      expect(mockUploadFileAsset).not.toHaveBeenCalled();
      const data = mockPayloadCreate.mock.calls[0][0].data as Record<string, unknown>;
      expect(data.versions).toEqual([{ kind: "full", lang: "en", file: "asset1" }]);
    });

    it("writes the submission locale as a second patch, reproducing Sanity's `{en, <lang>}`", async () => {
      mockPayloadCreate.mockResolvedValue({ id: "new-id" } as never);

      await submitResearchOutput({ userId: "user1", title: "Mon résultat", outputType: "report", language: "fr" });

      expect(mockPayloadCreate).toHaveBeenCalledWith(expect.objectContaining({ locale: "en" }));
      expect(mockPayloadUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ id: "new-id", locale: "fr", data: { title: "Mon résultat" } }),
      );
    });

    it("does not issue the second patch for an English submission", async () => {
      mockPayloadCreate.mockResolvedValue({ id: "new-id" } as never);
      await submitResearchOutput({ userId: "user1", title: "My output", outputType: "report", language: "en" });
      expect(mockPayloadUpdate).not.toHaveBeenCalled();
    });

    it("patches an allowed resubmission, setting what was given and nulling what was cleared", async () => {
      mockPayloadQueryRaw.mockResolvedValue({
        id: "ro1",
        submittedBy: "user1",
        moderationStatus: "pending",
        versions: [],
      } as never);

      const result = await submitResearchOutput({
        userId: "user1",
        title: "Updated output",
        outputType: "report",
        language: "en",
        editId: "ro1",
      });

      expect(result).toEqual({ id: "ro1" });
      expect(mockPayloadUpdate).toHaveBeenCalledWith({
        collection: "researchOutputs",
        id: "ro1",
        locale: "en",
        data: {
          title: "Updated output",
          outputType: "report",
          moderationStatus: "pending",
          versions: [],
          excerpt: null,
          region: null,
          themes: null,
          body: null,
          tags: null,
          relatedCommunities: null,
        },
      });
      expect(mockPayloadCreate).not.toHaveBeenCalled();
    });

    it("keeps a kept version row whole, so its Payload id survives the write", async () => {
      mockPayloadQueryRaw.mockResolvedValue({
        id: "ro1",
        submittedBy: "user1",
        moderationStatus: "pending",
        versions: [
          { id: "ro1:versions:v1", kind: "full", lang: "en" },
          { id: "ro1:versions:v2", kind: "summary", lang: "en" },
        ],
      } as never);

      await submitResearchOutput({
        userId: "user1",
        title: "Updated output",
        outputType: "report",
        language: "en",
        editId: "ro1",
        keptVersionKeys: ["v1"],
      });

      const data = mockPayloadUpdate.mock.calls[0][0].data as Record<string, unknown>;
      expect(data.versions).toEqual([{ id: "ro1:versions:v1", _key: "v1", kind: "full", lang: "en" }]);
    });

    it("throws ResearchOutputEditNotAllowedError when the caller may not edit the doc", async () => {
      mockPayloadQueryRaw.mockResolvedValue({
        id: "ro1",
        submittedBy: "someone-else",
        moderationStatus: "pending",
      } as never);
      mockFindFirst.mockResolvedValue(null);

      await expect(
        submitResearchOutput({ userId: "user1", title: "x", outputType: "report", language: "en", editId: "ro1" }),
      ).rejects.toBeInstanceOf(ResearchOutputEditNotAllowedError);
    });

    it("throws (does not degrade) when the write fails", async () => {
      mockPayloadCreate.mockRejectedValue(new Error("Payload write failed"));
      await expect(
        submitResearchOutput({ userId: "user1", title: "x", outputType: "report", language: "en" }),
      ).rejects.toThrow("Payload write failed");
    });
  });

  describe("updateResearchOutput", () => {
    it("patches through the Payload update primitive, naming the collection", async () => {
      await updateResearchOutput("ro1", { title: "New title" });
      expect(mockPayloadUpdate).toHaveBeenCalledWith({
        collection: "researchOutputs",
        id: "ro1",
        data: { title: "New title" },
      });
      expect(mockUpdateDocument).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Algolia index documents — read here, never written
  // -------------------------------------------------------------------------
  describe("agenda search-index docs", () => {
    it("dereferences the file asset on the sync projection", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [payloadAgendaRow()] } as never);
      const [doc] = await getPublishedAgendaIndexDocs();
      expect(doc.files).toEqual([
        {
          downloadCount: 0,
          file: { asset: { originalFilename: "Full RRAA Central and Southern Asia 18-03.pdf", url: "/payload-api/files/file/Full%20RRAA.pdf?prefix=cms%2Ffiles" } },
          language: "en",
        },
      ]);
    });

    it("keeps the webhook projection narrower — language and downloadCount only", async () => {
      mockPayloadQuery.mockResolvedValue(payloadAgendaRow() as never);
      const doc = await getAgendaIndexDocById("a1");
      expect(doc?.files).toEqual([{ downloadCount: 0, language: "en" }]);
    });

    it("carries Sanity's `_updatedAt` through the preserved timestamp", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [payloadAgendaRow()] } as never);
      const [doc] = await getPublishedAgendaIndexDocs();
      expect(doc._updatedAt).toBe("2025-11-13T03:39:37.000Z");
    });

    it("emits `tags: null` — 0/29 agendas carry one, and a tag has no `name` field to project anyway", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [payloadAgendaRow()] } as never);
      const [doc] = await getPublishedAgendaIndexDocs();
      expect(doc.tags).toBeNull();
      expect(doc.organizations).toBeNull();
      expect(doc.regionalCommunities).toEqual([{ name: { en: "Central and Southern Asia Regional Community" } }]);
    });

    it("getAgendaIndexDocsByIds short-circuits an empty id list without a read", async () => {
      await expect(getAgendaIndexDocsByIds([])).resolves.toEqual([]);
      expect(mockPayloadQuery).not.toHaveBeenCalled();
    });

    it("getAgendaIndexDocById returns null when there's no match", async () => {
      mockPayloadQuery.mockResolvedValue(null as never);
      await expect(getAgendaIndexDocById("missing")).resolves.toBeNull();
    });

    it("getAgendaCount counts through the `count` descriptor", async () => {
      mockPayloadQuery.mockResolvedValue(29 as never);
      await expect(getAgendaCount()).resolves.toBe(29);
      expect(mockPayloadQuery).toHaveBeenCalledWith({ type: "count", collection: "agendas" });
    });

    it("throws through when the sync source fails (route keeps its own catch)", async () => {
      mockPayloadQuery.mockRejectedValue(new Error("network error"));
      await expect(getPublishedAgendaIndexDocs()).rejects.toThrow("network error");
    });
  });

  // -------------------------------------------------------------------------
  // Search records — read, never written to the index
  // -------------------------------------------------------------------------
  describe("search records", () => {
    it("maps agenda rows to the same records the Sanity arm produces", async () => {
      mockPayloadQuery.mockResolvedValue({
        docs: [{ id: "a1", title: { en: "My agenda", es: null }, description: null, slug: "my-agenda" }],
      } as never);

      await expect(getAgendaSearchRecords()).resolves.toEqual([
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

    it("maps research-output rows, filtering on approved", async () => {
      mockPayloadQuery.mockResolvedValue({
        docs: [{ id: "ro1", title: { en: "My output" }, excerpt: { en: "Desc" }, slug: "my-output" }],
      } as never);

      await expect(getResearchOutputSearchRecords()).resolves.toEqual([
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

    it("degrades to an empty list when the source fails", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      mockPayloadQuery.mockRejectedValue(new Error("network error"));
      await expect(getAgendaSearchRecords()).resolves.toEqual([]);
      await expect(getResearchOutputSearchRecords()).resolves.toEqual([]);
    });
  });
});
