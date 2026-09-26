import { afterEach, describe, expect, it, vi } from "vitest";
import {
  flushModerationSideEffects,
  moderationAfterChange,
  type ModerationSideEffectDeps,
} from "@/payload/hooks/moderation";

/**
 * Slice 11. The moderation hook already computes `transitioned/from/to` after
 * the commit; that is the seam for the `submission_moderated` analytics
 * event. It is injected like the notifier, so this test asserts the call and
 * its closed property set — never the title, never the review notes.
 */
const approvedDoc = { id: "cs-1", moderationStatus: "approved", submittedBy: "user_1", title: "A Study", reviewNotes: "secret" };
const pendingDoc = { ...approvedDoc, moderationStatus: "pending" };

function deps(overrides: Partial<ModerationSideEffectDeps> = {}) {
  const analytics = vi.fn<NonNullable<ModerationSideEffectDeps["analytics"]>>(async () => undefined);
  const d: ModerationSideEffectDeps = {
    notify: vi.fn(async () => "sent"),
    markNotified: vi.fn(async () => undefined),
    revalidate: vi.fn(async () => undefined),
    analytics,
    siteUrl: "https://example.org",
    ...overrides,
  };
  return { d, analytics: d.analytics as typeof analytics };
}

afterEach(async () => {
  await flushModerationSideEffects();
});

describe("submission_moderated", () => {
  it("fires once per real transition with the moderator as the actor and only closed properties", async () => {
    const { d, analytics } = deps();
    const hook = moderationAfterChange("caseStudies", d);
    const req = { context: {}, user: { id: "user_mod" } } as never;
    await hook({ doc: approvedDoc, previousDoc: pendingDoc, operation: "update", req } as never);
    await flushModerationSideEffects();

    expect(analytics).toHaveBeenCalledTimes(1);
    expect(analytics).toHaveBeenCalledWith({
      collection: "caseStudies",
      docId: "cs-1",
      from: "pending",
      to: "approved",
      moderatorId: "user_mod",
      submitterId: "user_1",
    });
    const serialized = JSON.stringify(analytics.mock.calls[0][0]);
    expect(serialized).not.toContain("A Study");
    expect(serialized).not.toContain("secret");
  });

  it("does not fire when moderationStatus is unchanged (the bookkeeping write)", async () => {
    const { d, analytics } = deps();
    const hook = moderationAfterChange("caseStudies", d);
    await hook({ doc: approvedDoc, previousDoc: approvedDoc, operation: "update", req: { context: {} } } as never);
    await flushModerationSideEffects();
    expect(analytics).not.toHaveBeenCalled();
  });

  it("a failing analytics call never reaches the hook's caller", async () => {
    const onError = vi.fn();
    const { d } = deps({ analytics: vi.fn(async () => { throw new Error("posthog down"); }), onError });
    const hook = moderationAfterChange("caseStudies", d);
    const req = { context: {} } as never;
    await expect(hook({ doc: approvedDoc, previousDoc: pendingDoc, operation: "update", req } as never)).resolves.toBe(approvedDoc);
    await flushModerationSideEffects();
    expect(onError).toHaveBeenCalledWith("moderation analytics failed", expect.any(Error));
  });
});
