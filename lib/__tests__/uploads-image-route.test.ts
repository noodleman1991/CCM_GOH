/**
 * `app/api/uploads/image/route.ts` — the first of Task 15's external write
 * paths.
 *
 * The route has no rendered output, so `compareRoute` (the parity harness) does
 * not apply to it: there is no HTML to diff. It is verified directly instead —
 * by asserting **which seam primitive it calls** on each backend, and what it
 * hands that primitive.
 *
 * Both source modules are mocked, never the route, so the real branch inside
 * `POST` runs. A test that mocked the route's own decision would pass whichever
 * way the branch was wired.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const sanityUpload = vi.fn();
const payloadUpload = vi.fn();

vi.mock("@/lib/content/internal/sanity-source", () => ({
  uploadImageAsset: (...args: unknown[]) => sanityUpload(...args),
}));
vi.mock("@/lib/content/internal/payload-source", () => ({
  nowMinute: () => "2026-09-17T10:00:00.000Z",
  escapeContains: (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`),
  uploadImageAsset: (...args: unknown[]) => payloadUpload(...args),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({ userId: "user_1" }),
}));
vi.mock("@/lib/collaboration/service", () => ({
  authorizeCollab: vi.fn(async () => undefined),
}));
vi.mock("@/lib/rate-limit-route", () => ({
  rateLimitRequest: vi.fn(async () => null),
}));

import { POST } from "@/app/api/uploads/image/route";

const ASSET = {
  id: "media-1",
  url: "/payload-api/media/file/photo.jpg",
  width: 800,
  height: 600,
  lqip: "data:image/webp;base64,AAAA",
};

function upload(filename = "photo.jpg", type = "image/jpeg"): NextRequest {
  const form = new FormData();
  form.set("file", new File([new Uint8Array([1, 2, 3])], filename, { type }));
  return new Request("http://localhost/api/uploads/image", {
    method: "POST",
    body: form,
  }) as unknown as NextRequest;
}

/**
 * Both flags are cleared per test and restored after, so these assert the
 * MODULE's default rather than the ambient environment's. Without this a suite
 * run under `CONTENT_BACKEND=payload` would report the default-arm cases as
 * failures when the module is behaving correctly.
 */
const FLAGS = ["CONTENT_BACKEND", "CONTENT_BACKEND_UPLOADS"] as const;
let ambient: Record<string, string | undefined> = {};

beforeEach(() => {
  vi.clearAllMocks();
  ambient = Object.fromEntries(FLAGS.map((f) => [f, process.env[f]]));
  for (const flag of FLAGS) delete process.env[flag];
  sanityUpload.mockResolvedValue({ ...ASSET, id: "image-abc" });
  payloadUpload.mockResolvedValue(ASSET);
});

afterEach(() => {
  for (const flag of FLAGS) {
    if (ambient[flag] === undefined) delete process.env[flag];
    else process.env[flag] = ambient[flag];
  }
});

describe("POST /api/uploads/image", () => {
  it("uploads through Sanity by default — an unset flag changes nothing", async () => {
    const response = await POST(upload());

    expect(response.status).toBe(200);
    expect(sanityUpload).toHaveBeenCalledTimes(1);
    expect(payloadUpload).not.toHaveBeenCalled();
  });

  it("uploads through Payload when the flag says so, and never touches Sanity", async () => {
    process.env.CONTENT_BACKEND_UPLOADS = "payload";

    const response = await POST(upload());

    expect(response.status).toBe(200);
    expect(payloadUpload).toHaveBeenCalledTimes(1);
    expect(sanityUpload).not.toHaveBeenCalled();
  });

  it("hands Payload the browser's own content type, so `media` is not asked to guess", async () => {
    process.env.CONTENT_BACKEND_UPLOADS = "payload";

    await POST(upload("diagram.webp", "image/webp"));

    const [buffer, options] = payloadUpload.mock.calls[0] as [
      Buffer,
      { filename: string; contentType?: string },
    ];
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(options.filename).toBe("diagram.webp");
    expect(options.contentType).toBe("image/webp");
  });

  it("passes no `sanityAssetId` — that column belongs to imported rows, not new uploads", async () => {
    process.env.CONTENT_BACKEND_UPLOADS = "payload";

    await POST(upload());

    const [, options] = payloadUpload.mock.calls[0] as [Buffer, Record<string, unknown>];
    expect(options).not.toHaveProperty("sanityAssetId");
  });

  it("returns the same body shape on both backends, so the editor cannot tell them apart", async () => {
    const sanityBody = await (await POST(upload())).json();

    process.env.CONTENT_BACKEND_UPLOADS = "payload";
    const payloadBody = await (await POST(upload())).json();

    expect(Object.keys(sanityBody).sort()).toEqual(Object.keys(payloadBody).sort());
    expect(payloadBody).toEqual({
      assetRef: "media-1",
      url: "/payload-api/media/file/photo.jpg",
      width: 800,
      height: 600,
      lqip: "data:image/webp;base64,AAAA",
    });
  });

  it("still rejects a non-image before either backend is reached", async () => {
    process.env.CONTENT_BACKEND_UPLOADS = "payload";

    const response = await POST(upload("notes.pdf", "application/pdf"));

    expect(response.status).toBe(400);
    expect(payloadUpload).not.toHaveBeenCalled();
    expect(sanityUpload).not.toHaveBeenCalled();
  });
});
