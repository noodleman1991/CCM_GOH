import { describe, expect, it } from "vitest";
import { PAYLOAD_API_ANONYMOUS_RATE_LIMIT, shouldRateLimitPayloadApi } from "@/lib/payload-api-guard";

/**
 * `proxy.ts` returned early for every `/payload-api` request so that Clerk
 * still wrapped it but nothing else did — including the rate limiter that
 * every other public route goes through. An anonymous caller could loop
 * `GET /payload-api/caseStudies?limit=0&depth=10&locale=all` against Neon
 * for free. The proxy now rate-limits anonymous requests to the REST API by
 * IP, using the same limiter as the rest of the app.
 *
 * Static file requests are excluded: a rendered page carries dozens of
 * `/payload-api/media/file/…` images, the image optimizer fetches them
 * server-side, and they are the one part of this surface that is meant to be
 * hot. They are protected by unguessable names and by the CDN cache instead.
 */
describe("shouldRateLimitPayloadApi", () => {
  it("limits REST reads and writes", () => {
    expect(shouldRateLimitPayloadApi("/payload-api/caseStudies")).toBe(true);
    expect(shouldRateLimitPayloadApi("/payload-api/caseStudies/abc")).toBe(true);
    expect(shouldRateLimitPayloadApi("/payload-api/globals/homepage")).toBe(true);
    expect(shouldRateLimitPayloadApi("/payload-api/media")).toBe(true);
    expect(shouldRateLimitPayloadApi("/payload-api/users/login")).toBe(true);
  });

  it("does not limit static file serving", () => {
    expect(shouldRateLimitPayloadApi("/payload-api/media/file/oceania-9bac9301cda26005.jpg")).toBe(false);
    expect(shouldRateLimitPayloadApi("/payload-api/files/file/agenda.pdf")).toBe(false);
  });

  it("does not apply outside the Payload API", () => {
    expect(shouldRateLimitPayloadApi("/admin")).toBe(false);
    expect(shouldRateLimitPayloadApi("/admin/collections/media")).toBe(false);
    expect(shouldRateLimitPayloadApi("/api/search/counts")).toBe(false);
    expect(shouldRateLimitPayloadApi("/en/news")).toBe(false);
  });

  it("is generous enough for the admin's own anonymous probes and tight enough to stop a loop", () => {
    expect(PAYLOAD_API_ANONYMOUS_RATE_LIMIT.limit).toBeGreaterThanOrEqual(30);
    expect(PAYLOAD_API_ANONYMOUS_RATE_LIMIT.limit).toBeLessThanOrEqual(120);
    expect(PAYLOAD_API_ANONYMOUS_RATE_LIMIT.windowSeconds).toBe(60);
  });
});
