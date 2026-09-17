/**
 * The one place an outbound email's result is read.
 *
 * Resend 4.x does not throw on a rejected message. `emails.send()` resolves to
 * `{ data: null, error: { message, name } }` — a 403 from the sandbox sender,
 * an unverified domain, a malformed address all arrive this way. Until
 * 2026-09-17 three of this repo's four senders awaited the call and moved on,
 * so a rejected message was logged as sent, the case study's `notifiedStatus`
 * was burned (the submitter could never be told again), and the digest's
 * `digestSentAt` was stamped. Only the issue-report sender read the result.
 *
 * `sendEmail` returns a typed result. Callers decide what to do with a
 * failure — usually "do not record that it was sent" — but none of them can
 * ignore it by accident, because success and failure are different shapes.
 *
 * ---------------------------------------------------------------------------
 * The sender address
 * ---------------------------------------------------------------------------
 *
 * `CASE_STUDY_EMAIL_FROM` names the verified sender. When it is unset every
 * sender falls back to Resend's sandbox address, which delivers only to the
 * account owner and rejects everyone else — that fallback, not an unverified
 * domain, is why production email has been failing. `usingSandboxSender()`
 * exists so the boot manifest and a future health check can say so.
 */
import { reportError } from "@/lib/errors/report";

export const SANDBOX_FROM = "Connecting Climate Minds <onboarding@resend.dev>";

export function emailFrom(): string {
  return process.env.CASE_STUDY_EMAIL_FROM || SANDBOX_FROM;
}

export function usingSandboxSender(): boolean {
  return !process.env.CASE_STUDY_EMAIL_FROM;
}

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** A short label for logs: "case-study-status", "digest", "comment-approved"… */
  kind: string;
  from?: string;
  replyTo?: string;
  headers?: Record<string, string>;
  attachments?: { filename: string; content: Buffer }[];
}

export type SendEmailResult =
  | { ok: true; id: string | null }
  | { ok: false; reason: string; retriable: boolean };

/**
 * What a transport resolves to. Resend's real shape is `{ data, error }`;
 * the older SDK and this repo's test fakes return `{ id }`. Both are
 * accepted so an injected transport cannot accidentally read as a failure.
 */
export type TransportResult =
  | { data?: { id: string } | null; error?: { message?: string; name?: string } | null }
  | { id: string };

export type EmailTransport = (message: Omit<EmailMessage, "kind"> & { from: string }) => Promise<TransportResult>;

async function resendTransport(message: Omit<EmailMessage, "kind"> & { from: string }): Promise<TransportResult> {
  // Imported lazily so that loading a sender never constructs a client.
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  return resend.emails.send(message) as Promise<TransportResult>;
}

export async function sendEmail(
  message: EmailMessage,
  deps: { transport?: EmailTransport } = {},
): Promise<SendEmailResult> {
  const { kind, ...rest } = message;
  if (!deps.transport && !process.env.RESEND_API_KEY) {
    return { ok: false, reason: "RESEND_API_KEY not configured", retriable: false };
  }
  const transport = deps.transport ?? resendTransport;
  const payload = { ...rest, from: rest.from ?? emailFrom() };

  try {
    const result = await transport(payload);
    if (result && "error" in result && result.error) {
      const reason = result.error.message || result.error.name || "rejected by the email provider";
      reportError(new Error(reason), { route: `email:${kind}`, tags: { kind, to: payload.to } });
      return { ok: false, reason, retriable: false };
    }
    const id =
      result && "id" in result && typeof result.id === "string"
        ? result.id
        : result && "data" in result && result.data && typeof result.data.id === "string"
          ? result.data.id
          : null;
    return { ok: true, id };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "the email provider could not be reached";
    reportError(error, { route: `email:${kind}`, tags: { kind, to: payload.to } });
    return { ok: false, reason, retriable: true };
  }
}

/** The five characters that matter inside an HTML body. One copy, not three. */
export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch] as string);
}
