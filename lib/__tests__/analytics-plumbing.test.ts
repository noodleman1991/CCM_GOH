import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { checkEnv } from "@/lib/env";
import { PRIVACY } from "@/lib/legal/content";

/**
 * Slice 11. The parts of the PostHog integration that are configuration, not
 * code: the same-origin reverse proxy, the middleware bypass for it, where the
 * provider mounts, and the copy that must stop being false the day PostHog
 * ships behind the analytics toggle.
 */
const root = path.resolve(__dirname, "../..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");
const LOCALES = ["en", "es", "fr", "ar"] as const;

describe("reverse proxy", () => {
  it("next.config rewrites /ingest to the EU ingest host and keeps PostHog's trailing slashes", () => {
    const cfg = read("next.config.mjs");
    // The prefix is one constant, shared by name with lib/analytics/client.ts.
    expect(cfg).toContain("const POSTHOG_PROXY_PREFIX = '/ingest'");
    expect(cfg).toContain("source: `${POSTHOG_PROXY_PREFIX}/static/:path*`");
    expect(cfg).toContain("source: `${POSTHOG_PROXY_PREFIX}/:path*`");
    expect(cfg).toContain("eu.i.posthog.com");
    expect(cfg).toContain("skipTrailingSlashRedirect: true");
  });

  it("the CSP does not whitelist the PostHog host directly — the proxy is the only path", () => {
    expect(read("next.config.mjs")).not.toMatch(/connect-src[^\n]*posthog\.com/);
  });

  it("the middleware lets /ingest through untouched and keeps the trailing-slash redirect for pages", () => {
    const proxy = read("proxy.ts");
    expect(proxy).toContain("startsWith('/ingest/')");
    // skipTrailingSlashRedirect is app-wide, so the old 308 has to come from here.
    expect(proxy).toMatch(/endsWith\('\/'\)/);
  });
});

describe("mounting", () => {
  it("the provider sits inside the consent provider in the locale layout", () => {
    const layout = read("app/[locale]/layout.tsx");
    expect(layout).toContain("<PostHogProvider />");
    expect(layout.indexOf("<CookieConsentProvider>")).toBeLessThan(layout.indexOf("<PostHogProvider />"));
  });

  it("Plausible's gate goes through the shared consent module", () => {
    expect(read("components/cookie-consent/analytics-scripts.tsx")).toContain("plausibleAllowed(");
  });

  it("the cookie-preferences control is reachable from the sidebar and the privacy page", () => {
    expect(read("components/app-sidebar.tsx")).toContain("CookiePreferencesButton");
    expect(read("app/[locale]/(main)/legal/[doc]/page.tsx")).toContain("CookiePreferencesButton");
  });

  it("the banner switches are labelled for assistive technology", () => {
    const banner = read("components/cookie-consent/cookie-consent-banner.tsx");
    expect(banner.match(/<Switch[^>]*aria-labelledby=/g)?.length).toBe(3);
  });
});

describe("environment", () => {
  it("reports PostHog as a disabled feature when the key is absent", () => {
    expect(checkEnv({}).disabledFeatures).toContain("Product analytics (PostHog)");
    expect(checkEnv({ NEXT_PUBLIC_POSTHOG_KEY: "phc_x" }).disabledFeatures).not.toContain("Product analytics (PostHog)");
  });

  it(".env.example documents the three variables", () => {
    const example = read(".env.example");
    for (const k of ["NEXT_PUBLIC_POSTHOG_KEY", "NEXT_PUBLIC_POSTHOG_HOST", "NEXT_PUBLIC_POSTHOG_DEBUG"]) {
      expect(example).toContain(`${k}=`);
    }
  });
});

describe("copy that must be true before the first production event", () => {
  it.each(LOCALES)("%s banner no longer claims analytics needs no consent, and names PostHog", (l) => {
    const m = JSON.parse(read(`messages/${l}.json`));
    const analytics = m.cookieConsent.categories.analytics.description as string;
    expect(analytics).toContain("PostHog");
    expect(analytics).not.toMatch(/No consent needed|No se necesita consentimiento|Aucun consentement nécessaire|لا حاجة للموافقة/);
    expect(m.cookieConsent.description).toContain("PostHog");
  });

  it.each(LOCALES)("%s privacy policy names PostHog as a consent-gated processor and is re-dated", (l) => {
    const doc = PRIVACY[l];
    const text = JSON.stringify(doc);
    expect(text).toContain("PostHog");
    expect(doc.updated >= "2026-09-17").toBe(true);
    // The processor list gains PostHog too, not just the analytics section.
    const processors = doc.sections.find((s) => /proces|trait|يعالج/i.test(s.heading));
    expect(JSON.stringify(processors)).toContain("PostHog");
  });
});
