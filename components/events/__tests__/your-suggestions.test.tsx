// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { YourSuggestions } from "@/components/events/your-suggestions";

vi.mock("@/i18n/navigation", () => ({ Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }));
afterEach(cleanup);

it("shows each suggestion's outcome and the team's note", () => {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <YourSuggestions
        locale="en"
        items={[
          { id: "a", title: "Reef day", startAt: "2026-11-02T10:00:00.000Z", status: "revision", reviewNotes: "Please add the venue.", slug: "reef-day" },
          { id: "b", title: "Coastal walk", startAt: null, status: "approved", reviewNotes: null, slug: "coastal-walk" },
        ]}
      />
    </NextIntlClientProvider>,
  );
  expect(screen.getByText("Needs changes")).toBeTruthy();
  expect(screen.getByText("Please add the venue.")).toBeTruthy();
  expect(screen.getByRole("link", { name: /Coastal walk/ }).getAttribute("href")).toBe("/events/coastal-walk");
  expect(screen.getByRole("link", { name: /edit/i }).getAttribute("href")).toBe("/events/suggest?edit=a");
});
