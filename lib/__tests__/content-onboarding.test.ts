import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/content/internal/sanity-source", () => ({
  query: vi.fn(),
  queryPreviewable: vi.fn(),
}));
vi.mock("@/lib/content/internal/payload-source", () => ({
  query: vi.fn(),
  queryPreviewable: vi.fn(),
}));

import { query, queryPreviewable } from "@/lib/content/internal/sanity-source";
import {
  query as payloadQuery,
  queryPreviewable as payloadQueryPreviewable,
} from "@/lib/content/internal/payload-source";
import { ONBOARDING_GLOBAL_SLUGS } from "@/payload/globals/onboarding-content";
import {
  getActiveProfilePrompts,
  getOnboardingCommunities,
  getOnboardingContent,
} from "@/lib/content/onboarding";

const mockQuery = vi.mocked(query);
const mockQueryPreviewable = vi.mocked(queryPreviewable);
const mockPayloadQuery = vi.mocked(payloadQuery);
const mockPayloadQueryPreviewable = vi.mocked(payloadQueryPreviewable);

beforeEach(() => {
  mockQuery.mockReset();
  mockQueryPreviewable.mockReset();
  mockPayloadQuery.mockReset();
  mockPayloadQueryPreviewable.mockReset();
  // `activeBackend()` reads the environment per call, so an override left
  // behind by the Payload sections below would silently redirect these.
  delete process.env.CONTENT_BACKEND_ONBOARDING;
});
afterEach(() => {
  delete process.env.CONTENT_BACKEND_ONBOARDING;
  vi.restoreAllMocks();
});

describe("getOnboardingContent", () => {
  it("returns the content the source resolves", async () => {
    mockQuery.mockResolvedValue({ _id: "onb-en", language: "en", title: "Onboarding" });
    await expect(getOnboardingContent("en")).resolves.toEqual({
      _id: "onb-en",
      language: "en",
      title: "Onboarding",
    });
  });

  it("passes the requested locale through as $locale", async () => {
    mockQuery.mockResolvedValue(null);
    await getOnboardingContent("ar");
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), { locale: "ar" });
  });

  it("returns null when the source resolves null", async () => {
    mockQuery.mockResolvedValue(null);
    await expect(getOnboardingContent("en")).resolves.toBeNull();
  });

  it("uses query, not queryPreviewable — both original call sites used client.fetch directly", async () => {
    mockQuery.mockResolvedValue(null);
    await getOnboardingContent("en");
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockQueryPreviewable).not.toHaveBeenCalled();
  });

  it("throws through on failure — page.tsx has no try/catch around this read", async () => {
    mockQuery.mockRejectedValue(new Error("402 plan_limit_reached"));
    await expect(getOnboardingContent("en")).rejects.toThrow("402 plan_limit_reached");
  });
});

describe("getActiveProfilePrompts", () => {
  it("returns the prompts the source resolves", async () => {
    mockQueryPreviewable.mockResolvedValue([
      { id: "p1", prompt: { en: "What drew you to this work?" }, category: "motivation" },
    ]);
    await expect(getActiveProfilePrompts()).resolves.toEqual([
      { id: "p1", prompt: { en: "What drew you to this work?" }, category: "motivation" },
    ]);
  });

  it("defaults to [] when the source resolves a falsy value", async () => {
    mockQueryPreviewable.mockResolvedValue(null);
    await expect(getActiveProfilePrompts()).resolves.toEqual([]);
  });

  it("uses queryPreviewable, not query — the original omitted perspective/stega (draft-aware)", async () => {
    mockQueryPreviewable.mockResolvedValue([]);
    await getActiveProfilePrompts();
    expect(mockQueryPreviewable).toHaveBeenCalledTimes(1);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("throws through on failure — neither call site wraps this in try/catch", async () => {
    mockQueryPreviewable.mockRejectedValue(new Error("boom"));
    await expect(getActiveProfilePrompts()).rejects.toThrow("boom");
  });
});

describe("getOnboardingCommunities", () => {
  it("maps _id/slug/name/active rows to OnboardingRegionalCommunity[]", async () => {
    mockQuery.mockResolvedValue([
      { _id: "rc1", slug: "oceania", name: { en: "Oceania", ar: "أوقيانوسيا" }, active: true },
    ]);
    await expect(getOnboardingCommunities()).resolves.toEqual([
      { id: "rc1", slug: "oceania", name: { en: "Oceania", ar: "أوقيانوسيا" }, active: true },
    ]);
  });

  it("uses query, not queryPreviewable — the original called client.fetch directly", async () => {
    mockQuery.mockResolvedValue([]);
    await getOnboardingCommunities();
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockQueryPreviewable).not.toHaveBeenCalled();
  });

  it("degrades to [] on failure — the original getRegionalCommunities() swallowed its own errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValue(new Error("network error"));
    await expect(getOnboardingCommunities()).resolves.toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// The same contract, answered by Payload
// ---------------------------------------------------------------------------
//
// Every contract assertion above — the returned value, the empty-source case,
// which primitive is used, whether the function degrades or propagates — is
// restated here against Payload. What is NOT restated is how *Sanity* is
// asked: the GROQ text and the `{locale}` params describe one store's query
// language, and their Payload counterparts are the descriptors asserted below
// (the `active == true` filter as a `Where`, `order(orderRank)` as a `sort`,
// the missing GROQ limit as `pagination: false`).
//
// `getOnboardingContent` carries the one genuinely new thing: Phase 2 split
// `onboardingContent` into six globals to get under Postgres's 100-argument
// function cap, so this arm is `composeOnboardingContent` over six
// `findGlobal`s, and that compose is a DEEP merge — `fieldLabels` and
// `validationMessages` arrive from several of the six and must combine rather
// than overwrite. The merge is imported from
// `payload/globals/onboarding-content.ts` rather than rewritten here, so the
// tests below pin the composition, not a second copy of it.
// ---------------------------------------------------------------------------

/** A global's result as `findGlobal` really returns it: the content plus four
 *  housekeeping keys the `OnboardingContent` contract does not declare. */
function asGlobal(fields: Record<string, unknown>, slug: string): Record<string, unknown> {
  return {
    id: `${slug}-row-id`,
    globalType: slug,
    createdAt: "2026-06-17T06:45:35.000Z",
    updatedAt: "2026-09-04T11:11:16.417Z",
    ...fields,
  };
}

/** Answer the six global reads in ONBOARDING_GLOBAL_SLUGS order. */
function respondWithGlobals(parts: Record<string, unknown>[]): void {
  let call = 0;
  mockPayloadQuery.mockImplementation(async () => {
    const slug = ONBOARDING_GLOBAL_SLUGS[call];
    return asGlobal(parts[call++] ?? {}, slug) as never;
  });
}

describe("getOnboardingContent, answered by Payload", () => {
  beforeEach(() => {
    process.env.CONTENT_BACKEND_ONBOARDING = "payload";
  });

  it("reads all six onboarding globals, one per slug, and nothing else", async () => {
    respondWithGlobals([{ welcomeTitle: "Welcome" }, {}, {}, {}, {}, {}]);

    await getOnboardingContent("en");

    expect(mockPayloadQuery).toHaveBeenCalledTimes(ONBOARDING_GLOBAL_SLUGS.length);
    expect(ONBOARDING_GLOBAL_SLUGS.length).toBe(6);
    const slugs = mockPayloadQuery.mock.calls.map(([descriptor]) => (descriptor as { slug: string }).slug);
    expect(slugs).toEqual([...ONBOARDING_GLOBAL_SLUGS]);
    for (const [descriptor] of mockPayloadQuery.mock.calls) {
      expect(descriptor).toMatchObject({ type: "global", locale: "en", depth: 0 });
    }
    expect(mockQuery).not.toHaveBeenCalled();
    expect(mockQueryPreviewable).not.toHaveBeenCalled();
  });

  it("uses query, not queryPreviewable — both original call sites used client.fetch directly", async () => {
    respondWithGlobals([{ welcomeTitle: "Welcome" }, {}, {}, {}, {}, {}]);
    await getOnboardingContent("en");
    expect(mockPayloadQueryPreviewable).not.toHaveBeenCalled();
  });

  it("passes the requested locale to every one of the six reads", async () => {
    respondWithGlobals([{ welcomeTitle: "مرحباً" }, {}, {}, {}, {}, {}]);
    const content = await getOnboardingContent("ar");
    for (const [descriptor] of mockPayloadQuery.mock.calls) {
      expect((descriptor as { locale: string }).locale).toBe("ar");
    }
    // `language` is the locale that was asked for. Payload holds ONE localized
    // document, so unlike Sanity's `coalesce(<locale doc>, <en doc>)` there is
    // no other document whose own `language` could answer.
    expect(content?.language).toBe("ar");
  });

  it("merges fieldLabels and validationMessages across the six parts instead of overwriting them", async () => {
    // The reason the compose is a deep merge and not Object.assign: three of
    // the six globals declare `fieldLabels`, each holding one sub-group.
    respondWithGlobals([
      { welcomeTitle: "Welcome" },
      {
        basicInfoTitle: "Tell us about yourself",
        fieldLabels: { basicInfo: { firstName: "First Name" } },
        validationMessages: { basicInfo: { firstNameRequired: "Required" } },
      },
      {
        workInfoTitle: "Your work",
        fieldLabels: { workInfo: { workTypes: "Type of Work" } },
        validationMessages: { workInfo: { workTypesRequired: "Pick one" } },
      },
      { fieldLabels: { recentWork: { description: "Description" } } },
      { privacyFieldLabels: { showEmail: "Show email to other members" } },
      { fieldLabels: { review: { name: "Name" } }, validationMessages: { general: { validationError: "Oops" } } },
    ]);

    const content = await getOnboardingContent("en");

    expect(content?.fieldLabels).toEqual({
      basicInfo: { firstName: "First Name" },
      workInfo: { workTypes: "Type of Work" },
      recentWork: { description: "Description" },
      review: { name: "Name" },
    });
    expect(content?.validationMessages).toEqual({
      basicInfo: { firstNameRequired: "Required" },
      workInfo: { workTypesRequired: "Pick one" },
      general: { validationError: "Oops" },
    });
    // Keys that come from exactly one part are carried straight through.
    expect(content?.welcomeTitle).toBe("Welcome");
    expect(content?.basicInfoTitle).toBe("Tell us about yourself");
    expect(content?.workInfoTitle).toBe("Your work");
    expect(content?.privacyFieldLabels).toEqual({ showEmail: "Show email to other members" });
  });

  it("drops Payload's per-global housekeeping keys, which are not part of the contract", async () => {
    respondWithGlobals([{ welcomeTitle: "Welcome" }, {}, {}, {}, {}, {}]);
    const content = await getOnboardingContent("en");
    // Six globals carry six different `id`s and `updatedAt`s; merged, they
    // would silently mean "the sixth global's row", which is a fact about
    // nothing. `_id`/`_rev` are likewise unanswerable — no single id exists
    // and Payload has no revisions — and no consumer reads any of them.
    for (const key of ["id", "globalType", "createdAt", "updatedAt", "_id", "_rev"]) {
      expect(content).not.toHaveProperty(key);
    }
  });

  it("returns null when none of the six globals has been authored", async () => {
    // A Payload global always answers, even unsaved, so "no content" cannot be
    // a missing document the way `coalesce(…)[0]` expresses it. The API route
    // (`data ?? null`) and welcome-panel's `hasSanityContent` guard are both
    // written for the null.
    respondWithGlobals([
      { welcomeTitle: null, welcomeFeatures: [] },
      { fieldLabels: { basicInfo: { firstName: null } } },
      {},
      {},
      {},
      {},
    ]);
    await expect(getOnboardingContent("en")).resolves.toBeNull();
  });

  it("returns the content when a single leaf anywhere in the six is authored", async () => {
    respondWithGlobals([{}, {}, {}, {}, {}, { fieldLabels: { review: { name: "Name" } } }]);
    const content = await getOnboardingContent("en");
    expect(content).not.toBeNull();
    expect(content?.fieldLabels).toEqual({ review: { name: "Name" } });
  });

  it("throws through on failure — page.tsx has no try/catch around this read", async () => {
    mockPayloadQuery.mockRejectedValue(new Error("54023 too many arguments"));
    await expect(getOnboardingContent("en")).rejects.toThrow("54023 too many arguments");
  });
});

describe("getActiveProfilePrompts, answered by Payload", () => {
  beforeEach(() => {
    process.env.CONTENT_BACKEND_ONBOARDING = "payload";
  });

  it("returns the prompts the source resolves", async () => {
    mockPayloadQueryPreviewable.mockResolvedValue({
      docs: [
        {
          id: "p1",
          prompt: { en: "What drew you to this work?", es: null, fr: null, ar: null },
          category: "motivation",
          orderRank: "0|100008:",
        },
      ],
    } as never);
    // The input above is what Payload really hands back at `locale: "all"`:
    // every configured locale spelled out, `null` for the three nobody
    // translated. The expectation is the SANITY arm's shape (see the twin at
    // the top of this file) — a bare GROQ `prompt` returns only the authored
    // locales. This assertion previously pinned Payload's raw object, which
    // made the two arms of the same contract disagree; `internal/localized.ts`
    // now normalises it, so they agree.
    await expect(getActiveProfilePrompts()).resolves.toEqual([
      { id: "p1", prompt: { en: "What drew you to this work?" }, category: "motivation" },
    ]);
    expect(mockQueryPreviewable).not.toHaveBeenCalled();
  });

  it("asks for active prompts in orderRank order, unpaginated and in every locale", async () => {
    mockPayloadQueryPreviewable.mockResolvedValue({ docs: [] } as never);
    await getActiveProfilePrompts();
    expect(mockPayloadQueryPreviewable).toHaveBeenCalledWith({
      type: "find",
      collection: "profilePrompts",
      where: { active: { equals: true } },
      // GROQ returns every match; Payload's find stops at ten without this.
      sort: "orderRank",
      pagination: false,
      locale: "all",
      depth: 0,
    });
  });

  it("defaults to [] when the source resolves a falsy value", async () => {
    mockPayloadQueryPreviewable.mockResolvedValue(null as never);
    await expect(getActiveProfilePrompts()).resolves.toEqual([]);
  });

  it("uses queryPreviewable, not query — the original omitted perspective/stega (draft-aware)", async () => {
    mockPayloadQueryPreviewable.mockResolvedValue({ docs: [] } as never);
    await getActiveProfilePrompts();
    expect(mockPayloadQueryPreviewable).toHaveBeenCalledTimes(1);
    expect(mockPayloadQuery).not.toHaveBeenCalled();
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("throws through on failure — neither call site wraps this in try/catch", async () => {
    mockPayloadQueryPreviewable.mockRejectedValue(new Error("boom"));
    await expect(getActiveProfilePrompts()).rejects.toThrow("boom");
  });
});

describe("getOnboardingCommunities, answered by Payload", () => {
  beforeEach(() => {
    process.env.CONTENT_BACKEND_ONBOARDING = "payload";
  });

  it("maps id/slug/name/active rows to OnboardingRegionalCommunity[]", async () => {
    mockPayloadQuery.mockResolvedValue({
      docs: [
        {
          id: "regional-community-oceania",
          slug: "oceania",
          name: { en: "Oceania", ar: "أوقيانوسيا" },
          active: true,
          orderRank: "0|10002g:",
        },
      ],
    } as never);
    await expect(getOnboardingCommunities()).resolves.toEqual([
      {
        id: "regional-community-oceania",
        slug: "oceania",
        name: { en: "Oceania", ar: "أوقيانوسيا" },
        active: true,
      },
    ]);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("asks for active communities in orderRank order, unpaginated and in every locale", async () => {
    mockPayloadQuery.mockResolvedValue({ docs: [] } as never);
    await getOnboardingCommunities();
    expect(mockPayloadQuery).toHaveBeenCalledWith({
      type: "find",
      collection: "regionalCommunities",
      where: { active: { equals: true } },
      sort: "orderRank",
      pagination: false,
      locale: "all",
      // `coverImage`, `members` and `contact` are not projected by the GROQ
      // either; populating them would cost three joins per row for nothing.
      depth: 0,
    });
  });

  it("uses query, not queryPreviewable — the original called client.fetch directly", async () => {
    mockPayloadQuery.mockResolvedValue({ docs: [] } as never);
    await getOnboardingCommunities();
    expect(mockPayloadQuery).toHaveBeenCalledTimes(1);
    expect(mockPayloadQueryPreviewable).not.toHaveBeenCalled();
  });

  it("degrades to [] on failure — the original getRegionalCommunities() swallowed its own errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockPayloadQuery.mockRejectedValue(new Error("network error"));
    await expect(getOnboardingCommunities()).resolves.toEqual([]);
  });
});
