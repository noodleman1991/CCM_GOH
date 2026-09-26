// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";

vi.mock("@/components/maps/region-choropleth", () => ({ RegionChoropleth: () => <div data-testid="map" /> }));
import { PlacePicker, type PlaceValue } from "@/components/forms/place-picker";

const lagos = { label: "Lagos, Nigeria", lat: 6.45, lng: 3.39, countryCode3: "NGA", kind: "city", country: "Nigeria", city: "Lagos", precision: "city", vx: 500, vy: 250 };

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

function mount(onChange = vi.fn(), value: PlaceValue | null = null) {
  render(
    <NextIntlClientProvider locale="en" messages={{ placePicker: en.placePicker, common: en.common }}>
      <PlacePicker value={value} onChange={onChange} inputId="field-location" />
    </NextIntlClientProvider>,
  );
  return onChange;
}

describe("PlacePicker", () => {
  it("picks a suggestion with names and precision, never showing coordinates", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ results: [lagos] }))));
    const onChange = mount();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Lagos" } });
    await vi.advanceTimersByTimeAsync(400);
    fireEvent.click(await screen.findByRole("option", { name: /Lagos, Nigeria/ }));
    expect(onChange).toHaveBeenCalledWith({ lat: 6.45, lng: 3.39, text: "Lagos, Nigeria", precision: "city", countryCode3: "NGA", country: "Nigeria", city: "Lagos" });
    expect(document.body.textContent).not.toMatch(/6\.45|3\.39/);
  });

  it("no results shows the country/region hint", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ results: [] }))));
    mount();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Nowhereville" } });
    await vi.advanceTimersByTimeAsync(400);
    await waitFor(() => expect(screen.getByText(en.placePicker.noResults)).toBeTruthy());
  });

  it("the search input carries the id the error system focuses", () => {
    mount();
    expect(screen.getByRole("combobox").id).toBe("field-location");
  });
});
