// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
vi.mock("next-intl", () => ({ useTranslations: () => (k: string) => k }));
vi.mock("@/components/news/featured-news-card", () => ({
  default: ({ news, variant }: { news: { _id: string }; variant: string }) => <div data-testid="card">{`${news._id}:${variant}`}</div>,
}));
vi.mock("@/components/ui/section-header", () => ({ SectionHeader: () => null }));
import NewsHeroSection from "@/components/news/news-hero-section";
afterEach(cleanup);

describe("news featured area", () => {
  it("shows one lead story — the other featured stories join the main grid", () => {
    render(<NewsHeroSection featuredNews={[{ _id: "a" }, { _id: "b" }, { _id: "c" }] as never} locale="en" />);
    expect(screen.getAllByTestId("card").map((c) => c.textContent)).toEqual(["a:lead"]);
  });
});
