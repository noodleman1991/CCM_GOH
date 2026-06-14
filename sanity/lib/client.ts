import { createClient } from "next-sanity";

import { apiVersion, dataset, projectId, useCdn } from "../env";

// Read token so reads keep working when the dataset is private. This client is
// imported only from server code (server components, route handlers, query
// modules) — the token is never shipped to the browser. Browser-side reads of
// private data must go through an authenticated API route instead.
//
// NOTE: a token disables the CDN, so we force useCdn:false when a token is set
// to avoid a runtime warning and to fetch fresh, authorized content.
const token = process.env.SANITY_API_READ_TOKEN;

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: token ? false : useCdn,
  token,
  perspective: "published",
  stega: {
    studioUrl: process.env.NEXT_PUBLIC_SITE_URL + "/studio",
  },
});
