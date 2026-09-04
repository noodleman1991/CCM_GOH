import { describe, expect, it } from "vitest";
import {
  contentDrafts,
  draftTargets,
  importDraftTargets,
  DraftImportFailure,
  MissingPublishedCounterpart,
  type DraftClient,
} from "@/scripts/payload-import/drafts";
import {
  archiveCounts,
  collectValues,
  countDraftDocuments,
  latestIsDraft,
  countPortableTextFields,
  lexicalChildCount,
  reconcileManifest,
  sameText,
  verifyImport,
  EXPECTED_UPLOADS,
  NOT_IMPORTED_TYPES,
  RICH_TEXT_NOT_MODELLED,
  type ArchiveManifest,
  type VerifyClient,
} from "@/scripts/payload-import/verify";
import { documentTargets } from "@/scripts/payload-import/lib/transform";
import type {
  DocumentTarget,
  PayloadData,
  SanityDoc,
  TransformContext,
} from "@/scripts/payload-import/lib/transform";

/**
 * The fixtures below are verbatim slices of the Phase 0 archive
 * (`backups/sanity-production_2-2026-09-02.tar.gz`), and every count asserted
 * was measured over its 479 ndjson lines on 2026-09-04.
 *
 * Three of those measurements are the reason this file exists — each one is a
 * way a plausible implementation reports success while having lost the 21
 * lived-experience drafts, or fails while having imported them correctly:
 *
 * 1. The raw `drafts.*` count is **33**, not 30. Three are
 *    `sanity.previewUrlSecret`.
 * 2. The manifest says **446** published; **438** is what is imported. The
 *    difference is the 8 `translation.metadata` documents.
 * 3. The `_*_v` tables held **1,323 published version rows and zero drafts**
 *    before a single draft was imported, because every re-run of Task 12 adds
 *    a published snapshot. Counting rows instead of documents-by-status
 *    reports four figures where 30 is correct.
 */

const IMAGE_ID = "image-a188992df760eecc7333d6fbe0c264d859fb3523-3840x2160-png";

function context(): TransformContext {
  return { assets: new Map([[IMAGE_ID, IMAGE_ID]]), known: new Set() };
}

/* --------------------------------------------------------------- fixtures */

const REGIONAL_COMMUNITY: SanityDoc = {
  _id: "regional-community-oceania",
  _type: "regionalCommunity",
  active: true,
  featured: false,
  name: { ar: "Oceania", en: "Oceania", es: "Oceania", fr: "Oceania" },
  orderRank: "0|100008:",
  region: "oce",
  slug: { _type: "slug", current: "oceania" },
};

const AUTHOR: SanityDoc = {
  _id: "author-1",
  _type: "author",
  name: "Dr. Elvis Tata",
  slug: { _type: "slug", current: "elvis-tata" },
  orderRank: "0|10001k:",
};

/** `tag` 89766952-… verbatim. */
const TAG: SanityDoc = {
  _id: "tag-published",
  _type: "tag",
  label: { en: "Climate Anxiety" },
  orderRank: "0|1000ig:",
  useAsTheme: false,
  value: { _type: "slug", current: "climate-anxiety" },
};

/**
 * `drafts.7ba8e07e-…` verbatim — one of the three drafts with no published
 * counterpart, and the reason a `tag` draft must not be discarded: it carries
 * a `value` and a `category` but no `label` at all.
 */
const TAG_DRAFT: SanityDoc = {
  _id: "drafts.7ba8e07e-ae05-483f-b650-cf72fc3a398c",
  _type: "tag",
  _createdAt: "2026-08-18T18:46:06Z",
  _updatedAt: "2026-08-18T18:49:01Z",
  category: "topic",
  color: "#205596",
  orderRank: "0|1000ko:",
  useAsTheme: false,
  value: { _type: "slug", current: "access-to-education" },
};

function livedExperience(id: string, title: string): SanityDoc {
  return {
    _id: id,
    _type: "livedExperience",
    title: { en: title },
    slug: { _type: "slug", current: id },
    description: { en: "Description" },
    author: { _ref: "author-1", _type: "reference" },
    region: { _ref: "regional-community-oceania", _type: "reference" },
    tags: [],
    featured: false,
    noindex: false,
    publishedAt: "2025-11-10T13:09:46.029Z",
    videoLink: "https://youtu.be/abc",
    videoUrl: "https://youtu.be/abc",
  };
}

function regionalPage(id: string, language: string): SanityDoc {
  return {
    _id: id,
    _type: "regionalCommunityPage",
    language,
    title: { [language]: `Oceania (${language})` },
    slug: { _type: "slug", current: "oceania" },
    regionalCommunity: { _ref: "regional-community-oceania", _type: "reference" },
    noindex: false,
    orderRank: "0|100008:",
  };
}

/** A `sanity.previewUrlSecret` draft, verbatim in shape. */
const SYSTEM_DRAFT: SanityDoc = {
  _id: "drafts.sanity-previewUrlSecret-abc",
  _type: "sanity.previewUrlSecret",
  secret: "xyz",
};

const BASE_DOCS: SanityDoc[] = [TAG, REGIONAL_COMMUNITY, AUTHOR];

/* ----------------------------------------------------------- draft filter */

describe("contentDrafts", () => {
  it("filters sanity.* before counting, so 33 raw records are 30 content drafts", () => {
    const docs = [
      ...BASE_DOCS,
      livedExperience("lived-experience-1", "A story"),
      { ...livedExperience("lived-experience-1", "An edit"), _id: "drafts.lived-experience-1" },
      TAG_DRAFT,
      SYSTEM_DRAFT,
      { ...SYSTEM_DRAFT, _id: "drafts.sanity-previewUrlSecret-def" },
      { ...SYSTEM_DRAFT, _id: "drafts.sanity-previewUrlSecret-ghi" },
    ];
    const { drafts, system } = contentDrafts(docs);
    expect(drafts).toHaveLength(2);
    expect(system).toHaveLength(3);
    expect(drafts.map((d) => d._type)).toEqual(["livedExperience", "tag"]);
  });

  it("does not mistake a published document for a draft", () => {
    expect(contentDrafts(BASE_DOCS).drafts).toHaveLength(0);
  });
});

/* ---------------------------------------------------------- draft targets */

describe("draftTargets", () => {
  const docs: SanityDoc[] = [
    ...BASE_DOCS,
    livedExperience("lived-experience-1", "A story"),
    livedExperience("lived-experience-2", "Another story"),
    { ...livedExperience("lived-experience-1", "An edit"), _id: "drafts.lived-experience-1" },
    { ...livedExperience("lived-experience-2", "A second edit"), _id: "drafts.lived-experience-2" },
    TAG_DRAFT,
    SYSTEM_DRAFT,
  ];

  it("builds one target per content draft and reports the system ones separately", () => {
    const { targets, system } = draftTargets(docs, context());
    expect(targets).toHaveLength(3);
    expect(system).toEqual(["drafts.sanity-previewUrlSecret-abc"]);
  });

  it("stamps _status draft on every locale, because 'published' silently publishes the edit", () => {
    // Payload's update operation computes
    // `isSavingDraft = draftArg && … && data._status !== 'published'`, and
    // `buildTarget` stamps `published` on every drafts-enabled collection. A
    // draft import that let that through would publish all 30 unreviewed edits.
    const { targets } = draftTargets(docs, context());
    for (const target of targets) {
      for (const data of Object.values(target.data)) {
        expect((data as PayloadData)._status).toBe("draft");
      }
    }
  });

  it("marks the drafts with a published counterpart, and the ones without", () => {
    const { targets } = draftTargets(docs, context());
    const overPublished = targets.filter((t) => t.overPublished);
    const neverPublished = targets.filter((t) => !t.overPublished);
    expect(overPublished.map((t) => t.id).sort()).toEqual(["lived-experience-1", "lived-experience-2"]);
    expect(neverPublished).toHaveLength(1);
    expect(neverPublished[0].sanityType).toBe("tag");
    // The never-published draft keeps the id it would have had on publish.
    expect(neverPublished[0].id).toBe("7ba8e07e-ae05-483f-b650-cf72fc3a398c");
    expect(neverPublished[0].slug).toBe("tags");
  });

  it("carries the draft's own content, not the published document's", () => {
    const { targets } = draftTargets(docs, context());
    const edit = targets.find((t) => t.id === "lived-experience-1")!;
    expect(edit.data.en?.title).toBe("An edit");
  });

  it("resolves a non-English Lane-A draft onto the English document's Payload id", () => {
    // The 28 regionalCommunityPage documents collapse to 7, keyed by the
    // ENGLISH id. `drafts.<spanish id>` therefore does not name a Payload
    // document; it has to be resolved through the published source index.
    const laneA: SanityDoc[] = [
      ...BASE_DOCS,
      regionalPage("regional-community-page-oceania", "en"),
      regionalPage("regional-community-page-oceania-es", "es"),
      {
        ...regionalPage("regional-community-page-oceania-es", "es"),
        _id: "drafts.regional-community-page-oceania-es",
        title: { es: "Oceanía editada" },
      },
    ];
    const { targets } = draftTargets(laneA, context());
    expect(targets).toHaveLength(1);
    expect(targets[0].id).toBe("regional-community-page-oceania");
    expect(targets[0].slug).toBe("regionalCommunityPages");
    // …and the edit lands in the Spanish lane, not over the English one.
    expect(Object.keys(targets[0].data)).toEqual(["es"]);
    expect(targets[0].data.es?.title).toBe("Oceanía editada");
  });

  it("keeps the lived-experience drafts distinguishable by their source id", () => {
    const { targets } = draftTargets(docs, context());
    const lived = targets.filter((t) => t.sanityType === "livedExperience");
    expect(lived.map((t) => t.draftId).sort()).toEqual([
      "drafts.lived-experience-1",
      "drafts.lived-experience-2",
    ]);
  });
});

/* ------------------------------------------------------------ write loop */

function memoryClient(present: string[]): DraftClient & {
  created: string[];
  updated: string[];
  writes: { id: string; locale: string; data: PayloadData }[];
} {
  const ids = new Set(present);
  const created: string[] = [];
  const updated: string[] = [];
  const writes: { id: string; locale: string; data: PayloadData }[] = [];
  return {
    created,
    updated,
    writes,
    async existingIds() {
      return new Set(ids);
    },
    async createDraft({ id, data, locale }) {
      created.push(id);
      ids.add(id);
      writes.push({ id, locale, data });
    },
    async updateDraft({ id, data, locale }) {
      updated.push(id);
      writes.push({ id, locale, data });
    },
  };
}

describe("importDraftTargets", () => {
  const docs: SanityDoc[] = [
    ...BASE_DOCS,
    livedExperience("lived-experience-1", "A story"),
    { ...livedExperience("lived-experience-1", "An edit"), _id: "drafts.lived-experience-1" },
    TAG_DRAFT,
  ];

  it("updates over a published document and creates the never-published one", async () => {
    const { targets } = draftTargets(docs, context());
    const client = memoryClient(["lived-experience-1"]);
    const summary = await importDraftTargets(targets, { client });

    expect(client.updated).toEqual(["lived-experience-1"]);
    expect(client.created).toEqual(["7ba8e07e-ae05-483f-b650-cf72fc3a398c"]);
    expect(summary).toMatchObject({ created: 1, updated: 1 });
    expect(summary.byType).toEqual({ livedExperience: 1, tag: 1 });
  });

  it("is idempotent: the second run updates what the first created", async () => {
    const { targets } = draftTargets(docs, context());
    const client = memoryClient(["lived-experience-1"]);
    await importDraftTargets(targets, { client });
    const second = await importDraftTargets(targets, { client });
    expect(second).toMatchObject({ created: 0, updated: 2 });
  });

  it("refuses to run when a published counterpart is missing, rather than publishing the edit", async () => {
    const { targets } = draftTargets(docs, context());
    const client = memoryClient([]);
    await expect(importDraftTargets(targets, { client })).rejects.toBeInstanceOf(MissingPublishedCounterpart);
    expect(client.created).toEqual([]);
    expect(client.updated).toEqual([]);
  });

  it("reports every failure rather than stopping at the first", async () => {
    const { targets } = draftTargets(docs, context());
    const client = memoryClient(["lived-experience-1"]);
    const failing: DraftClient = {
      ...client,
      async updateDraft() {
        throw new Error("connection reset");
      },
    };
    await expect(
      importDraftTargets(targets, { client: failing, attempts: 1, retryDelayMs: 0 }),
    ).rejects.toBeInstanceOf(DraftImportFailure);
  });
});

/* ------------------------------------------------------------ verifier */

describe("reconcileManifest", () => {
  /** `docs/migration/sanity-archive-manifest.json`, trimmed to the shape used. */
  const manifest = {
    totals: { documents: 476, published: 446, drafts: 30 },
    byType: {
      tag: { published: 67, drafts: 1 },
      author: { published: 95, drafts: 4 },
      testimonial: { published: 20, drafts: 1 },
      "translation.metadata": { published: 8, drafts: 0 },
      livedExperience: { published: 35, drafts: 21 },
      caseStudy: { published: 27, drafts: 1 },
      newsPost: { published: 4, drafts: 1 },
      regionalCommunityPage: { published: 28, drafts: 1 },
      page: { published: 36, drafts: 0 },
      agenda: { published: 29, drafts: 0 },
      organization: { published: 24, drafts: 0 },
      caseStudyDraft: { published: 1, drafts: 0 },
      externalSource: { published: 1, drafts: 0 },
      expertiseArea: { published: 5, drafts: 0 },
      workType: { published: 6, drafts: 0 },
      docsChapter: { published: 12, drafts: 0 },
      homepage: { published: 4, drafts: 0 },
      onboardingContent: { published: 4, drafts: 0 },
      profilePrompt: { published: 3, drafts: 0 },
      regionalCommunity: { published: 7, drafts: 0 },
      researchOutput: { published: 29, drafts: 0 },
      siteAnnouncement: { published: 1, drafts: 0 },
    },
  };

  it("reconciles 438 against the manifest's 446 by excluding translation.metadata", () => {
    const expectations = reconcileManifest(manifest);
    expect(expectations.publishedInManifest).toBe(446);
    expect(expectations.publishedImported).toBe(438);
    expect(expectations.excluded).toEqual({ "translation.metadata": 8 });
    expect(NOT_IMPORTED_TYPES).toContain("translation.metadata");
  });

  it("reports 30 drafts, 21 of them lived experiences", () => {
    const expectations = reconcileManifest(manifest);
    expect(expectations.drafts).toBe(30);
    expect(expectations.draftsByType.livedExperience).toBe(21);
    expect(Object.values(expectations.draftsByType).reduce((a, b) => a + b, 0)).toBe(30);
  });

  it("does not carry translation.metadata into the per-type expectations", () => {
    expect(reconcileManifest(manifest).publishedByType["translation.metadata"]).toBeUndefined();
  });
});

describe("archiveCounts", () => {
  it("separates published from drafts and drops sanity.*", () => {
    const counts = archiveCounts([
      TAG,
      TAG_DRAFT,
      SYSTEM_DRAFT,
      livedExperience("lived-experience-1", "A story"),
      { ...livedExperience("lived-experience-1", "An edit"), _id: "drafts.lived-experience-1" },
    ]);
    expect(counts.published).toEqual({ tag: 1, livedExperience: 1 });
    expect(counts.drafts).toEqual({ tag: 1, livedExperience: 1 });
    expect(counts.system).toBe(1);
  });
});

describe("countDraftDocuments", () => {
  it("ignores published version rows, however many an idempotent re-run piled up", () => {
    // `_tags_v` held 740 published rows for 67 documents before any draft
    // existed. A row count reports 740; the answer is 1.
    const rows = [
      ...Array.from({ length: 740 }, (_, i) => ({ parent: `tag-${i % 67}`, status: "published", latest: false })),
      { parent: "tag-42", status: "draft", latest: true },
    ];
    expect(countDraftDocuments(rows)).toEqual(new Set(["tag-42"]));
  });

  it("counts a document once however many draft rows it accumulated", () => {
    // One draft row per locale written, per run — four locales over two runs
    // is eight rows for one pending edit.
    const rows = Array.from({ length: 8 }, (_, i) => ({ parent: "lived-experience-1", status: "draft", latest: i === 7 }));
    expect(countDraftDocuments(rows).size).toBe(1);
  });
});

describe("latestIsDraft", () => {
  it("catches a draft buried behind a newer published version", () => {
    // What a re-run of `pnpm import:documents` AFTER the draft import does:
    // the draft row survives, so a count by status still says 1, but the
    // pending edit is no longer what an editor opening the document sees.
    const rows = [
      { parent: "lived-experience-1", status: "draft", latest: false },
      { parent: "lived-experience-2", status: "draft", latest: true },
    ];
    expect(countDraftDocuments(rows).size).toBe(2);
    expect(latestIsDraft(rows)).toEqual(new Set(["lived-experience-2"]));
  });
});

describe("collectValues", () => {
  const uploads = new Set([IMAGE_ID]);

  it("keys strings, uploads and rich text by path", () => {
    const collected = collectValues(
      {
        title: "A story",
        image: { asset: IMAGE_ID, alt: "Alt text" },
        content: { root: { children: [{ type: "paragraph" }] } },
        sections: [{ heading: "One" }, { heading: "Two" }],
      },
      uploads,
    );
    expect(collected.text.get("title")).toBe("A story");
    expect(collected.text.get("sections[1].heading")).toBe("Two");
    expect(collected.uploads.get("image.asset")).toBe(IMAGE_ID);
    expect(collected.richText.get("content")).toBe(1);
  });

  it("does not report an empty rich-text root as content", () => {
    const collected = collectValues({ content: { root: { children: [] } } }, uploads);
    expect(collected.richText.size).toBe(0);
  });

  it("skips the bookkeeping keys that differ between the transform and the read-back", () => {
    const collected = collectValues({ id: "x", _status: "draft", createdAt: "2026-01-01" }, uploads);
    expect(collected.text.size).toBe(0);
  });

  it("ignores nulls and empty strings, which the transform writes for absent fields", () => {
    const collected = collectValues({ label: null, description: "" }, uploads);
    expect(collected.text.size).toBe(0);
  });
});

describe("lexicalChildCount", () => {
  it("recognises an editor state and nothing else", () => {
    expect(lexicalChildCount({ root: { children: [1, 2] } })).toBe(2);
    expect(lexicalChildCount({ root: {} })).toBeUndefined();
    expect(lexicalChildCount({ asset: IMAGE_ID })).toBeUndefined();
    expect(lexicalChildCount("text")).toBeUndefined();
  });
});

describe("countPortableTextFields", () => {
  const block = { _key: "a", _type: "block", style: "normal", children: [{ _type: "span", text: "Body" }] };

  it("counts a bare Portable Text array", () => {
    expect(countPortableTextFields({ _id: "x", _type: "y", content: [block] }, "en")).toBe(1);
  });

  it("counts one lane of an {en, es, fr, ar} field, not four", () => {
    expect(
      countPortableTextFields({ _id: "x", _type: "y", content: { en: [block], es: [block] } }, "en"),
    ).toBe(1);
  });

  it("finds rich text nested inside a block array", () => {
    expect(
      countPortableTextFields({ _id: "x", _type: "y", sections: [{ _key: "s", body: [block] }] }, "en"),
    ).toBe(1);
  });

  it("does not count an empty array or an array of non-block members", () => {
    expect(countPortableTextFields({ _id: "x", _type: "y", content: [] }, "en")).toBe(0);
    expect(
      countPortableTextFields({ _id: "x", _type: "y", tags: [{ _ref: "tag-1", _type: "reference" }] }, "en"),
    ).toBe(0);
  });

  it("follows the en fallback for a lane Sanity never filled, exactly as Payload does", () => {
    expect(countPortableTextFields({ _id: "x", _type: "y", content: { en: [block] } }, "ar")).toBe(1);
  });

  it("counts the requested lane when it exists, not the English one", () => {
    expect(
      countPortableTextFields({ _id: "x", _type: "y", content: { en: [block], ar: [] } }, "ar"),
    ).toBe(0);
  });
});

describe("the recorded exceptions", () => {
  it("allows the two unmodelled author bios by id, not by field", () => {
    // `author.bio` is Portable Text on exactly 2 of 95 authors and
    // `payload/collections/authors.ts` has no rich-text field (Task 4's
    // decision, named in transform.ts's AUTHOR_DROPPED). Listing the two
    // documents rather than the field is what keeps a THIRD author growing a
    // bio a verification failure instead of a silent loss.
    expect(Object.keys(RICH_TEXT_NOT_MODELLED).sort()).toEqual([
      "authors/author-ccm-case-studies",
      "authors/author-ccm-community",
    ]);
    expect(Object.values(RICH_TEXT_NOT_MODELLED).reduce((a, b) => a + b, 0)).toBe(2);
  });

  it("pins Task 11's asset counts, which Tasks 12 and 13 may only read", () => {
    expect(EXPECTED_UPLOADS).toEqual({ media: 347, files: 48 });
  });
});

/* ------------------------------------------------ verifyImport, end to end */

/**
 * The checks above cover the pure helpers. These drive `verifyImport()`
 * itself through its own injection points — a fake `VerifyClient` for the
 * database side, a fixture archive and manifest for the other — and apply one
 * mutation at a time to what is read back.
 *
 * This is the test that was missing. Before it, `verifyImport` compared
 * *presence*: replacing every localized string in every document with the
 * literal "WRONG" passed all nineteen checks, and the six archive-only checks
 * had no injection point at all, so their failure modes were unproven by
 * construction.
 */

/** A tag with genuinely different `fr` and `ar` values, so a swap is visible. */
const TAG_TRANSLATED: SanityDoc = {
  _id: "tag-anxiety",
  _type: "tag",
  label: { en: "Anxiety", fr: "Anxiété", ar: "قلق" },
  orderRank: "0|1000ih:",
  useAsTheme: false,
  value: { _type: "slug", current: "anxiety" },
};

const BODY_BLOCKS = [
  { _type: "block", _key: "b1", style: "normal", children: [{ _type: "span", _key: "s1", text: "One" }] },
  { _type: "block", _key: "b2", style: "normal", children: [{ _type: "span", _key: "s2", text: "Two" }] },
  { _type: "block", _key: "b3", style: "normal", children: [{ _type: "span", _key: "s3", text: "Three" }] },
];

function verifyDocs(): SanityDoc[] {
  const lived = { ...livedExperience("lived-experience-1", "A story"), body: BODY_BLOCKS };
  return [
    TAG,
    TAG_TRANSLATED,
    REGIONAL_COMMUNITY,
    AUTHOR,
    lived,
    { ...lived, _id: "drafts.lived-experience-1", title: { en: "An edit" } },
    SYSTEM_DRAFT,
    { ...SYSTEM_DRAFT, _id: "drafts.sanity-previewUrlSecret-def" },
    { ...SYSTEM_DRAFT, _id: "drafts.sanity-previewUrlSecret-ghi" },
  ];
}

/** The manifest that agrees with `verifyDocs()`. */
function verifyManifest(): ArchiveManifest {
  return {
    totals: { documents: 9, published: 5, drafts: 1 },
    byType: {
      tag: { published: 2 },
      regionalCommunity: { published: 1 },
      author: { published: 1 },
      livedExperience: { published: 1, drafts: 1 },
    },
  };
}

/** A client that answers from the transform's own output — a faithful import. */
function fakeVerifyClient(docs: SanityDoc[], overrides: Partial<VerifyClient> = {}): VerifyClient {
  const published = documentTargets(docs, context());
  const drafts = draftTargets(docs, context());
  const ids = new Map<string, Set<string>>();
  const rows = new Map<string, Map<string, DocumentTarget>>();
  for (const target of published.targets) {
    if (target.kind !== "collection") continue;
    if (!ids.has(target.slug)) ids.set(target.slug, new Set());
    ids.get(target.slug)!.add(target.id);
    if (!rows.has(target.slug)) rows.set(target.slug, new Map());
    rows.get(target.slug)!.set(target.id, target);
  }
  for (const target of drafts.targets) {
    if (target.overPublished) continue;
    if (!ids.has(target.slug)) ids.set(target.slug, new Set());
    ids.get(target.slug)!.add(target.id);
  }
  return {
    async ids(collection) {
      return new Set(ids.get(collection) ?? []);
    },
    async docs(collection, locale) {
      // `en` fallback, exactly as the Payload-backed client reads.
      return [...(rows.get(collection)?.values() ?? [])].map((target) => ({
        ...((target.data[locale] ?? target.data.en) as PayloadData),
        id: target.id,
      }));
    },
    async draftVersions(collection) {
      return drafts.targets
        .filter((t) => t.slug === collection)
        .map((t) => ({ parent: t.id, status: "draft", latest: true }));
    },
    async countUploads(collection) {
      return EXPECTED_UPLOADS[collection];
    },
    async uploadIds() {
      return new Set<string>();
    },
    async global() {
      return null;
    },
    ...overrides,
  };
}

async function runVerify(overrides: Partial<VerifyClient> = {}, manifest = verifyManifest()) {
  const docs = verifyDocs();
  return verifyImport({
    quiet: true,
    client: fakeVerifyClient(docs, overrides),
    archive: { docs, manifest },
  });
}

const failed = (report: Awaited<ReturnType<typeof runVerify>>) =>
  report.checks.filter((c) => !c.ok).map((c) => c.name);

describe("verifyImport, driven through a fake client", () => {
  it("passes every check against a faithful import", async () => {
    const report = await runVerify();
    expect(failed(report)).toEqual([]);
    expect(report.ok).toBe(true);
  });

  it("fails when every string is replaced, which the presence-only version passed", async () => {
    // The finding this test exists for. `collectValues` only asked whether the
    // path was present, never what it held, so "WRONG" everywhere was a pass.
    const report = await runVerify({
      async docs(collection, locale) {
        const real = await fakeVerifyClient(verifyDocs()).docs(collection, locale);
        const wrong = (value: unknown): unknown => {
          if (typeof value === "string") return "WRONG";
          if (Array.isArray(value)) return value.map(wrong);
          if (value && typeof value === "object") {
            return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, k === "id" ? v : wrong(v)]));
          }
          return value;
        };
        return real.map((doc) => wrong(doc) as Record<string, unknown>);
      },
    });
    expect(failed(report)).toContain("locales/all-four-populated");
  });

  it("fails when two locales are swapped on the way back", async () => {
    // `tag-anxiety` is "Anxiété" in fr and "قلق" in ar. A presence check
    // cannot see the difference; a value check must.
    const report = await runVerify({
      async docs(collection, locale) {
        const swapped = locale === "fr" ? "ar" : locale === "ar" ? "fr" : locale;
        return fakeVerifyClient(verifyDocs()).docs(collection, swapped);
      },
    });
    expect(failed(report)).toContain("locales/all-four-populated");
  });

  it("fails when a rich-text field comes back with fewer blocks than it went in with", async () => {
    // Truncation, not emptiness: the previous check only asked whether the
    // Lexical root had any children at all, so losing two of three was a pass.
    const report = await runVerify({
      async docs(collection, locale) {
        const real = await fakeVerifyClient(verifyDocs()).docs(collection, locale);
        return real.map((doc) => {
          const body = doc.body as { root?: { children?: unknown[] } } | undefined;
          if (!body?.root?.children) return doc;
          return { ...doc, body: { ...body, root: { ...body.root, children: body.root.children.slice(0, 1) } } };
        });
      },
    });
    expect(failed(report)).toContain("richtext/non-empty");
  });

  it("fails when a document is missing, and when one is unexpected", async () => {
    const missing = await runVerify({
      async ids(collection) {
        const real = await fakeVerifyClient(verifyDocs()).ids(collection);
        real.delete("tag-anxiety");
        return real;
      },
    });
    expect(failed(missing)).toContain("documents/ids");
    expect(failed(missing)).toContain("documents/per-collection");
  });

  it("fails when an upload count moves", async () => {
    const report = await runVerify({
      async countUploads(collection) {
        return collection === "media" ? 346 : EXPECTED_UPLOADS.files;
      },
    });
    expect(failed(report)).toEqual(["uploads/media"]);
  });

  it("fails when a published version is newer than the draft", async () => {
    // The documents-after-drafts hazard: the rows survive, so the count of
    // documents carrying a draft is unchanged and only `latest` moves.
    const report = await runVerify({
      async draftVersions(collection) {
        const real = await fakeVerifyClient(verifyDocs()).draftVersions(collection);
        return real.map((row) => ({ ...row, latest: false }));
      },
    });
    expect(failed(report)).toEqual(["drafts/draft-is-the-newest-version"]);
  });

  it("fails when a global holds content the archive has none of", async () => {
    // With the fallback off, an empty read is a real outcome — which is what
    // makes this check able to fail at all. Read with `fallbackLocale: "en"`,
    // as it was, every global reported "populated in four locales" by
    // construction.
    const report = await runVerify({
      async global(slug, locale) {
        return slug === "homepage" && locale === "ar" ? { title: "Inherited" } : null;
      },
    });
    expect(failed(report)).toEqual(["globals/locales-match-the-archive"]);
  });

  it("fails when the manifest and the archive disagree", async () => {
    // An archive-scoped check, exercised through the archive injection point
    // the verifier previously did not have.
    const manifest = verifyManifest();
    manifest.byType!.tag = { published: 7 };
    const report = await runVerify({}, manifest);
    expect(failed(report)).toContain("manifest/published-by-type");
  });

  it("counts the archive-only checks apart from the database ones", async () => {
    const report = await runVerify();
    const archive = report.checks.filter((c) => c.scope === "archive").map((c) => c.name);
    expect(archive.sort()).toEqual([
      "documents/every-sanity-id-accounted",
      "manifest/438-reconciles-with-446",
      "manifest/content-drafts",
      "manifest/published-by-type",
      "manifest/published-total",
      "manifest/system-drafts-filtered",
    ]);
    expect(report.checks.filter((c) => c.scope === "database")).toHaveLength(13);
  });
});

describe("sameText", () => {
  it("is exact on ordinary strings", () => {
    expect(sameText("Adaptation", "Adaptation")).toBe(true);
    expect(sameText("Adaptation", "adaptation")).toBe(false);
    expect(sameText("2024", "2024-01-01T00:00:00.000Z")).toBe(false);
  });

  it("accepts the one spelling difference Postgres introduces", () => {
    // 124 of the 13,566 values compared are dates Sanity stores as
    // `2024-03-18` and Payload reads back as `2024-03-18T00:00:00.000Z`.
    expect(sameText("2024-03-18", "2024-03-18T00:00:00.000Z")).toBe(true);
    expect(sameText("2025-11-10T13:09:46Z", "2025-11-10T13:09:46.000Z")).toBe(true);
    expect(sameText("2024-03-18", "2024-03-19T00:00:00.000Z")).toBe(false);
  });
});
