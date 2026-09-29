import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const staff = vi.fn();
const run = vi.fn();
vi.mock("@/lib/authz", () => ({ getActor: async () => ({}), isStaff: () => staff() }));
vi.mock("@/payload/components/moderation-actions-server", () => ({ runModerationAction: (i: unknown) => run(i) }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
import { reviewSubmission } from "@/lib/actions/review";
beforeEach(() => { staff.mockReset(); run.mockReset(); });

describe("reviewing a submission from the site", () => {
  it("refuses anyone who isn't staff", async () => {
    staff.mockReturnValue(false);
    expect(await reviewSubmission({ collection: "events", id: "e1", action: "approve" })).toEqual({ ok: false, error: "Only the team can review submissions." });
    expect(run).not.toHaveBeenCalled();
  });
  it("uses the same moderation action as the admin buttons", async () => {
    staff.mockReturnValue(true);
    run.mockResolvedValue({ ok: true, message: "done", status: "approved" });
    expect(await reviewSubmission({ collection: "events", id: "e1", action: "reject", reviewNotes: "Duplicate" })).toEqual({ ok: true });
    expect(run).toHaveBeenCalledWith({ collection: "events", id: "e1", action: "reject", reviewNotes: "Duplicate" });
  });
  it("passes the workflow's own refusal through", async () => {
    staff.mockReturnValue(true);
    run.mockResolvedValue({ ok: false, error: "Reject needs a note." });
    expect(await reviewSubmission({ collection: "events", id: "e1", action: "reject" })).toEqual({ ok: false, error: "Reject needs a note." });
  });
});
