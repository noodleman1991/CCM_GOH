import { describe, it, expect } from "vitest";
import { ipActorKey } from "@/lib/rate-limit-actor";

/**
 * The anonymous rate-limit key must be something the client cannot choose.
 * Audit M5: `postComment` hashed `authorName`, so rotating the display name
 * gave an unlimited budget. The key is now derived from the client IP the way
 * `rateLimitRequest` already did it — first `x-forwarded-for` hop, then
 * `x-real-ip`, hashed so no raw address reaches the rate-limit store.
 */
describe("ipActorKey", () => {
  it("uses the first x-forwarded-for hop and hashes it", () => {
    const key = ipActorKey(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }));
    expect(key).toMatch(/^ip:[0-9a-f]{16}$/);
    expect(key).not.toContain("203.0.113.7");
    expect(key).toBe(ipActorKey(new Headers({ "x-forwarded-for": "203.0.113.7" })));
  });

  it("falls back to x-real-ip, then to a fixed 'unknown' bucket", () => {
    const real = ipActorKey(new Headers({ "x-real-ip": "198.51.100.2" }));
    expect(real).toBe(ipActorKey(new Headers({ "x-forwarded-for": "198.51.100.2" })));
    expect(ipActorKey(new Headers())).toBe(ipActorKey(new Headers()));
    expect(ipActorKey(new Headers())).not.toBe(real);
  });

  it("gives different clients different keys", () => {
    expect(ipActorKey(new Headers({ "x-forwarded-for": "203.0.113.7" }))).not.toBe(
      ipActorKey(new Headers({ "x-forwarded-for": "203.0.113.8" }))
    );
  });
});
