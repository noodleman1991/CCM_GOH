// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import messages from "@/messages/en.json";
vi.mock("@/i18n/navigation", () => ({ Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }));
import { ContributionsCard } from "@/components/contributions/contributions-card";

afterEach(cleanup);

const zero = { draft: 0, pending: 0, revision: 0, approved: 0, rejected: 0 };
const wrap = (ui: React.ReactNode) => render(<NextIntlClientProvider locale="en" messages={messages}>{ui}</NextIntlClientProvider>);

describe("the dashboard card", () => {
  it("invites a member who has shared nothing", () => {
    wrap(<ContributionsCard counts={zero} needsChanges={[]} />);
    expect(screen.getByText(/Share your work/)).toBeTruthy();
    expect(screen.queryByText("Needs changes")).toBeNull();
  });
  it("leads with what needs changes, and links to the full list", () => {
    wrap(<ContributionsCard counts={{ ...zero, revision: 1, approved: 3 }} needsChanges={[{ id: "l1", kind: "livedExperience", title: "Rising tide", status: "revision", reviewNotes: "Add a place.", date: null, href: null, editHref: "/lived-experiences/submit?edit=l1", adminHref: "" }]} />);
    expect(screen.getByText("Rising tide")).toBeTruthy();
    expect(screen.getByRole("link", { name: /See all/ }).getAttribute("href")).toBe("/dashboard/submissions");
  });
});
