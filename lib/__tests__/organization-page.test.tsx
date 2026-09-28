// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NEXT_NOT_FOUND"); } }));
vi.mock("next-intl/server", () => ({ getTranslations: async () => (k: string) => `t:${k}` }));
vi.mock("@/i18n/navigation", () => ({ Link: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a> }));
const getOrganization = vi.fn();
vi.mock("@/lib/content/organizations", () => ({ getOrganization: (s: string, l: string) => getOrganization(s, l) }));
vi.mock("@/components/blocks/content-feed", () => ({
  default: ({ settings }: { settings: { filters: { organizationIds: string[] } } }) => <div data-testid="feed">{settings.filters.organizationIds.join(",")}</div>,
}));
import OrganizationPage from "@/app/[locale]/(main)/organizations/[slug]/page";

afterEach(cleanup);
const org = { id: "o1", name: "Wellcome", acronym: null, type: "foundation", website: "https://wellcome.org", description: "A charity", logo: null, place: "London", community: null };

describe("organisation page", () => {
  it("shows the organisation and a feed of what's linked to it", async () => {
    getOrganization.mockResolvedValue(org);
    render(await OrganizationPage({ params: Promise.resolve({ locale: "en", slug: "wellcome" }) }));
    expect(screen.getByRole("heading", { level: 1, name: "Wellcome" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /wellcome\.org/ }).getAttribute("href")).toBe("https://wellcome.org");
    expect(screen.getByTestId("feed").textContent).toBe("o1");
    expect(screen.getByText("A charity")).toBeTruthy();
  });
  it("404s when the organisation is hidden or missing", async () => {
    getOrganization.mockResolvedValue(null);
    await expect(OrganizationPage({ params: Promise.resolve({ locale: "en", slug: "x" }) })).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
