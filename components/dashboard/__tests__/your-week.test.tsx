// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
vi.mock("@/i18n/navigation", () => ({ Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }));
import { YourWeek } from "@/components/dashboard/your-week";
import type { WeekItem } from "@/lib/dashboard/your-week";

afterEach(cleanup);
const show = (items: WeekItem[]) => render(<NextIntlClientProvider locale="en" messages={messages}><YourWeek items={items} locale="en" /></NextIntlClientProvider>);

describe("your week", () => {
  it("lists what needs you, what you're going to and what your community has on", () => {
    show([
      { kind: "changes", id: "c1", title: "Rising tide", contributionKind: "livedExperience", href: "/lived-experiences/submit?edit=c1" },
      { kind: "going", id: "e1", title: "Reef day", startAt: "2026-11-14T10:00:00Z", href: "/events/reef-day", external: false },
      { kind: "community", id: "e2", title: "Pacific night", startAt: "2026-11-20T10:00:00Z", href: "https://example.org", external: true },
    ]);
    expect(screen.getByText("Needs your changes")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Rising tide/ }).getAttribute("href")).toBe("/lived-experiences/submit?edit=c1");
    expect(screen.getByText("Going")).toBeTruthy();
    expect(screen.getByText("From your community")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Pacific night/ }).getAttribute("target")).toBe("_blank");
  });
  it("welcomes someone with nothing on yet, with three ways in", () => {
    show([]);
    expect(screen.getByText("Nothing on your plate yet")).toBeTruthy();
    expect(screen.getAllByRole("link").map((a) => a.getAttribute("href"))).toEqual(["/events", "/dashboard/submissions", "/collaborate?tab=people"]);
  });
});
