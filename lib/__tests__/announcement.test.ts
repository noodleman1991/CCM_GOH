import { describe, it, expect } from "vitest";
import {
  announcementStyles,
  shouldShowAnnouncement,
  announcementKey,
  ANNOUNCEMENT_STYLES,
} from "../announcement";

describe("announcementStyles", () => {
  it("returns the variant styles, defaulting to brand", () => {
    expect(announcementStyles("success")).toBe(ANNOUNCEMENT_STYLES.success);
    expect(announcementStyles("nope")).toBe(ANNOUNCEMENT_STYLES.brand);
    expect(announcementStyles(null)).toBe(ANNOUNCEMENT_STYLES.brand);
  });

  it("every variant has bar + link classes", () => {
    for (const v of ["brand", "info", "success", "warning"] as const) {
      expect(ANNOUNCEMENT_STYLES[v].bar).toBeTruthy();
      expect(ANNOUNCEMENT_STYLES[v].link).toBeTruthy();
    }
  });
});

describe("shouldShowAnnouncement", () => {
  const now = new Date("2026-06-17T12:00:00Z");

  it("false when missing or disabled", () => {
    expect(shouldShowAnnouncement(null, now)).toBe(false);
    expect(shouldShowAnnouncement({ enabled: false }, now)).toBe(false);
  });

  it("true when enabled with no window", () => {
    expect(shouldShowAnnouncement({ enabled: true }, now)).toBe(true);
  });

  it("respects startsAt / endsAt window", () => {
    expect(shouldShowAnnouncement({ enabled: true, startsAt: "2026-06-18T00:00:00Z" }, now)).toBe(false); // not started
    expect(shouldShowAnnouncement({ enabled: true, startsAt: "2026-06-01T00:00:00Z" }, now)).toBe(true);
    expect(shouldShowAnnouncement({ enabled: true, endsAt: "2026-06-16T00:00:00Z" }, now)).toBe(false); // ended
    expect(shouldShowAnnouncement({ enabled: true, endsAt: "2026-06-30T00:00:00Z" }, now)).toBe(true);
    expect(
      shouldShowAnnouncement({ enabled: true, startsAt: "2026-06-01T00:00:00Z", endsAt: "2026-06-30T00:00:00Z" }, now)
    ).toBe(true);
  });

  it("ignores unparseable dates rather than hiding", () => {
    expect(shouldShowAnnouncement({ enabled: true, startsAt: "not-a-date" }, now)).toBe(true);
  });
});

describe("announcementKey", () => {
  it("is stable for the same content and changes with it", () => {
    const a = announcementKey("Hello", "brand");
    expect(a).toBe(announcementKey("Hello", "brand"));
    expect(a).not.toBe(announcementKey("Hello", "info"));
    expect(a).not.toBe(announcementKey("Goodbye", "brand"));
  });
});
