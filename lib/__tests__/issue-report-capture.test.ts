import { describe, expect, it } from "vitest";
import {
  canCaptureScreen,
  captureFilename,
  captureScales,
  isCaptureCancelled,
} from "@/components/issue-report/capture-screen";
import { MAX_SCREENSHOT_BYTES } from "@/lib/issue-report";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import fr from "@/messages/fr.json";
import ar from "@/messages/ar.json";

describe("screenshot capture helpers", () => {
  it("is unavailable where the browser has no screen capture", () => {
    expect(canCaptureScreen()).toBe(false);
  });

  it("treats a dismissed share prompt as a cancel, not a failure", () => {
    expect(isCaptureCancelled(new DOMException("denied", "NotAllowedError"))).toBe(true);
    expect(isCaptureCancelled(new DOMException("aborted", "AbortError"))).toBe(true);
    expect(isCaptureCancelled(new Error("boom"))).toBe(false);
  });

  it("names the file after the moment it was taken", () => {
    expect(captureFilename(new Date(2026, 8, 25, 14, 5))).toBe("screenshot-2026-09-25-1405.jpg");
  });

  it("fits a 4K tab to 2560px, then shrinks a quarter per retry", () => {
    const [first, second] = captureScales(3840, 2160);
    expect(Math.round(3840 * first)).toBe(2560);
    expect(second).toBeCloseTo(first * 0.75);
    expect(captureScales(1280, 720)[0]).toBe(1);
  });
});

describe("screenshot size cap", () => {
  it("keeps the base64 report inside Vercel's 4.5MB request body limit", () => {
    const base64 = Math.ceil((MAX_SCREENSHOT_BYTES * 4) / 3);
    expect(base64 + 64 * 1024).toBeLessThan(4.5 * 1024 * 1024);
  });
});

describe("capture strings", () => {
  it.each([["en", en], ["es", es], ["fr", fr], ["ar", ar]] as const)("exist in %s", (_, messages) => {
    const ir = messages.issueReport as Record<string, unknown> & { areas: Record<string, string> };
    for (const key of ["screenshotCapture", "screenshotHintCapture", "screenshotCaptureFailed"]) {
      expect(typeof ir[key]).toBe("string");
    }
    expect(ir.areas.cms).toBeTruthy();
  });
});
