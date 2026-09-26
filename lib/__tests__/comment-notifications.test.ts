import { beforeEach, describe, expect, it, vi } from "vitest";

const { sendMock, comment, user, pref } = vi.hoisted(() => ({
  sendMock: vi.fn(),
  comment: { findUnique: vi.fn() },
  user: { findUnique: vi.fn() },
  pref: { upsert: vi.fn() },
}));
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: (...a: unknown[]) => sendMock(...a) };
  },
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { comment, user, notificationPreference: pref },
}));

import { notifyCommentApproved } from "@/lib/comment-notifications";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  process.env.RESEND_API_KEY = "re_test";
  comment.findUnique.mockResolvedValue({ authorId: "u1" });
  user.findUnique.mockResolvedValue({ email: "author@example.org", preferredLanguage: "fr" });
  pref.upsert.mockResolvedValue({
    userId: "u1",
    emailOnReply: true,
    emailOnMention: true,
    emailOnMessage: true,
    emailWeeklyDigest: true,
    unsubscribeToken: "tok_1",
  });
});

describe("notifyCommentApproved", () => {
  it("reports a Resend rejection as a failure instead of `sent`", async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: "domain not verified", name: "validation_error" } });
    const r = await notifyCommentApproved("c1");
    expect(r).toBe("failed: domain not verified");
  });

  it("reports success with the provider id", async () => {
    sendMock.mockResolvedValue({ data: { id: "email_9" }, error: null });
    const r = await notifyCommentApproved("c1");
    expect(r).toMatch(/^sent: author@example.org/);
  });

  it("carries a working unsubscribe link and the one-click headers", async () => {
    sendMock.mockResolvedValue({ data: { id: "email_9" }, error: null });
    await notifyCommentApproved("c1");
    const msg = sendMock.mock.calls[0]![0] as { html: string; text: string; headers?: Record<string, string> };
    expect(msg.html).toContain("/api/notifications/unsubscribe?token=tok_1");
    expect(msg.text).toContain("/api/notifications/unsubscribe?token=tok_1");
    expect(msg.headers?.["List-Unsubscribe"]).toContain("token=tok_1");
    expect(msg.headers?.["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
  });

  it("respects a full opt-out: a person who unsubscribed from every email kind gets nothing", async () => {
    // There is no dedicated preference for approvals (that needs a schema
    // change); the blanket unsubscribe flips every flag off, and that state
    // has to mean "no email at all".
    pref.upsert.mockResolvedValue({
      userId: "u1",
      emailOnReply: false,
      emailOnMention: false,
      emailOnMessage: false,
      emailWeeklyDigest: false,
      unsubscribeToken: "tok_1",
    });
    const r = await notifyCommentApproved("c1");
    expect(r).toBe("skipped: author opted out of email");
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("uses the author's locale", async () => {
    sendMock.mockResolvedValue({ data: { id: "email_9" }, error: null });
    await notifyCommentApproved("c1");
    const msg = sendMock.mock.calls[0]![0] as { subject: string };
    expect(msg.subject).toBe("Votre commentaire est en ligne");
  });
});
