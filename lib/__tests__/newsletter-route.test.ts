import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `app/api/newsletter/route.ts` used to do `new Resend(process.env.RESEND_API_KEY)`
 * at module scope. The Resend constructor throws when the key is undefined
 * (node_modules/resend/dist/index.js: "Missing API key. Pass it to the
 * constructor"), so in any environment without the key the route module failed
 * to IMPORT, and the block 500'd before it ever reached the audience check
 * (2026-09-16 audit, infra gap 2 / critic C10). The client is now built inside
 * the handler, after both variables have been checked.
 *
 * `resend` is mocked with a constructor spy so the tests can assert WHEN it is
 * constructed, which is the whole point; the rate limiter is mocked out because
 * its Postgres fallback would otherwise be reached.
 */
const contactsCreate = vi.fn();
const ResendCtor = vi.fn(function (this: { contacts: { create: typeof contactsCreate } }) {
  this.contacts = { create: contactsCreate };
});

vi.mock("resend", () => ({ Resend: ResendCtor }));
vi.mock("@/lib/rate-limit-route", () => ({
  rateLimitRequest: vi.fn(async () => null),
}));

const VARS = ["RESEND_API_KEY", "RESEND_AUDIENCE_ID"] as const;
let ambient: Record<string, string | undefined> = {};

beforeEach(() => {
  vi.clearAllMocks();
  ambient = Object.fromEntries(VARS.map((v) => [v, process.env[v]]));
  for (const v of VARS) delete process.env[v];
  contactsCreate.mockResolvedValue({ data: { id: "contact_1" }, error: null });
});

afterEach(() => {
  for (const v of VARS) {
    if (ambient[v] === undefined) delete process.env[v];
    else process.env[v] = ambient[v];
  }
});

const post = (body: unknown) =>
  new Request("http://localhost/api/newsletter", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

describe("POST /api/newsletter", () => {
  it("importing the route with RESEND_API_KEY unset constructs no client", async () => {
    await import("@/app/api/newsletter/route");
    expect(ResendCtor).not.toHaveBeenCalled();
  });

  it("answers 503 newsletter_unavailable when RESEND_API_KEY is unset, without constructing a client", async () => {
    process.env.RESEND_AUDIENCE_ID = "aud_1";
    const { POST } = await import("@/app/api/newsletter/route");
    const res = await POST(post({ email: "a@b.co" }));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "newsletter_unavailable" });
    expect(ResendCtor).not.toHaveBeenCalled();
    expect(contactsCreate).not.toHaveBeenCalled();
  });

  it("answers 503 newsletter_unavailable when RESEND_AUDIENCE_ID is unset, without constructing a client", async () => {
    process.env.RESEND_API_KEY = "re_test";
    const { POST } = await import("@/app/api/newsletter/route");
    const res = await POST(post({ email: "a@b.co" }));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "newsletter_unavailable" });
    expect(ResendCtor).not.toHaveBeenCalled();
  });

  it("subscribes through a client built from RESEND_API_KEY once both variables are set", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.RESEND_AUDIENCE_ID = "aud_1";
    const { POST } = await import("@/app/api/newsletter/route");
    const res = await POST(post({ email: "a@b.co" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(ResendCtor).toHaveBeenCalledWith("re_test");
    expect(contactsCreate).toHaveBeenCalledWith({ email: "a@b.co", unsubscribed: false, audienceId: "aud_1" });
  });

  it("still rejects an invalid email with 400 when configured", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.RESEND_AUDIENCE_ID = "aud_1";
    const { POST } = await import("@/app/api/newsletter/route");
    const res = await POST(post({ email: "not-an-email" }));
    expect(res.status).toBe(400);
    expect(contactsCreate).not.toHaveBeenCalled();
  });
});
