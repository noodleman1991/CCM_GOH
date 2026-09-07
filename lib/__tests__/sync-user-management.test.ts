/**
 * `lib/actions/sync-user-management.ts` — Task 15's `queryRaw` write path.
 *
 * It has no rendered route of its own, so `compareRoute` does not apply; two
 * of its readers (`/[locale]/onboarding`, `/[locale]/dashboard/profile/edit`)
 * are Clerk-gated pages the harness cannot render either. So it is verified
 * directly, by shape and by primitive.
 *
 * **Both source modules are mocked, never the module under test**, so the real
 * branch runs. And the primitive assertion is the point: `queryRaw` (raw, write
 * client / drafts-visible, uncached) and `query` (published, cached an hour)
 * return the same shape, so a reader that picked the wrong one is invisible to
 * a test that only inspects the result. Every read in this file feeds a write
 * decision — "does this key already exist, and under which id" — so a cached
 * read could drive a duplicate create.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sanityQueryRaw = vi.fn();
const sanityCreate = vi.fn();
const sanityUpdate = vi.fn();

const payloadQuery = vi.fn();
const payloadQueryRaw = vi.fn();
const payloadCreate = vi.fn();
const payloadUpdate = vi.fn();

vi.mock("@/lib/content/internal/sanity-source", () => ({
  queryRaw: (...a: unknown[]) => sanityQueryRaw(...a),
  createDocument: (...a: unknown[]) => sanityCreate(...a),
  updateDocument: (...a: unknown[]) => sanityUpdate(...a),
}));
vi.mock("@/lib/content/internal/payload-source", () => ({
  query: (...a: unknown[]) => payloadQuery(...a),
  queryRaw: (...a: unknown[]) => payloadQueryRaw(...a),
  createDocument: (...a: unknown[]) => payloadCreate(...a),
  updateDocument: (...a: unknown[]) => payloadUpdate(...a),
}));
vi.mock("@/lib/authz", () => ({
  getActor: async () => ({ role: "admin" }),
  isStaff: () => true,
}));

import {
  fetchUserManagementOptions,
  fetchUserManagementOptionsWithLocale,
  syncExpertiseAreasToSanity,
  syncWorkTypesToSanity,
  validateUserManagementSync,
} from "@/lib/actions/sync-user-management";

/** The six keys `PRISMA_WORK_TYPES` declares, as Payload rows. */
const WORK_TYPE_ROWS = [
  "RESEARCH",
  "POLICY",
  "LIVED_EXPERIENCE_EXPERT",
  "NGO",
  "COMMUNITY_ORGANIZATION",
  "EDUCATION_TEACHING",
].map((key, i) => ({
  id: `wt-${i}`,
  key,
  label: { en: key, es: key, fr: key, ar: key },
  description: { en: "", es: "", fr: "", ar: "" },
  order: i + 1,
  isActive: true,
}));

const EXPERTISE_ROWS = ["CLIMATE_CHANGE", "MENTAL_HEALTH", "HEALTH"].map((key, i) => ({
  id: `ea-${i}`,
  key,
  label: { en: key, es: key, fr: key, ar: key },
  description: { en: "", es: "", fr: "", ar: "" },
  order: i + 1,
  isActive: true,
}));

/** Answer a `find` descriptor with the rows for its collection. */
function findsReturn(workTypes: unknown[], expertiseAreas: unknown[]) {
  return async (descriptor: { collection: string }) => ({
    docs: descriptor.collection === "workTypes" ? workTypes : expertiseAreas,
  });
}

/** Cleared per test, so these assert the module's default, not the ambient env. */
const FLAGS = ["CONTENT_BACKEND", "CONTENT_BACKEND_USER_MANAGEMENT"] as const;
let ambient: Record<string, string | undefined> = {};

beforeEach(() => {
  vi.clearAllMocks();
  ambient = Object.fromEntries(FLAGS.map((f) => [f, process.env[f]]));
  for (const flag of FLAGS) delete process.env[flag];
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  payloadQueryRaw.mockImplementation(findsReturn(WORK_TYPE_ROWS, EXPERTISE_ROWS));
  payloadCreate.mockResolvedValue({ id: "new-1" });
  payloadUpdate.mockResolvedValue(undefined);
  sanityQueryRaw.mockResolvedValue({ workTypes: [], expertiseAreas: [] });
  sanityCreate.mockResolvedValue({ id: "sanity-1" });
  sanityUpdate.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  for (const flag of FLAGS) {
    if (ambient[flag] === undefined) delete process.env[flag];
    else process.env[flag] = ambient[flag];
  }
});

describe("the backend flag", () => {
  it("leaves every path on Sanity when nothing is set", async () => {
    await syncWorkTypesToSanity();
    await validateUserManagementSync();
    await fetchUserManagementOptionsWithLocale("es");

    expect(sanityQueryRaw).toHaveBeenCalled();
    expect(payloadQueryRaw).not.toHaveBeenCalled();
    expect(payloadQuery).not.toHaveBeenCalled();
  });
});

describe("on Payload", () => {
  beforeEach(() => {
    process.env.CONTENT_BACKEND_USER_MANAGEMENT = "payload";
  });

  it("reads through the uncached primitive, so a stale read cannot drive a write", async () => {
    await syncWorkTypesToSanity();

    expect(payloadQueryRaw).toHaveBeenCalled();
    // `query` is published + cached an hour. Same shape, wrong freshness: a
    // cached "this key does not exist" drives a duplicate create.
    expect(payloadQuery).not.toHaveBeenCalled();
    expect(sanityQueryRaw).not.toHaveBeenCalled();
  });

  it("reads every option, active and inactive, ordered the way Sanity ordered them", async () => {
    await syncWorkTypesToSanity();

    const descriptor = payloadQueryRaw.mock.calls[0][0] as Record<string, unknown>;
    expect(descriptor).toMatchObject({
      type: "find",
      collection: "workTypes",
      sort: ["order", "key"],
      pagination: false,
      locale: "all",
    });
    // GROQ's `*[_type == "workType"]` filtered on nothing — inactive options
    // are part of the sync's own bookkeeping and must stay visible.
    expect(descriptor.where).toBeUndefined();
  });

  it("updates an existing option by Payload field name, never a Sanity document shape", async () => {
    await syncWorkTypesToSanity();

    const calls = payloadUpdate.mock.calls.map(([c]) => c as Record<string, unknown>);
    expect(calls.length).toBeGreaterThan(0);
    for (const call of calls) {
      expect(call.collection).toBe("workTypes");
      const data = call.data as Record<string, unknown>;
      // Payload drops unknown data keys silently: a Sanity-shaped write here
      // would report success and change nothing.
      expect(data).not.toHaveProperty("_type");
      expect(data).not.toHaveProperty("_id");
      for (const key of Object.keys(data)) {
        expect(["label", "description", "order", "isActive"]).toContain(key);
      }
    }
    expect(payloadCreate).not.toHaveBeenCalled();
  });

  it("writes all four locales — a localized field takes one write per locale", async () => {
    await syncWorkTypesToSanity();

    const forResearch = payloadUpdate.mock.calls
      .map(([c]) => c as { id: string; locale?: string; data: Record<string, unknown> })
      .filter((c) => c.id === "wt-0");
    const localesWritten = forResearch.filter((c) => "label" in c.data).map((c) => c.locale);
    expect([...localesWritten].sort()).toEqual(["ar", "en", "es", "fr"]);
    // Every localized write carries a string, not Sanity's [{_key, value}].
    for (const call of forResearch) {
      if ("label" in call.data) expect(typeof call.data.label).toBe("string");
    }
  });

  it("writes the non-localized fields exactly once, not once per locale", async () => {
    await syncWorkTypesToSanity();

    const orderWrites = payloadUpdate.mock.calls
      .map(([c]) => c as { id: string; data: Record<string, unknown> })
      .filter((c) => c.id === "wt-0" && "order" in c.data);
    expect(orderWrites).toHaveLength(1);
    expect(orderWrites[0].data).toMatchObject({ order: 0, isActive: true });
  });

  it("mints an id when creating, because `id` is a required text column in Payload", async () => {
    payloadQueryRaw.mockImplementation(findsReturn([], EXPERTISE_ROWS));

    await syncWorkTypesToSanity();

    const created = payloadCreate.mock.calls.map(([c]) => c as { collection: string; data: Record<string, unknown> });
    expect(created).toHaveLength(6);
    for (const call of created) {
      expect(call.collection).toBe("workTypes");
      expect(typeof call.data.id).toBe("string");
      expect(String(call.data.id).length).toBeGreaterThan(0);
      expect(call.data).not.toHaveProperty("_type");
    }
    // Deterministic and key-derived, so a re-run after a partial failure
    // cannot mint a second row for the same key.
    expect(created.map((c) => c.data.id)).toContain("workType-RESEARCH");
  });

  it("syncs expertise areas into their own collection", async () => {
    await syncExpertiseAreasToSanity();

    for (const [call] of payloadUpdate.mock.calls as [{ collection: string }][]) {
      expect(call.collection).toBe("expertiseAreas");
    }
  });

  it("validates against Payload's keys and reports the same counts contract", async () => {
    const result = await validateUserManagementSync();

    expect(result.isValid).toBe(true);
    expect(result.missingWorkTypes).toEqual([]);
    expect(result.counts.sanityWorkTypes).toBe(6);
    expect(result.counts.sanityExpertiseAreas).toBe(3);
  });

  it("reports a missing key rather than pretending the sync is complete", async () => {
    payloadQueryRaw.mockImplementation(findsReturn(WORK_TYPE_ROWS.slice(0, 2), EXPERTISE_ROWS));

    const result = await validateUserManagementSync();

    expect(result.isValid).toBe(false);
    expect(result.missingWorkTypes).toContain("NGO");
  });

  it("returns the `_id`-keyed shape both rendered readers expect", async () => {
    const options = await fetchUserManagementOptions();

    expect(options.workTypes[0]).toMatchObject({ _id: "wt-0", key: "RESEARCH", order: 1 });
    expect(options.expertiseAreas).toHaveLength(3);
  });

  it("resolves one locale with an English fallback, reproducing the GROQ coalesce", async () => {
    payloadQueryRaw.mockImplementation(
      findsReturn(
        [{ id: "wt-0", key: "RESEARCH", label: "Investigación", description: "…", order: 1, isActive: true }],
        [],
      ),
    );

    const options = await fetchUserManagementOptionsWithLocale("es");

    const descriptor = payloadQueryRaw.mock.calls[0][0] as Record<string, unknown>;
    expect(descriptor).toMatchObject({ locale: "es", fallbackLocale: "en" });
    // `isActive == true` — a checkbox, not a select, so no enum value can be
    // passed that Postgres would reject.
    expect(descriptor.where).toEqual({ isActive: { equals: true } });
    expect(options.workTypes[0]).toMatchObject({ _id: "wt-0", key: "RESEARCH", label: "Investigación" });
  });

  it("falls back to the hardcoded list when Payload answers empty, exactly as on Sanity", async () => {
    payloadQueryRaw.mockImplementation(findsReturn([], []));

    const options = await fetchUserManagementOptionsWithLocale("fr");

    expect(options.workTypes.length).toBeGreaterThan(0);
    expect(options.workTypes[0].label).toBe("Recherche et Analyse");
  });

  it("falls back rather than throwing when Payload is unreachable", async () => {
    payloadQueryRaw.mockRejectedValue(new Error("payload down"));

    const options = await fetchUserManagementOptionsWithLocale("en");

    expect(options.workTypes.length).toBeGreaterThan(0);
  });

  it("uses `key` as the label of last resort, the way the GROQ coalesce did", async () => {
    payloadQueryRaw.mockImplementation(
      findsReturn([{ id: "wt-9", key: "RESEARCH", label: null, description: null, order: 1, isActive: true }], []),
    );

    const options = await fetchUserManagementOptionsWithLocale("ar");

    expect(options.workTypes[0].label).toBe("RESEARCH");
    expect(options.workTypes[0].description).toBe("");
  });
});
