import { describe, expect, it } from "vitest";
import { client } from "@/sanity/lib/client";

/**
 * `@sanity/client` supports `timeout` and applies no default, so a hung
 * upstream blocks server rendering with no ceiling. On 2026-07-28 a Sanity
 * quota outage (402 plan_limit_reached) took every content page down; a
 * timeout turns that failure mode into fast degraded responses through the
 * content layer's `safe()` wrappers instead of hanging renders.
 *
 * This is Phase 3's first task and ships alone, because unlike the rest of
 * the phase it is a deliberate behaviour change rather than a backend swap.
 */
describe("the Sanity client", () => {
  it("caps request time, so a hung upstream cannot block rendering forever", () => {
    expect(client.config().timeout).toBe(10_000);
  });
});
