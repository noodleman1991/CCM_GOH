// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("server-only", () => ({}));
vi.mock("@/components/regions/region-hero", () => ({ RegionHero: ({ slug }: { slug: string }) => <div data-testid="hero">{slug}</div> }));
vi.mock("@/components/blocks/community/region-members-block", () => ({
  RegionMembersBlock: ({ slug }: { slug: string }) => <div data-testid="members">{slug}</div>,
}));

import CommunityHeader from "@/components/blocks/community-header";
import CommunityMembers from "@/components/blocks/community-members";
import { pageBlocks } from "@/lib/content/internal/payload/blocks";
import { communityHeader, communityMembers } from "@/payload/blocks";

afterEach(cleanup);

describe("community sections", () => {
  it("are named and grouped", () => {
    expect([communityHeader.slug, communityHeader.labels?.singular, communityHeader.admin?.group]).toEqual(["communityHeader", "Community header", "Openings"]);
    expect([communityMembers.slug, communityMembers.labels?.singular, communityMembers.admin?.group]).toEqual(["communityMembers", "Community members", "Content"]);
  });

  it("map to their components' props", () => {
    const [h, m] = pageBlocks([
      { id: "h", blockType: "communityHeader", intro: "Hello" },
      { id: "m", blockType: "communityMembers", title: null },
    ])! as Array<Record<string, unknown>>;
    expect(h).toMatchObject({ _type: "community-header", intro: "Hello" });
    expect(m).toMatchObject({ _type: "community-members", title: null });
  });

  it("the header shows the region hero for the page's community, with the intro", async () => {
    render(<>{await CommunityHeader({ communitySlug: "oceania", locale: "en", intro: "Welcome" })}</>);
    expect(screen.getByTestId("hero").textContent).toBe("oceania");
    expect(screen.getByText("Welcome")).toBeTruthy();
  });

  it("renders nothing outside a community page", async () => {
    expect(await CommunityHeader({ locale: "en", intro: "x" })).toBeNull();
    expect(await CommunityMembers({ locale: "en" })).toBeNull();
  });

  it("members shows the community's members", async () => {
    render(<>{await CommunityMembers({ communitySlug: "oceania", locale: "en" })}</>);
    expect(screen.getByTestId("members").textContent).toBe("oceania");
  });
});
