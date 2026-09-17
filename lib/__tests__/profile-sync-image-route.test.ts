/**
 * `app/api/profile/sync-image/route.ts` — the audit's "sync-image stores any
 * string" note (Edit profile row).
 *
 * The route mirrors the Clerk-hosted avatar into `User.image` so the rest of
 * the site can render it without a Clerk round-trip. It took whatever string
 * the body carried, so an authenticated user could point their public avatar
 * at any host — a tracking pixel, a 20 MB image, or a `javascript:` URL in a
 * place that renders `<img src>`. Only Clerk's image hosts — the same two
 * `next.config.mjs` `images.remotePatterns` already trusts — are accepted.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const auth = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({
  auth: (...a: unknown[]) => auth(...a),
}));

const update = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { update: (...a: unknown[]) => update(...a) } },
}));

import { POST } from "@/app/api/profile/sync-image/route";

function post(body: unknown): NextRequest {
  return new Request("http://localhost/api/profile/sync-image", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  auth.mockResolvedValue({ userId: "user_1" });
  update.mockResolvedValue({ id: "user_1" });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/profile/sync-image", () => {
  it("requires a signed-in user", async () => {
    auth.mockResolvedValue({ userId: null });

    const response = await POST(post({ imageUrl: "https://img.clerk.com/abc" }));

    expect(response.status).toBe(401);
    expect(update).not.toHaveBeenCalled();
  });

  it.each(["https://img.clerk.com/eyJ0eXBlIjoi", "https://images.clerk.dev/oauth_google/img_1.jpeg"])(
    "stores a Clerk-hosted image URL: %s",
    async (imageUrl) => {
      const response = await POST(post({ imageUrl }));

      expect(response.status).toBe(200);
      expect(update).toHaveBeenCalledWith({ where: { id: "user_1" }, data: { image: imageUrl } });
    },
  );

  it("clears the image when the body carries null", async () => {
    const response = await POST(post({ imageUrl: null }));

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith({ where: { id: "user_1" }, data: { image: null } });
  });

  it.each([
    ["another host", "https://evil.example.com/pixel.png"],
    ["a look-alike subdomain", "https://img.clerk.com.evil.example/x.png"],
    ["plain http on a Clerk host", "http://img.clerk.com/abc"],
    ["a javascript: URL", "javascript:alert(1)"],
    ["a data: URL", "data:image/png;base64,AAAA"],
    ["not a URL at all", "just some text"],
    ["a non-string", 42],
  ])("rejects %s with 400 and writes nothing", async (_label, imageUrl) => {
    const response = await POST(post({ imageUrl }));

    expect(response.status).toBe(400);
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects a body that is not JSON with 400", async () => {
    const request = new Request("http://localhost/api/profile/sync-image", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not json",
    }) as unknown as NextRequest;

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(update).not.toHaveBeenCalled();
  });
});
