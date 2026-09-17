import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";

/**
 * Slice 11. `track()` is the ONLY way a component reaches PostHog, and it
 * refuses anything outside the declared taxonomy: an unknown event name does
 * not compile, and a property whose name suggests free text or identity
 * throws outside production so the mistake is caught in dev and in tests.
 */
const capture = vi.fn();
vi.mock("@/lib/analytics/client", () => ({
  getPostHog: () => ({ capture }),
}));

import { track, type AnalyticsEvents } from "@/lib/analytics/events";

const g = globalThis as { window?: unknown };

describe("track", () => {
  beforeEach(() => {
    capture.mockClear();
  });
  afterEach(() => {
    delete g.window;
  });

  it("is a no-op on the server (no window)", async () => {
    expect(g.window).toBeUndefined();
    await track("video_unlocked", { provider: "youtube" });
    expect(capture).not.toHaveBeenCalled();
  });

  it("forwards the event name and properties to the loaded client in the browser", async () => {
    g.window = {};
    await track("search_performed", { scope: "all", query_length: 4, results_count: 0, zero_results: true, filters_count: 0 });
    expect(capture).toHaveBeenCalledWith("search_performed", {
      scope: "all",
      query_length: 4,
      results_count: 0,
      zero_results: true,
      filters_count: 0,
    });
  });

  it.each(["email", "query", "text", "title", "url", "Body"])("throws on a forbidden property name: %s", async (key) => {
    g.window = {};
    await expect(
      track("video_unlocked", { provider: "youtube", [key]: "anything" } as never),
    ).rejects.toThrow(/forbidden property/);
    expect(capture).not.toHaveBeenCalled();
  });

  it("only compiles for declared events", () => {
    expectTypeOf<keyof AnalyticsEvents>().toEqualTypeOf<
      | "content_viewed"
      | "reader_opened"
      | "reader_progress"
      | "report_downloaded"
      | "external_link_clicked"
      | "video_unlocked"
      | "search_performed"
      | "search_result_clicked"
      | "atlas_filter_applied"
      | "submission_started"
      | "submission_draft_saved"
      | "submission_submitted"
      | "submission_moderated"
      | "community_joined"
      | "rsvp_set"
      | "comment_posted"
      | "reaction_added"
      | "collaboration_created"
      | "sign_up_completed"
      | "onboarding_step_viewed"
      | "onboarding_completed"
      | "newsletter_subscribed"
      | "weekly_digest_sent"
    >();
    // @ts-expect-error — not in the taxonomy
    void (() => track("made_up_event", {}));
  });
});
