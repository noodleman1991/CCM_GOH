import { describe, expect, it } from "vitest";
import { toSuggestion } from "@/lib/geocoding";

const row = (over: Record<string, unknown>) => ({
  display_name: "Lagos, Lagos State, Nigeria", lat: "6.45", lon: "3.39", type: "city", addresstype: "city",
  address: { city: "Lagos", country: "Nigeria", country_code: "ng" }, ...over,
});

describe("toSuggestion", () => {
  it("names the city and country and sets precision from what was found", () => {
    expect(toSuggestion(row({}))).toMatchObject({ city: "Lagos", country: "Nigeria", countryCode3: "NGA", precision: "city" });
  });

  it("a country result is country precision with no city", () => {
    expect(toSuggestion(row({ display_name: "Kenya", type: "administrative", addresstype: "country", address: { country: "Kenya", country_code: "ke" } })))
      .toMatchObject({ city: null, country: "Kenya", precision: "country" });
  });

  it("a state or province is region precision", () => {
    expect(toSuggestion(row({ addresstype: "state", type: "administrative", address: { state: "Sindh", country: "Pakistan", country_code: "pk" } })))
      .toMatchObject({ precision: "region", city: null });
  });

  it("a village or town counts as a city", () => {
    expect(toSuggestion(row({ addresstype: "village", type: "village", address: { village: "Kibera", country: "Kenya", country_code: "ke" } })))
      .toMatchObject({ city: "Kibera", precision: "city" });
  });

  it("a building or site is an exact point", () => {
    expect(toSuggestion(row({ addresstype: "amenity", type: "university" }))).toMatchObject({ precision: "exact" });
  });

  it("drops rows without usable coordinates", () => {
    expect(toSuggestion(row({ lat: "x" }))).toBeNull();
  });
});
