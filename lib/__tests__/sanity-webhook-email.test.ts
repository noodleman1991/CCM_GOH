import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@sanity/webhook", () => ({
  isValidSignature: async () => true,
  SIGNATURE_HEADER_NAME: "sanity-webhook-signature",
}));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn(), revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "sanity-webhook-signature": "t=1,v1=x" }) }));
const queryRaw = vi.fn();
vi.mock("@/lib/content/internal/sanity-source", () => ({ queryRaw: (...a: unknown[]) => queryRaw(...a) }));
const notify = vi.fn();
vi.mock("@/lib/case-study-emails", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/case-study-emails")>();
  return { ...actual, notifyCaseStudyStatusChange: (...a: unknown[]) => notify(...a) };
});

import { POST } from "@/app/api/webhooks/sanity/route";

const payload = { _type: "caseStudy", _id: "cs1", _rev: "r1", projectId: "p", dataset: "d", status: "approved" };
const post = () =>
  new NextRequest("http://localhost/api/webhooks/sanity", {
    method: "POST",
    headers: { "content-type": "application/json", "sanity-webhook-signature": "t=1,v1=x" },
    body: JSON.stringify(payload),
  });

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  process.env.SANITY_WEBHOOK_SECRET = "s";
  queryRaw.mockResolvedValue({ title: "T", status: "approved", notifiedStatus: null, submittedBy: "u1", locale: "en" });
});

describe("POST /api/webhooks/sanity — case-study status email", () => {
  it("returns 200 when the email was sent or legitimately skipped", async () => {
    notify.mockResolvedValue("sent: approved -> a@b.c");
    expect((await POST(post())).status).toBe(200);
    notify.mockResolvedValue("skipped: already notified for this status");
    expect((await POST(post())).status).toBe(200);
  });

  it("returns 500 when the email failed, so Sanity retries the delivery", async () => {
    // The cache revalidation already happened and is idempotent; a retry
    // re-runs the notification, whose notifiedStatus brake stops duplicates.
    notify.mockResolvedValue("failed: sandbox sender");
    const res = await POST(post());
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ emailResult: "failed: sandbox sender" });
  });

  it("returns 500 when the notifier throws", async () => {
    notify.mockRejectedValue(new Error("boom"));
    expect((await POST(post())).status).toBe(500);
  });
});
