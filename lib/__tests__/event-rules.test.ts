import { describe, expect, it } from "vitest";
import { externalNeedsWebsite } from "@/payload/fields/event-rules";

describe("an outside event needs its organiser's website", () => {
  it("refuses an empty website when another organisation runs it", () => {
    expect(externalNeedsWebsite("", { siblingData: { origin: "external" } })).toBe(
      "Add the event's website — visitors go there for outside events.",
    );
    expect(externalNeedsWebsite(undefined, { siblingData: { origin: "external" } })).not.toBe(true);
  });
  it("accepts a website for an outside event, and no website for a CCM one", () => {
    expect(externalNeedsWebsite("https://example.org/ev", { siblingData: { origin: "external" } })).toBe(true);
    expect(externalNeedsWebsite("", { siblingData: { origin: "ccm" } })).toBe(true);
    expect(externalNeedsWebsite("", { siblingData: {} })).toBe(true);
  });
  it("still refuses a website that isn't a web address", () => {
    expect(externalNeedsWebsite("not a url", { siblingData: { origin: "ccm" } })).not.toBe(true);
  });
});
