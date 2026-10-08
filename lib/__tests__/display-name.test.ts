import { describe, expect, it } from "vitest";
import { displayNameOf } from "@/lib/people/display-name";

describe("a member's name on the hub", () => {
  // Arabic pages showed "Lokszinski Amit": the name was flipped for every
  // right-to-left page, Latin names included (fixed 2026-10-08).
  it("is shown the way they wrote it, whatever the page's language", () => {
    expect(displayNameOf({ firstName: "Amit", lastName: "Lokszinski", username: "amit" })).toBe("Amit Lokszinski");
    expect(displayNameOf({ firstName: "سارة", lastName: "حسن", username: null })).toBe("سارة حسن");
  });
  it("falls back to one name, then the username", () => {
    expect(displayNameOf({ firstName: "Amit", lastName: null, username: "a" })).toBe("Amit");
    expect(displayNameOf({ firstName: null, lastName: "Lokszinski", username: "a" })).toBe("Lokszinski");
    expect(displayNameOf({ firstName: null, lastName: null, username: "amit" })).toBe("amit");
    expect(displayNameOf({ firstName: null, lastName: null, username: null })).toBe("Anonymous User");
  });
});
