// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import messages from "@/messages/en.json";
import type { Contribution } from "@/lib/contributions/model";
vi.mock("@/i18n/navigation", () => ({ Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }));
import { ContributionRow } from "@/components/contributions/contribution-row";

afterEach(cleanup);

const item = (o: Partial<Contribution> = {}): Contribution => ({ id: "s1", kind: "livedExperience", title: "Living with the rising tide", status: "pending", reviewNotes: null, date: "2026-09-01T00:00:00.000Z", href: null, editHref: "/lived-experiences/submit?edit=s1", adminHref: "/admin/collections/livedExperiences/s1", ...o });
const show = (i: Contribution, showAdmin = false) => render(<NextIntlClientProvider locale="en" messages={messages}><ContributionRow item={i} showAdmin={showAdmin} /></NextIntlClientProvider>);

describe("a contribution row", () => {
  it("asks for changes with the team's note when sent back", () => {
    show(item({ status: "revision", reviewNotes: "Please add where this happened." }));
    expect(screen.getByText("Needs changes")).toBeTruthy();
    expect(screen.getByText("Please add where this happened.")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Make changes/ }).getAttribute("href")).toBe("/lived-experiences/submit?edit=s1");
  });
  it("shows the note but no edit when declined", () => {
    show(item({ status: "rejected", reviewNotes: "Out of scope.", editHref: null }));
    expect(screen.getByText("Out of scope.")).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Edit|Make changes/ })).toBeNull();
  });
  it("opens the public page when published, and the admin for editors", () => {
    show(item({ status: "approved", editHref: null, href: "/lived-experiences/rising-tide" }), true);
    expect(screen.getByRole("link", { name: /View/ }).getAttribute("href")).toBe("/lived-experiences/rising-tide");
    expect(screen.getByRole("link", { name: /Open in admin/ }).getAttribute("href")).toBe("/admin/collections/livedExperiences/s1");
  });
  it("names an untitled item by its kind", () => {
    show(item({ title: null }));
    expect(screen.getByText("Untitled story")).toBeTruthy();
  });
});
