import { describe, it, expect, vi, afterEach } from "vitest";
import { geocodeQuery } from "@/lib/geocoding";

afterEach(() => vi.unstubAllGlobals());

describe("geocodeQuery", () => {
  it("maps Nominatim rows to suggestions with alpha-3 country codes", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{
        display_name: "Nakuru, Kenya",
        lat: "-0.28",
        lon: "36.07",
        type: "city",
        address: { country_code: "ke" },
      }],
    }));
    const results = await geocodeQuery("Nakuru");
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      label: "Nakuru, Kenya",
      lat: -0.28,
      lng: 36.07,
      countryCode3: "KEN",
      kind: "city",
    });
  });

  it("returns [] on service failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, statusText: "boom" }));
    expect(await geocodeQuery("x")).toEqual([]);
  });

  it("returns [] for blank input without fetching", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    expect(await geocodeQuery("  ")).toEqual([]);
    expect(f).not.toHaveBeenCalled();
  });
});
