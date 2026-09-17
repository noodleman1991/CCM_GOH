import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/content/internal/sanity-source", () => ({
  query: vi.fn(),
  queryLive: vi.fn(),
  queryRaw: vi.fn(),
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
}));

// `payload-source`, not the reader. This module holds FIVE `queryLive` sites
// and TWO `queryRaw` ones, and the two primitives return the same shape — so a
// reader that picks the wrong one is invisible to a result-based test. That is
// the exact gap the Phase-1 authorization bypass fell through. Mocking the
// source leaves the real reader running and makes its primitive choice
// observable.
vi.mock("@/lib/content/internal/payload-source", () => ({
  nowMinute: () => "2026-09-17T10:00:00.000Z",
  escapeContains: (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`),
  query: vi.fn(),
  queryPreviewable: vi.fn(),
  queryLive: vi.fn(),
  queryRaw: vi.fn(),
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
}));

import { query, queryLive, queryRaw, createDocument, updateDocument } from "@/lib/content/internal/sanity-source";
import {
  query as payloadQuery,
  queryPreviewable as payloadQueryPreviewable,
  queryLive as payloadQueryLive,
  queryRaw as payloadQueryRaw,
  createDocument as payloadCreateDocument,
  updateDocument as payloadUpdateDocument,
} from "@/lib/content/internal/payload-source";
import {
  getDynamicContent,
  getDiscoveryOptions,
  getForYouCandidates,
  getNewsPostsForBlock,
  getDocSlugs,
  getOutputSummaries,
  getOutputStatuses,
  createWorkspaceOutputDraft,
  resolveCommentTarget,
  getModerationSettings,
  getEvents,
  getEditableEventDoc,
  getEventEditGate,
  submitEvent,
  updateEvent,
  getApprovedEventForRsvp,
  getEventsStartingWithin,
  fetchDynamicCaseStudies,
  fetchDynamicLivedExperiences,
} from "@/lib/content/discovery";

const mockQuery = vi.mocked(query);
const mockQueryLive = vi.mocked(queryLive);
const mockQueryRaw = vi.mocked(queryRaw);
const mockCreateDocument = vi.mocked(createDocument);
const mockUpdateDocument = vi.mocked(updateDocument);

const mockPayloadQuery = vi.mocked(payloadQuery);
const mockPayloadQueryPreviewable = vi.mocked(payloadQueryPreviewable);
const mockPayloadQueryLive = vi.mocked(payloadQueryLive);
const mockPayloadQueryRaw = vi.mocked(payloadQueryRaw);
const mockPayloadCreateDocument = vi.mocked(payloadCreateDocument);
const mockPayloadUpdateDocument = vi.mocked(payloadUpdateDocument);

beforeEach(() => {
  mockQuery.mockReset();
  mockQueryLive.mockReset();
  mockQueryRaw.mockReset();
  mockCreateDocument.mockReset();
  mockUpdateDocument.mockReset();
  mockPayloadQuery.mockReset();
  mockPayloadQueryPreviewable.mockReset();
  mockPayloadQueryLive.mockReset();
  mockPayloadQueryRaw.mockReset();
  mockPayloadCreateDocument.mockReset();
  mockPayloadUpdateDocument.mockReset();
  // The Sanity arm is the default and every test above this line depends on
  // it, so the flag is cleared before each test and set only inside the
  // Payload describe below.
  // Pin the Sanity arm explicitly: these suites assert Sanity behaviour and
  // must not read the ambient CONTENT_BACKEND (184 false failures under
  // `CONTENT_BACKEND=payload` before 2026-09-17). The Payload describes below
  // set the override to "payload" themselves.
  process.env.CONTENT_BACKEND_DISCOVERY = "sanity";
});
afterEach(() => {
  delete process.env.CONTENT_BACKEND_DISCOVERY;
  vi.restoreAllMocks();
});

describe("getDynamicContent", () => {
  it("resolves recognized (kind, mode) pairs via query, forwarding communitySlug/count", async () => {
    mockQuery.mockResolvedValue([{ _id: "n1" }]);
    const result = await getDynamicContent("newsPost", { communitySlug: "oceania", count: 2, mode: "recent" });
    expect(result).toEqual([{ _id: "n1" }]);
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('_type == "newsPost"'), {
      communitySlug: "oceania",
      count: 2,
    });
  });

  it("resolves featured mode with the featured-ordered query", async () => {
    mockQuery.mockResolvedValue([{ _id: "cs1" }]);
    const result = await getDynamicContent("caseStudy", { communitySlug: "oceania", count: 3, mode: "featured" });
    expect(result).toEqual([{ _id: "cs1" }]);
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("order(featured desc"), expect.any(Object));
  });

  it("returns [] for a kind with no dynamic-insert query, without calling query", async () => {
    const result = await getDynamicContent("event", { communitySlug: "oceania", count: 3, mode: "recent" });
    expect(result).toEqual([]);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("returns [] when the query resolves null", async () => {
    mockQuery.mockResolvedValue(null);
    const result = await getDynamicContent("livedExperience", { communitySlug: "s", count: 1, mode: "recent" });
    expect(result).toEqual([]);
  });

  it("propagates a failure rather than degrading (not wrapped in safe — the call sites keep their own try/catch)", async () => {
    mockQuery.mockRejectedValue(new Error("upstream down"));
    await expect(
      getDynamicContent("newsPost", { communitySlug: "s", count: 1, mode: "recent" }),
    ).rejects.toThrow("upstream down");
  });
});

describe("getDiscoveryOptions", () => {
  it("returns regions and tags from two query reads", async () => {
    mockQuery.mockImplementation(async (groq: string) => {
      if (groq.includes("regionalCommunity")) return [{ slug: "oceania", name: { en: "Oceania" } }];
      return [{ value: "climate", label: { en: "Climate" } }];
    });
    const facets = await getDiscoveryOptions();
    expect(facets.regions).toEqual([{ slug: "oceania", name: { en: "Oceania" } }]);
    expect(facets.tags).toEqual([{ value: "climate", label: { en: "Climate" } }]);
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it("degrades regions to [] on failure while tags still populate (independent degrade)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockImplementation(async (groq: string) => {
      if (groq.includes("regionalCommunity")) throw new Error("boom");
      return [{ value: "climate", label: { en: "Climate" } }];
    });
    const facets = await getDiscoveryOptions();
    expect(facets.regions).toEqual([]);
    expect(facets.tags).toEqual([{ value: "climate", label: { en: "Climate" } }]);
  });

  it("degrades tags to [] on failure while regions still populate", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockImplementation(async (groq: string) => {
      if (groq.includes("regionalCommunity")) return [{ slug: "oceania", name: { en: "Oceania" } }];
      throw new Error("boom");
    });
    const facets = await getDiscoveryOptions();
    expect(facets.regions).toEqual([{ slug: "oceania", name: { en: "Oceania" } }]);
    expect(facets.tags).toEqual([]);
  });
});

describe("getForYouCandidates", () => {
  it("forwards the region/theme filters and limit as GROQ params", async () => {
    mockQuery.mockResolvedValue([{ _id: "cs1", _type: "caseStudy", title: "T", slug: "t", region: "oce", rcSlug: null, tagSlugs: null }]);
    const rows = await getForYouCandidates({
      regionCodes: ["oce"],
      regionSlugs: ["oceania"],
      themeSlugs: ["climate"],
      limit: 6,
    });
    expect(rows).toHaveLength(1);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('_type in ["caseStudy", "livedExperience", "newsPost"]'),
      { regionCodes: ["oce"], regionSlugs: ["oceania"], themeSlugs: ["climate"], limit: 6 },
    );
  });

  it("propagates a failure (the one call site keeps its own try/catch)", async () => {
    mockQuery.mockRejectedValue(new Error("down"));
    await expect(
      getForYouCandidates({ regionCodes: [], regionSlugs: [], themeSlugs: [], limit: 6 }),
    ).rejects.toThrow("down");
  });
});

describe("getNewsPostsForBlock", () => {
  it("manual mode returns [] without querying when there are no ids", async () => {
    const result = await getNewsPostsForBlock("manual", 6, []);
    expect(result).toEqual([]);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("manual mode fetches the given ids", async () => {
    mockQuery.mockResolvedValue([{ _id: "n1" }]);
    const result = await getNewsPostsForBlock("manual", 6, ["n1"]);
    expect(result).toEqual([{ _id: "n1" }]);
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("_id in $ids"), { ids: ["n1"] });
  });

  it("featured mode returns only featured posts when there are enough", async () => {
    mockQuery.mockResolvedValueOnce([{ _id: "f1" }, { _id: "f2" }, { _id: "f3" }]);
    const result = await getNewsPostsForBlock("featured", 2);
    expect(result).toEqual([{ _id: "f1" }, { _id: "f2" }]);
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it("featured mode fills the remaining quota with recent posts", async () => {
    mockQuery.mockResolvedValueOnce([{ _id: "f1" }]); // 1 featured, need 2 more
    mockQuery.mockResolvedValueOnce([{ _id: "r1" }, { _id: "r2" }]);
    const result = await getNewsPostsForBlock("featured", 3);
    expect(result).toEqual([{ _id: "f1" }, { _id: "r1" }, { _id: "r2" }]);
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it("recent mode fetches only recent posts", async () => {
    mockQuery.mockResolvedValue([{ _id: "r1" }]);
    const result = await getNewsPostsForBlock("recent", 6);
    expect(result).toEqual([{ _id: "r1" }]);
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("order(publishedAt desc)"));
  });
});

describe("getDocSlugs", () => {
  it("queries slugs for the given ids", async () => {
    mockQuery.mockResolvedValue([{ _id: "cs1", slug: "the-slug" }]);
    const result = await getDocSlugs(["cs1"]);
    expect(result).toEqual([{ _id: "cs1", slug: "the-slug" }]);
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("_id in $ids"), { ids: ["cs1"] });
  });
});

describe("getOutputSummaries", () => {
  it("queries title/status/slug for the given ids via query (display-only enrichment)", async () => {
    mockQuery.mockResolvedValue([{ _id: "cs1", title: "T", status: "approved", slug: "t" }]);
    const result = await getOutputSummaries(["cs1"]);
    expect(result).toEqual([{ _id: "cs1", title: "T", status: "approved", slug: "t" }]);
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('"slug": slug.current'), { ids: ["cs1"] });
    expect(mockQueryRaw).not.toHaveBeenCalled();
  });
});

describe("getOutputStatuses", () => {
  it("queries title/status for the given ids via queryLive (feeds a Prisma write)", async () => {
    mockQueryLive.mockResolvedValue([{ _id: "cs1", title: "T", status: "approved" }]);
    const result = await getOutputStatuses(["cs1"]);
    expect(result).toEqual([{ _id: "cs1", title: "T", status: "approved" }]);
    expect(mockQueryLive).toHaveBeenCalledWith(expect.any(String), { ids: ["cs1"] });
    expect(mockQuery).not.toHaveBeenCalled();
  });

  // Pins the fix for a regression: the original (lib/collaboration/service.ts's
  // refreshOutputStatuses, per `git show 87ef869bc`) called `client.fetch`
  // directly — published perspective. `queryRaw` fixes the caching half but
  // switches to the raw perspective, which would let a still-unpublished
  // draft's title/status leak into Postgres. Must be queryLive, not queryRaw.
  it("uses queryLive, not queryRaw or query", async () => {
    mockQueryLive.mockResolvedValue([]);
    await getOutputStatuses(["cs1"]);
    expect(mockQueryLive).toHaveBeenCalledTimes(1);
    expect(mockQueryRaw).not.toHaveBeenCalled();
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

describe("createWorkspaceOutputDraft", () => {
  it("creates a pending draft doc with a drafts.-prefixed id", async () => {
    mockCreateDocument.mockResolvedValue({ id: "drafts.abc" });
    const result = await createWorkspaceOutputDraft("caseStudy", "My title");
    expect(result).toEqual({ id: "drafts.abc" });
    expect(mockCreateDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        _type: "caseStudy",
        title: { en: "My title" },
        status: "pending",
      }),
    );
    const doc = mockCreateDocument.mock.calls[0][0] as { _id: string };
    expect(doc._id).toMatch(/^drafts\./);
  });
});

describe("resolveCommentTarget", () => {
  it("returns null for a non-Sanity-backed type without calling queryLive", async () => {
    const result = await resolveCommentTarget("collaborationThread", "t1");
    expect(result).toBeNull();
    expect(mockQueryLive).not.toHaveBeenCalled();
  });

  it("returns the target when the predicate count is > 0", async () => {
    mockQueryLive.mockResolvedValue(1);
    const result = await resolveCommentTarget("researchOutput", "ro1");
    expect(result).toEqual({ type: "researchOutput", id: "ro1" });
    expect(mockQueryLive).toHaveBeenCalledWith(
      expect.stringContaining('_type == "researchOutput" && status == "approved"'),
      { id: "ro1" },
    );
  });

  it("returns null when the predicate count is 0", async () => {
    mockQueryLive.mockResolvedValue(0);
    expect(await resolveCommentTarget("caseStudy", "missing")).toBeNull();
  });

  it("degrades to null on a queryLive failure", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQueryLive.mockRejectedValue(new Error("boom"));
    expect(await resolveCommentTarget("newsPost", "n1")).toBeNull();
  });

  it("uses queryLive, not query or queryRaw — this is a write-time authorization gate against a client-supplied id, so it must be both live (no cache) and published-only (raw would let a drafts.-prefixed id validate an unapproved document)", async () => {
    mockQueryLive.mockResolvedValue(1);
    await resolveCommentTarget("caseStudy", "cs1");
    expect(mockQueryLive).toHaveBeenCalledTimes(1);
    expect(mockQuery).not.toHaveBeenCalled();
    expect(mockQueryRaw).not.toHaveBeenCalled();
  });
});

describe("getModerationSettings", () => {
  it("returns the fetched settings, guarding non-array wordlists", async () => {
    mockQueryLive.mockResolvedValue({ enabled: false, blockTerms: ["x"], reviewTerms: null });
    const settings = await getModerationSettings();
    expect(settings).toEqual({ enabled: false, blockTerms: ["x"], reviewTerms: [] });
  });

  it("returns the default (enabled, empty lists) when the doc is missing", async () => {
    mockQueryLive.mockResolvedValue(null);
    expect(await getModerationSettings()).toEqual({ enabled: true, blockTerms: [], reviewTerms: [] });
  });

  it("fails open to the default on a query failure", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQueryLive.mockRejectedValue(new Error("boom"));
    expect(await getModerationSettings()).toEqual({ enabled: true, blockTerms: [], reviewTerms: [] });
  });

  it("uses queryLive, not query — the original was a bare client.fetch with no next.revalidate; query()'s hour-long cache would sit on top of the comment gate's own 60s in-process TTL", async () => {
    mockQueryLive.mockResolvedValue(null);
    await getModerationSettings();
    expect(mockQueryLive).toHaveBeenCalledTimes(1);
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

describe("getEvents", () => {
  it("list mode queries approved events with the default limit", async () => {
    mockQuery.mockResolvedValue([{ _id: "e1" }]);
    const result = await getEvents();
    expect(result).toEqual([{ _id: "e1" }]);
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('status == "approved"'), { limit: 50 });
  });

  it("list mode forwards a custom limit", async () => {
    mockQuery.mockResolvedValue([]);
    await getEvents({ limit: 12 });
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), { limit: 12 });
  });

  it("slug mode returns a single-item array when found", async () => {
    mockQuery.mockResolvedValue({ _id: "e1", slug: "my-event" });
    const result = await getEvents({ slug: "my-event" });
    expect(result).toEqual([{ _id: "e1", slug: "my-event" }]);
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("slug.current == $slug"), { slug: "my-event" });
  });

  it("slug mode returns [] when not found", async () => {
    mockQuery.mockResolvedValue(null);
    expect(await getEvents({ slug: "missing" })).toEqual([]);
  });

  it("propagates a failure rather than degrading (originals called client.fetch with no try/catch)", async () => {
    mockQuery.mockRejectedValue(new Error("down"));
    await expect(getEvents()).rejects.toThrow("down");
  });
});

describe("getEditableEventDoc", () => {
  it("uses queryRaw with the drafts-id fallback projection", async () => {
    mockQueryRaw.mockResolvedValue({ _id: "e1", status: "pending" });
    const result = await getEditableEventDoc("e1");
    expect(result).toEqual({ _id: "e1", status: "pending" });
    expect(mockQueryRaw).toHaveBeenCalledWith(expect.stringContaining('_id == "drafts." + $id'), { id: "e1" });
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("propagates a failure — gated drafts-visible reads throw, like the write paths", async () => {
    mockQueryRaw.mockRejectedValue(new Error("down"));
    await expect(getEditableEventDoc("e1")).rejects.toThrow("down");
  });
});

describe("getEventEditGate", () => {
  it("uses queryRaw with the minimal existence+ownership projection", async () => {
    mockQueryRaw.mockResolvedValue({ _id: "e1", submittedBy: "u1", status: "pending" });
    const result = await getEventEditGate("e1");
    expect(result).toEqual({ _id: "e1", submittedBy: "u1", status: "pending" });
    expect(mockQueryRaw).toHaveBeenCalledWith(
      `*[_type == "event" && _id == $id][0]{ _id, submittedBy, status }`,
      { id: "e1" },
    );
  });
});

describe("submitEvent", () => {
  it("creates a pending doc with a generated slug", async () => {
    mockCreateDocument.mockResolvedValue({ id: "new-event" });
    const result = await submitEvent({
      submittedBy: "u1",
      title: "Community Meetup",
      description: null,
      scope: "community",
      startAt: "2026-09-10T10:00:00Z",
      endAt: null,
      mode: "online",
      locationName: null,
      url: null,
      linkedProject: null,
    });
    expect(result).toEqual({ id: "new-event" });
    expect(mockCreateDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        _type: "event",
        status: "pending",
        submittedBy: "u1",
        title: "Community Meetup",
        slug: { _type: "slug", current: expect.stringContaining("community-meetup") },
      }),
    );
  });

  it("only sets relatedCommunity/relatedCollaboration when provided", async () => {
    mockCreateDocument.mockResolvedValue({ id: "new-event" });
    await submitEvent({
      submittedBy: "u1",
      title: "Project Sync",
      description: null,
      scope: "project",
      startAt: "2026-09-10T10:00:00Z",
      endAt: null,
      mode: "online",
      locationName: null,
      url: null,
      linkedProject: "proj-1",
      regionalCommunityId: "rc1",
      relatedCollaboration: "collab1",
    });
    const doc = mockCreateDocument.mock.calls[0][0] as Record<string, unknown>;
    expect(doc.relatedCommunity).toEqual({ _type: "reference", _ref: "rc1" });
    expect(doc.relatedCollaboration).toBe("collab1");
    expect(doc.linkedProject).toBe("proj-1");
  });

  it("clears linkedProject when scope is not project", async () => {
    mockCreateDocument.mockResolvedValue({ id: "new-event" });
    await submitEvent({
      submittedBy: "u1",
      title: "Community Meetup",
      description: null,
      scope: "community",
      startAt: "2026-09-10T10:00:00Z",
      endAt: null,
      mode: "online",
      locationName: null,
      url: null,
      linkedProject: "proj-1",
    });
    const doc = mockCreateDocument.mock.calls[0][0] as Record<string, unknown>;
    expect(doc.linkedProject).toBeUndefined();
  });
});

describe("updateEvent", () => {
  it("forces status to pending and unsets blank optional fields", async () => {
    mockUpdateDocument.mockResolvedValue(undefined);
    await updateEvent("e1", {
      title: "Updated title",
      description: null,
      scope: "community",
      startAt: "2026-09-10T10:00:00Z",
      endAt: null,
      mode: "online",
      locationName: null,
      url: null,
      linkedProject: null,
    });
    expect(mockUpdateDocument).toHaveBeenCalledWith(
      "e1",
      expect.objectContaining({
        status: "pending",
        title: "Updated title",
        description: null,
        endAt: null,
        locationName: null,
        url: null,
        linkedProject: null,
      }),
    );
  });

  it("never clears relatedCommunity/relatedCollaboration when omitted, but sets them when provided", async () => {
    mockUpdateDocument.mockResolvedValue(undefined);
    await updateEvent("e1", { title: "T", scope: "community" });
    let data = mockUpdateDocument.mock.calls[0][1] as Record<string, unknown>;
    expect("relatedCommunity" in data).toBe(false);
    expect("relatedCollaboration" in data).toBe(false);

    mockUpdateDocument.mockClear();
    await updateEvent("e1", { title: "T", scope: "community", regionalCommunityId: "rc1", relatedCollaboration: "c1" });
    data = mockUpdateDocument.mock.calls[0][1] as Record<string, unknown>;
    expect(data.relatedCommunity).toEqual({ _type: "reference", _ref: "rc1" });
    expect(data.relatedCollaboration).toBe("c1");
  });
});

describe("getApprovedEventForRsvp", () => {
  it("uses queryLive — the read feeds the RSVP write", async () => {
    mockQueryLive.mockResolvedValue({ _id: "e1", title: "T", startAt: null, slug: "t", submittedBy: "u1" });
    const result = await getApprovedEventForRsvp("e1");
    expect(result).toEqual({ _id: "e1", title: "T", startAt: null, slug: "t", submittedBy: "u1" });
    expect(mockQueryLive).toHaveBeenCalledWith(expect.stringContaining('status == "approved"'), { id: "e1" });
    expect(mockQuery).not.toHaveBeenCalled();
  });

  // Pins the fix for a regression: `eventId` is client-supplied (setRsvp
  // takes it straight from the caller). The original (lib/actions/rsvp.ts,
  // per `git show 87ef869bc`) called `client.fetch` directly — published
  // perspective. `queryRaw`'s raw perspective would let a `drafts.`-prefixed
  // id match an unpublished event whose draft says status: "approved" — the
  // same authorization-bypass shape already fixed in resolveCommentTarget.
  // Must be queryLive, not queryRaw.
  it("uses queryLive, not queryRaw or query", async () => {
    mockQueryLive.mockResolvedValue(null);
    await getApprovedEventForRsvp("e1");
    expect(mockQueryLive).toHaveBeenCalledTimes(1);
    expect(mockQueryRaw).not.toHaveBeenCalled();
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

describe("getEventsStartingWithin", () => {
  it("uses queryLive with the now/end window — feeds the reminder notification write", async () => {
    mockQueryLive.mockResolvedValue([{ _id: "e1", title: "T" }]);
    const result = await getEventsStartingWithin("2026-09-01T00:00:00Z", "2026-09-02T00:00:00Z");
    expect(result).toEqual([{ _id: "e1", title: "T" }]);
    expect(mockQueryLive).toHaveBeenCalledWith(expect.stringContaining("dateTime(startAt)"), {
      now: "2026-09-01T00:00:00Z",
      end: "2026-09-02T00:00:00Z",
    });
    expect(mockQuery).not.toHaveBeenCalled();
  });

  // Pins the fix for a regression: the original (lib/events.ts, per
  // `git show 87ef869bc`) called `client.fetch` directly — published
  // perspective, never cached. `queryRaw` would fix the caching but flip to
  // the raw perspective, surfacing unpublished drafts into the reminder
  // fan-out. Must be queryLive, not queryRaw.
  it("uses queryLive, not queryRaw or query", async () => {
    mockQueryLive.mockResolvedValue([]);
    await getEventsStartingWithin("2026-09-01T00:00:00Z", "2026-09-02T00:00:00Z");
    expect(mockQueryLive).toHaveBeenCalledTimes(1);
    expect(mockQueryRaw).not.toHaveBeenCalled();
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

describe("fetchDynamicCaseStudies", () => {
  it("dynamic-featured: returns featured items alone when there are enough", async () => {
    mockQuery.mockResolvedValueOnce([{ _id: "cs1" }, { _id: "cs2" }]);
    const result = await fetchDynamicCaseStudies({ regionalCommunityId: "rc1", maxItems: 2 });
    expect(result).toEqual([{ _id: "cs1" }, { _id: "cs2" }]);
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it("dynamic-featured: fills the remaining quota from recent non-featured items", async () => {
    mockQuery.mockResolvedValueOnce([{ _id: "cs1" }]);
    mockQuery.mockResolvedValueOnce([{ _id: "cs2" }, { _id: "cs3" }]);
    const result = await fetchDynamicCaseStudies({ regionalCommunityId: "rc1", maxItems: 3 });
    expect(result).toEqual([{ _id: "cs1" }, { _id: "cs2" }, { _id: "cs3" }]);
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it("dynamic-recent: queries recent case studies directly", async () => {
    mockQuery.mockResolvedValueOnce([{ _id: "cs1" }]);
    const result = await fetchDynamicCaseStudies({ regionalCommunityId: "rc1", mode: "dynamic-recent", maxItems: 6 });
    expect(result).toEqual([{ _id: "cs1" }]);
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it("catches a failure and returns []", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValue(new Error("boom"));
    expect(await fetchDynamicCaseStudies({ regionalCommunityId: "rc1" })).toEqual([]);
  });
});

describe("fetchDynamicLivedExperiences", () => {
  it("dynamic-featured: fills the remaining quota from recent non-featured items", async () => {
    mockQuery.mockResolvedValueOnce([{ _id: "le1" }]);
    mockQuery.mockResolvedValueOnce([{ _id: "le2" }]);
    const result = await fetchDynamicLivedExperiences({ regionalCommunityId: "rc1", maxItems: 2 });
    expect(result).toEqual([{ _id: "le1" }, { _id: "le2" }]);
  });

  it("dynamic-recent: queries recent lived experiences directly", async () => {
    mockQuery.mockResolvedValueOnce([{ _id: "le1" }]);
    const result = await fetchDynamicLivedExperiences({ regionalCommunityId: "rc1", mode: "dynamic-recent" });
    expect(result).toEqual([{ _id: "le1" }]);
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it("catches a failure and returns []", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValue(new Error("boom"));
    expect(await fetchDynamicLivedExperiences({ regionalCommunityId: "rc1" })).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// The Payload arm
//
// Nothing above this line was edited except the shared mock/reset block: the
// tests above are the Sanity contract and they are what BOTH backends have to
// satisfy. Everything below sets `CONTENT_BACKEND_DISCOVERY=payload`, mocks
// `payload-source` rather than the reader, and asserts the same contract plus
// the four things only the primitive choice, the union's membership, the
// `moderationStatus` rename or the ordering can show.
// ---------------------------------------------------------------------------

/** A `find` result, as `payload-source` hands one back. */
const docs = (...rows: Record<string, unknown>[]) => ({ docs: rows });

/** The descriptor for one `find` on a named collection, whichever call it was. */
function descriptorFor(
  mock: { mock: { calls: unknown[][] } },
  collection: string,
): Record<string, unknown> | undefined {
  return mock.mock.calls
    .map((call) => call[0] as Record<string, unknown>)
    .find((d) => d?.collection === collection);
}

/** Every collection a mock was asked about, in call order. */
function collectionsOf(mock: { mock: { calls: unknown[][] } }): string[] {
  return mock.mock.calls.map((call) => (call[0] as { collection?: string })?.collection ?? "");
}

describe("discovery, answered by Payload", () => {
  beforeEach(() => {
    process.env.CONTENT_BACKEND_DISCOVERY = "payload";
  });

  // -------------------------------------------------------------------------
  // The primitive, not just the result
  //
  // Five `queryLive` sites and two `queryRaw` ones. `queryLive` is live AND
  // published-only; `queryRaw` sees every version. Swapping one for the other
  // is invisible to a result-based test and is how the Phase-1 bypass
  // happened, so each site is pinned by descriptor.
  // -------------------------------------------------------------------------
  describe("the primitive, not just the result", () => {
    it("queryLive site 1/5 — getOutputStatuses: a read that REFRESHES Postgres and fires notifications, so live but never drafts", async () => {
      mockPayloadQueryLive.mockResolvedValue(docs() as never);
      await getOutputStatuses(["cs1"]);
      expect(collectionsOf(mockPayloadQueryLive).sort()).toEqual([
        "caseStudies",
        "events",
        "livedExperiences",
        "researchOutputs",
      ]);
      expect(mockPayloadQuery).not.toHaveBeenCalled();
      expect(mockPayloadQueryRaw).not.toHaveBeenCalled();
      expect(mockQueryLive).not.toHaveBeenCalled();
    });

    it("its sibling getOutputSummaries stays on `query` — display-only enrichment, and the two must not be conflated", async () => {
      mockPayloadQuery.mockResolvedValue(docs() as never);
      await getOutputSummaries(["cs1"]);
      expect(mockPayloadQuery).toHaveBeenCalled();
      expect(mockPayloadQueryLive).not.toHaveBeenCalled();
      expect(mockPayloadQueryRaw).not.toHaveBeenCalled();
    });

    it("queryLive site 2/5 — resolveCommentTarget: a write-time authorization gate against a client-supplied id", async () => {
      mockPayloadQueryLive.mockResolvedValue(1 as never);
      const target = await resolveCommentTarget("caseStudy", "cs1");
      expect(target).toEqual({ type: "caseStudy", id: "cs1" });
      expect(mockPayloadQueryLive).toHaveBeenCalledWith({
        type: "count",
        collection: "caseStudies",
        where: { and: [{ moderationStatus: { equals: "approved" } }, { id: { equals: "cs1" } }] },
      });
      // `queryRaw` here would let a `drafts.`-prefixed id validate against a
      // draft that says approved; `query` would keep a withdrawn document
      // valid for up to an hour.
      expect(mockPayloadQueryRaw).not.toHaveBeenCalled();
      expect(mockPayloadQuery).not.toHaveBeenCalled();
    });

    it("queryLive site 3/5 — getModerationSettings: the comment gate's wordlist, read fresh", async () => {
      mockPayloadQueryLive.mockResolvedValue(null as never);
      await getModerationSettings();
      expect(mockPayloadQueryLive).toHaveBeenCalledWith({
        type: "global",
        slug: "moderationSettings",
        locale: "all",
      });
      expect(mockPayloadQuery).not.toHaveBeenCalled();
    });

    it("queryLive site 4/5 — getApprovedEventForRsvp: a read feeding the RSVP write, on a client-supplied id", async () => {
      mockPayloadQueryLive.mockResolvedValue(docs() as never);
      await getApprovedEventForRsvp("e1");
      expect(mockPayloadQueryLive).toHaveBeenCalledWith(
        expect.objectContaining({ type: "find", collection: "events" }),
      );
      expect(mockPayloadQueryRaw).not.toHaveBeenCalled();
      expect(mockPayloadQuery).not.toHaveBeenCalled();
    });

    it("queryLive site 5/5 — getEventsStartingWithin: the reminder cron's fan-out must not see unapproved drafts", async () => {
      mockPayloadQueryLive.mockResolvedValue(docs() as never);
      await getEventsStartingWithin("2026-09-01T00:00:00Z", "2026-09-02T00:00:00Z");
      expect(mockPayloadQueryLive).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "find",
          collection: "events",
          where: {
            and: [
              { moderationStatus: { equals: "approved" } },
              {
                and: [
                  { startAt: { greater_than: "2026-09-01T00:00:00Z" } },
                  { startAt: { less_than: "2026-09-02T00:00:00Z" } },
                ],
              },
            ],
          },
        }),
      );
      expect(mockPayloadQueryRaw).not.toHaveBeenCalled();
      expect(mockPayloadQuery).not.toHaveBeenCalled();
    });

    it("queryRaw site 1/2 — getEditableEventDoc: edit mode is exactly about reopening a draft, so this one MUST see them", async () => {
      mockPayloadQueryRaw.mockResolvedValue(null as never);
      await getEditableEventDoc("drafts.e1");
      expect(mockPayloadQueryRaw).toHaveBeenCalledWith(
        expect.objectContaining({ type: "findByID", collection: "events", id: "e1" }),
      );
      expect(mockPayloadQueryLive).not.toHaveBeenCalled();
      expect(mockPayloadQuery).not.toHaveBeenCalled();
    });

    it("queryRaw site 2/2 — getEventEditGate: the ownership gate feeding the updateEvent write, no drafts-id fallback", async () => {
      mockPayloadQueryRaw.mockResolvedValue(docs() as never);
      await getEventEditGate("e1");
      expect(mockPayloadQueryRaw).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "find",
          collection: "events",
          where: { id: { equals: "e1" } },
        }),
      );
      expect(mockPayloadQueryLive).not.toHaveBeenCalled();
      expect(mockPayloadQuery).not.toHaveBeenCalled();
    });

    it("every public read goes through `query`, and never through a live or raw one", async () => {
      mockPayloadQuery.mockResolvedValue(docs() as never);
      await getDynamicContent("newsPost", { communitySlug: "oceania", count: 3, mode: "recent" });
      await getDiscoveryOptions();
      await getForYouCandidates({ regionCodes: ["oce"], regionSlugs: [], themeSlugs: [], limit: 6 });
      await getNewsPostsForBlock("recent", 6);
      await getDocSlugs(["cs1"]);
      await getEvents();
      await fetchDynamicCaseStudies({ regionalCommunityId: "rc1" });
      await fetchDynamicLivedExperiences({ regionalCommunityId: "rc1" });

      expect(mockPayloadQuery).toHaveBeenCalled();
      expect(mockPayloadQueryLive).not.toHaveBeenCalled();
      expect(mockPayloadQueryRaw).not.toHaveBeenCalled();
      expect(mockPayloadQueryPreviewable).not.toHaveBeenCalled();
      // And the Sanity source is never touched once the flag is set.
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // The cross-type union
  // -------------------------------------------------------------------------
  describe("the 'For You' union", () => {
    it("asks three collections, and gives livedExperiences the STRICT approved filter — reproducing the zero it returns today", async () => {
      mockPayloadQuery.mockResolvedValue(docs() as never);
      await getForYouCandidates({
        regionCodes: ["oce"],
        regionSlugs: ["oceania"],
        themeSlugs: ["climate-change"],
        limit: 6,
      });
      expect(collectionsOf(mockPayloadQuery).sort()).toEqual([
        "caseStudies",
        "livedExperiences",
        "newsPosts",
      ]);

      const le = descriptorFor(mockPayloadQuery, "livedExperiences")!;
      const clauses = (le.where as { and: unknown[] }).and;
      // Strict approved, NOT the exists-or-approved disjunction that
      // `publishedAndApproved` would apply — using that here would admit all
      // 35 published lived experiences into a surface that has never shown one.
      expect(clauses).toContainEqual({ moderationStatus: { equals: "approved" } });
      expect(JSON.stringify(clauses)).not.toContain('"moderationStatus":{"exists":false}');
    });

    it("gives newsPosts NO moderation clause at all — the collection has no such field, which is why all four match", async () => {
      mockPayloadQuery.mockResolvedValue(docs() as never);
      await getForYouCandidates({ regionCodes: [], regionSlugs: [], themeSlugs: ["t"], limit: 6 });
      const news = descriptorFor(mockPayloadQuery, "newsPosts")!;
      expect(JSON.stringify(news.where)).not.toContain("moderationStatus");
      expect((news.where as { and: unknown[] }).and).toContainEqual({ slug: { exists: true } });
    });

    it("never filters a lived experience by `region` — it holds a community REFERENCE there, so the Sanity clause can never match", async () => {
      mockPayloadQuery.mockResolvedValue(docs() as never);
      await getForYouCandidates({ regionCodes: ["oce"], regionSlugs: [], themeSlugs: [], limit: 6 });
      // With only a region-code filter, the lived-experience arm has nothing
      // left to match on, so it is not queried at all.
      expect(collectionsOf(mockPayloadQuery)).not.toContain("livedExperiences");
      expect(JSON.stringify(descriptorFor(mockPayloadQuery, "caseStudies"))).toContain('"region"');
    });

    it("drops a region code outside the fixed seven — a Postgres enum THROWS on one where GROQ merely fails to match", async () => {
      mockPayloadQuery.mockResolvedValue(docs() as never);
      await getForYouCandidates({ regionCodes: ["oce", "esa"], regionSlugs: [], themeSlugs: [], limit: 6 });
      const cs = descriptorFor(mockPayloadQuery, "caseStudies")!;
      expect(JSON.stringify(cs.where)).toContain('"oce"');
      expect(JSON.stringify(cs.where)).not.toContain('"esa"');
    });

    it("merges the three arms and orders them as ONE list — date desc, then _id asc", async () => {
      mockPayloadQuery.mockImplementation(async (descriptor: unknown) => {
        const { collection } = descriptor as { collection: string };
        if (collection === "caseStudies") {
          return docs(
            { id: "case-study-20", slug: "b", title: { en: "B" }, publishedAt: "2024-01-01T00:00:00.000Z" },
            { id: "case-study-2", slug: "a", title: { en: "A" }, publishedAt: "2024-01-01T00:00:00.000Z" },
          ) as never;
        }
        if (collection === "newsPosts") {
          return docs(
            { id: "news-old", slug: "old", title: { en: "Old" }, publishedAt: "2023-01-01T00:00:00.000Z" },
            { id: "news-new", slug: "new", title: { en: "New" }, publishedAt: "2025-01-01T00:00:00.000Z" },
          ) as never;
        }
        return docs() as never;
      });
      const rows = await getForYouCandidates({
        regionCodes: [],
        regionSlugs: [],
        themeSlugs: ["t"],
        limit: 10,
      });
      // Not three concatenated per-type lists: the news post from 2025 leads,
      // the two tied case studies follow in `_id` ascending order, and the
      // 2023 news post sorts last.
      expect(rows.map((r) => r._id)).toEqual([
        "news-new",
        "case-study-2",
        "case-study-20",
        "news-old",
      ]);
      expect(rows.map((r) => r._type)).toEqual(["newsPost", "caseStudy", "caseStudy", "newsPost"]);
    });

    it("projects the seven keys in GROQ's alphabetical order, with null for what is unset", async () => {
      mockPayloadQuery.mockImplementation(async (descriptor: unknown) =>
        (descriptor as { collection: string }).collection === "newsPosts"
          ? (docs({
              id: "n1",
              slug: "the-slug",
              title: { en: "T", es: null, fr: null, ar: null },
              region: null,
              relatedCommunity: null,
              tags: [],
              publishedAt: "2024-01-01T00:00:00.000Z",
            }) as never)
          : (docs() as never),
      );
      const [row] = await getForYouCandidates({
        regionCodes: [],
        regionSlugs: [],
        themeSlugs: ["t"],
        limit: 6,
      });
      expect(Object.keys(row)).toEqual([
        "_id",
        "_type",
        "rcSlug",
        "region",
        "slug",
        "tagSlugs",
        "title",
      ]);
      expect(row).toEqual({
        _id: "n1",
        _type: "newsPost",
        rcSlug: null,
        region: null,
        slug: "the-slug",
        tagSlugs: null,
        title: "T",
      });
    });
  });

  // -------------------------------------------------------------------------
  // status -> moderationStatus, both directions
  // -------------------------------------------------------------------------
  describe("moderationStatus, in both directions", () => {
    it("every event read filters on `moderationStatus`, strictly approved — never a publish-state-only clause, never exists-or-approved", async () => {
      mockPayloadQuery.mockResolvedValue(docs() as never);
      mockPayloadQueryLive.mockResolvedValue(docs() as never);
      await getEvents();
      await getEvents({ slug: "s" });
      await getApprovedEventForRsvp("e1");
      await getEventsStartingWithin("a", "b");
      mockPayloadQueryLive.mockResolvedValue(0 as never);
      await resolveCommentTarget("event", "e1");

      const descriptors = [...mockPayloadQuery.mock.calls, ...mockPayloadQueryLive.mock.calls].map(
        (call) => JSON.stringify((call[0] as unknown as Record<string, unknown>).where),
      );
      expect(descriptors).toHaveLength(5);
      for (const where of descriptors) {
        expect(where).toContain('"moderationStatus":{"equals":"approved"}');
        expect(where).not.toContain('"status"' + ":");
        expect(where).not.toContain("exists");
      }
    });

    it("submitEvent writes `moderationStatus`, never a `status` key Payload would silently drop", async () => {
      mockPayloadCreateDocument.mockResolvedValue({ id: "new" } as never);
      await submitEvent({
        submittedBy: "u1",
        title: "Community Meetup",
        description: null,
        scope: "community",
        startAt: "2026-09-10T10:00:00Z",
        endAt: null,
        mode: "online",
        locationName: null,
        url: null,
        linkedProject: null,
        regionalCommunityId: "rc1",
      });
      const call = mockPayloadCreateDocument.mock.calls[0][0] as {
        collection: string;
        locale: string;
        data: Record<string, unknown>;
      };
      expect(call.collection).toBe("events");
      expect(call.locale).toBe("en");
      expect(call.data.moderationStatus).toBe("pending");
      expect("status" in call.data).toBe(false);
      expect(call.data.submittedBy).toBe("u1");
      expect(call.data.slug).toContain("community-meetup");
      // A plain id, not a `drafts.`-prefixed one: Payload has no such spelling.
      expect(String(call.data.id)).not.toMatch(/^drafts\./);
      // A relationship is an id, not a `{_type:"reference"}` object.
      expect(call.data.relatedCommunity).toBe("rc1");
      expect(mockCreateDocument).not.toHaveBeenCalled();
    });

    it("updateEvent returns the document to pending under the Payload name, and clears the blanks", async () => {
      mockPayloadUpdateDocument.mockResolvedValue(undefined as never);
      await updateEvent("e1", {
        title: "Updated",
        description: null,
        scope: "community",
        startAt: "2026-09-10T10:00:00Z",
        endAt: null,
        mode: "online",
        locationName: null,
        url: null,
        linkedProject: null,
      });
      const call = mockPayloadUpdateDocument.mock.calls[0][0] as {
        collection: string;
        id: string;
        data: Record<string, unknown>;
      };
      expect(call).toMatchObject({ collection: "events", id: "e1" });
      expect(call.data.moderationStatus).toBe("pending");
      expect("status" in call.data).toBe(false);
      expect(call.data).toMatchObject({ title: "Updated", description: null, endAt: null, url: null });
      expect("relatedCommunity" in call.data).toBe(false);
    });

    it("createWorkspaceOutputDraft creates an unpublished row with `moderationStatus`, in the mapped collection", async () => {
      mockPayloadCreateDocument.mockResolvedValue({ id: "abc" } as never);
      await createWorkspaceOutputDraft("livedExperience", "My title");
      const call = mockPayloadCreateDocument.mock.calls[0][0] as {
        collection: string;
        draft: boolean;
        locale: string;
        data: Record<string, unknown>;
      };
      expect(call.collection).toBe("livedExperiences");
      expect(call.draft).toBe(true);
      expect(call.locale).toBe("en");
      expect(call.data.moderationStatus).toBe("pending");
      expect("status" in call.data).toBe(false);
      expect(call.data.title).toBe("My title");
      expect(String(call.data.id)).not.toMatch(/^drafts\./);
      expect(call.data.slug).toBeTruthy();
    });

    it("refuses an output type it has no collection for, rather than writing nowhere", async () => {
      await expect(createWorkspaceOutputDraft("report", "T")).rejects.toThrow(/no payload collection/i);
      expect(mockPayloadCreateDocument).not.toHaveBeenCalled();
    });

    it("reads a workspace output's `status` back OUT of `moderationStatus`", async () => {
      mockPayloadQuery.mockImplementation(async (descriptor: unknown) =>
        (descriptor as { collection: string }).collection === "caseStudies"
          ? (docs({ id: "cs1", slug: "s", title: { en: "T" }, moderationStatus: "pending" }) as never)
          : (docs() as never),
      );
      expect(await getOutputSummaries(["drafts.cs1"])).toEqual([
        { _id: "cs1", slug: "s", status: "pending", title: "T" },
      ]);
      // The `drafts.` prefix is stripped, because Payload has no such id.
      expect(descriptorFor(mockPayloadQuery, "caseStudies")).toMatchObject({
        where: { id: { in: ["cs1"] } },
      });
    });
  });

  // -------------------------------------------------------------------------
  // Projections and orderings
  // -------------------------------------------------------------------------
  describe("the projection", () => {
    it("orders both discovery facets by id — GROQ's `order(name asc)` / `order(value asc)` sort an OBJECT and fall back to _id", async () => {
      mockPayloadQuery.mockImplementation(async (descriptor: unknown) => {
        const { collection } = descriptor as { collection: string };
        if (collection === "regionalCommunities") {
          return docs(
            { id: "regional-community-oceania", slug: "oceania", name: { en: "AAA Oceania" } },
            { id: "regional-community-europe", slug: "europe", name: { en: "ZZZ Europe" } },
          ) as never;
        }
        return docs(
          { id: "tag-zulu", value: "aaa-first-alphabetically", label: { en: "Zulu" } },
          { id: "tag-alpha", value: "zzz-last-alphabetically", label: { en: "Alpha" } },
        ) as never;
      });
      const facets = await getDiscoveryOptions();
      expect(facets.regions.map((r) => r.slug)).toEqual(["europe", "oceania"]);
      // `value` is the FLAT Payload string, not Sanity's `{_type:"slug",current}`
      // — the same divergence `payload/news.ts` and `payload/outputs.ts` carry.
      expect(facets.tags).toEqual([
        { label: { en: "Alpha" }, value: "zzz-last-alphabetically" },
        { label: { en: "Zulu" }, value: "aaa-first-alphabetically" },
      ]);
    });

    it("flattens both moderation wordlists out of Payload's `[{term}]` rows", async () => {
      mockPayloadQueryLive.mockResolvedValue({
        enabled: false,
        blockTerms: [{ term: "slur" }, { term: "threat" }],
        reviewTerms: [],
      } as never);
      expect(await getModerationSettings()).toEqual({
        enabled: false,
        blockTerms: ["slur", "threat"],
        reviewTerms: [],
      });
    });

    it("falls back to the built-in default when the global is unauthored — as it is in both stores today", async () => {
      mockPayloadQueryLive.mockResolvedValue({ blockTerms: [], reviewTerms: [], enabled: true } as never);
      expect(await getModerationSettings()).toEqual({
        enabled: true,
        blockTerms: [],
        reviewTerms: [],
      });
    });

    it("fails open to the default when the Payload read throws, exactly as the Sanity arm does", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      mockPayloadQueryLive.mockRejectedValue(new Error("boom"));
      expect(await getModerationSettings()).toEqual({
        enabled: true,
        blockTerms: [],
        reviewTerms: [],
      });
    });

    it("degrades the two discovery facets independently, keeping the Sanity arm's per-facet behaviour", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      mockPayloadQuery.mockImplementation(async (descriptor: unknown) => {
        if ((descriptor as { collection: string }).collection === "regionalCommunities") {
          throw new Error("boom");
        }
        return docs({ id: "t1", value: "climate", label: { en: "Climate" } }) as never;
      });
      const facets = await getDiscoveryOptions();
      expect(facets.regions).toEqual([]);
      expect(facets.tags).toEqual([{ label: { en: "Climate" }, value: "climate" }]);
    });

    it("collapses an event's localized title and description onto the plain strings ContentEvent declares", async () => {
      mockPayloadQuery.mockResolvedValue(
        docs({
          id: "e1",
          slug: "my-event",
          title: { en: "Meetup", es: "Meetup ES", fr: null, ar: null },
          description: { en: "About it", es: null, fr: null, ar: null },
          scope: "community",
          startAt: "2026-09-10T10:00:00.000Z",
          endAt: null,
          mode: "online",
          locationName: null,
          url: null,
          linkedProject: null,
        }) as never,
      );
      expect(await getEvents()).toEqual([
        {
          _id: "e1",
          description: "About it",
          endAt: null,
          linkedProject: null,
          locationName: null,
          mode: "online",
          scope: "community",
          slug: "my-event",
          // Payload always spells the millis; Sanity stores `…:00Z`.
          startAt: "2026-09-10T10:00:00Z",
          title: "Meetup",
          url: null,
        },
      ]);
    });

    it("orders the events list soonest-first with an _id tie-break, and honours the limit", async () => {
      mockPayloadQuery.mockResolvedValue(
        docs(
          { id: "e-b", slug: "b", title: { en: "B" }, startAt: "2027-01-01T00:00:00.000Z" },
          { id: "e-a", slug: "a", title: { en: "A" }, startAt: "2026-01-01T00:00:00.000Z" },
          { id: "e-c", slug: "c", title: { en: "C" }, startAt: "2026-01-01T00:00:00.000Z" },
        ) as never,
      );
      expect((await getEvents({ limit: 2 })).map((e) => e._id)).toEqual(["e-a", "e-c"]);
    });

    it("builds a dynamic-insert news card with Sanity's key order, its slug object and a flat tag value", async () => {
      mockPayloadQuery.mockResolvedValue(
        docs({
          id: "n1",
          slug: "the-slug",
          title: { en: "T", es: null, fr: null, ar: null },
          excerpt: { en: null, es: null, fr: null, ar: null },
          publishedAt: "2024-05-10T00:00:00.000Z",
          featured: true,
          image: null,
          author: { id: "a1", name: "Desk", slug: "desk" },
          tags: [{ id: "t1", label: { en: "Climate" }, value: "climate", color: "#fff", category: "topic" }],
        }) as never,
      );
      const [card] = await getDynamicContent("newsPost", {
        communitySlug: "oceania",
        count: 3,
        mode: "featured",
      });
      expect(Object.keys(card)).toEqual([
        "_id",
        "author",
        "excerpt",
        "featured",
        "image",
        "publishedAt",
        "slug",
        "tags",
        "title",
      ]);
      expect(card.slug).toEqual({ _type: "slug", current: "the-slug" });
      expect(card.author).toEqual({ name: "Desk", slug: { _type: "slug", current: "desk" } });
      // The empty locale arms are dropped, so an untranslated excerpt is the
      // `null` GROQ emits rather than `{en:null,…}`.
      expect(card.excerpt).toBeNull();
      expect(card.tags).toEqual([
        { _id: "t1", color: "#fff", label: { en: "Climate" }, value: "climate" },
      ]);
    });

    it("builds the image group in Sanity's key order, with the flattened media row appended for payload-image-source", async () => {
      mockPayloadQuery.mockResolvedValue(
        docs({
          id: "n1",
          slug: "s",
          title: { en: "T" },
          publishedAt: "2024-01-01T00:00:00.000Z",
          image: {
            asset: {
              id: "image-abc-5760x3240-jpg",
              url: "/payload-api/media/file/a.jpg",
              mimeType: "image/jpeg",
              lqip: "data:image/jpeg;base64,AAA",
              width: 5760,
              height: 3240,
              sizes: { crop80x80: { url: "/payload-api/media/file/a-80x80.jpg" } },
            },
            alt: { en: "A photo", es: null, fr: null, ar: null },
          },
        }) as never,
      );
      const [card] = await getDynamicContent("newsPost", {
        communitySlug: "oceania",
        count: 1,
        mode: "recent",
      });
      const image = card.image as Record<string, unknown>;
      // Sanity alphabetises the keys of every object it returns, including the
      // nested `metadata` and `dimensions`.
      expect(Object.keys(image)).toEqual([
        "alt",
        "asset",
        "height",
        "lqip",
        "mimeType",
        "sizes",
        "url",
        "width",
      ]);
      const asset = image.asset as Record<string, unknown>;
      // `RECENT_NEWS_QUERY` does NOT project `mimeType` on the asset.
      expect(Object.keys(asset)).toEqual(["_id", "metadata", "url"]);
      expect(asset.metadata).toEqual({ dimensions: { height: 3240, width: 5760 }, lqip: "data:image/jpeg;base64,AAA" });
      expect(Object.keys((asset.metadata as { dimensions: object }).dimensions)).toEqual([
        "height",
        "width",
      ]);
      // `image.alt` is a plain string on both backends, not a locale map.
      expect(image.alt).toBe("A photo");
    });

    it("puts featured cards first in featured mode and leaves them unmarked in recent mode", async () => {
      const rows = docs(
        { id: "n-plain", slug: "p", title: { en: "P" }, featured: false, publishedAt: "2026-01-01T00:00:00.000Z" },
        { id: "n-star", slug: "s", title: { en: "S" }, featured: true, publishedAt: "2024-01-01T00:00:00.000Z" },
      );
      mockPayloadQuery.mockResolvedValue(rows as never);
      const featured = await getDynamicContent("caseStudy", {
        communitySlug: "oceania",
        count: 5,
        mode: "featured",
      });
      expect(featured.map((c) => c._id)).toEqual(["n-star", "n-plain"]);

      mockPayloadQuery.mockResolvedValue(rows as never);
      const recent = await getDynamicContent("caseStudy", {
        communitySlug: "oceania",
        count: 5,
        mode: "recent",
      });
      expect(recent.map((c) => c._id)).toEqual(["n-plain", "n-star"]);
      // `featured` is projected only by the featured queries.
      expect("featured" in recent[0]).toBe(false);
    });

    it("keeps the lived-experience dynamic insert on the LOOSE rule — that GROQ writes exists-or-approved with no type restriction", async () => {
      mockPayloadQuery.mockResolvedValue(docs() as never);
      await getDynamicContent("livedExperience", {
        communitySlug: "oceania",
        count: 3,
        mode: "recent",
      });
      expect(JSON.stringify(descriptorFor(mockPayloadQuery, "livedExperiences")?.where)).toContain(
        '"exists":false',
      );
    });

    it("resolves a comment target for each backed type and refuses the unbacked ones without a read", async () => {
      expect(await resolveCommentTarget("collaborationThread", "t1")).toBeNull();
      expect(mockPayloadQueryLive).not.toHaveBeenCalled();

      mockPayloadQueryLive.mockResolvedValue(0 as never);
      expect(await resolveCommentTarget("livedExperience", "le1")).toBeNull();
      // The one loose predicate: unset means approved for this type alone.
      expect(JSON.stringify(mockPayloadQueryLive.mock.calls[0][0])).toContain('"exists":false');
    });

    it("degrades a comment-target read to null on failure, under the same log label as the Sanity arm", async () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockPayloadQueryLive.mockRejectedValue(new Error("boom"));
      expect(await resolveCommentTarget("newsPost", "n1")).toBeNull();
      expect(spy.mock.calls.flat().join(" ")).toContain("comment-target-newsPost");
    });
  });
});
