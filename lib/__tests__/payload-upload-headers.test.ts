import { describe, expect, it } from "vitest";
import { Media } from "@/payload/collections/media";
import { Files } from "@/payload/collections/files";
import { uploadResponseHeaders } from "@/payload/hooks/upload-headers";

/**
 * Two things about how `/payload-api/<slug>/file/<name>` answers:
 *
 * 1. `media` accepts `image/*`, which includes SVG, and Payload stores an SVG
 *    verbatim (no sharp pass). Served from the hub's own origin with the
 *    site's CSP (`script-src 'unsafe-inline'`), an SVG carrying `<script>`
 *    runs on the origin that holds the Clerk session — stored XSS reachable
 *    by any editor account. Removing SVG is not an option: `svgPattern` and
 *    the logo fields are SVG by design. Instead the SVG response gets its own
 *    `Content-Security-Policy: sandbox`, which neuters script when the file is
 *    opened directly and changes nothing for `<img src>` (images never ran
 *    script anyway).
 *
 * 2. Neither the S3 static handler nor Payload's own sets `Cache-Control`, so
 *    the CDN could not cache an image origin response at all, and `next/image`
 *    re-fetched through two function invocations every `minimumCacheTTL`.
 */
describe("uploadResponseHeaders", () => {
  const run = (init: Record<string, string>) => {
    const headers = new Headers(init);
    const out = uploadResponseHeaders({ headers });
    return out ?? headers;
  };

  it("sandboxes an SVG so a script inside it cannot run on the hub origin", () => {
    const h = run({ "content-type": "image/svg+xml" });
    const csp = h.get("content-security-policy") ?? "";
    expect(csp).toMatch(/\bsandbox\b/);
    expect(csp).toMatch(/script-src 'none'/);
    expect(h.get("x-content-type-options")).toBe("nosniff");
  });

  it("does not sandbox raster images or PDFs", () => {
    expect(run({ "content-type": "image/png" }).get("content-security-policy")).toBeNull();
    expect(run({ "content-type": "application/pdf" }).get("content-security-policy")).toBeNull();
  });

  it("lets the CDN and the image optimizer cache every file for a day, revalidating in the background", () => {
    for (const type of ["image/png", "image/svg+xml", "application/pdf", "video/mp4"]) {
      const cc = run({ "content-type": type }).get("cache-control") ?? "";
      expect(cc, type).toMatch(/public/);
      expect(cc, type).toMatch(/max-age=86400/);
      expect(cc, type).toMatch(/stale-while-revalidate=604800/);
    }
  });

  it("keeps a Cache-Control the storage handler already chose", () => {
    const h = run({ "content-type": "image/png", "cache-control": "private, no-store" });
    expect(h.get("cache-control")).toBe("private, no-store");
  });

  it("is wired onto both upload collections", () => {
    for (const c of [Media, Files]) {
      const upload = c.upload as { modifyResponseHeaders?: unknown };
      expect(upload.modifyResponseHeaders, c.slug).toBe(uploadResponseHeaders);
    }
  });
});
