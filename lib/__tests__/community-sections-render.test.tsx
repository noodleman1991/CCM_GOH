// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("next-intl/server", () => ({ getTranslations: async () => (k: string) => `t:${k}` }));
vi.mock("@/components/regions/region-section-spine", () => ({
  RegionSectionSpine: ({ sections }: { sections: Array<{ id: string; label: string }> }) => (
    <nav data-testid="menu">{sections.map((s) => `${s.id}=${s.label}`).join(",")}</nav>
  ),
}));
vi.mock("@/components/blocks", () => ({
  default: ({ blocks, context, editHref }: { blocks: Array<{ _key: string }>; context: { communityId: string }; editHref?: (i: number) => string }) => (
    <div data-testid="blocks">{`${blocks.map((b) => b._key).join(",")}@${context.communityId}${editHref ? `#${editHref(0)}` : ""}`}</div>
  ),
}));
import CommunitySections from "@/components/pages/community-sections";

afterEach(cleanup);
const s = (key: string, kind?: string) => ({ _type: "faqs", _key: key, chapter: kind ? { kind, label: null } : null });

describe("CommunitySections", () => {
  it("draws the menu from chapters and anchors each chapter", async () => {
    const { container } = render(
      await CommunitySections({ sections: [s("a", "overview"), s("b"), s("c", "news")], communityId: "c1", communitySlug: "oceania", locale: "en" }),
    );
    expect(screen.getByTestId("menu").textContent).toBe("overview=t:sectionTitles.overview,news=t:sectionTitles.newsUpdates");
    expect([...container.querySelectorAll("section[id]")].map((e) => e.id)).toEqual(["overview", "news"]);
    expect(screen.getAllByTestId("blocks").map((e) => e.textContent)).toEqual(["a,b@c1", "c@c1"]);
  });

  it("shows no menu with a single chapter", async () => {
    render(await CommunitySections({ sections: [s("a", "overview"), s("b")], communityId: "c1", communitySlug: "oceania", locale: "en" }));
    expect(screen.queryByTestId("menu")).toBeNull();
  });

  it("points staff edit links at the right row of the whole list", async () => {
    render(
      await CommunitySections({ sections: [s("a", "overview"), s("b"), s("c", "news")], communityId: "c1", communitySlug: "oceania", locale: "en", canEdit: true, editLabel: "Edit" }),
    );
    expect(screen.getAllByTestId("blocks").map((e) => e.textContent)).toEqual([
      "a,b@c1#/admin/collections/regionalCommunities/c1#sections-row-0",
      "c@c1#/admin/collections/regionalCommunities/c1#sections-row-2",
    ]);
  });
});
