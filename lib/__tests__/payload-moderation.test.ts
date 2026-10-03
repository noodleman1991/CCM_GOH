/**
 * The four Studio moderation workflows, as Payload hooks and admin buttons.
 *
 * Two things this file deliberately does NOT do:
 *
 * 1. **It never writes to the database.** Every transition below runs against an
 *    in-memory fake that reproduces the behaviours read out of `payload/dist/`:
 *    an update merges onto the latest version, `draft` decides only whether the
 *    result is a new draft version or the published row, and `_status` is a
 *    field with `defaultValue: "draft"` that nothing but the written data ever
 *    sets to `"published"`. The real-database counterpart is
 *    `scripts/payload-moderation-live-check.ts`, which drives two throwaway
 *    documents through the same transitions and deletes them again.
 * 2. **It never asserts that an email arrived.** The Resend sending domain is
 *    unverified, so every recipient but one is rejected with a 403 and status
 *    mail has been failing silently in production. What is asserted is that the
 *    send was *attempted*, with which arguments — the sender is injected.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  applyModerationAction,
  availableModerationActions,
  MODERATED_COLLECTIONS,
  MODERATION_STATUSES,
  MODERATION_WORKFLOWS,
  ModerationActionNotAvailableError,
  ModerationNotesRequiredError,
  runModerationSideEffects,
  SKIP_MODERATION_SIDE_EFFECTS,
  takedownsThatWouldNotReachThePublicCopy,
  type ModerationAction,
  type ModerationChange,
  type ModerationClient,
  type ModeratedCollection,
  type ModerationSideEffectDeps,
  type ModerationStatus,
} from "@/payload/hooks/moderation";
import { CaseStudies } from "@/payload/collections/case-studies";
import { Events } from "@/payload/collections/events";
import { LivedExperiences } from "@/payload/collections/lived-experiences";
import { ResearchOutputs } from "@/payload/collections/research-outputs";

type Doc = Record<string, unknown>;

// ---------------------------------------------------------------------------
// The transition table is Studio's table
// ---------------------------------------------------------------------------

/**
 * Transcribed from `sanity/actions/*-actions.ts`'s `visibleWhenStatus`, by
 * hand, from the four files rather than from the port. If the port drifts from
 * Studio, this is what notices.
 */
const STUDIO_VISIBILITY: Record<ModeratedCollection, Record<ModerationAction, ModerationStatus[]>> = {
  caseStudies: {
    approve: ["pending", "revision"],
    revision: ["pending"],
    reject: ["pending", "revision"],
  },
  events: {
    approve: ["pending", "revision"],
    revision: ["pending", "approved"],
    reject: ["pending", "revision", "approved"],
  },
  livedExperiences: {
    approve: ["pending", "revision"],
    revision: ["pending"],
    reject: ["pending", "revision"],
  },
  researchOutputs: {
    approve: ["pending", "revision"],
    revision: ["pending", "approved"],
    reject: ["pending", "revision", "approved"],
  },
};

describe("the moderation transition table", () => {
  it.each(MODERATED_COLLECTIONS)("offers exactly what Studio offered on %s", (collection) => {
    for (const status of MODERATION_STATUSES) {
      const expected = (["approve", "revision", "reject"] as const).filter((action) =>
        STUDIO_VISIBILITY[collection][action].includes(status),
      );
      expect(availableModerationActions(collection, status)).toEqual(expected);
    }
  });

  it.each(MODERATED_COLLECTIONS)("offers nothing on %s when moderationStatus is unset", (collection) => {
    // Studio's gate is `visibleWhenStatus.includes(doc?.status)`, and an unset
    // status matches nothing. Preserved deliberately — see the note below about
    // livedExperiences, where this is 56 real documents rather than a corner.
    expect(availableModerationActions(collection, undefined)).toEqual([]);
    expect(availableModerationActions(collection, null)).toEqual([]);
    expect(availableModerationActions(collection, "draft")).toEqual([]);
  });

  it("never offers a takedown that would land on a draft nobody reads", () => {
    expect(takedownsThatWouldNotReachThePublicCopy()).toEqual([]);
  });

  it("agrees with each collection's real versions.drafts setting", () => {
    const configs = {
      caseStudies: CaseStudies,
      events: Events,
      livedExperiences: LivedExperiences,
      researchOutputs: ResearchOutputs,
    } as const;
    for (const collection of MODERATED_COLLECTIONS) {
      expect(MODERATION_WORKFLOWS[collection].hasDrafts).toBe(Boolean(configs[collection].versions));
    }
  });

  it("case studies and events email their sender the outcome; the others don't", () => {
    expect(MODERATION_WORKFLOWS.caseStudies.notifies).toBe(true);
    expect(MODERATION_WORKFLOWS.events.notifies).toBe(true);
    expect(MODERATION_WORKFLOWS.livedExperiences.notifies).toBe(false);
    expect(MODERATION_WORKFLOWS.researchOutputs.notifies).toBe(false);
  });

  it("wires the hook and the buttons onto all four moderated collections", () => {
    const configs = [CaseStudies, Events, LivedExperiences, ResearchOutputs];
    for (const config of configs) {
      // At least one, not exactly one: Task 17 added a second `afterChange`
      // to `caseStudies` for the Algolia sync. What this asserts is that the
      // moderation hook is still wired, not that it is alone.
      expect(config.hooks?.afterChange?.length).toBeGreaterThanOrEqual(1);
      const ui = config.fields.find(
        (field) => "name" in field && field.name === "moderationActions",
      );
      expect(ui).toMatchObject({ type: "ui" });
    }
  });
});

// ---------------------------------------------------------------------------
// A fake Payload, reproducing the two version behaviours that matter
// ---------------------------------------------------------------------------

interface UpdateCall {
  collection: string;
  id: string;
  data: Doc;
  draft: boolean;
  overrideAccess?: boolean;
  context?: Record<string, unknown>;
}

/**
 * `updateByID` always merges onto the latest version; `draft` only decides
 * whether the result becomes another draft version or the published row. Both
 * are reproduced here so the tests exercise the same shape the real client has.
 */
function fakeStore(initial: Record<string, { published: Doc; draft?: Doc }>) {
  const rows = structuredClone(initial);
  const updates: UpdateCall[] = [];

  const latest = (id: string): Doc => {
    const row = rows[id];
    return { ...(row.draft ?? row.published) };
  };

  const client: ModerationClient & { update: (args: Record<string, unknown>) => Promise<unknown> } = {
    findByID: async ({ collection, id, draft }) => {
      const row = rows[id];
      if (!row) throw new Error(`no such document: ${collection}/${id}`);
      return draft ? latest(id) : { ...row.published };
    },
    update: async (args) => {
      const { collection, id, data, draft, overrideAccess, context } = args as unknown as UpdateCall;
      const row = rows[id];
      if (!row) throw new Error(`no such document: ${collection}/${id}`);
      const merged = { ...latest(id), ...data };
      if (draft) {
        row.draft = { ...merged, _status: "draft" };
      } else {
        row.published = { ...merged, _status: "published" };
        delete row.draft;
      }
      updates.push({ collection, id, data, draft, overrideAccess, context });
      return { ...merged };
    },
  };

  return { client, rows, updates, latest };
}

const CASE_STUDY_ID = "cs-1";

function caseStudyStore(overrides: Doc = {}) {
  return fakeStore({
    [CASE_STUDY_ID]: {
      published: {
        id: CASE_STUDY_ID,
        slug: "a-study",
        title: "A Study",
        moderationStatus: "pending",
        submittedBy: "user_1",
        _status: "published",
        ...overrides,
      },
    },
  });
}

// ---------------------------------------------------------------------------
// applyModerationAction
// ---------------------------------------------------------------------------

describe("applyModerationAction", () => {
  const now = new Date("2026-09-08T10:00:00.000Z");

  it("approves a pending case study, publishes it, and stamps the review dates", async () => {
    const store = caseStudyStore();
    const result = await applyModerationAction(store.client, {
      collection: "caseStudies",
      id: CASE_STUDY_ID,
      action: "approve",
      now,
    });

    expect(result).toEqual({
      id: CASE_STUDY_ID,
      collection: "caseStudies",
      from: "pending",
      to: "approved",
      published: true,
    });
    expect(store.updates).toHaveLength(1);
    expect(store.updates[0]).toMatchObject({
      collection: "caseStudies",
      id: CASE_STUDY_ID,
      // Publishes — see the module header. Without this the approval never
      // reaches the site: the gate is published AND approved.
      draft: false,
      // The collection's own `update: isEditor` gets to decide as well.
      overrideAccess: false,
    });
    expect(store.updates[0].data).toEqual({
      moderationStatus: "approved",
      publishedAt: "2026-09-08T10:00:00.000Z",
      reviewedAt: "2026-09-08T10:00:00.000Z",
      // `draft: false` alone does not publish. `_status` carries
      // `defaultValue: "draft"` and Payload's update only ever *forces*
      // `"draft"`, never `"published"` — the admin's Publish button sends this
      // in its body. Found by the live check: without it the approval succeeded
      // and the case study stayed invisible.
      _status: "published",
    });
  });

  it("does not send _status on a collection that has no versions", async () => {
    for (const collection of ["events", "researchOutputs"] as const) {
      const store = fakeStore({ x: { published: { id: "x", moderationStatus: "pending", _status: "published" } } });
      await applyModerationAction(store.client, { collection, id: "x", action: "approve", now });
      // Payload rejects a query or a write naming `_status` on a collection
      // without `versions.drafts` — there is no such field.
      expect(store.updates[0].data).not.toHaveProperty("_status");
    }
  });

  it("never publishes on revision or reject", async () => {
    for (const action of ["revision", "reject"] as const) {
      const store = caseStudyStore();
      await applyModerationAction(store.client, {
        collection: "caseStudies",
        id: CASE_STUDY_ID,
        action,
        reviewNotes: "notes",
        now,
      });
      expect(store.updates[0].data).not.toHaveProperty("_status");
      expect(store.updates[0].draft).toBe(true);
    }
  });

  it("keeps an existing publishedAt when re-approving after a revision", async () => {
    const store = caseStudyStore({ moderationStatus: "revision", publishedAt: "2024-01-01T00:00:00.000Z" });
    await applyModerationAction(store.client, {
      collection: "caseStudies",
      id: CASE_STUDY_ID,
      action: "approve",
      now,
    });
    expect(store.updates[0].data.publishedAt).toBe("2024-01-01T00:00:00.000Z");
    expect(store.updates[0].data.reviewedAt).toBe("2026-09-08T10:00:00.000Z");
  });

  it("requests a revision without publishing, and records the reviewer's notes", async () => {
    const store = caseStudyStore();
    const result = await applyModerationAction(store.client, {
      collection: "caseStudies",
      id: CASE_STUDY_ID,
      action: "revision",
      reviewNotes: "  Please add a methods section.  ",
      now,
    });

    expect(result.to).toBe("revision");
    expect(result.published).toBe(false);
    // A revision request must not push the in-flight draft live as a side
    // effect of recording a decision.
    expect(store.updates[0].draft).toBe(true);
    expect(store.updates[0].data).toEqual({
      moderationStatus: "revision",
      reviewNotes: "Please add a methods section.",
      reviewedAt: "2026-09-08T10:00:00.000Z",
    });
  });

  it("refuses revision and rejection without notes, and never touches the store", async () => {
    for (const action of ["revision", "reject"] as const) {
      const store = caseStudyStore();
      await expect(
        applyModerationAction(store.client, { collection: "caseStudies", id: CASE_STUDY_ID, action, now }),
      ).rejects.toBeInstanceOf(ModerationNotesRequiredError);
      await expect(
        applyModerationAction(store.client, {
          collection: "caseStudies",
          id: CASE_STUDY_ID,
          action,
          reviewNotes: "   ",
          now,
        }),
      ).rejects.toBeInstanceOf(ModerationNotesRequiredError);
      expect(store.updates).toEqual([]);
    }
  });

  it("refuses an action the current status does not offer, reading the status from the store", async () => {
    const store = caseStudyStore({ moderationStatus: "approved" });
    // Studio hid "Request Revision" on an approved case study; a caller that
    // sends it anyway is refused rather than obeyed.
    await expect(
      applyModerationAction(store.client, {
        collection: "caseStudies",
        id: CASE_STUDY_ID,
        action: "revision",
        reviewNotes: "please revise",
        now,
      }),
    ).rejects.toBeInstanceOf(ModerationActionNotAvailableError);
    expect(store.updates).toEqual([]);
  });

  it("refuses every action on a document whose moderationStatus is unset", async () => {
    const store = fakeStore({
      le: { published: { id: "le", moderationStatus: null, _status: "published" } },
    });
    await expect(
      applyModerationAction(store.client, { collection: "livedExperiences", id: "le", action: "approve", now }),
    ).rejects.toBeInstanceOf(ModerationActionNotAvailableError);
    expect(store.updates).toEqual([]);
  });

  it("acts on the in-flight draft, not the published row, on a drafts collection", async () => {
    const store = fakeStore({
      [CASE_STUDY_ID]: {
        published: { id: CASE_STUDY_ID, moderationStatus: "approved", title: "Old", _status: "published" },
        draft: { id: CASE_STUDY_ID, moderationStatus: "pending", title: "Resubmitted", _status: "draft" },
      },
    });
    const result = await applyModerationAction(store.client, {
      collection: "caseStudies",
      id: CASE_STUDY_ID,
      action: "approve",
      now,
    });
    // The gate ran against the draft (pending), not the published row
    // (approved) — approving a resubmission is the whole job.
    expect(result.from).toBe("pending");
    // And the approve published the draft's content.
    expect(store.rows[CASE_STUDY_ID].published).toMatchObject({
      title: "Resubmitted",
      moderationStatus: "approved",
      _status: "published",
    });
    expect(store.rows[CASE_STUDY_ID].draft).toBeUndefined();
  });

  it("writes a direct, immediately-public change on the two collections without drafts", async () => {
    for (const collection of ["events", "researchOutputs"] as const) {
      const store = fakeStore({ x: { published: { id: "x", moderationStatus: "approved", _status: "published" } } });
      await applyModerationAction(store.client, {
        collection,
        id: "x",
        action: "reject",
        reviewNotes: "Duplicate listing.",
        now,
      });
      // No versions to hide behind: the takedown takes effect at once.
      expect(store.updates[0].draft).toBe(false);
      expect(store.rows.x.published.moderationStatus).toBe("rejected");
    }
  });

  it("stamps each workflow's own date field and nothing else", async () => {
    const cases = [
      { collection: "caseStudies" as const, expected: { publishedAt: 1, reviewedAt: 1 } },
      { collection: "events" as const, expected: {} },
      { collection: "livedExperiences" as const, expected: { publishedAt: 1 } },
      { collection: "researchOutputs" as const, expected: { publishDate: 1 } },
    ];
    for (const { collection, expected } of cases) {
      const store = fakeStore({ x: { published: { id: "x", moderationStatus: "pending", _status: "published" } } });
      await applyModerationAction(store.client, { collection, id: "x", action: "approve", now });
      const written = Object.keys(store.updates[0].data).filter(
        (key) => key !== "moderationStatus" && key !== "_status",
      );
      expect(written.sort()).toEqual(Object.keys(expected).sort());
    }
  });
});

// ---------------------------------------------------------------------------
// The side effects the Sanity webhook used to perform
// ---------------------------------------------------------------------------

function sideEffectDeps(overrides: Partial<ModerationSideEffectDeps> = {}) {
  const notified: { input: Parameters<ModerationSideEffectDeps["notify"]>[0] }[] = [];
  const marked: { id: string; status: string }[] = [];
  const revalidated: { tags: string[]; paths: string[] }[] = [];
  const deps: ModerationSideEffectDeps = {
    notify: async (input) => {
      notified.push({ input });
      return `sent: ${input.status}`;
    },
    markNotified: async (id, status) => {
      marked.push({ id, status });
    },
    revalidate: (targets) => {
      revalidated.push(targets);
    },
    siteUrl: "https://example.org",
    ...overrides,
  };
  return { deps, notified, marked, revalidated };
}

function change(partial: Partial<ModerationChange> & { doc: Doc }): ModerationChange {
  return {
    collection: "caseStudies",
    previousDoc: undefined,
    operation: "update",
    ...partial,
  };
}

describe("runModerationSideEffects", () => {
  it("revalidates the case-study paths the webhook revalidated — and no tags, which the generic hook owns", async () => {
    const { deps, revalidated } = sideEffectDeps();
    const result = await runModerationSideEffects(
      change({
        doc: { id: CASE_STUDY_ID, slug: "a-study", moderationStatus: "approved" },
        previousDoc: { moderationStatus: "pending" },
      }),
      deps,
    );

    expect(revalidated).toHaveLength(1);
    // payload/hooks/revalidate-content.ts fires the blanket and per-collection
    // tags after commit on every content write, this one included. Firing the
    // blanket tag here as well evicted the whole site twice per approval.
    expect(revalidated[0].tags).toEqual([]);
    // The webhook pushed a listing page and a detail page per locale.
    expect(revalidated[0].paths).toEqual([
      "/en/research-and-action/case-studies",
      "/en/research-and-action/case-studies/a-study",
      "/es/research-and-action/case-studies",
      "/es/research-and-action/case-studies/a-study",
      "/fr/research-and-action/case-studies",
      "/fr/research-and-action/case-studies/a-study",
      "/ar/research-and-action/case-studies",
      "/ar/research-and-action/case-studies/a-study",
    ]);
    expect(result.revalidated).toHaveLength(8);
  });

  it("revalidates even when the status did not change — the webhook fired on every edit", async () => {
    const { deps, revalidated, notified } = sideEffectDeps();
    await runModerationSideEffects(
      change({
        doc: { id: CASE_STUDY_ID, slug: "a-study", moderationStatus: "approved" },
        previousDoc: { moderationStatus: "approved" },
      }),
      deps,
    );
    expect(revalidated).toHaveLength(1);
    expect(notified).toEqual([]);
  });

  it("passes the notifier exactly what the webhook's GROQ projected", async () => {
    const { deps, notified } = sideEffectDeps();
    await runModerationSideEffects(
      change({
        doc: {
          id: CASE_STUDY_ID,
          slug: "a-study",
          title: "A Study",
          moderationStatus: "revision",
          notifiedStatus: "approved",
          submittedBy: "user_1",
          reviewNotes: "Please add a methods section.",
        },
        previousDoc: { moderationStatus: "approved" },
      }),
      deps,
    );

    expect(notified).toHaveLength(1);
    expect(notified[0].input).toEqual({
      caseStudyId: CASE_STUDY_ID,
      status: "revision",
      notifiedStatus: "approved",
      submittedBy: "user_1",
      title: "A Study",
      reviewNotes: "Please add a methods section.",
      // `coalesce(submitterLocale, "en")` — submitterLocale exists in neither
      // schema, so this has always been "en".
      locale: "en",
      siteUrl: "https://example.org",
    });
  });

  it("reads the English title when the doc carries the whole localized object", async () => {
    const { deps, notified } = sideEffectDeps();
    await runModerationSideEffects(
      change({
        doc: {
          id: CASE_STUDY_ID,
          title: { ar: "دراسة", en: "A Study", es: "Un estudio" },
          moderationStatus: "approved",
          submittedBy: "user_1",
        },
        previousDoc: { moderationStatus: "pending" },
      }),
      deps,
    );
    // The webhook projected `title.en`; a reviewer working in Arabic must not
    // silently change which title the submitter is emailed.
    expect(notified[0].input.title).toBe("A Study");
  });

  it("treats a create as having no previous status", async () => {
    const { deps, notified } = sideEffectDeps();
    await runModerationSideEffects(
      change({
        operation: "create",
        // Payload passes `previousDoc: {}` on create; a hook that read it as a
        // real previous value would see undefined either way, but a caller that
        // passed the created doc through would not.
        previousDoc: { moderationStatus: "approved" },
        doc: { id: CASE_STUDY_ID, moderationStatus: "approved", submittedBy: "user_1" },
      }),
      deps,
    );
    expect(notified).toHaveLength(1);
    expect(notified[0].input.status).toBe("approved");
  });

  it("never notifies for the two collections that have no email", async () => {
    for (const collection of ["livedExperiences", "researchOutputs"] as const) {
      const { deps, notified, revalidated } = sideEffectDeps();
      const result = await runModerationSideEffects(
        change({
          collection,
          doc: { id: "x", moderationStatus: "approved", submittedBy: "user_1" },
          previousDoc: { moderationStatus: "pending" },
        }),
        deps,
      );
      expect(notified).toEqual([]);
      expect(result.email).toBe("skipped: collection does not notify");
      // They still revalidate: the webhook pushed the blanket tag for every
      // document type it saw.
      expect(revalidated[0].tags).toEqual([]);
      expect(revalidated[0].paths).toEqual([]);
    }
  });

  it("emails an event's sender when the team decides (events spec §3.4)", async () => {
    const { deps, notified } = sideEffectDeps();
    await runModerationSideEffects(
      change({ collection: "events", doc: { id: "ev1", moderationStatus: "approved", submittedBy: "user_1", title: { en: "Reef day" } }, previousDoc: { moderationStatus: "pending" } }),
      deps,
    );
    expect(notified).toHaveLength(1);
  });

  it("survives a revalidation that throws, and still emails", async () => {
    const { deps, notified } = sideEffectDeps({
      revalidate: () => {
        throw new Error("no request scope");
      },
    });
    const result = await runModerationSideEffects(
      change({
        doc: { id: CASE_STUDY_ID, moderationStatus: "approved", submittedBy: "user_1" },
        previousDoc: { moderationStatus: "pending" },
      }),
      { ...deps, onError: () => {} },
    );
    expect(notified).toHaveLength(1);
    expect(result.email).toMatch(/^sent:/);
  });

  it("bounds a hung notifier so it cannot hold the write's transaction open", async () => {
    const seen: string[] = [];
    // Observed, not imagined: Payload runs afterChange inside the write's
    // transaction, and an outbound call to Resend that never settles took a
    // real write down with Neon's `25P03 idle-in-transaction` after five
    // minutes. See scripts/payload-moderation-live-check.ts.
    const { deps } = sideEffectDeps({ notify: () => new Promise<string>(() => {}), notifyTimeoutMs: 25 });
    const result = await runModerationSideEffects(
      change({
        doc: { id: CASE_STUDY_ID, moderationStatus: "approved", submittedBy: "user_1" },
        previousDoc: { moderationStatus: "pending" },
      }),
      { ...deps, onError: (message) => seen.push(message) },
    );
    expect(result.email).toBe("error");
    expect(seen).toEqual(["moderation notification failed"]);
  });

  it("reports a failing notifier instead of throwing out of the hook", async () => {
    const seen: string[] = [];
    const { deps } = sideEffectDeps({
      notify: async () => {
        throw new Error("resend is down");
      },
    });
    const result = await runModerationSideEffects(
      change({
        doc: { id: CASE_STUDY_ID, moderationStatus: "approved", submittedBy: "user_1" },
        previousDoc: { moderationStatus: "pending" },
      }),
      { ...deps, onError: (message) => seen.push(message) },
    );
    // The editorial write already succeeded; a failed email must not undo it.
    expect(result.email).toBe("error");
    expect(seen).toEqual(["moderation notification failed"]);
  });
});

// ---------------------------------------------------------------------------
// notifiedStatus, and the loop it has to stop
// ---------------------------------------------------------------------------

describe("notifiedStatus duplicate suppression", () => {
  it("brake 1: the bookkeeping write re-enters with an unchanged status and stops", async () => {
    const { deps, notified } = sideEffectDeps();
    const result = await runModerationSideEffects(
      change({
        // What the hook's own `markNotified` write produces: moderationStatus
        // identical on both sides, notifiedStatus newly set.
        doc: { id: CASE_STUDY_ID, moderationStatus: "approved", notifiedStatus: "approved", submittedBy: "user_1" },
        previousDoc: { moderationStatus: "approved", notifiedStatus: undefined },
      }),
      deps,
    );
    expect(notified).toEqual([]);
    expect(result.email).toBe("skipped: moderationStatus unchanged");
  });

  it("brake 2: notifiedStatus is handed to the notifier unchanged, so it can refuse a repeat", async () => {
    const { deps, notified } = sideEffectDeps();
    await runModerationSideEffects(
      change({
        doc: {
          id: CASE_STUDY_ID,
          moderationStatus: "approved",
          notifiedStatus: "approved",
          submittedBy: "user_1",
        },
        // A transition did occur — but the submitter was already told
        // "approved" once, so the notifier's own guard is what must fire.
        previousDoc: { moderationStatus: "revision" },
      }),
      deps,
    );
    expect(notified).toHaveLength(1);
    expect(notified[0].input.notifiedStatus).toBe("approved");
  });

  it("brake 3: the context flag exists and is what the hook's own write carries", () => {
    expect(SKIP_MODERATION_SIDE_EFFECTS).toBe("skipModerationSideEffects");
  });
});

// ---------------------------------------------------------------------------
// Every state transition, end to end, with the sender mocked
// ---------------------------------------------------------------------------

const sendMock = vi.fn().mockResolvedValue({ id: "email_1" });
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: (...args: unknown[]) => sendMock(...args) };
  },
}));

const prismaFindUnique = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: (...args: unknown[]) => prismaFindUnique(...args) } },
}));

vi.mock("@/lib/content/case-studies", () => ({
  // The seam's own bookkeeping writer. It follows CONTENT_BACKEND, so the
  // Payload hook must never reach it — asserted below.
  updateCaseStudy: vi.fn(async () => undefined),
}));

describe("the whole workflow, driven through the fake store", () => {
  const now = new Date("2026-09-08T10:00:00.000Z");
  let sent: { to: string; subject: string; text: string }[];

  beforeEach(() => {
    vi.clearAllMocks();
    prismaFindUnique.mockResolvedValue({ email: "submitter@example.org" });
    sent = [];
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * One document, one moderation queue. `act` runs a real
   * `applyModerationAction` against the fake store and then dispatches the
   * `afterChange` side effects the way Payload would, with the real
   * `notifyCaseStudyStatusChange` behind an injected sender and an injected,
   * Payload-local `markNotified`.
   */
  async function harness() {
    const { notifyCaseStudyStatusChange } = await import("@/lib/case-study-emails");
    const store = caseStudyStore({ notifiedStatus: undefined });
    const emailResults: string[] = [];

    const dispatch = async (previous: Doc, next: Doc, operation: "create" | "update" = "update") => {
      const result = await runModerationSideEffects(
        { collection: "caseStudies", doc: next, previousDoc: previous, operation },
        {
          notify: (input, notifyDeps) =>
            notifyCaseStudyStatusChange(input, {
              ...notifyDeps,
              sendEmail: async (message) => {
                sent.push({ to: message.to, subject: message.subject, text: message.text });
                return { id: "email_1" };
              },
            }),
          markNotified: async (id, status) => {
            const previousDoc = store.latest(id);
            await store.client.update({
              collection: "caseStudies",
              id,
              data: { notifiedStatus: status },
              draft: true,
              context: { [SKIP_MODERATION_SIDE_EFFECTS]: true },
              overrideAccess: true,
            });
            // Payload re-enters afterChange for this write too; the brakes are
            // what stop it, so the test lets it happen rather than pretending.
            await dispatch(previousDoc, store.latest(id));
          },
          revalidate: () => {},
          siteUrl: "https://example.org",
        },
      );
      emailResults.push(result.email);
      return result;
    };

    const act = async (action: ModerationAction, reviewNotes?: string) => {
      const previous = store.latest(CASE_STUDY_ID);
      await applyModerationAction(store.client, {
        collection: "caseStudies",
        id: CASE_STUDY_ID,
        action,
        reviewNotes,
        now,
      });
      return dispatch(previous, store.latest(CASE_STUDY_ID));
    };

    /** The submitter resubmits. Not a moderation action — `submitCaseStudy`
     *  does this — but the queue cannot get from `revision` back to `pending`
     *  without it, so the sequence includes it explicitly. */
    const resubmit = async () => {
      const previous = store.latest(CASE_STUDY_ID);
      await store.client.update({
        collection: "caseStudies",
        id: CASE_STUDY_ID,
        data: { moderationStatus: "pending", title: "A Study, revised" },
        draft: false,
        overrideAccess: true,
      });
      return dispatch(previous, store.latest(CASE_STUDY_ID));
    };

    return { store, act, resubmit, emailResults };
  }

  it("walks pending -> revision -> pending -> approved and emails exactly twice", async () => {
    const { store, act, resubmit, emailResults } = await harness();

    await act("revision", "Please add a methods section.");
    expect(store.latest(CASE_STUDY_ID).moderationStatus).toBe("revision");

    await resubmit();
    expect(store.latest(CASE_STUDY_ID).moderationStatus).toBe("pending");

    await act("approve");
    expect(store.latest(CASE_STUDY_ID).moderationStatus).toBe("approved");
    expect(store.rows[CASE_STUDY_ID].published._status).toBe("published");

    expect(sent.map((message) => message.subject)).toEqual([
      'Your case study "A Study" needs a few changes',
      'Your case study "A Study, revised" has been published',
    ]);
    expect(sent.every((message) => message.to === "submitter@example.org")).toBe(true);
    expect(sent[0].text).toContain("Please add a methods section.");

    // Every dispatch, in the order they resolve. The `notifiedStatus`
    // bookkeeping write happens *inside* the notifier, so its own re-entrant
    // dispatch resolves before the one that triggered it — and it is refused by
    // brake 1 both times. `pending` is not a notifiable status, so the
    // resubmission emails nothing.
    expect(emailResults).toEqual([
      "skipped: moderationStatus unchanged",
      "sent: revision -> submitter@example.org",
      "skipped: status not notifiable",
      "skipped: moderationStatus unchanged",
      "sent: approved -> submitter@example.org",
    ]);

    // The bookkeeping landed, and it landed on Payload — not through the seam.
    expect(store.latest(CASE_STUDY_ID).notifiedStatus).toBe("approved");
    const { updateCaseStudy } = await import("@/lib/content/case-studies");
    expect(updateCaseStudy).not.toHaveBeenCalled();
  });

  it("walks pending -> rejected and emails once", async () => {
    const { store, act, emailResults } = await harness();
    await act("reject", "Out of scope for this collection.");

    expect(store.latest(CASE_STUDY_ID).moderationStatus).toBe("rejected");
    // A rejection does not publish, so the public row is untouched.
    expect(store.rows[CASE_STUDY_ID].published.moderationStatus).toBe("pending");
    expect(sent).toHaveLength(1);
    expect(sent[0].subject).toBe('Update on your case study "A Study"');
    expect(sent[0].text).toContain("Out of scope for this collection.");
    expect(emailResults).toEqual([
      // The re-entrant bookkeeping dispatch resolves first — and is refused.
      "skipped: moderationStatus unchanged",
      "sent: rejected -> submitter@example.org",
    ]);
    expect(store.latest(CASE_STUDY_ID).notifiedStatus).toBe("rejected");
  });

  it("does not email twice when the same terminal status is reached again", async () => {
    const { act, emailResults } = await harness();
    await act("approve");
    expect(sent).toHaveLength(1);

    // The document is now approved; approve is no longer offered, so reaching
    // "approved" a second time is only possible through a direct edit. Brake 2
    // is what refuses it.
    const { notifyCaseStudyStatusChange } = await import("@/lib/case-study-emails");
    const repeat = await notifyCaseStudyStatusChange(
      {
        caseStudyId: CASE_STUDY_ID,
        status: "approved",
        notifiedStatus: "approved",
        submittedBy: "user_1",
        title: "A Study",
        siteUrl: "https://example.org",
      },
      { sendEmail: async () => ({ id: "x" }) },
    );
    expect(repeat).toBe("skipped: already notified for this status");
    expect(sent).toHaveLength(1);
    expect(emailResults).toEqual([
      "skipped: moderationStatus unchanged",
      "sent: approved -> submitter@example.org",
    ]);
  });

  it("sends nothing at all when the case study has no submitter", async () => {
    const { notifyCaseStudyStatusChange } = await import("@/lib/case-study-emails");
    const attempted: unknown[] = [];
    const result = await notifyCaseStudyStatusChange(
      {
        caseStudyId: CASE_STUDY_ID,
        status: "approved",
        submittedBy: undefined,
        title: "A Study",
        siteUrl: "https://example.org",
      },
      {
        sendEmail: async (message) => {
          attempted.push(message);
          return { id: "x" };
        },
      },
    );
    expect(result).toBe("skipped: no submitter on document");
    expect(attempted).toEqual([]);
  });
});
