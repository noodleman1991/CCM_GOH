import { describe, it, expect } from "vitest";
import {
  deriveAreaFromPath,
  describeBrowser,
  describeDevice,
  describeOs,
  issueReportSchema,
} from "@/lib/issue-report";

const UA = {
  chromeMac:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
  safariIphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  edgeWindows:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0",
  firefoxLinux: "Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0",
  ipad: "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/604.1",
};

describe("deriveAreaFromPath", () => {
  it("treats the locale root as the home page", () => {
    expect(deriveAreaFromPath("/en")).toBe("home");
    expect(deriveAreaFromPath("/ar/")).toBe("home");
    expect(deriveAreaFromPath("/")).toBe("home");
  });

  it("matches areas regardless of locale prefix", () => {
    expect(deriveAreaFromPath("/en/atlas")).toBe("map");
    expect(deriveAreaFromPath("/fr/atlas")).toBe("map");
    expect(deriveAreaFromPath("/atlas")).toBe("map");
  });

  it("prefers the more specific path over its parent", () => {
    expect(deriveAreaFromPath("/en/lived-experiences/submit")).toBe("story-submit");
    expect(deriveAreaFromPath("/en/lived-experiences")).toBe("stories");
    expect(deriveAreaFromPath("/en/lived-experiences/some-story")).toBe("stories");
  });

  it("maps the research-and-action children separately", () => {
    expect(deriveAreaFromPath("/en/research-and-action/case-studies")).toBe("case-studies");
    expect(deriveAreaFromPath("/en/research-and-action/research-outputs")).toBe("research-outputs");
  });

  it("maps events under collaborate, not collaborations", () => {
    expect(deriveAreaFromPath("/en/collaborate/events")).toBe("events");
    expect(deriveAreaFromPath("/en/collaborations/abc")).toBe("collaborations");
  });

  it("falls back to 'other' rather than guessing", () => {
    expect(deriveAreaFromPath("/en/some-cms-page")).toBe("other");
    expect(deriveAreaFromPath("")).toBe("other");
  });

  it("does not mistake a slug that merely starts with a locale code", () => {
    expect(deriveAreaFromPath("/energy-transition")).toBe("other");
  });
});

describe("describeBrowser", () => {
  it("does not report Chrome-based browsers as Chrome", () => {
    expect(describeBrowser(UA.edgeWindows)).toBe("Edge 141");
  });

  it("does not report Chrome as Safari", () => {
    expect(describeBrowser(UA.chromeMac)).toBe("Chrome 141");
  });

  it("reads Safari and Firefox versions", () => {
    expect(describeBrowser(UA.safariIphone)).toBe("Safari 17");
    expect(describeBrowser(UA.firefoxLinux)).toBe("Firefox 130");
  });

  it("degrades to a stable label when unrecognised", () => {
    expect(describeBrowser("")).toBe("Unknown browser");
  });
});

describe("describeDevice", () => {
  it("separates phone, tablet and computer", () => {
    expect(describeDevice(UA.safariIphone, 390)).toBe("Phone");
    expect(describeDevice(UA.ipad, 1024)).toBe("Tablet");
    expect(describeDevice(UA.chromeMac, 1512)).toBe("Computer");
  });

  it("uses the viewport when the UA claims desktop on a small screen", () => {
    expect(describeDevice(UA.chromeMac, 400)).toBe("Phone");
  });
});

describe("describeOs", () => {
  it("names the platform", () => {
    expect(describeOs(UA.chromeMac)).toBe("macOS");
    expect(describeOs(UA.edgeWindows)).toBe("Windows");
    expect(describeOs(UA.safariIphone)).toBe("iOS");
    expect(describeOs(UA.firefoxLinux)).toBe("Linux");
  });
});

describe("issueReportSchema", () => {
  const valid = {
    summary: "Map is blank on my phone",
    whatHappened: "Tapped the map from the menu and got a grey box.",
    urgency: "annoying",
    area: "map",
    wasSignedIn: true,
    context: { url: "https://example.org/en/atlas" },
  };

  it("accepts a minimal report and defaults the optional context", () => {
    const parsed = issueReportSchema.parse(valid);
    expect(parsed.whatShouldHappen).toBe("");
    expect(parsed.context.browser).toBe("");
    expect(parsed.screenshot).toBeUndefined();
  });

  it("keeps urgency and area as free strings so the wording can change", () => {
    const parsed = issueReportSchema.parse({
      ...valid,
      urgency: "some-new-value",
      area: "a-brand-new-area",
    });
    expect(parsed.urgency).toBe("some-new-value");
    expect(parsed.area).toBe("a-brand-new-area");
  });

  it("rejects an empty summary or description", () => {
    expect(() => issueReportSchema.parse({ ...valid, summary: "" })).toThrow();
    expect(() => issueReportSchema.parse({ ...valid, whatHappened: " " })).toThrow();
  });

  it("requires the signed-in answer, since it changes what we can reproduce", () => {
    const withoutSignedIn: Partial<typeof valid> = { ...valid };
    delete withoutSignedIn.wasSignedIn;
    expect(() => issueReportSchema.parse(withoutSignedIn)).toThrow();
  });
});
