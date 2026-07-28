import { defineLive } from "next-sanity/live";
import { client } from "./client";
import { token } from "./token";

export const { sanityFetch, SanityLive } = defineLive({
  client,
  serverToken: token,
  // Safety net: in production sanityFetch would otherwise cache with
  // revalidate:false and rely solely on Live events for invalidation. If the
  // event stream is unavailable (e.g. the 2026-07-28 API-quota outage), pages
  // would stay stale until the next deploy. Live events still invalidate
  // instantly when available; this only caps staleness at an hour.
  fetchOptions: { revalidate: 3600 },
  // Draft live-preview happens through the Studio's Presentation tool, which
  // supplies its own auth — we never need a token shared with the browser.
  // Explicitly opt out so no token is exposed client-side (and to silence the
  // "No browserToken provided" warning).
  browserToken: false,
});
