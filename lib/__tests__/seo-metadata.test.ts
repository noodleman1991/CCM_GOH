import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Slice 10a. Four defects in the site's metadata, all confirmed by the audit:
 * an empty CMS title rendered " | Connecting Climate Minds" through the
 * template; the Open Graph locale was `en_US` on every page in every locale;
 * canonicals omitted the locale prefix and no page declared its language
 * alternates; and the JSON-LD `image` on news articles was the relative
 * `/payload-api/…` path under Payload, which Next absolutises for
 * `openGraph.images` but not for raw JSON-LD.
 */
vi.mock("@/lib/content/images", () => ({ imageUrl: (img: unknown) => (img ? "https://img.example/og.webp" : "") }));
vi.mock("@/lib/content/internal/backend", () => ({ activeBackend: () => "sanity" }));

import { absoluteUrl, siteUrl } from "@/lib/seo/site-url";
import { localizedAlternates, OG_LOCALES, ogLocale } from "@/lib/seo/alternates";

const saved = process.env.NEXT_PUBLIC_SITE_URL;
beforeEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = "https://hub.example.org/";
});
afterEach(() => {
  if (saved === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = saved;
});

describe("siteUrl / absoluteUrl — one base URL, no trailing slash, never 'undefined/'", () => {
  it("normalises the configured base", () => {
    expect(siteUrl()).toBe("https://hub.example.org");
  });

  it("falls back to the production origin when unset, instead of the string 'undefined'", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(siteUrl()).toBe("https://connectingclimateminds.org");
    expect(absoluteUrl("/sitemap.xml")).toBe("https://connectingclimateminds.org/sitemap.xml");
  });

  it("absolutises a relative path and leaves an absolute URL alone", () => {
    expect(absoluteUrl("/payload-api/media/file/a.jpg")).toBe("https://hub.example.org/payload-api/media/file/a.jpg");
    expect(absoluteUrl("payload-api/x")).toBe("https://hub.example.org/payload-api/x");
    expect(absoluteUrl("https://cdn.sanity.io/images/a.jpg")).toBe("https://cdn.sanity.io/images/a.jpg");
    expect(absoluteUrl(null)).toBeNull();
    expect(absoluteUrl(undefined)).toBeNull();
  });
});

describe("localizedAlternates / ogLocale", () => {
  it("declares the canonical with the locale prefix and all four languages plus x-default", () => {
    expect(localizedAlternates("/news/heat", "ar")).toEqual({
      canonical: "/ar/news/heat",
      languages: {
        en: "/en/news/heat",
        es: "/es/news/heat",
        fr: "/fr/news/heat",
        ar: "/ar/news/heat",
        "x-default": "/en/news/heat",
      },
    });
  });

  it("handles the root path", () => {
    expect(localizedAlternates("", "fr").canonical).toBe("/fr");
    expect(localizedAlternates("/", "fr").languages.en).toBe("/en");
  });

  it("maps each locale to a real Open Graph locale, defaulting to English", () => {
    expect(OG_LOCALES).toEqual({ en: "en_GB", es: "es_ES", fr: "fr_FR", ar: "ar_SA" });
    expect(ogLocale("ar")).toBe("ar_SA");
    expect(ogLocale("xx")).toBe("en_GB");
  });
});

describe("generatePageMetadata", () => {
  it("omits the title when the CMS title is empty, so the layout's default applies instead of ' | Connecting Climate Minds'", async () => {
    const { generatePageMetadata } = await import("@/lib/content/metadata");
    const meta = generatePageMetadata({ page: { meta_title: "" } as never, slug: "about", locale: "en" });
    expect(meta.title).toBeUndefined();
  });

  it("uses the locale's Open Graph locale and locale-prefixed alternates", async () => {
    const { generatePageMetadata } = await import("@/lib/content/metadata");
    const meta = generatePageMetadata({ page: { meta_title: { ar: "من نحن" } } as never, slug: "about", locale: "ar" });
    expect(meta.title).toBe("من نحن");
    expect(meta.openGraph?.locale).toBe("ar_SA");
    expect(meta.alternates).toEqual(localizedAlternates("/about", "ar"));
  });

  it("treats the index page as the root", async () => {
    const { generatePageMetadata } = await import("@/lib/content/metadata");
    const meta = generatePageMetadata({ page: null, slug: "index", locale: "es" });
    expect(meta.alternates?.canonical).toBe("/es");
  });
});
