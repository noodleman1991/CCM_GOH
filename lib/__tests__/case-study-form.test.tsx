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

  it("a failure with no field to point at scrolls to and focuses the message", async () => {
    fetchMock.mockImplementation(async (url: string) =>
      url === "/api/case-studies/submit"
        ? new Response(JSON.stringify({ error: { message: "Something went wrong on our side." } }), { status: 500 })
        : new Response(JSON.stringify({ draft: null, id: "d1" })),
    );
    mount();
    await fillEverything();
    await act(async () => { fireEvent.click(screen.getAllByRole("button", { name: /Submit for review/ })[0]); });
    const alert = await screen.findByRole("alert");
    await waitFor(() => expect(document.activeElement).toBe(alert));
    expect(alert.scrollIntoView).toHaveBeenCalled();
  });

  it("a server problem on a field the form doesn't show is told in the message, never lost", async () => {
    fetchMock.mockImplementation(async (url: string) =>
      url === "/api/case-studies/submit"
        ? new Response(JSON.stringify({ error: { message: "Some details need fixing — they're marked below.", fields: { "place.city": "That town name is too long" } } }), { status: 400 })
        : new Response(JSON.stringify({ draft: null, id: "d1" })),
    );
    mount();
    await fillEverything();
    await act(async () => { fireEvent.click(screen.getAllByRole("button", { name: /Submit for review/ })[0]); });
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("That town name is too long");
    // Nothing is marked below, so the message doesn't say it is.
    expect(alert.textContent).not.toContain("marked below");
    await waitFor(() => expect(document.activeElement).toBe(alert));
  });

  it("'Add who wrote this' stays open while any author has no name", async () => {
    mount();
    await fillEverything();
    expect(screen.getAllByText("Everything's ready to send").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Add author" }));
    expect(screen.getAllByText("1 thing left").length).toBeGreaterThan(0);
  });

  it("nothing can be typed until the saved draft is in, so it can't be overwritten", async () => {
    let release: (r: Response) => void = () => {};
    fetchMock.mockImplementation((url: string) =>
      url.startsWith("/api/case-studies/drafts") && !fetchMock.mock.calls.some(([, init]) => init?.method === "POST")
        ? new Promise<Response>((done) => { release = done; })
        : Promise.resolve(new Response(JSON.stringify({ id: "d9" }))),
    );
    mount();
    expect(screen.getByText("Loading your draft…")).toBeTruthy();
    expect(screen.getByLabelText("Title").matches(":disabled")).toBe(true);
    await act(async () => release(new Response(JSON.stringify({ draft: { _id: "d9", title: { en: "Stored title" }, lastSaved: new Date().toISOString() } }))));
    const title = screen.getByLabelText("Title") as HTMLInputElement;
    await waitFor(() => expect(title.matches(":disabled")).toBe(false));
    expect(title.value).toBe("Stored title");
    expect(screen.queryByText("Loading your draft…")).toBeNull();
  });

  it("removing the cover is saved with the draft", async () => {
    fetchMock.mockImplementation(async (url: string) =>
      url === "/api/uploads/image"
        ? new Response(JSON.stringify({ assetRef: "m1", url: "/m.png" }))
        : new Response(JSON.stringify({ draft: null, id: "d1" })),
    );
    const { container } = renderForm();
    await waitFor(() => expect(screen.getByLabelText("Title").matches(":disabled")).toBe(false));
    // A form holding something (an empty new form has nothing to save).
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Floods in Lagos" } });
    const file = new File(["x"], "cover.png", { type: "image/png" });
    await act(async () => { fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [file] } }); });
    fireEvent.click(await screen.findByRole("button", { name: "Remove image" }));
    await waitFor(
      () => {
        const saves = fetchMock.mock.calls.filter(([url, init]) => url === "/api/case-studies/drafts" && init?.method === "POST");
        expect(saves.length).toBeGreaterThan(0);
        expect(JSON.parse(String(saves.at(-1)![1].body)).draftData.imageAssetId).toBeNull();
      },
      { timeout: 4000 },
    );
  });
});

function renderForm() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ImprovedCaseStudyForm userId="u1" locale="en" availableTags={tags} regionalCommunities={communities} />
    </NextIntlClientProvider>,
  );
}

async function fillEverything() {
  await waitFor(() => expect(screen.getByLabelText("Title").matches(":disabled")).toBe(false));
  fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Floods in Lagos" } });
  fireEvent.change(screen.getByLabelText("Summary"), { target: { value: "x".repeat(60) } });
  fireEvent.change(screen.getByTestId("story"), { target: { value: "It rained." } });
  fireEvent.click(screen.getByRole("button", { name: "Water Access" }));
  fireEvent.change(screen.getByRole("combobox", { name: /regional community/i }), { target: { value: "c1" } });
}
