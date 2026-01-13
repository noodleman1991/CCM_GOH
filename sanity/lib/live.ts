import { defineLive } from "next-sanity/live";
import { client } from "./client";
import { token } from "./token";

export const { sanityFetch, SanityLive } = defineLive({
  client: client.withConfig({
    // Use the token for server-side requests
    token,
  }),
  serverToken: token,
  browserToken: token,
});
