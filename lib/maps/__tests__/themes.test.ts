import { describe, it, expect, vi, beforeEach } from "vitest";

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));
vi.mock("@/sanity/lib/client", () => ({ client: { fetch: fetchMock } }));

import { getThemeOptions } from "../themes";
import { FALLBACK_THEMES } from "../region-facets";

describe("getThemeOptions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("maps CMS rows flagged useAsTheme to ThemeOption", async () => {
    fetchMock.mockResolvedValue([
      { slug: "climate", label: { en: "Climate", es: "Clima", fr: "Climat", ar: "المناخ" } },
      { slug: "health", label: { en: "Health" } },
    ]);
    const options = await getThemeOptions();
    expect(options).toEqual([
      { slug: "climate", label: { en: "Climate", es: "Clima", fr: "Climat", ar: "المناخ" } },
      { slug: "health", label: { en: "Health" } },
    ]);
  });

  it("falls back to FALLBACK_THEMES mapped to ThemeOption when the CMS returns nothing", async () => {
    fetchMock.mockResolvedValue([]);
    const options = await getThemeOptions();
    expect(options.map((o) => o.slug)).toEqual(
      FALLBACK_THEMES.map((t) => t.slug)
    );
    expect(options.every((o) => typeof o.label.en === "string" && o.label.en.length > 0)).toBe(true);
  });

  it("filters out malformed rows (missing slug or label)", async () => {
    fetchMock.mockResolvedValue([
      { slug: "good", label: { en: "Good" } },
      { slug: null, label: { en: "No slug" } },
      { slug: "no-label", label: null },
      { label: { en: "No slug field" } },
    ]);
    const options = await getThemeOptions();
    expect(options).toEqual([{ slug: "good", label: { en: "Good" } }]);
  });

  it("falls back when the CMS fetch throws", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    const options = await getThemeOptions();
    expect(options.map((o) => o.slug)).toEqual(
      FALLBACK_THEMES.map((t) => t.slug)
    );
  });
});
