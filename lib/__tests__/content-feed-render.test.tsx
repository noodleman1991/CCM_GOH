// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

vi.mock("server-only", () => ({}));
const resolve = vi.fn();
vi.mock("@/lib/content/feeds/resolve", () => ({ resolveContentFeed: (s: unknown, c: unknown) => resolve(s, c) }));
vi.mock("next-intl/server", () => ({ getTranslations: async () => (key: string) => `t:${key}` }));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a data-site-link="" href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("@/components/cards/typed-card", () => ({
  TypedCard: ({ item, variant }: { item: { title: string }; variant: string }) => <div data-variant={variant}>{item.title}</div>,
}));

import ContentFeed from "@/components/blocks/content-feed";

const card = (id: string) => ({ type: "newsPost", id, title: `Card ${id}`, href: `/news/${id}` });

beforeEach(() => resolve.mockReset());
afterEach(cleanup);

async function show(settings: Record<string, unknown>, extra: Record<string, unknown> = {}) {
  const element = await ContentFeed({ settings, locale: "en", ...extra });
  return render(<>{element}</>);
}

describe("ContentFeed", () => {
  it("renders nothing when nothing matches", async () => {
    resolve.mockResolvedValue({ items: [], skipped: [] });
    const { container } = await show({ kinds: ["newsPosts"] });
    expect(container.innerHTML).toBe("");
  });

  it("shows the heading, intro and a grid of cards", async () => {
    resolve.mockResolvedValue({ items: [card("1"), card("2")], skipped: [] });
    await show({ kinds: ["newsPosts"], heading: "Latest news", intro: "What's new" });
    expect(screen.getByRole("heading", { level: 2, name: "Latest news" })).toBeTruthy();
    expect(screen.getByText("What's new")).toBeTruthy();
    expect(screen.getAllByText(/Card/).map((el) => el.getAttribute("data-variant"))).toEqual(["grid", "grid"]);
  });

  it("uses row cards for the list layout", async () => {
    resolve.mockResolvedValue({ items: [card("1")], skipped: [] });
    await show({ kinds: ["newsPosts"], layout: "list" });
    expect(screen.getByText("Card 1").getAttribute("data-variant")).toBe("row");
  });

  it("makes the carousel a labelled, scrollable region", async () => {
    resolve.mockResolvedValue({ items: [card("1"), card("2")], skipped: [] });
    await show({ kinds: ["newsPosts"], layout: "carousel", heading: "Stories" });
    const region = screen.getByRole("region", { name: "Stories" });
    expect(region.className).toContain("overflow-x-auto");
  });

  it("links a single-kind feed to its listing with the site's label", async () => {
    resolve.mockResolvedValue({ items: [card("1")], skipped: [] });
    await show({ kinds: ["newsPosts"] });
    const link = screen.getByRole("link", { name: /t:viewAll.newsPosts/ });
    expect(link.getAttribute("href")).toBe("/news");
    expect(link.hasAttribute("data-site-link")).toBe(true);
  });

  it("uses the editor's link as typed for a mixed feed", async () => {
    resolve.mockResolvedValue({ items: [card("1")], skipped: [] });
    await show({ kinds: ["newsPosts", "events"], viewAll: { href: "https://example.org/all", label: "Everything" } });
    const link = screen.getByRole("link", { name: /Everything/ });
    expect(link.getAttribute("href")).toBe("https://example.org/all");
    expect(link.hasAttribute("data-site-link")).toBe(false);
  });

  it("passes the page's language and community to the feed", async () => {
    resolve.mockResolvedValue({ items: [], skipped: [] });
    await ContentFeed({ settings: { kinds: ["newsPosts"] }, locale: "ar", communityId: "c-1", communityRegion: "oce" });
    expect(resolve).toHaveBeenCalledWith({ kinds: ["newsPosts"] }, { locale: "ar", communityId: "c-1", communityRegion: "oce" });
  });
});
