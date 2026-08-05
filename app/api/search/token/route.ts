import { NextResponse } from "next/server";
import { algoliasearch } from "algoliasearch";
import { ALGOLIA_INDICES } from "@/lib/algolia";

// Mints a short-lived, search-only, index-restricted Algolia key for the
// browser — so the client never needs a standing NEXT_PUBLIC_* search key.
//
// NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY has been invalid since June (403
// "Invalid Application-ID or API key"), and the admin key can't be shipped
// to the client. This route uses the admin key SERVER-SIDE only, to mint a
// key the browser is actually allowed to hold.
//
// Implementation note — why `addApiKey`, not `generateSecuredApiKey`:
// Algolia's usual answer for exactly this ("mint a scoped browser key on
// demand") is `generateSecuredApiKey` — a local HMAC computation, no network
// call, instant. That was the first implementation here. Verified against
// this Algolia application (2026-08): a secured key generated from the
// working admin key — with restrictIndices+validUntil, with validUntil only,
// and with no restrictions at all — was rejected on every attempt with 403
// "Invalid Application-ID or API key" / "Invalid API key", while the SAME
// admin key used directly (or any other key actually registered on the
// account) works fine. That points at HMAC "virtual" keys being rejected by
// this specific app, not a bug in the restriction params.
// A genuinely-registered key created via the real "add API key" admin
// endpoint (`addApiKey`) DOES work (confirmed), after Algolia's normal
// few-second key-propagation delay — so that's what this route uses. Same
// security properties as the secured-key approach would have had: search-only
// ACL, an index allowlist, and a bounded lifetime — just backed by Algolia's
// actual key registry instead of the (non-functional, on this account)
// virtual-key mechanism. If Algolia support later confirms/fixes secured
// keys for this app, this can switch back to the zero-round-trip approach.
export const runtime = "nodejs";

const APP_ID = process.env.ALGOLIA_APP_ID || process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
const ADMIN_KEY = process.env.ALGOLIA_API_KEY;

// Every index the frontend is allowed to query directly — single source of
// truth shared with the admin/sync side (lib/algolia.ts).
const PUBLIC_INDICES = Object.values(ALGOLIA_INDICES);

const KEY_VALIDITY_SECONDS = 60 * 60; // ~1h
// Mint a replacement once the cached key has less than this much life left,
// so a slow client never gets handed a key that expires mid-session.
const REFRESH_MARGIN_SECONDS = 10 * 60;

type SearchToken = { appId: string; apiKey: string; validUntil: number };

// Module-scope cache: persists across requests on the same warm server
// instance, so almost every request hits the fast path and never pays
// Algolia's key-propagation delay. `inflight` collapses concurrent
// cold-start requests onto a single mint instead of creating N keys.
let cached: SearchToken | null = null;
let inflight: Promise<SearchToken> | null = null;

async function mintToken(): Promise<SearchToken> {
  if (!APP_ID || !ADMIN_KEY) {
    throw new Error("Algolia admin credentials are not configured (ALGOLIA_APP_ID / ALGOLIA_API_KEY)");
  }

  const client = algoliasearch(APP_ID, ADMIN_KEY);

  const created = await client.addApiKey({
    acl: ["search"],
    indexes: PUBLIC_INDICES,
    validity: KEY_VALIDITY_SECONDS,
    description: "hub-frontend-search (auto-minted by /api/search/token, self-expiring)",
  });

  // Using the key immediately after creation reliably 403s for a few
  // seconds on this account — wait for it to actually propagate before
  // handing it to a browser.
  await client.waitForApiKey({
    operation: "add",
    key: created.key,
    maxRetries: 20,
    timeout: (retryCount) => Math.min(retryCount * 200, 1500),
  });

  return {
    appId: APP_ID,
    apiKey: created.key,
    validUntil: Math.floor(Date.now() / 1000) + KEY_VALIDITY_SECONDS,
  };
}

export async function GET() {
  const now = Math.floor(Date.now() / 1000);

  if (cached && cached.validUntil - now > REFRESH_MARGIN_SECONDS) {
    return NextResponse.json(cached, { headers: { "Cache-Control": "private, max-age=1800" } });
  }

  try {
    if (!inflight) {
      inflight = mintToken().finally(() => {
        inflight = null;
      });
    }
    const token = await inflight;
    cached = token;
    return NextResponse.json(token, { headers: { "Cache-Control": "private, max-age=1800" } });
  } catch (error) {
    // Do NOT fall back to a fake/empty token here — the client hook decides
    // what to do (falls back to the raw env key if one is configured, else
    // surfaces the error) so failures are visible, not silently swallowed.
    console.error("[api/search/token] failed to mint a search token:", error);
    return NextResponse.json(
      {
        error: "search_token_unavailable",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
