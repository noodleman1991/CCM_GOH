import { describe, expect, it } from "vitest";
import { plausibleAllowed, posthogAllowed } from "@/lib/analytics/consent";

/**
 * Slice 11. Two analytics tools, two rules, side by side so the asymmetry is
 * explicit. Plausible is cookieless and keeps its existing "load until told
 * not to" rule (components/cookie-consent/analytics-scripts.tsx). PostHog
 * processes personal data (IP, user agent, URL) on every event, so it loads
 * ONLY on an explicit, stored "analytics: true" — never in the still-loading
 * frame, never before a choice.
 */
const decidedYes = { consent: { analytics: true }, hasConsented: true };
const decidedNo = { consent: { analytics: false }, hasConsented: true };
const loading = { consent: null, hasConsented: true };
const noChoice = { consent: null, hasConsented: false };

describe("posthogAllowed — opt-in only", () => {
  it.each([
    ["accepted", decidedYes, true],
    ["declined", decidedNo, false],
    ["still loading the stored choice", loading, false],
    ["no choice made yet", noChoice, false],
  ])("%s → %s", (_label, snapshot, expected) => {
    expect(posthogAllowed(snapshot)).toBe(expected);
  });
});

describe("plausibleAllowed — the pre-existing cookieless rule, unchanged", () => {
  it.each([
    ["accepted", decidedYes, true],
    ["declined", decidedNo, false],
    ["still loading the stored choice", loading, false],
    ["no choice made yet", noChoice, true],
  ])("%s → %s", (_label, snapshot, expected) => {
    expect(plausibleAllowed(snapshot)).toBe(expected);
  });
});
