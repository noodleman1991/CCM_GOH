import { describe, expect, it } from "vitest";
import {
  buildTarget,
  documentTargets,
  groupSources,
  ImportTransformError,
  IMPORT_ORDER,
  LOCALES,
  localizedValue,
  perFieldLocale,
  dateOf,
  pointOf,
  slugOf,
  type DocumentTarget,
  type Locale,
  type PayloadData,
  type SanityDoc,
  type TransformContext,
} from "@/scripts/payload-import/lib/transform";
import {
  importDocumentTargets,
  type DocumentClient,
} from "@/scripts/payload-import/documents";
import { splitRow } from "@/payload/blocks/split-row";

/**
 * Every fixture in this file is a verbatim slice of the Phase 0 archive
 * (`backups/sanity-production_2-2026-09-02.tar.gz`, 479 ndjson lines), not an
 * invented shape. The counts quoted in the comments were measured across the
 * whole archive on 2026-09-04.
 *
 * The property the whole task turns on is that this transform is a pure
 * function of the archive: `documents.ts` supplies a Payload client and this
 * file supplies an in-memory one, and the two must agree.
 */

const IMAGE_REF = "image@file://./images/a188992df760eecc7333d6fbe0c264d859fb3523-3840x2160.png";
const IMAGE_ID = "image-a188992df760eecc7333d6fbe0c264d859fb3523-3840x2160-png";
const FILE_REF = "file@file://./files/ad19e079b1145a395f82c37cc7524ab3c34a4c85.pdf";
const FILE_ID = "file-ad19e079b1145a395f82c37cc7524ab3c34a4c85-pdf";

function context(known: string[] = []): TransformContext {
  return {
    assets: new Map([
      [IMAGE_ID, IMAGE_ID],
      [FILE_ID, FILE_ID],
    ]),
    known: new Set(known),
  };
}

function single(doc: SanityDoc) {
  return { kind: "single" as const, canonical: doc };
}

/* --------------------------------------------------------------- fixtures */

/** `tag` 89766952-… verbatim: `label` is `{en}` only on 27 of the 67 tags. */
const TAG: SanityDoc = {
  _id: "89766952-743e-4018-862d-9f4a56399c7b",
  _type: "tag",
  _createdAt: "2026-08-18T18:26:03Z",
  _updatedAt: "2026-08-18T18:26:38Z",
  category: "topic",
  color: "#205596",
  label: { en: "Climate Anxiety" },
  orderRank: "0|1000ig:",
  useAsTheme: false,
  value: { _type: "slug", current: "climate-anxiety" },
};

/** `workType` — one of only four documents using `internationalizedArray`. */
const WORK_TYPE: SanityDoc = {
  _id: "QnkPsvKZEt9LuBetGmHOvt",
  _type: "workType",
  key: "EDUCATION_TEACHING",
  isActive: true,
  order: 5,
  label: [
    { _key: "en", value: "Education & Teaching" },
    { _key: "es", value: "Educación y Enseñanza" },
    { _key: "fr", value: "Éducation et Enseignement" },
    { _key: "ar", value: "التعليم والتدريس" },
  ],
  description: [{ _key: "en", value: "Educational programs" }],
};

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
  _id: "author-elvis-tatas-lived-experience",
  _type: "author",
  name: "Dr. Elvis Tata's Lived Experience",
  slug: { _type: "slug", current: "elvis-tatas-lived-experience" },
  orderRank: "0|10001k:",
  communityMemberships: [
    { _key: "4r94c4mv0", community: { _ref: "regional-community-oceania", _type: "reference" }, role: "Researcher" },
  ],
};

/** A `caseStudy` with the two shapes obligations 1 and 3 are about. */
const CASE_STUDY: SanityDoc = {
  _id: "case-study-20",
  _type: "caseStudy",
  title: { en: "Title", es: "Título", fr: "Titre", ar: "عنوان" },
  slug: { _type: "slug", current: "case-study-20" },
  excerpt: { en: "Excerpt", es: "Extracto", fr: "Extrait", ar: "مقتطف" },
  content: [{ _key: "a", _type: "block", style: "normal", children: [{ _key: "b", _type: "span", marks: [], text: "Body" }] }],
  image: { _sanityAsset: IMAGE_REF, _type: "image", alt: "Young People" },
  tags: [],
  topic: "mental-health",
  region: "oce",
  authors: [{ _key: "z", name: "A. Author", role: "lead" }],
  locationText: { city: "Suva", country: "Fiji" },
  locationDisplayText: "Suva, Fiji",
  locationCountryCode: "FJ",
  studyLocation: { _type: "geopoint", lat: 22.75, lng: 89.25 },
  studyPeriod: { startDate: "", endDate: "" },
  featured: false,
  status: "approved",
};

const LIVED_EXPERIENCE: SanityDoc = {
  _id: "lived-experience-1",
  _type: "livedExperience",
  language: "en",
  title: { en: "A story" },
  slug: { _type: "slug", current: "a-story" },
  description: { en: "Description" },
  author: { _ref: "author-elvis-tatas-lived-experience", _type: "reference" },
  region: { _ref: "regional-community-oceania", _type: "reference" },
  tags: [],
  featured: false,
  noindex: false,
  publishedAt: "2025-11-10T13:09:46.029Z",
  videoLink: "https://youtu.be/abc",
  videoUrl: "https://youtu.be/abc",
  place: { countryCode: "FJ", precision: "country" },
};

const RESEARCH_OUTPUT: SanityDoc = {
  _id: "research-output-1",
  _type: "researchOutput",
  title: { en: "Report", es: "Informe", fr: "Rapport", ar: "تقرير" },
  slug: { _type: "slug", current: "report" },
  excerpt: { en: "Excerpt" },
  outputType: "report",
  layout: "report",
  coverImage: { _sanityAsset: IMAGE_REF, _type: "image", alt: "Cover" },
  versions: [{ _key: "v1", kind: "full", lang: "en", file: { _sanityAsset: FILE_REF, _type: "file" }, downloadCount: 0 }],
  organizations: null,
  tags: null,
  relatedCommunities: null,
  migratedFromReport: "report-1",
  publishDate: "2024-03-18T00:00:00.000Z",
  year: 2024,
  featured: false,
  status: "approved",
};

const AGENDA: SanityDoc = {
  _id: "agenda-1",
  _type: "agenda",
  title: { en: "Agenda", es: "Agenda", fr: "Agenda", ar: "أجندة" },
  slug: { _type: "slug", current: "agenda-1" },
  subtitle: { en: "Sub" },
  description: { en: "Desc" },
  coverImage: { _sanityAsset: IMAGE_REF, _type: "image", alt: "Cover" },
  files: [{ _key: "f1", language: "en", file: { _sanityAsset: FILE_REF, _type: "file" }, downloadCount: 3 }],
  agendaType: "research",
  accessLevel: "public",
  publishDate: "2024-03-18",
  year: 2024,
  featured: false,
  totalDownloadCount: 3,
};

/** One page group: 4 documents, one per language, sharing a slug. */
function pageGroup(): SanityDoc[] {
  return (["en", "es", "fr", "ar"] as const).map((language) => ({
    _id: `page-about-${language}`,
    _type: "page",
    language,
    title: { en: "About", es: "Acerca de", fr: "À propos", ar: "حول" }[language],
    slug: { _type: "slug", current: "about" },
    orderRank: "0|100000:",
    noindex: false,
    blocks: [
      {
        _key: `hero-${language}`,
        _type: "hero-1",
        title: `Hero ${language}`,
        imagePosition: "right",
        image: { _sanityAsset: IMAGE_REF, _type: "image", alt: "Hero" },
        body: [{ _key: "b1", _type: "block", style: "normal", children: [{ _key: "s1", _type: "span", marks: [], text: language }] }],
      },
    ],
  }));
}

/* ------------------------------------------------------------------ atoms */

describe("transform atoms", () => {
  it("reads both slug shapes in the archive", () => {
    // 4 of the 446 published documents store a bare `{current}` with no `_type`.
    expect(slugOf({ _type: "slug", current: "about" })).toBe("about");
    expect(slugOf({ current: "about" })).toBe("about");
    expect(slugOf(undefined)).toBeUndefined();
  });

  it("resolves all three localized shapes, falling back to en", () => {
    expect(localizedValue({ en: "a", fr: "b" }, "fr")).toBe("b");
    expect(localizedValue({ en: "a" }, "fr")).toBe("a");
    expect(localizedValue([{ _key: "es", value: "hola" }], "es")).toBe("hola");
    // A bare value is the same in every locale — `caseStudy.content` and every
    // `image.alt` are stored this way.
    expect(localizedValue("plain", "ar")).toBe("plain");
  });

  it("coerces empty strings to null against date columns", () => {
    // `caseStudyDraft.studyPeriod` is `{startDate: "", endDate: ""}` and one
    // published caseStudy has an empty startDate too.
    expect(dateOf("")).toBeNull();
    expect(dateOf("   ")).toBeNull();
    expect(dateOf("2024-03-18")).toBe("2024-03-18");
  });

  it("converts a Sanity geopoint to Payload's [longitude, latitude]", () => {
    expect(pointOf({ _type: "geopoint", lat: 22.75, lng: 89.25 })).toEqual([89.25, 22.75]);
    // `caseStudyDraft.studyLocation` is `{}`.
    expect(pointOf({})).toBeNull();
  });
});

/* ------------------------------------------------------------ id identity */

describe("id preservation", () => {
  it("keeps the Sanity _id as the Payload id on a Lane-B document", () => {
    const target = buildTarget("tag", single(TAG), context());
    expect(target.id).toBe("89766952-743e-4018-862d-9f4a56399c7b");
    expect(target.slug).toBe("tags");
    expect(target.sources).toEqual(["89766952-743e-4018-862d-9f4a56399c7b"]);
  });

  it("keeps the English document's _id when four Lane-A documents collapse into one", () => {
    // Measured: in every one of the 9 page groups and 7 region groups, the
    // English member holds the canonical unsuffixed id.
    const { targets } = documentTargets(pageGroup(), context());
    expect(targets).toHaveLength(1);
    expect(targets[0].id).toBe("page-about-en");
    expect(targets[0].sources.sort()).toEqual(["page-about-ar", "page-about-en", "page-about-es", "page-about-fr"]);
  });

  it("creates with data.id set, so Payload does not mint one", async () => {
    const { store, client } = memoryClient();
    const target = buildTarget("tag", single(TAG), context());
    await importDocumentTargets([target], { client });
    expect(store.get("tags")?.get(TAG._id as string)?.en?.id).toBe(TAG._id);
  });
});

/* ------------------------------------------------------------- idempotency */

describe("idempotency", () => {
  it("creates on the first run and updates on the second, with an identical store", async () => {
    const docs: SanityDoc[] = [TAG, WORK_TYPE, REGIONAL_COMMUNITY, AUTHOR, ...pageGroup()];
    const { store, client } = memoryClient();

    const first = await importDocumentTargets(documentTargets(docs, context()).targets, { client });
    expect(first.created).toBe(5);
    expect(first.updated).toBe(0);
    const afterFirst = snapshot(store);

    const second = await importDocumentTargets(documentTargets(docs, context()).targets, { client });
    expect(second.created).toBe(0);
    expect(second.updated).toBe(5);
    expect(snapshot(store)).toEqual(afterFirst);
  });

  it("mints array and block row ids deterministically, so a re-run rewrites the same rows", () => {
    const a = buildTarget("author", single(AUTHOR), context(["regional-community-oceania"]));
    const b = buildTarget("author", single(AUTHOR), context(["regional-community-oceania"]));
    const rows = (t: DocumentTarget) => (t.data.en!.communityMemberships as PayloadData[])[0].id;
    expect(rows(a)).toBe(rows(b));
    // The source document id is part of the key because the primary key spans
    // the whole table, and because a localized blocks table stores one row per
    // locale.
    expect(rows(a)).toBe("author-elvis-tatas-lived-experience:communityMemberships:4r94c4mv0");
  });

  it("skips existing documents in resume mode instead of updating them", async () => {
    const { client } = memoryClient();
    const targets = documentTargets([TAG], context()).targets;
    await importDocumentTargets(targets, { client });
    const second = await importDocumentTargets(targets, { client, resume: true });
    expect(second).toMatchObject({ created: 0, updated: 0, skipped: 1 });
  });
});

/* ----------------------------------------------------------- slug grouping */

describe("locale collapsing by slug", () => {
  it("groups the four language documents of a page by slug, not by translation.metadata", () => {
    // Only 1 of the 9 page groups has translation.metadata and it links 2 of
    // the 4 languages; slug grouping is complete for all 9.
    const docs = [
      ...pageGroup(),
      { _id: "meta-1", _type: "translation.metadata", translations: [] },
    ];
    const { groups, skipped } = groupSources(docs);
    expect(groups.get("page")).toHaveLength(1);
    expect(skipped).toEqual(["meta-1"]);
  });

  it("writes one Payload document with four populated locales", () => {
    const { targets } = documentTargets(pageGroup(), context());
    expect(Object.keys(targets[0].data).sort()).toEqual(["ar", "en", "es", "fr"]);
    expect(targets[0].data.fr!.title).toBe("À propos");
    expect(targets[0].data.ar!.title).toBe("حول");
    // The grouping key itself is not localized.
    for (const locale of LOCALES) expect(targets[0].data[locale]!.slug).toBe("about");
  });

  it("writes only the locales that differ for a Lane-B document", () => {
    // `tag.label` is `{en}` on 27 of 67 tags: three redundant writes saved,
    // and Payload's `fallback: true` serves es/fr/ar from en exactly as
    // Sanity did.
    expect(Object.keys(buildTarget("tag", single(TAG), context()).data)).toEqual(["en"]);
    // `workType.label` has all four, so all four are written.
    expect(Object.keys(buildTarget("workType", single(WORK_TYPE), context()).data).sort()).toEqual([
      "ar",
      "en",
      "es",
      "fr",
    ]);
  });

  it("refuses a Lane-A group with no English document", () => {
    const noEnglish = pageGroup().filter((d) => d.language !== "en");
    expect(() => groupSources(noEnglish)).toThrow(/no English document/);
  });
});

/* ------------------------------------------------- per-field locale writes */

describe("a locale holds only what Sanity translates", () => {
  it("does not copy English into a field the locale has no translation for", () => {
    // `workType.description` is `[{_key:"en"}]` only; `label` has all four. The
    // whole-document collapse this replaces wrote the entire `es` payload the
    // moment `label` differed — and by then the English description had
    // already been substituted for `es`. Measured over the archive: 112
    // (document, locale, field) triples held a hard copy of English in a row
    // Sanity never translated, invisible to every count and frozen against
    // future English edits.
    const target = buildTarget("workType", single(WORK_TYPE), context());
    expect(target.data.en!.description).toBe("Educational programs");
    expect(target.data.es!.label).toBe("Educación y Enseñanza");
    expect(target.data.es!.description).toBeNull();
    expect(target.data.fr!.description).toBeNull();
    expect(target.data.ar!.description).toBeNull();
  });

  it("writes a locale whose translation is spelled exactly like English", () => {
    // The mirror of the same bug: `tag-adaptation.label.fr` is literally
    // "Adaptation", so a difference test saw nothing to write and the `fr` row
    // was never created. Presence is decided by whether Sanity holds a value,
    // never by whether it differs.
    const sameWord: SanityDoc = { ...TAG, label: { en: "Adaptation", fr: "Adaptation" } };
    const target = buildTarget("tag", single(sameWord), context());
    expect(Object.keys(target.data).sort()).toEqual(["en", "fr"]);
    expect(target.data.fr!.label).toBe("Adaptation");
  });

  it("keeps English on a required localized field, because Payload rejects a null there", () => {
    // `tags.label` is `localized` **and** `required`. Payload validates the
    // incoming value for the operation's locale, and `required && !value` is a
    // hard error — so the one class of field that cannot be cleared keeps the
    // fallback, deliberately and on the record.
    const translatedDescription: SanityDoc = {
      ...TAG,
      label: { en: "Climate Anxiety" },
      description: { en: "About climate anxiety", es: "Sobre la ansiedad climática" },
    };
    const target = buildTarget("tag", single(translatedDescription), context());
    expect(target.data.es!.description).toBe("Sobre la ansiedad climática");
    expect(target.data.es!.label).toBe("Climate Anxiety");
  });

  it("reports what it cleared and what the schema forced it to keep", () => {
    // The two outcomes named explicitly, so the required-field exception can
    // never grow silently.
    const localized = new Map([
      ["label", { path: "label", required: true }],
      ["description", { path: "description", required: false }],
      ["image.alt", { path: "image.alt", required: false }],
    ]);
    // `built` is the ordinary build, which already carries the translation
    // wherever Sanity has one and the English fallback wherever it does not;
    // `translated` is the same build with the fallback off.
    const built = { label: "English", description: "Español", image: { asset: "a", alt: "English" } };
    const translated = { label: null, description: "Español", image: { asset: "a", alt: null } };
    const result = perFieldLocale(built, translated, localized);
    expect(result.cleared).toEqual(["image.alt"]);
    expect(result.keptEnglish).toEqual(["label"]);
    expect(result.payload).toEqual({
      label: "English",
      description: "Español",
      image: { asset: "a", alt: null },
    });
    // The input is untouched — `buildTarget` compares it against `en`.
    expect(built.image.alt).toBe("English");
  });

  it("still writes nothing but `en` for a document with no translations at all", () => {
    // The floor: a bare value is one value for every language, so it is not a
    // translation and must not conjure three more locale rows.
    expect(Object.keys(buildTarget("tag", single(TAG), context()).data)).toEqual(["en"]);
  });
});

/* ------------------------------------------------------- reference ordering */

describe("reference order", () => {
  it("fails loudly on a reference to a document that has not been imported yet", () => {
    expect(() => buildTarget("author", single(AUTHOR), context([]))).toThrow(ImportTransformError);
    expect(() => buildTarget("author", single(AUTHOR), context([]))).toThrow(
      /references "regional-community-oceania", which has not been imported yet/,
    );
  });

  it("puts every referenced type before its referrers", () => {
    const before = (type: string) => IMPORT_ORDER.indexOf(type);
    expect(before("regionalCommunity")).toBeLessThan(before("author"));
    expect(before("author")).toBeLessThan(before("livedExperience"));
    expect(before("tag")).toBeLessThan(before("caseStudy"));
    expect(before("agenda")).toBeLessThan(before("page"));
    expect(before("caseStudy")).toBeLessThan(before("regionalCommunityPage"));
    expect(before("newsPost")).toBeLessThan(before("homepage"));
  });

  it("resolves references once the target has been imported", () => {
    const target = buildTarget("author", single(AUTHOR), context(["regional-community-oceania"]));
    const memberships = target.data.en!.communityMemberships as PayloadData[];
    expect(memberships[0].community).toBe("regional-community-oceania");
  });

  it("refuses a reference-shaped field holding something that is not a reference", () => {
    // The last silent drop in a file whose doctrine is hard errors: an entry
    // with no `_ref` used to resolve to undefined and be filtered out, so a
    // list of bare id strings became a null field with no trace. Zero
    // occurrences in today's archive — but this is exactly the shape the
    // malformed lived-experience tags had.
    const author = {
      ...AUTHOR,
      communityMemberships: [{ _key: "m1", community: "regional-community-oceania", role: "member" }],
    };
    expect(() => buildTarget("author", single(author), context(["regional-community-oceania"]))).toThrow(
      /is not a Sanity reference/,
    );
  });

  it("refuses a reference list of bare id strings", () => {
    // What `caseStudy.tags` would look like if the malformed-tag defect
    // recurred: a list of plain ids where references belong. It used to become
    // `tags: []`, indistinguishable from a case study with no tags at all.
    const caseStudy = { ...CASE_STUDY, tags: ["tag-farmers"] };
    expect(() => buildTarget("caseStudy", single(caseStudy), context(["tag-farmers"]))).toThrow(
      /is not a Sanity reference/,
    );
  });

  it("refuses a hole in the middle of a reference list", () => {
    const caseStudy = {
      ...CASE_STUDY,
      tags: [{ _ref: "tag-farmers", _type: "reference" }, null],
    };
    expect(() => buildTarget("caseStudy", single(caseStudy), context(["tag-farmers"]))).toThrow(
      /may not contain a hole/,
    );
  });
});

/* ---------------------------------------------- the seven measured obligations */

describe("the measured obligations", () => {
  it("1. writes Sanity's `status` into `moderationStatus`", () => {
    // The field could not keep the name: Payload's drafts feature owns
    // `_status`. Applies to caseStudies, livedExperiences, researchOutputs
    // and events.
    expect(buildTarget("caseStudy", single(CASE_STUDY), context()).data.en!.moderationStatus).toBe("approved");
    expect(buildTarget("researchOutput", single(RESEARCH_OUTPUT), context()).data.en!.moderationStatus).toBe("approved");
    expect(buildTarget("caseStudy", single(CASE_STUDY), context()).data.en!.status).toBeUndefined();
  });

  it("2. writes the bare `image.alt` string into the en locale", () => {
    // Real data stores a plain string, never an `{en,…}` lane; Payload keeps
    // `alt` localized and `fallback: true` covers es/fr/ar.
    const target = buildTarget("caseStudy", single(CASE_STUDY), context());
    expect(target.data.en!.image).toEqual({ asset: IMAGE_ID, alt: "Young People", caption: null });
    // The other locales are written because the title differs, and the alt
    // resolves to the same string there rather than to null.
    expect((target.data.ar!.image as PayloadData).alt).toBe("Young People");
  });

  it("3. coerces empty strings to null on date and point fields", () => {
    const target = buildTarget("caseStudy", single(CASE_STUDY), context());
    // The group itself stays an object — a null group crashes Payload's
    // beforeValidate (see the group test below) — but its date leaves are null,
    // which is what a `date` column can actually take.
    expect(target.data.en!.studyPeriod).toEqual({ startDate: null, endDate: null });
    expect(target.data.en!.studyLocation).toEqual([89.25, 22.75]);
  });

  it("never writes null for a group, because Payload cannot take one", () => {
    // `beforeValidate/promise.ts` substitutes `{}` only when
    // `typeof siblingData[name] !== "object"` — and `typeof null === "object"`,
    // so a null group is passed through and its `upload` child reads `.asset`
    // off null. Measured: six authors with no image killed a real run.
    const noImage = { ...AUTHOR };
    const target = buildTarget("author", single(noImage), context(["regional-community-oceania"]));
    expect(target.data.en!.image).toEqual({ asset: null, alt: null });
  });

  it("4. treats livedExperience.region as a regionalCommunity reference, not a region code", () => {
    // 42 of 42 populated documents store a reference; the schema's declared
    // fixed-7 code is fiction.
    const target = buildTarget(
      "livedExperience",
      single(LIVED_EXPERIENCE),
      context(["author-elvis-tatas-lived-experience", "regional-community-oceania"]),
    );
    expect(target.data.en!.region).toBe("regional-community-oceania");
  });

  it("5. carries livedExperience.videoUrl, which the Sanity schema never declared", () => {
    // 56 of 56 populated, read by five lib/content modules.
    const target = buildTarget(
      "livedExperience",
      single(LIVED_EXPERIENCE),
      context(["author-elvis-tatas-lived-experience", "regional-community-oceania"]),
    );
    expect(target.data.en!.videoUrl).toBe("https://youtu.be/abc");
  });

  it("6. does not import onboardingContent's drifted scalars, but does import what lines up", () => {
    const doc: SanityDoc = {
      _id: "onboarding-content-en",
      _type: "onboardingContent",
      language: "en",
      slug: { _type: "slug", current: "onboarding-content-english" },
      welcomeTitle: "Welcome",
      welcomeFeatures: [{ _key: "f1", title: "Feature", description: "Desc" }],
      // Stored as a sentence where the global declares a group. Every consumer
      // reads `content?.basicInfoFieldHints?.usernameHint || t(...)`, and a
      // string has no `usernameHint`, so this has always fallen through to i18n.
      basicInfoFieldHints: "اسمك سيكون مرئياً لأعضاء المجتمع الآخرين",
      welcomeSteps: "a string where an array is declared",
      navigationTexts: { finish: "Finish", next: "Next" },
      visibilityLabels: { public: "Public", connections: "Connections" },
    };
    const target = buildTarget("onboardingContent", { kind: "perLocale", canonical: doc, docs: { en: doc } }, context());
    const data = target.data.en!;
    expect(data.welcomeTitle).toBe("Welcome");
    expect((data.welcomeFeatures as PayloadData[])[0]).toMatchObject({ title: "Feature", description: "Desc" });
    expect(data.basicInfoFieldHints).toBeUndefined();
    expect(data.welcomeSteps).toBeUndefined();
    // `navigationTexts` is declared with {continue, back, submit, submitting};
    // the four stored keys match none of them.
    expect(data.navigationTexts).toBeUndefined();
    // `visibilityLabels.public` is declared and kept; `connections` is not.
    expect(data.visibilityLabels).toEqual({ public: "Public" });
    expect(target.unplaced).toEqual(
      expect.arrayContaining([
        expect.stringContaining("basicInfoFieldHints (stored string, declared group)"),
        expect.stringContaining("welcomeSteps (stored string, declared array)"),
        expect.stringContaining("visibilityLabels.connections (no declared field)"),
      ]),
    );
  });

  it("7. resolves the three file-backed upload fields to `files`, not `media`", () => {
    const agenda = buildTarget("agenda", single(AGENDA), context());
    expect((agenda.data.en!.files as PayloadData[])[0].file).toBe(FILE_ID);
    expect(agenda.data.en!.coverImage).toMatchObject({ asset: IMAGE_ID });

    const output = buildTarget("researchOutput", single(RESEARCH_OUTPUT), context());
    expect((output.data.en!.versions as PayloadData[])[0].file).toBe(FILE_ID);

    const withVideo = { ...LIVED_EXPERIENCE, videoFile: { _sanityAsset: FILE_REF, _type: "file" } };
    const lived = buildTarget(
      "livedExperience",
      single(withVideo),
      context(["author-elvis-tatas-lived-experience", "regional-community-oceania"]),
    );
    expect(lived.data.en!.videoFile).toBe(FILE_ID);
  });
});

/* --------------------------------------------------------------- the archive */

describe("archive-specific shapes", () => {
  it("resolves assets from `_sanityAsset` strings, because the archive has no asset._ref", () => {
    // `@sanity/export` rewrote all 759 asset references; an importer written
    // against `_ref` resolves nothing and silently produces documents with no
    // images.
    const target = buildTarget("agenda", single(AGENDA), context());
    expect(target.data.en!.coverImage).toEqual({ asset: IMAGE_ID, alt: "Cover" });
  });

  it("fails loudly when an asset is missing from Task 11's map", () => {
    const ctx: TransformContext = { assets: new Map(), known: new Set() };
    expect(() => buildTarget("agenda", single(AGENDA), ctx)).toThrow(/not in the Task 11 asset map/);
  });

  it("resolves the images embedded inside Portable Text", () => {
    const doc: SanityDoc = {
      _id: "docsChapter-1",
      _type: "docsChapter",
      collection: "global-agenda",
      title: "Chapter",
      slug: { _type: "slug", current: "chapter" },
      order: 1,
      body: [
        { _key: "i1", _type: "image", _sanityAsset: IMAGE_REF, alt: { en: "Illustration" }, placement: "center" },
      ],
    };
    const target = buildTarget("docsChapter", single(doc), context());
    const body = target.data.en!.body as { root: { children: { fields: Record<string, unknown> }[] } };
    // The `image` embed block declares `media` + `sanityAssetId`; it has no
    // field that could hold a `_sanityAsset` string.
    expect(body.root.children[0].fields).toMatchObject({
      blockType: "image",
      media: IMAGE_ID,
      sanityAssetId: IMAGE_ID,
      alt: "Illustration",
      placement: "center",
    });
    expect(body.root.children[0].fields._sanityAsset).toBeUndefined();
  });

  it("maps regionalCommunityPage.whyJoinCTA onto hero1 and ignores the stored `cta-1`", () => {
    // All 28 documents store `_type: "cta-1"` and all 28 are wrong: the field
    // set is hero-1's (`image` on 24, `imagePosition` on 20). Spec §7.1.
    const doc: SanityDoc = {
      _id: "regional-community-page-oceania",
      _type: "regionalCommunityPage",
      language: "en",
      title: "Oceania",
      slug: { _type: "slug", current: "oceania" },
      useTemplate: true,
      regionalCommunity: { _ref: "regional-community-oceania", _type: "reference" },
      welcomeHero: { _type: "hero-1", title: "Welcome" },
      whyJoinCTA: {
        _type: "cta-1",
        title: "Why join",
        image: { _sanityAsset: IMAGE_REF, _type: "image", alt: "Join" },
        imagePosition: "left",
      },
      agendasGrid: { mode: "manual", gridColumns: "grid-cols-3", maxItems: 6, showTitle: true, title: "Agendas" },
      testimonialsBlock: { showSection: true, title: "Voices", testimonials: [] },
    };
    const target = buildTarget(
      "regionalCommunityPage",
      { kind: "perLocale", canonical: doc, docs: { en: doc } },
      context(["regional-community-oceania"]),
    );
    const why = target.data.en!.whyJoinCTA as PayloadData;
    // hero1 carries image/imagePosition; cta1 does not.
    expect(why.image).toEqual({ asset: IMAGE_ID, alt: "Join" });
    expect(why.imagePosition).toBe("left");

    const sections = target.data.en!.sections as PayloadData[];
    expect(sections.map((s) => s.contentType)).toEqual(["agendas", "testimonials"]);
    expect(sections[0]).toMatchObject({ blockType: "contentGrid", mode: "manual", title: "Agendas" });
    // `showSection` is true on all 17 documents that have the block, so it
    // encodes nothing the block's presence does not already say.
    expect(sections[1].showSection).toBeUndefined();
  });

  it("normalizes the legacy sectionWidth value the enum no longer offers", () => {
    // 4 of the 19 stored values are `"full"`. Both renderers test
    // `=== "narrow"`, so "full" and "default" already render identically —
    // and a Postgres enum that has never heard of "full" would fail the run.
    const docs = pageGroup().map((d) => ({
      ...d,
      blocks: [{ _key: "c", _type: "cta-1", title: "CTA", sectionWidth: "full" }],
    }));
    const { targets } = documentTargets(docs, context());
    expect((targets[0].data.en!.blocks as PayloadData[])[0].sectionWidth).toBe("default");
  });

  it("refuses a Sanity field no Payload field claims", () => {
    expect(() => buildTarget("tag", single({ ...TAG, mysteryField: "x" }), context())).toThrow(
      /no Payload field claims "mysteryField"/,
    );
  });

  it("refuses a Sanity document type with no Payload target", () => {
    expect(() => groupSources([{ _id: "x", _type: "unheardOf" }])).toThrow(/has no Payload target/);
  });

  it("skips drafts and Sanity's own bookkeeping types", () => {
    const { skipped } = groupSources([
      TAG,
      { ...TAG, _id: "drafts.89766952-743e-4018-862d-9f4a56399c7b" },
      { _id: "secret", _type: "sanity.previewUrlSecret" },
    ]);
    // The 30 real drafts are Task 13's, imported as draft *versions* on top of
    // the published document.
    expect(skipped.sort()).toEqual(["drafts.89766952-743e-4018-862d-9f4a56399c7b", "secret"]);
  });

  it("publishes collections that have drafts enabled", () => {
    // Without an explicit `_status`, Payload would file every imported
    // document as an unpublished draft.
    expect(buildTarget("tag", single(TAG), context()).data.en!._status).toBe("published");
    // A collection with no drafts must NOT carry the field.
    expect(buildTarget("workType", single(WORK_TYPE), context()).data.en!._status).toBeUndefined();
  });

  it("keeps Sanity's createdAt so editorial ordering survives", () => {
    expect(buildTarget("tag", single(TAG), context()).data.en!.createdAt).toBe("2026-08-18T18:26:03Z");
  });
});

/* -------------------------------------------------------- in-memory client */

type Store = Map<string, Map<string, Partial<Record<Locale, PayloadData>>>>;

function memoryClient(): { store: Store; client: DocumentClient } {
  const store: Store = new Map();
  const globals = new Map<string, Partial<Record<Locale, PayloadData>>>();
  const collection = (slug: string) => {
    const existing = store.get(slug);
    if (existing) return existing;
    const created = new Map<string, Partial<Record<Locale, PayloadData>>>();
    store.set(slug, created);
    return created;
  };
  return {
    store,
    client: {
      async existingIds(slug) {
        return new Set(collection(slug).keys());
      },
      async latestDraftDocuments() {
        return [];
      },
      async globalExists(slug) {
        return globals.has(slug);
      },
      async create({ collection: slug, data, locale }) {
        const bucket = collection(slug);
        if (bucket.has(String(data.id))) throw new Error(`duplicate id ${String(data.id)}`);
        bucket.set(String(data.id), { [locale]: data });
      },
      async update({ collection: slug, id, data, locale }) {
        const bucket = collection(slug);
        const doc = bucket.get(id);
        if (!doc) throw new Error(`no such document ${slug}/${id}`);
        doc[locale] = { ...data, id };
      },
      async updateGlobal({ slug, data, locale }) {
        const doc = globals.get(slug) ?? {};
        doc[locale] = data;
        globals.set(slug, doc);
      },
    },
  };
}

function snapshot(store: Store): string {
  return JSON.stringify(
    [...store].map(([slug, docs]) => [slug, [...docs].sort(([a], [b]) => a.localeCompare(b))]),
  );
}

/* ------------------------------------------------- failure and concurrency */

describe("write loop", () => {
  it("finishes the run and throws once, rather than discarding the documents after a bad one", async () => {
    // A single unimportable document must not cost the rest of the import.
    // This is not hypothetical: the `onboardingContent` global cannot
    // currently be read at all (197 locale columns vs Postgres's 100-argument
    // limit on `json_build_array`, SQLSTATE 54023), and an abort-on-first-error
    // loop threw before a single other document was written.
    const { store, client } = memoryClient();
    const broken: DocumentClient = {
      ...client,
      async create(args) {
        if (args.data.id === "89766952-743e-4018-862d-9f4a56399c7b") throw new Error("boom");
        return client.create(args);
      },
    };
    const targets = documentTargets([TAG, WORK_TYPE, REGIONAL_COMMUNITY], context()).targets;
    await expect(
      importDocumentTargets(targets, { client: broken, attempts: 1 }),
    ).rejects.toThrow(/some documents could not be imported[\s\S]*tag 89766952/);
    // The other two still landed.
    expect(store.get("workTypes")?.size).toBe(1);
    expect(store.get("regionalCommunities")?.size).toBe(1);
  });

  it("aborts early once too many documents have failed", async () => {
    const { client } = memoryClient();
    const broken: DocumentClient = {
      ...client,
      async create() {
        throw new Error("boom");
      },
    };
    const many = Array.from({ length: 20 }, (_, i) => ({ ...TAG, _id: `tag-${i}` }));
    await expect(
      importDocumentTargets(documentTargets(many, context()).targets, {
        client: broken,
        attempts: 1,
        maxFailures: 3,
      }),
    ).rejects.toThrow(/more than 3 documents failed; stopping early/);
  });

  it("refuses to run when a draft is the newest version, before writing anything", async () => {
    // Payload bases every edit on the version flagged `latest`, and a
    // published save takes that flag. Running this importer after
    // `pnpm import:drafts` therefore leaves all 30 draft rows in place while
    // burying every pending edit — 21 of them in-flight moderation work on
    // lived experiences — with nothing in the output to say so.
    const { store, client } = memoryClient();
    const afterDrafts: DocumentClient = {
      ...client,
      async latestDraftDocuments(collection) {
        return collection === "tags" ? ["tag-under-review"] : [];
      },
    };
    const targets = documentTargets([TAG, WORK_TYPE], context()).targets;
    await expect(importDocumentTargets(targets, { client: afterDrafts })).rejects.toThrow(
      /have a draft as their newest version[\s\S]*tags\/tag-under-review[\s\S]*--allow-after-drafts/,
    );
    // Nothing was written: the guard runs before the first create.
    expect(store.size).toBe(0);
  });

  it("writes anyway when the caller passes --allow-after-drafts", async () => {
    const { store, client } = memoryClient();
    const afterDrafts: DocumentClient = {
      ...client,
      async latestDraftDocuments() {
        return ["tag-under-review"];
      },
    };
    const targets = documentTargets([TAG, WORK_TYPE], context()).targets;
    await importDocumentTargets(targets, { client: afterDrafts, allowAfterDrafts: true });
    expect(store.get("tags")?.size).toBe(1);
    expect(store.get("workTypes")?.size).toBe(1);
  });

  it("overlaps siblings but keeps a barrier between types", async () => {
    // Serial writes against the Neon pooler cost ~6s per document; the barrier
    // is what keeps a page from being written before the agendas it links to.
    const order: string[] = [];
    const seen = new Set<string>();
    const { client } = memoryClient();
    const watched: DocumentClient = {
      ...client,
      async create(args) {
        order.push(args.collection);
        seen.add(args.collection);
        // Every workType must wait until every tag is done.
        if (args.collection === "workTypes") expect(seen.has("tags")).toBe(true);
        await new Promise((r) => setTimeout(r, 1));
        return client.create(args);
      },
    };
    const tags = Array.from({ length: 8 }, (_, i) => ({ ...TAG, _id: `tag-${i}`, value: { current: `t${i}` } }));
    const workTypes = Array.from({ length: 4 }, (_, i) => ({ ...WORK_TYPE, _id: `wt-${i}`, key: `K${i}` }));
    await importDocumentTargets(documentTargets([...tags, ...workTypes], context()).targets, {
      client: watched,
      concurrency: 4,
    });
    expect(order.slice(0, 8).every((c) => c === "tags")).toBe(true);
    expect(order.slice(8).every((c) => c === "workTypes")).toBe(true);
  });
});

/* -------------------------------------------- shapes the real run uncovered */

describe("shapes only the real run uncovered", () => {
  it("treats an empty string as an absent translation, not a translation to nothing", () => {
    // `caseStudy` 2U42vBhgRaBYxnTE6w726U stores
    // `title: {en: "…", es: "", fr: "", ar: ""}` and `caseStudies.title` is
    // localized AND required — reading `ar` literally wrote null and Payload
    // rejected the whole document. Two case studies were lost to three empty
    // strings before this rule existed.
    expect(localizedValue({ en: "Title", es: "", fr: "", ar: "" }, "ar")).toBe("Title");
    expect(localizedValue([{ _key: "en", value: "T" }, { _key: "fr", value: "" }], "fr")).toBe("T");
    const emptyLanes = { ...CASE_STUDY, title: { en: "Title", es: "", fr: "", ar: "" } };
    const target = buildTarget("caseStudy", single(emptyLanes), context());
    for (const locale of LOCALES) {
      if (target.data[locale]) expect(target.data[locale]!.title).toBe("Title");
    }
  });

  it("accepts the three-column split-row three real documents store", () => {
    // Sanity declares `rule.max(2)` and never enforced it;
    // `page-toolkits-{ar,es,fr}` each store three columns, and Payload's
    // `maxRows` IS enforced. Modelled on the data, like `whyJoinCTA`.
    expect(splitRow.fields.find((f) => "name" in f && f.name === "splitColumns")).toMatchObject({ maxRows: 3 });
  });
});
