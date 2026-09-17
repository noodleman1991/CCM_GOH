import "server-only";
import { reportError } from "@/lib/errors/report";

/**
 * Cloudflare Turnstile server-side verification. Used to gate anonymous comment
 * submission. Fail-closed: if the secret is not configured, the caller must
 * treat anonymous submission as unavailable (never open).
 */

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
/**
 * A human is waiting on the comment form, so this is the shortest timeout of
 * the outbound calls (audit M8: it had none). A timeout fails CLOSED like any
 * other verification failure — never open.
 */
const VERIFY_TIMEOUT_MS = 5_000;

export function turnstileConfigured(): boolean {
  return !!process.env.TURNSTILE_SECRET_KEY;
}

export async function verifyTurnstile(token: string | undefined): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return false; // fail closed
  if (!token) return false;

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
      cache: "no-store",
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (error) {
    // Closed on failure, as before — but a Cloudflare outage or timeout used to
    // look identical to a bot from here. Now it is reported.
    reportError(error, { route: "turnstile" });
    return false;
  }
}
