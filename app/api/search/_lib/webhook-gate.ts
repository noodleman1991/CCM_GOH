import { NextResponse } from "next/server";
import { isValidSignature, SIGNATURE_HEADER_NAME } from "@sanity/webhook";
import { bearerMatches } from "@/lib/auth/bearer";

/**
 * Authorisation for the Sanity-fed search webhooks
 * (`app/api/search/{news,case-studies,agendas}/webhook`).
 *
 * Two callers are legitimate, and each proves itself differently:
 *
 *  - **Sanity** signs the raw body with `SANITY_WEBHOOK_SECRET` and sends the
 *    `sanity-webhook-signature` header (`t=<ts>,v1=<base64url hmac>`), which
 *    is what `SANITY_WEBHOOK_SETUP.md` configures.
 *  - **Our own code** (Clerk webhook, profile route, scripts) sends
 *    `Authorization: Bearer <SEARCH_WEBHOOK_SECRET>`.
 *
 * Hub audit 2026-09-16:
 *  - H2: the news route called `isValidSignature()` without `await`.
 *    `@sanity/webhook` 4.x returns `Promise<boolean>`; a Promise is truthy, so
 *    every signature — including garbage — passed. The `await` lives here now,
 *    in one place, wrapped in try/catch because the library throws on a
 *    malformed header and a throw must read as "invalid", not a 500.
 *  - M20: `case-studies` and `agendas` accepted the bearer only, so every
 *    delivery configured as the setup doc says 401'd. All three routes share
 *    this gate, so they accept the same two credentials.
 *
 * Secrets are read per request, not at module load: a route that snapshots
 * `process.env` at import cannot be exercised under a test that sets the
 * secret in `beforeEach`, and that is exactly how H2 stayed invisible.
 *
 * The body is consumed here because the HMAC covers the raw bytes; the caller
 * gets the text back and parses it itself (re-serialised JSON can differ from
 * what Sanity signed).
 */
export type SearchWebhookAuth =
  | { ok: true; body: string; via: "bearer" | "sanity-signature" }
  | { ok: false; response: NextResponse };

export async function authorizeSearchWebhook(request: Request): Promise<SearchWebhookAuth> {
  const body = await request.text();

  if (bearerMatches(request.headers.get("authorization"), process.env.SEARCH_WEBHOOK_SECRET)) {
    return { ok: true, body, via: "bearer" };
  }

  const sanitySecret = process.env.SANITY_WEBHOOK_SECRET;
  const signature = request.headers.get(SIGNATURE_HEADER_NAME);

  if (!sanitySecret) {
    // No Sanity secret configured and the bearer did not match: nothing left
    // to verify against. Deliberately not "skip verification".
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!signature) {
    console.warn(`Search webhook: missing ${SIGNATURE_HEADER_NAME} header`);
    return { ok: false, response: NextResponse.json({ error: "Missing signature" }, { status: 401 }) };
  }

  let valid = false;
  try {
    valid = await isValidSignature(body, signature, sanitySecret);
  } catch (error) {
    console.warn("Search webhook: signature verification threw", error);
  }
  if (!valid) {
    console.warn("Search webhook: invalid signature");
    return { ok: false, response: NextResponse.json({ error: "Invalid signature" }, { status: 401 }) };
  }

  return { ok: true, body, via: "sanity-signature" };
}
