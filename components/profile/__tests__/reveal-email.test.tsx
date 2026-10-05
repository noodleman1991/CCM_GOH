// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";

// The widget hands back a token as soon as it shows (stands in for Cloudflare).
vi.mock("@/components/comments/turnstile-widget", () => ({
  TurnstileWidget: ({ onToken }: { onToken: (t: string) => void }) => <button type="button" onClick={() => onToken("tok")}>human-check</button>,
}));
const reveal = vi.hoisted(() => vi.fn(async () => ({ ok: true, email: "amina@example.org" })));
vi.mock("@/lib/actions/reveal-contact-email", () => ({ revealContactEmail: reveal }));
import { RevealEmail } from "@/components/profile/reveal-email";

const show = () => render(<NextIntlClientProvider locale="en" messages={messages}><RevealEmail profileUserId="u2" /></NextIntlClientProvider>);
beforeEach(() => reveal.mockClear());
afterEach(cleanup);

describe("an email behind a human check", () => {
  it("isn't in the page until someone asks and passes the check", async () => {
    const { container } = show();
    expect(container.innerHTML).not.toContain("@");
    fireEvent.click(screen.getByRole("button", { name: /Show email/ }));
    expect(reveal).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "human-check" }));
    const link = await screen.findByRole("link", { name: "amina@example.org" });
    expect(link.getAttribute("href")).toBe("mailto:amina@example.org");
    expect(reveal).toHaveBeenCalledWith({ profileUserId: "u2", token: "tok" });
  });
  it("says why when it can't be shown", async () => {
    reveal.mockResolvedValueOnce({ ok: false, error: "notShared" } as never);
    show();
    fireEvent.click(screen.getByRole("button", { name: /Show email/ }));
    fireEvent.click(screen.getByRole("button", { name: "human-check" }));
    expect(await screen.findByRole("status")).toBeTruthy();
  });
});
