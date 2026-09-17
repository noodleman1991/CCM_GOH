// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CookieConsentProvider, useCookieConsent } from "@/components/cookie-consent/cookie-consent-provider";

/**
 * Slice 11. The provider is the consent → SDK bridge. It must load nothing
 * until an explicit "analytics: true" is stored, unload on a later decline,
 * identify with the Clerk id (never the email) and reset on sign-out.
 */
const { loadPostHog, unloadPostHog, ph, auth } = vi.hoisted(() => {
  const ph = { identify: vi.fn(), reset: vi.fn(), register: vi.fn(), capture: vi.fn() };
  const auth = { userId: null as string | null, isLoaded: true };
  return { loadPostHog: vi.fn(async () => ph), unloadPostHog: vi.fn(), ph, auth };
});
vi.mock("@/lib/analytics/client", () => ({
  loadPostHog,
  unloadPostHog,
  getPostHog: () => (loadPostHog.mock.calls.length > 0 ? ph : null),
  posthogEnabled: () => true,
}));
vi.mock("@clerk/nextjs", () => ({ useAuth: () => auth }));
vi.mock("next-intl", () => ({ useLocale: () => "ar" }));
vi.mock("next/navigation", () => ({ usePathname: () => "/ar/news", useSearchParams: () => new URLSearchParams() }));

import { PostHogProvider } from "@/components/analytics/posthog-provider";

let consentApi: ReturnType<typeof useCookieConsent> | null = null;
function Probe() {
  const api = useCookieConsent();
  useEffect(() => {
    consentApi = api;
  }, [api]);
  return null;
}
function mount() {
  return render(
    <CookieConsentProvider>
      <Probe />
      <PostHogProvider />
    </CookieConsentProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  loadPostHog.mockClear();
  unloadPostHog.mockClear();
  for (const fn of Object.values(ph)) fn.mockClear();
  auth.userId = null;
  consentApi = null;
});
afterEach(() => cleanup());

describe("PostHogProvider", () => {
  it("loads nothing before a choice, loads on Accept All, unloads on Essential Only", async () => {
    mount();
    await act(async () => {});
    expect(loadPostHog).not.toHaveBeenCalled();

    await act(async () => consentApi!.acceptAll());
    expect(loadPostHog).toHaveBeenCalledTimes(1);
    expect(loadPostHog).toHaveBeenCalledWith({ locale: "ar", dir: "rtl" });

    await act(async () => consentApi!.rejectNonEssential());
    expect(unloadPostHog).toHaveBeenCalledTimes(1);
  });

  it("honours a stored acceptance on mount, one render after the consent resolves", async () => {
    localStorage.setItem("ccm-cookie-consent", JSON.stringify({ essential: true, functional: true, analytics: true, timestamp: 1 }));
    mount();
    await act(async () => {});
    expect(loadPostHog).toHaveBeenCalledTimes(1);
  });

  it("identifies with the Clerk id when a user appears, and resets when they leave", async () => {
    localStorage.setItem("ccm-cookie-consent", JSON.stringify({ essential: true, functional: true, analytics: true, timestamp: 1 }));
    const view = mount();
    await act(async () => {});
    expect(ph.identify).not.toHaveBeenCalled();

    auth.userId = "user_1";
    view.rerender(
      <CookieConsentProvider>
        <Probe />
        <PostHogProvider />
      </CookieConsentProvider>,
    );
    await act(async () => {});
    expect(ph.identify).toHaveBeenCalledWith("user_1");
    expect(ph.identify.mock.calls[0]).toHaveLength(1); // no person properties from the client

    auth.userId = null;
    view.rerender(
      <CookieConsentProvider>
        <Probe />
        <PostHogProvider />
      </CookieConsentProvider>,
    );
    await act(async () => {});
    expect(ph.reset).toHaveBeenCalledTimes(1);
  });

  it("captures a pageview with the locale stripped from the path and no query string", async () => {
    localStorage.setItem("ccm-cookie-consent", JSON.stringify({ essential: true, functional: true, analytics: true, timestamp: 1 }));
    mount();
    await act(async () => {});
    expect(ph.capture).toHaveBeenCalledWith("$pageview", expect.objectContaining({ path_unlocalized: "/news", has_query: false }));
    const props = ph.capture.mock.calls[0][1] as Record<string, unknown>;
    expect(Object.keys(props)).not.toContain("query");
  });
});
