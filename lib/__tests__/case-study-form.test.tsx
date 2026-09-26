// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";

vi.mock("@clerk/nextjs", () => ({ useUser: () => ({ user: { fullName: "Ada Lovelace", emailAddresses: [{ emailAddress: "ada@example.org" }] } }) }));
vi.mock("sonner", () => ({ toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() } }));
vi.mock("@/components/forms/portable-text-editor", () => ({
  default: ({ onChangeAction, language, id }: { onChangeAction: (v: unknown) => void; language: string; id?: string }) => (
    <textarea
      id={id}
      data-testid="story"
      data-language={language}
      onChange={(e) => onChangeAction([{ _type: "block", children: [{ _type: "span", text: e.target.value }] }])}
    />
  ),
}));
vi.mock("@/components/maps/region-choropleth", () => ({ RegionChoropleth: () => null }));
vi.mock("@/i18n/navigation", () => ({ Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a> }));

import ImprovedCaseStudyForm from "@/components/forms/case-study-form";

const tags = [{ _id: "t1", label: { en: "Water Access" }, value: { current: "water" }, category: "topic" }];
const communities = [{ _id: "c1", name: { en: "West Africa" }, slug: { current: "west-africa" }, region: "ssa" }];

const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset().mockImplementation(async (url: string) =>
    url.startsWith("/api/case-studies/drafts") ? new Response(JSON.stringify({ draft: null, id: "d1" })) : new Response(JSON.stringify({ id: "cs1" })),
  );
  vi.stubGlobal("fetch", fetchMock);
  Element.prototype.scrollIntoView = vi.fn();
  window.matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); localStorage.clear(); });

function mount() {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ImprovedCaseStudyForm userId="u1" locale="en" availableTags={tags} regionalCommunities={communities} />
    </NextIntlClientProvider>,
  );
}

describe("case study form", () => {
  it("stays quiet while typing, explains on leaving the field, and clears when fixed", async () => {
    mount();
    const title = await screen.findByLabelText("Title");
    fireEvent.change(title, { target: { value: "Flo" } });
    expect(screen.queryByText(/at least 5 characters/)).toBeNull();
    fireEvent.blur(title);
    expect(await screen.findByText("Make the title a little longer (at least 5 characters)")).toBeTruthy();
    fireEvent.change(title, { target: { value: "Floods in Lagos" } });
    await waitFor(() => expect(screen.queryByText(/at least 5 characters/)).toBeNull());
  });

  it("submit with gaps focuses the first problem and lists what's left", async () => {
    mount();
    fireEvent.click((await screen.findAllByRole("button", { name: /Submit for review/ }))[0]);
    await waitFor(() => expect(document.activeElement?.id).toBe("field-title-en"));
    expect(screen.getAllByText("Add where this took place").length).toBeGreaterThan(0);
    expect(fetchMock).not.toHaveBeenCalledWith("/api/case-studies/submit", expect.anything());
  });

  it("arabic writing language: right-to-left inputs, story editor in Arabic, English title required", async () => {
    mount();
    fireEvent.click(await screen.findByRole("button", { name: "العربية" }));
    expect((screen.getByLabelText("Title") as HTMLInputElement).dir).toBe("rtl");
    expect(screen.getByTestId("story").dataset.language).toBe("ar");
    expect(screen.getByLabelText("English title")).toBeTruthy();
  });

  it("shows a server's field message under the right field", async () => {
    fetchMock.mockImplementation(async (url: string) =>
      url === "/api/case-studies/submit"
        ? new Response(JSON.stringify({ error: { message: "Some details need fixing — they're marked below.", fields: { "title.en": "A case study with this title already exists" } } }), { status: 400 })
        : new Response(JSON.stringify({ draft: null, id: "d1" })),
    );
    mount();
    fireEvent.change(await screen.findByLabelText("Title"), { target: { value: "Floods in Lagos" } });
    fireEvent.change(screen.getByLabelText("Summary"), { target: { value: "x".repeat(60) } });
    fireEvent.change(screen.getByTestId("story"), { target: { value: "It rained." } });
    fireEvent.click(screen.getByRole("button", { name: "Water Access" }));
    fireEvent.change(screen.getByRole("combobox", { name: /regional community/i }), { target: { value: "c1" } });
    await act(async () => { fireEvent.click(screen.getAllByRole("button", { name: /Submit for review/ })[0]); });
    expect(await screen.findByText("A case study with this title already exists")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain("Some details need fixing");
  });
});
