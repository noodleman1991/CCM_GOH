import { createClient } from "next-sanity";

import { apiVersion, dataset, projectId, useCdn } from "../env";

// Read token so reads keep working when the dataset is private. This client is
// imported only from server code (server components, route handlers, query
// modules) — the token is never shipped to the browser. Browser-side reads of
// private data must go through an authenticated API route instead.
//
// NOTE: keep useCdn ON even with a token. The API CDN (apicdn.sanity.io)
// accepts authenticated requests, and the uncached live API has a far smaller
// request quota — routing every page render through it exhausted the plan
// quota on 2026-07-28 and took down all content pages (402 plan_limit_reached).
// Published-perspective reads never need the live API.
const token = process.env.SANITY_API_READ_TOKEN;

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn,
  token,
  perspective: "published",
  // Cap request time. @sanity/client applies no default, so a hung upstream
  // blocks server rendering with no ceiling — the render waits as long as
  // Sanity does. On 2026-07-28 a quota outage (402 plan_limit_reached) took
  // every content page down; with a ceiling that becomes a fast failure the
  // content layer's `safe()` wrappers can degrade around, instead of a
  // hanging render.
  //
  // 10s is well above the p99 for these queries (a warm CDN read is tens of
  // milliseconds) while staying comfortably inside Vercel's function budget,
  // so it only ever fires on a genuinely stuck upstream.
  timeout: 10_000,
  stega: {
    studioUrl: process.env.NEXT_PUBLIC_SITE_URL + "/studio",
  },
});
