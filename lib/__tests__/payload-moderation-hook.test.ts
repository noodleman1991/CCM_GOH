import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SKIP_MODERATION_SIDE_EFFECTS,
  flushModerationSideEffects,
  moderationAfterChange,
  type ModerationSideEffectDeps,
  type ModerationSideEffectResult,
} from "@/payload/hooks/moderation";

/**
 * `runModerationSideEffects` is tested in payload-moderation.test.ts as a pure
 * function. This file tests the HOOK around it — specifically that the hook no
 * longer awaits the side effects inside the write's transaction.
 *
 * Payload runs `afterChange` before `commitTransaction`. Until 2026-09-16 the
 * hook awaited the notifier (an HTTPS call to Resend, up to 10s) and then the
 * `notifiedStatus` bookkeeping write — a second Local API update with no
 * `req`, so a second transaction that had to wait on the first's row lock
 * while the first waited on it. Every approval paid the 10s ceiling, the email
 * went out before the commit (a rollback would still have emailed), and Neon
 * had already killed one such connection with `25P03`.
 *
 * Now the hook decides nothing and awaits nothing: it hands the whole side
 * effect run to the shared after-commit helper and returns. The result the
 * live check reads from `req.context.moderationSideEffects` is a promise.
 */

const approvedDoc = {
  id: "cs-1",
  moderationStatus: "approved",
  notifiedStatus: undefined,
  submittedBy: "user_1",
  title: "A Study",
};
const pendingDoc = { ...approvedDoc, moderationStatus: "pending" };

function deps(overrides: Partial<ModerationSideEffectDeps> = {}) {
  const notify = vi.fn<ModerationSideEffectDeps["notify"]>(async () => "sent");
  const markNotified = vi.fn<ModerationSideEffectDeps["markNotified"]>(async () => undefined);
  const revalidate = vi.fn<NonNullable<ModerationSideEffectDeps["revalidate"]>>(async () => undefined);
  const onError = vi.fn<NonNullable<ModerationSideEffectDeps["onError"]>>();
  const d: ModerationSideEffectDeps = { notify, markNotified, revalidate, onError, siteUrl: "https://example.org", ...overrides };
  // Return the EFFECTIVE functions, so a test that overrides one asserts on it.
  return {
    d,
    notify: d.notify as typeof notify,
    markNotified: d.markNotified as typeof markNotified,
    revalidate: d.revalidate as typeof revalidate,
    onError: d.onError as typeof onError,
  };
}

afterEach(async () => {
  await flushModerationSideEffects();
  vi.restoreAllMocks();
});

describe("moderationAfterChange runs its side effects after the write, not inside it", () => {
  it("returns before the notifier has run", async () => {
    let release!: () => void;
    const gate = new Promise<string>((resolve) => {
      release = () => resolve("sent");
    });
    const { d, notify } = deps({ notify: vi.fn(() => gate) });
    const hook = moderationAfterChange("caseStudies", d);
    const req = { context: {} } as never;

    const returned = await hook({ doc: approvedDoc, previousDoc: pendingDoc, operation: "update", req } as never);

    expect(returned).toBe(approvedDoc);
    // The hook is back; the notifier has been reached (scheduled work started)
    // but has not settled. A hook that awaited it could not have returned yet.
    release();
    await flushModerationSideEffects();
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it("still notifies exactly once for a real transition, with the same input as before", async () => {
    const { d, notify } = deps();
    const hook = moderationAfterChange("caseStudies", d);
    await hook({ doc: approvedDoc, previousDoc: pendingDoc, operation: "update", req: { context: {} } } as never);
    await flushModerationSideEffects();
    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify.mock.calls[0]![0]).toMatchObject({ caseStudyId: "cs-1", status: "approved", submittedBy: "user_1" });
  });

  it("exposes the outcome on req.context as a promise the caller can await after the write", async () => {
    const { d } = deps();
    const hook = moderationAfterChange("caseStudies", d);
    const req = { context: {} as Record<string, unknown> };
    await hook({ doc: approvedDoc, previousDoc: pendingDoc, operation: "update", req } as never);
    const pending = req.context.moderationSideEffects as Promise<ModerationSideEffectResult>;
    expect(pending).toBeInstanceOf(Promise);
    const result = await pending;
    expect(result).toMatchObject({ transitioned: true, from: "pending", to: "approved", email: "sent" });
  });

  it("still stands down for the bookkeeping write's context flag", async () => {
    const { d, notify, revalidate } = deps();
    const hook = moderationAfterChange("caseStudies", d);
    const req = { context: { [SKIP_MODERATION_SIDE_EFFECTS]: true } as Record<string, unknown> };
    await hook({ doc: approvedDoc, previousDoc: pendingDoc, operation: "update", req } as never);
    await flushModerationSideEffects();
    expect(notify).not.toHaveBeenCalled();
    expect(revalidate).not.toHaveBeenCalled();
    expect(req.context.moderationSideEffects).toBeUndefined();
  });

  it("ignores operations other than create and update", async () => {
    const { d, notify, revalidate } = deps();
    const hook = moderationAfterChange("caseStudies", d);
    await hook({ doc: approvedDoc, previousDoc: pendingDoc, operation: "delete", req: { context: {} } } as never);
    await flushModerationSideEffects();
    expect(notify).not.toHaveBeenCalled();
    expect(revalidate).not.toHaveBeenCalled();
  });

  it("reports a failing notifier through onError and never rejects the hook", async () => {
    const { d, onError } = deps({
      notify: vi.fn(async () => {
        throw new Error("resend down");
      }),
    });
    const hook = moderationAfterChange("caseStudies", d);
    const req = { context: {} as Record<string, unknown> };
    await expect(
      hook({ doc: approvedDoc, previousDoc: pendingDoc, operation: "update", req } as never),
    ).resolves.toBe(approvedDoc);
    const result = await (req.context.moderationSideEffects as Promise<ModerationSideEffectResult>);
    expect(result.email).toBe("error");
    expect(onError).toHaveBeenCalledWith("moderation notification failed", expect.any(Error));
  });

  it("the bookkeeping write it schedules is not the same transaction as the trigger", async () => {
    // After commit there is no outer transaction to deadlock against, so
    // markNotified must be reached and complete.
    const { d, markNotified, notify } = deps({
      notify: vi.fn(async (_input, notifyDeps) => {
        await notifyDeps.markNotified("cs-1", "approved");
        return "sent";
      }),
    });
    const hook = moderationAfterChange("caseStudies", d);
    await hook({ doc: approvedDoc, previousDoc: pendingDoc, operation: "update", req: { context: {} } } as never);
    await flushModerationSideEffects();
    expect(notify).toHaveBeenCalledTimes(1);
    expect(markNotified).toHaveBeenCalledWith("cs-1", "approved");
  });
});
