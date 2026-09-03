import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/content/internal/sanity-source", () => ({
  query: vi.fn(),
  queryLive: vi.fn(),
  queryRaw: vi.fn(),
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
}));

import { query, queryLive, queryRaw, createDocument, updateDocument } from "@/lib/content/internal/sanity-source";
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

beforeEach(() => {
  mockQuery.mockReset();
  mockQueryLive.mockReset();
  mockQueryRaw.mockReset();
  mockCreateDocument.mockReset();
  mockUpdateDocument.mockReset();
});
afterEach(() => vi.restoreAllMocks());

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
