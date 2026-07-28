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
  stega: {
    studioUrl: process.env.NEXT_PUBLIC_SITE_URL + "/studio",
  },
});
