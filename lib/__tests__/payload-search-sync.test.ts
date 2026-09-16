/**
 * Task 17 — the Algolia sync that used to arrive as a Sanity webhook.
 *
 * Two things are under test and they are different in kind:
 *
 * 1. **The decision** — save or delete, and on what evidence. Pure, so it is
 *    exercised directly through `planSearchSync`.
 * 2. **The record** — the exact object that reaches Algolia. The index schema
 *    is the contract this task must not move, so the expected records here are
 *    written out **by hand** from the shape the sync routes emitted before the
 *    change, rather than by calling the same transform twice and agreeing with
 *    itself.
 *
 * And one property that is the whole design: the hook **must not await** the
 * network call, because Payload runs `afterChange` inside the write's Postgres
 * transaction. That is asserted by observing that the fake index has not been
 * touched when the hook returns, and has been by the time `flushSearchSync()`
 * resolves.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { writeIndexName } from "@/lib/algolia";
import type { CaseStudyIndexDoc } from "@/lib/content/case-studies";
import type { NewsIndexDoc } from "@/lib/content/news";
import type { AgendaIndexDoc } from "@/lib/content/outputs";
import {
  applySearchSync,
  flushSearchSync,
  onAgendaChange,
  onCaseStudyChange,
  onNewsChange,
  planSearchSync,
  runSearchSync,
  searchSyncAfterChange,
  searchSyncAfterDelete,
  SEARCH_INDEX_KEY,
  SEARCH_SYNCED_COLLECTIONS,
  transformAgendaForIndex,
  transformCaseStudyForIndex,
  transformNewsForIndex,
  type SearchIndexClient,
  type SearchSyncDeps,
  type SearchSyncSource,
} from "@/payload/hooks/search-sync";

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

interface RecordedOp {
  op: "save" | "delete";
  id: string;
  indexName: string;
  record?: Record<string, unknown>;
}

function fakeIndex(ops: RecordedOp[]): SearchIndexClient {
  return {
    async saveObjects({ indexName, objects }) {
      for (const object of objects) {
        ops.push({
          op: "save",
          id: String(object.objectID),
          indexName,
          record: object,
        });
      }
    },
    async deleteObject({ indexName, objectID }) {
      ops.push({ op: "delete", id: objectID, indexName });
    },
  };
}

function deps(
  ops: RecordedOp[],
  sources: Record<string, SearchSyncSource | null>,
  overrides: Partial<SearchSyncDeps> = {},
): SearchSyncDeps {
  return {
    index: fakeIndex(ops),
    indexNameFor: (collection) => SEARCH_INDEX_KEY[collection].toLowerCase(),
    resolve: async (_collection, id) => sources[id] ?? null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Fixtures — deliberately minimal, so a missing field shows up as a default
// ---------------------------------------------------------------------------

const approvedCaseStudy: CaseStudyIndexDoc = {
  _id: "case-study-approved",
  title: { en: "Heat and health in Karachi", es: "Calor y salud en Karachi" },
  slug: { current: "heat-and-health-in-karachi" },
  excerpt: { en: "What a monsoon city learned." },
  status: "approved",
  featured: true,
  publishedAt: "2026-03-01T00:00:00.000Z",
  _updatedAt: "2026-03-02T00:00:00.000Z",
  region: "SAS",
  themes: ["health"],
  populations: ["urban"],
  authors: [{ name: "A. Khan", role: "lead", affiliation: { name: "BRAC" } }],
  tags: [{ name: "heat" }, { name: undefined }],
  studyLocation: { lat: 24.86, lng: 67.01 },
  studyPeriod: { startDate: "2024-01-01", endDate: "2024-12-31" },
  organizations: [{ name: "BRAC" }],
};

const rejectedCaseStudy: CaseStudyIndexDoc = {
  ...approvedCaseStudy,
  _id: "case-study-rejected",
  status: "rejected",
};

const publishedNews: NewsIndexDoc = {
  _id: "news-published",
  title: { en: "Hub opens submissions" },
  subtitle: { en: "For everyone" },
  excerpt: { en: "A short note." },
  slug: { current: "hub-opens-submissions" },
  publishedAt: "2026-01-01T00:00:00.000Z",
  _updatedAt: "2026-01-02T00:00:00.000Z",
  featured: false,
  author: { _id: "author-1", name: "R. Diaz" },
  tags: [{ label: { en: "Announcements" }, name: "announcements" }, { name: "policy" }],
  organizations: [{ name: "CCM" }],
  projects: [{ name: "Atlas" }],
  location: { lat: 51.5, lng: -0.12 },
  locationDetails: { city: "London", country: "United Kingdom" },
  language: "en",
  region: "EUR",
  themes: ["policy"],
  populations: [],
};

const agenda: AgendaIndexDoc = {
  _id: "agenda-global",
  title: { en: "Global agenda", fr: "Agenda mondial" },
  subtitle: { en: "2026" },
  description: { en: "The whole thing." },
  slug: { current: "global-agenda" },
  agendaType: "global",
  year: 2026,
  publishDate: "2026-02-01T00:00:00.000Z",
  totalDownloadCount: 42,
  featured: true,
  accessLevel: "public",
  organizations: [{ name: "CCM" }],
  regionalCommunities: [{ name: "Oceania" }],
  tags: [{ name: "agenda" }],
  files: [
    { language: "en", file: { asset: { url: "https://cdn/en.pdf", originalFilename: "en.pdf" } } },
    { language: "fr", file: { asset: { url: "https://cdn/fr.pdf" } } },
    { language: "es", file: { asset: null } },
  ],
};

const published = (doc: SearchSyncSource["doc"]): SearchSyncSource => ({ published: true, doc });

beforeEach(async () => {
  await flushSearchSync();
  delete process.env.ALGOLIA_INDEX_PREFIX;
});

// ---------------------------------------------------------------------------
// The plan's test
// ---------------------------------------------------------------------------

describe("the search sync's save/delete decision", () => {
  it("indexes an approved case study and removes a rejected one", async () => {
    const ops: RecordedOp[] = [];
    const d = deps(ops, {
      [approvedCaseStudy._id]: published(approvedCaseStudy),
      [rejectedCaseStudy._id]: published(rejectedCaseStudy),
    });

    await onCaseStudyChange(approvedCaseStudy._id, d);
    await onCaseStudyChange(rejectedCaseStudy._id, d);

    expect(ops.map((o) => ({ op: o.op, id: o.id }))).toEqual([
      { op: "save", id: approvedCaseStudy._id },
      { op: "delete", id: rejectedCaseStudy._id },
    ]);
  });

  it("deletes a case study that no longer exists", () => {
    const plan = planSearchSync("caseStudies", "gone", null);
    expect(plan).toMatchObject({ op: "delete", objectID: "gone" });
    expect(plan.reason).toBe("document does not exist");
  });

  it.each(["pending", "revision", "rejected"] as const)(
    "deletes a case study whose moderationStatus is %s",
    (status) => {
      const plan = planSearchSync(
        "caseStudies",
        "id",
        published({ ...approvedCaseStudy, status } as CaseStudyIndexDoc),
      );
      expect(plan.op).toBe("delete");
      expect(plan.reason).toBe(`moderationStatus is ${status}`);
    },
  );

  it("deletes an unpublished document even when it is approved — `draft: false` does not publish", () => {
    const plan = planSearchSync("caseStudies", approvedCaseStudy._id, {
      published: false,
      doc: approvedCaseStudy,
    });
    expect(plan.op).toBe("delete");
    expect(plan.reason).toBe("document is not published");
  });

  it("keeps an approved case study indexed when a draft of it is saved", async () => {
    // A draft save leaves the published row untouched, and the decision reads
    // the published row — so the live record must survive it. Deciding from the
    // `doc` the hook is handed would delete it.
    const ops: RecordedOp[] = [];
    await onCaseStudyChange(
      approvedCaseStudy._id,
      deps(ops, { [approvedCaseStudy._id]: published(approvedCaseStudy) }),
    );
    expect(ops.map((o) => o.op)).toEqual(["save"]);
  });

  it("indexes a news post published in the past and removes one dated in the future", async () => {
    const ops: RecordedOp[] = [];
    const future: NewsIndexDoc = { ...publishedNews, _id: "news-future", publishedAt: "2099-01-01T00:00:00.000Z" };
    const d = deps(
      ops,
      {
        [publishedNews._id]: published(publishedNews),
        [future._id]: published(future),
      },
      { now: new Date("2026-06-01T00:00:00.000Z") },
    );

    await onNewsChange(publishedNews._id, d);
    await onNewsChange(future._id, d);

    expect(ops.map((o) => ({ op: o.op, id: o.id }))).toEqual([
      { op: "save", id: publishedNews._id },
      { op: "delete", id: future._id },
    ]);
  });

  it("removes a news post with no publishedAt at all", () => {
    const plan = planSearchSync("newsPosts", "n", published({ ...publishedNews, publishedAt: undefined }));
    expect(plan.op).toBe("delete");
    expect(plan.reason).toBe("publishedAt is unset or in the future");
  });

  it("indexes every agenda that exists — the agenda routes never filtered", async () => {
    const ops: RecordedOp[] = [];
    await onAgendaChange(agenda._id, deps(ops, { [agenda._id]: published(agenda) }));
    expect(ops.map((o) => o.op)).toEqual(["save"]);
  });

  it("deletes rather than reads when the document was deleted", async () => {
    const ops: RecordedOp[] = [];
    const resolve = vi.fn();
    await runSearchSync(
      { collection: "agendas", id: agenda._id, deleted: true },
      deps(ops, {}, { resolve: resolve as never }),
    );
    expect(resolve).not.toHaveBeenCalled();
    expect(ops).toEqual([{ op: "delete", id: agenda._id, indexName: "agendas" }]);
  });
});

// ---------------------------------------------------------------------------
// The record shape — transcribed by hand from what the routes emitted
// ---------------------------------------------------------------------------

describe("the record shape, which the index schema depends on", () => {
  it("builds the case-study record the sync route always built", () => {
    expect(transformCaseStudyForIndex(approvedCaseStudy)).toEqual({
      objectID: "case-study-approved",
      contentId: "case-study-approved",
      title: { en: "Heat and health in Karachi", es: "Calor y salud en Karachi" },
      excerpt: { en: "What a monsoon city learned." },
      slug: "heat-and-health-in-karachi",
      status: "approved",
      featured: true,
      publishedAt: Date.parse("2026-03-01T00:00:00.000Z"),
      updatedAt: Date.parse("2026-03-02T00:00:00.000Z"),
      authors: [{ name: "A. Khan", role: "lead", affiliation: "BRAC" }],
      tags: ["heat"],
      studyLocation: { lat: 24.86, lng: 67.01, name: "24.86, 67.01" },
      studyPeriod: { startDate: "2024-01-01", endDate: "2024-12-31" },
      organizations: ["BRAC"],
      language: "en",
      accessLevel: "public",
      region: "SAS",
      themes: ["health"],
      populations: ["urban"],
    });
  });

  it("keeps the case-study record's defaults for an empty document", () => {
    const record = transformCaseStudyForIndex({ _id: "bare" })!;
    expect(record.title).toEqual({ en: "Untitled Case Study" });
    expect(record.excerpt).toEqual({});
    expect(record.slug).toBe("");
    expect(record.status).toBe("pending");
    expect(record.featured).toBe(false);
    expect(record.authors).toEqual([]);
    expect(record.studyLocation).toBeUndefined();
    expect(record.studyPeriod).toBeUndefined();
    expect(record.region).toBeUndefined();
    expect(record.themes).toEqual([]);
    expect(record.populations).toEqual([]);
    expect(record.language).toBe("en");
    expect(record.accessLevel).toBe("public");
  });

  it("builds the news record the sync route always built", () => {
    expect(transformNewsForIndex(publishedNews)).toEqual({
      objectID: "news-published",
      contentId: "news-published",
      title: { en: "Hub opens submissions" },
      subtitle: { en: "For everyone" },
      excerpt: { en: "A short note." },
      slug: "hub-opens-submissions",
      publishedAt: Date.parse("2026-01-01T00:00:00.000Z"),
      updatedAt: Date.parse("2026-01-02T00:00:00.000Z"),
      author: { name: "R. Diaz", id: "author-1" },
      featured: false,
      // `label.en` wins over `name`, and a tag with only a `name` falls back.
      tags: ["Announcements", "policy"],
      organizations: ["CCM"],
      projects: ["Atlas"],
      location: { city: "London", country: "United Kingdom", lat: 51.5, lng: -0.12 },
      accessLevel: "public",
      language: "en",
      region: "EUR",
      themes: ["policy"],
      populations: [],
    });
  });

  it("refuses a news post missing a title or a slug, as the route did", () => {
    expect(transformNewsForIndex({ _id: "x", slug: { current: "x" } })).toBeNull();
    expect(transformNewsForIndex({ _id: "x", title: { en: "x" } })).toBeNull();
  });

  it("builds the agenda record the sync route always built, `files` included", () => {
    expect(transformAgendaForIndex(agenda)).toEqual({
      objectID: "agenda-global",
      contentId: "agenda-global",
      title: { en: "Global agenda", fr: "Agenda mondial" },
      subtitle: { en: "2026" },
      description: { en: "The whole thing." },
      slug: "global-agenda",
      agendaType: "global",
      year: 2026,
      publishDate: Date.parse("2026-02-01T00:00:00.000Z"),
      totalDownloadCount: 42,
      featured: true,
      organizations: ["CCM"],
      regionalCommunities: ["Oceania"],
      tags: ["agenda"],
      accessLevel: "public",
      language: "en",
      // `languages` is derived from every declared file language, including the
      // Spanish one whose asset is missing — `deriveAgendaLanguages` reads
      // `file.language` and never looks at the asset. Pre-existing, preserved.
      languages: ["en", "es", "fr"],
      // The drift that is being closed: the sync route emitted `files`, the
      // webhook did not, and `saveObjects` replaces the whole object — so every
      // webhook delivery stripped them until the next full sync. One shape now,
      // and it is the full sync's, because that is what the live index holds.
      files: [
        { language: "en", url: "https://cdn/en.pdf", filename: "en.pdf" },
        { language: "fr", url: "https://cdn/fr.pdf", filename: undefined },
      ],
    });
  });

  it("keeps `language: 'en'` on agendas — the deprecated field the index still faces on", () => {
    expect(transformAgendaForIndex({ _id: "a" })!.language).toBe("en");
  });
});

// ---------------------------------------------------------------------------
// The design decision, asserted
// ---------------------------------------------------------------------------

describe("the hook does not hold the write's transaction open", () => {
  it("returns before the index client is touched, and completes on flush", async () => {
    const ops: RecordedOp[] = [];
    const d = deps(ops, { [approvedCaseStudy._id]: published(approvedCaseStudy) });
    const hook = searchSyncAfterChange("caseStudies", d);

    const returned = hook({
      doc: { id: approvedCaseStudy._id },
      previousDoc: {},
      operation: "update",
      req: { payload: undefined } as never,
      collection: undefined as never,
      context: {} as never,
    } as never);

    // The hook is synchronous by construction: it schedules and returns the
    // document. If it ever starts awaiting the network, this stops being true
    // and the Postgres transaction starts being held open behind Algolia.
    expect(returned).toEqual({ id: approvedCaseStudy._id });
    expect(ops).toEqual([]);

    await flushSearchSync();
    expect(ops.map((o) => ({ op: o.op, id: o.id }))).toEqual([
      { op: "save", id: approvedCaseStudy._id },
    ]);
  });

  it("does not let an Algolia failure escape into the write", async () => {
    const exploding: SearchIndexClient = {
      saveObjects: async () => {
        throw new Error("algolia is down");
      },
      deleteObject: async () => {
        throw new Error("algolia is down");
      },
    };
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const hook = searchSyncAfterChange("caseStudies", {
      index: exploding,
      indexNameFor: () => "case_studies",
      resolve: async () => published(approvedCaseStudy),
    });

    expect(() =>
      hook({
        doc: { id: approvedCaseStudy._id },
        previousDoc: {},
        operation: "update",
        req: {} as never,
        collection: undefined as never,
        context: {} as never,
      } as never),
    ).not.toThrow();

    await flushSearchSync();
    expect(errors).toHaveBeenCalled();
    errors.mockRestore();
  });

  it("collapses two writes to the same document that are queued together", async () => {
    const ops: RecordedOp[] = [];
    const d = deps(ops, { [agenda._id]: published(agenda) });
    const hook = searchSyncAfterChange("agendas", d);
    const event = {
      doc: { id: agenda._id },
      previousDoc: {},
      operation: "update",
      req: {} as never,
      collection: undefined as never,
      context: {} as never,
    } as never;

    hook(event);
    hook(event);
    await flushSearchSync();

    expect(ops).toHaveLength(1);
  });

  it("deletes from the index when a document is deleted", async () => {
    const ops: RecordedOp[] = [];
    const hook = searchSyncAfterDelete("newsPosts", deps(ops, {}));
    hook({
      doc: { id: "news-gone" },
      id: "news-gone",
      req: {} as never,
      collection: undefined as never,
      context: {} as never,
    } as never);

    expect(ops).toEqual([]);
    await flushSearchSync();
    expect(ops).toEqual([{ op: "delete", id: "news-gone", indexName: "news" }]);
  });

  it("ignores an operation with no usable id", async () => {
    const ops: RecordedOp[] = [];
    const hook = searchSyncAfterChange("agendas", deps(ops, {}));
    hook({
      doc: {},
      previousDoc: {},
      operation: "update",
      req: {} as never,
      collection: undefined as never,
      context: {} as never,
    } as never);
    await flushSearchSync();
    expect(ops).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Index naming
// ---------------------------------------------------------------------------

describe("writeIndexName", () => {
  it("is the identity when no prefix is set — which is every real environment", () => {
    expect(writeIndexName("case_studies")).toBe("case_studies");
  });

  it("prefixes a write so a parity run can target a scratch index", () => {
    process.env.ALGOLIA_INDEX_PREFIX = "t17_";
    expect(writeIndexName("case_studies")).toBe("t17_case_studies");
    delete process.env.ALGOLIA_INDEX_PREFIX;
  });

  it("maps every synced collection to an index", () => {
    expect(SEARCH_SYNCED_COLLECTIONS.map((c) => SEARCH_INDEX_KEY[c])).toEqual([
      "CASE_STUDIES",
      "NEWS",
      "AGENDAS",
    ]);
  });
});

describe("applySearchSync", () => {
  it("deletes when a save operation carries no record", async () => {
    const ops: RecordedOp[] = [];
    await applySearchSync({ op: "save", objectID: "x", reason: "n/a" }, "agendas", fakeIndex(ops));
    expect(ops).toEqual([{ op: "delete", id: "x", indexName: "agendas" }]);
  });
});
