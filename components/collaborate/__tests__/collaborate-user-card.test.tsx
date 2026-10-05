// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";

const viewer = vi.hoisted(() => ({ signedIn: true, id: "me" }));
vi.mock("@clerk/nextjs", () => ({ useUser: () => ({ isSignedIn: viewer.signedIn, user: viewer.signedIn ? { id: viewer.id } : null }) }));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a>,
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/hooks/use-collaboration", () => ({ useCollaboration: () => ({ notifications: true, people: true, workspaces: { see: false, create: false }, messages: false, contributions: true }) }));
vi.mock("@/lib/actions/messaging", () => ({ startConversation: vi.fn() }));
const requestContact = vi.hoisted(() => vi.fn(async () => ({ ok: true, status: "PENDING" })));
vi.mock("@/lib/actions/requests", () => ({ requestContact }));
import { CollaborateUserCard } from "@/components/collaborate/collaborate-user-card";

const member = (o: Record<string, unknown> = {}) => ({ id: "u2", username: "amina", firstName: "Amina", lastName: "K", openToCollaboration: true, workTypes: [], expertiseAreas: [], ...o }) as never;
const show = (user = member()) => render(<NextIntlClientProvider locale="en" messages={messages}><CollaborateUserCard user={user} /></NextIntlClientProvider>);

beforeEach(() => { viewer.signedIn = true; viewer.id = "me"; requestContact.mockClear(); });
afterEach(cleanup);

describe("Ask to connect on a member's card", () => {
  it("is offered to signed-in members for people open to collaborating, with an optional note", async () => {
    show();
    fireEvent.click(await screen.findByRole("button", { name: /Connect/ }));
    fireEvent.change(await screen.findByRole("textbox"), { target: { value: "Same research area!" } });
    fireEvent.click(screen.getByRole("button", { name: /Send/ }));
    await waitFor(() => expect(requestContact).toHaveBeenCalledWith("u2", "Same research area!"));
    expect(await screen.findByRole("button", { name: /Requested/ })).toBeTruthy();
  });
  it("isn't offered for someone who isn't open, to signed-out visitors, or on your own card", async () => {
    show(member({ openToCollaboration: false }));
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByRole("button", { name: /Connect/ })).toBeNull();
    cleanup();
    viewer.signedIn = false;
    show();
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByRole("button", { name: /Connect/ })).toBeNull();
    cleanup();
    viewer.signedIn = true;
    viewer.id = "u2";
    show();
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByRole("button", { name: /Connect/ })).toBeNull();
  });
});
