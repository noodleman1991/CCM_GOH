// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { YourSuggestions } from "@/components/events/your-suggestions";
import type { Contribution } from "@/lib/contributions/model";

vi.mock("@/i18n/navigation", () => ({ Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }));
afterEach(cleanup);

const event = (o: Partial<Contribution>): Contribution => ({ id: "a", kind: "event", title: "Reef day", status: "pending", reviewNotes: null, date: null, href: null, editHref: null, adminHref: "", ...o });

it("shows each suggestion's outcome with the same rows as My contributions", () => {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <YourSuggestions
        items={[
          event({ status: "revision", reviewNotes: "Please add the venue.", editHref: "/events/suggest?edit=a" }),
          event({ id: "b", title: "Coastal walk", status: "approved", href: "/events/coastal-walk" }),
        ]}
      />
    </NextIntlClientProvider>,
  );
  expect(screen.getByText("Needs changes")).toBeTruthy();
  expect(screen.getByText("Please add the venue.")).toBeTruthy();
  expect(screen.getByRole("link", { name: /Make changes/ }).getAttribute("href")).toBe("/events/suggest?edit=a");
  expect(screen.getByRole("link", { name: /View/ }).getAttribute("href")).toBe("/events/coastal-walk");
});

it("shows nothing when there are no suggestions", () => {
  const { container } = render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <YourSuggestions items={[]} />
    </NextIntlClientProvider>,
  );
  expect(container.innerHTML).toBe("");
});
