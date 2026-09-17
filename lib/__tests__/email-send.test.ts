import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emailFrom, escapeHtml, sendEmail, usingSandboxSender } from "@/lib/email/send";

/**
 * Resend 4.x never throws on a rejected message: `emails.send()` resolves to
 * `{ data: null, error: { message, name } }`. Three of the four senders in
 * this repo ignored that shape, so a 403 from the sandbox sender was logged
 * as sent, `notifiedStatus` was burned and `digestSentAt` was stamped. This
 * module is the one place the result is read.
 */
const savedEnv = { key: process.env.RESEND_API_KEY, from: process.env.CASE_STUDY_EMAIL_FROM };

beforeEach(() => {
  process.env.RESEND_API_KEY = "re_test";
  process.env.CASE_STUDY_EMAIL_FROM = "Hub <hub@example.org>";
});
afterEach(() => {
  if (savedEnv.key === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = savedEnv.key;
  if (savedEnv.from === undefined) delete process.env.CASE_STUDY_EMAIL_FROM;
  else process.env.CASE_STUDY_EMAIL_FROM = savedEnv.from;
  vi.restoreAllMocks();
});

const message = { to: "person@example.org", subject: "Hello", html: "<p>Hi</p>", text: "Hi" };

describe("sendEmail", () => {
  it("returns ok with the provider id when the transport accepts the message", async () => {
    const transport = vi.fn(async () => ({ data: { id: "email_123" }, error: null }));
    const result = await sendEmail({ ...message, kind: "test" }, { transport });
    expect(result).toEqual({ ok: true, id: "email_123" });
    expect(transport).toHaveBeenCalledWith(expect.objectContaining({ from: "Hub <hub@example.org>", to: "person@example.org" }));
  });

  it("returns a failure when the transport resolves with an error object — the Resend shape", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const transport = vi.fn(async () => ({ data: null, error: { message: "You can only send testing emails to your own email address", name: "validation_error" } }));
    const result = await sendEmail({ ...message, kind: "case-study-status" }, { transport });
    expect(result).toEqual({ ok: false, reason: "You can only send testing emails to your own email address", retriable: false });
    expect(error).toHaveBeenCalledTimes(1);
    expect(String(error.mock.calls[0]![0])).toContain("case-study-status");
  });

  it("returns a retriable failure when the transport throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const transport = vi.fn(async () => {
      throw new Error("fetch failed");
    });
    const result = await sendEmail({ ...message, kind: "digest" }, { transport });
    expect(result).toEqual({ ok: false, reason: "fetch failed", retriable: true });
  });

  it("treats a bare `{ id }` result (the older SDK and the tests' fakes) as success", async () => {
    const transport = vi.fn(async () => ({ id: "email_1" }) as never);
    expect(await sendEmail({ ...message, kind: "test" }, { transport })).toEqual({ ok: true, id: "email_1" });
  });

  it("refuses without a transport when RESEND_API_KEY is unset, without constructing a client", async () => {
    delete process.env.RESEND_API_KEY;
    const result = await sendEmail({ ...message, kind: "test" });
    expect(result).toEqual({ ok: false, reason: "RESEND_API_KEY not configured", retriable: false });
  });
});

describe("the sender address", () => {
  it("is the configured one when set", () => {
    expect(emailFrom()).toBe("Hub <hub@example.org>");
    expect(usingSandboxSender()).toBe(false);
  });

  it("falls back to Resend's sandbox sender and says so", () => {
    // Production has been running on this fallback: the sandbox address
    // delivers only to the account owner and 403s everyone else.
    delete process.env.CASE_STUDY_EMAIL_FROM;
    expect(emailFrom()).toContain("onboarding@resend.dev");
    expect(usingSandboxSender()).toBe(true);
  });
});

describe("escapeHtml", () => {
  it("escapes the five characters that matter in an HTML body", () => {
    expect(escapeHtml(`<b>"Tom" & 'Jerry'</b>`)).toBe("&lt;b&gt;&quot;Tom&quot; &amp; &#39;Jerry&#39;&lt;/b&gt;");
  });
});
