// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";

vi.mock("@/i18n/navigation", () => ({ Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }));
const access = vi.hoisted(() => ({ people: true }));
vi.mock("@/hooks/use-collaboration", () => ({ useCollaboration: () => ({ notifications: false, people: access.people, workspaces: { see: false, create: false }, messages: false, contributions: true }) }));
const setOpen = vi.hoisted(() => vi.fn(async () => ({ ok: true })));
vi.mock("@/lib/actions/open-to-collaborate", () => ({ setOpenToCollaborate: setOpen }));
import { OpenToCollaborateCard } from "@/components/collaborate/open-to-collaborate-card";

const show = (initiallyOpen = false) => render(<NextIntlClientProvider locale="en" messages={messages}><OpenToCollaborateCard initiallyOpen={initiallyOpen} /></NextIntlClientProvider>);

beforeEach(() => { access.people = true; setOpen.mockClear(); localStorage.clear(); });
afterEach(cleanup);

describe("asking a member if they're open to collaborate", () => {
  it("saves yes, with what they'd like to work on, and says so", async () => {
    show();
    fireEvent.change(await screen.findByLabelText(/What would you like to work on/), { target: { value: "youth research" } });
    fireEvent.click(screen.getByRole("button", { name: /Yes, I'm open/ }));
    await waitFor(() => expect(setOpen).toHaveBeenCalledWith(true, "youth research"));
    expect(await screen.findByText("You're open to collaborating.")).toBeTruthy();
  });
  it("keeps the confirmation when the page refreshes with the member now open", async () => {
    const { rerender } = show();
    fireEvent.click(await screen.findByRole("button", { name: /Yes, I'm open/ }));
    await screen.findByText("You're open to collaborating.");
    rerender(<NextIntlClientProvider locale="en" messages={messages}><OpenToCollaborateCard initiallyOpen /></NextIntlClientProvider>);
    expect(screen.getByText("You're open to collaborating.")).toBeTruthy();
  });
  it("goes away on Not now, and stays away on this device", async () => {
    show();
    fireEvent.click(await screen.findByRole("button", { name: /Not now/ }));
    expect(screen.queryByText("Open to collaborating?")).toBeNull();
    expect(localStorage.getItem("ccm:open-card-dismissed")).toBe("1");
    cleanup();
    show();
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByText("Open to collaborating?")).toBeNull();
  });
  it("isn't shown while the team hasn't opened it, or to someone already open", async () => {
    access.people = false;
    const a = show();
    await new Promise((r) => setTimeout(r, 0));
    expect(a.container.innerHTML).toBe("");
    cleanup();
    access.people = true;
    const b = show(true);
    await new Promise((r) => setTimeout(r, 0));
    expect(b.container.innerHTML).toBe("");
  });
});
