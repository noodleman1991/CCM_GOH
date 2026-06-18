import { defineLive } from "next-sanity/live";
import { client } from "./client";
import { token } from "./token";

export const { sanityFetch, SanityLive } = defineLive({
  client,
  serverToken: token,
  // Draft live-preview happens through the Studio's Presentation tool, which
  // supplies its own auth — we never need a token shared with the browser.
  // Explicitly opt out so no token is exposed client-side (and to silence the
  // "No browserToken provided" warning).
  browserToken: false,
});
