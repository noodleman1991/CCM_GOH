import { defineLive } from "next-sanity/live";
import { client } from "./client";
import { token } from "./token";

export const { sanityFetch, SanityLive } = defineLive({
  client,
  serverToken: token,
  // Backstop only — NOT the primary freshness mechanism.
  //
  // Publishing invalidates the "sanity" tag via the webhook
  // (app/api/webhooks/sanity/route.ts), which is instant and costs one request
  // per publish. This timer exists solely for the case where that webhook does
  // not fire (misconfigured, or an outage like 2026-07-28), so pages cannot
  // stay stale until the next deploy.
  //
  // Every tick re-fetches regardless of whether anything changed, and each
  // sanityFetch is TWO upstream requests (next-sanity issues a syncTags fetch
  // then a result fetch), so this value is the main lever on read volume.
  // Raise it once the webhook is confirmed firing: SANITY_REVALIDATE_SECONDS=86400
  // cuts timer-driven reads 24x with the webhook still giving instant updates.
  fetchOptions: {
    revalidate: Number(process.env.SANITY_REVALIDATE_SECONDS) || 3600,
  },
  // Draft live-preview happens through the Studio's Presentation tool, which
  // supplies its own auth — we never need a token shared with the browser.
  // Explicitly opt out so no token is exposed client-side (and to silence the
  // "No browserToken provided" warning).
  browserToken: false,
});
