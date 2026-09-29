// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NEXT_NOT_FOUND"); } }));
vi.mock("next-intl/server", () => ({ getTranslations: async () => (k: string) => `t:${k}` }));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: null }) }));
vi.mock("@/lib/authz", () => ({ getActor: async () => null, isStaff: () => false }));
const getCommunity = vi.fn();
const getPage = vi.fn();
vi.mock("@/lib/content/communities", () => ({ getCommunity: (s: string, l: string) => getCommunity(s, l) }));
vi.mock("@/lib/content/pages", () => ({ getRegionalCommunityPage: (s: string, l: string) => getPage(s, l), getRegionalCommunityTeamMembers: async () => null }));
vi.mock("@/components/pages/community-sections", () => ({ default: () => <div data-testid="sections" /> }));
vi.mock("@/components/templates/regional-community-template", () => ({ default: () => <div data-testid="template" /> }));
vi.mock("@/components/regions/region-hero", () => ({ RegionHero: () => <div data-testid="hero" /> }));
vi.mock("@/components/follow/follow-button", () => ({ FollowButton: () => null }));
import Page from "@/app/[locale]/(main)/communities/[slug]/page";

const params = Promise.resolve({ locale: "en", slug: "oceania" });
beforeEach(() => { getCommunity.mockReset(); getPage.mockReset(); });
afterEach(cleanup);

describe("community route", () => {
  it("renders the record's sections when it has them", async () => {
    getCommunity.mockResolvedValue({ id: "rc1", slug: "oceania", sections: [{ _type: "faqs" }] });
    getPage.mockResolvedValue({ useTemplate: true, regionalCommunity: { _id: "rc1" } });
    render(await Page({ params }));
    expect(screen.getByTestId("sections")).toBeTruthy();
    expect(screen.queryByTestId("template")).toBeNull();
  });

  it("renders today's page while the record has no sections", async () => {
    getCommunity.mockResolvedValue({ id: "rc1", slug: "oceania", sections: [] });
    getPage.mockResolvedValue({ useTemplate: true, regionalCommunity: { _id: "rc1" } });
    render(await Page({ params }));
    expect(screen.getByTestId("hero")).toBeTruthy();
    expect(screen.getByTestId("template")).toBeTruthy();
  });

  it("404s when neither exists", async () => {
    getCommunity.mockResolvedValue(null);
    getPage.mockResolvedValue(null);
    await expect(Page({ params })).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
